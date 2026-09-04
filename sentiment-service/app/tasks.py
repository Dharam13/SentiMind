"""
Celery Tasks for SentiMind ML & NLP Processing.
Includes:
- analyze_single_mention with 3-retry isolation and MongoDB permanent failure logging.
- check_spike_callback (Chord Barrier) that triggers Spike Detection & AI Intent ONCE per batch.
"""

import os
import logging
import requests
from datetime import datetime, timedelta
from bson import ObjectId
from pymongo import MongoClient

from app.celery_app import celery_app
from app.preprocess import preprocess
from app.sentiment import analyze

logger = logging.getLogger("CeleryTasks")
logger.setLevel(logging.INFO)

# MongoDB connection for worker
MONGODB_URI = os.getenv(
    "MONGODB_URI",
    "mongodb+srv://dharamhpatel2005_db_user:dharam123@cluster0.x4gjggk.mongodb.net/sentimind_collector?appName=Cluster0"
)
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

_mongo_client = None

def get_mongo_db():
    global _mongo_client
    if _mongo_client is None:
        _mongo_client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=10000)
    return _mongo_client.get_database("sentimind_collector")


@celery_app.task(
    bind=True,
    max_retries=3,
    default_retry_delay=5,
    name="tasks.analyze_single_mention"
)
def analyze_single_mention(self, mention_id_str: str, text: str, project_id: int = 1):
    """
    Analyzes sentiment for a single social mention.
    Has 3-retry fault tolerance. On 3rd failure, permanently logs failure to MongoDB.
    """
    try:
        if not text or not isinstance(text, str):
            raise ValueError(f"Invalid text input for mention {mention_id_str}")

        clean_text = preprocess(text)
        result = analyze(clean_text)

        sentiment_payload = {
            "label": result.sentiment,
            "confidence": round(result.confidence, 4),
            "final_score": round(result.final_score, 4),
            "vader_score": round(result.vader_score, 4),
            "distilbert_score": round(result.distilbert_score, 4),
        }

        # Update MongoDB mention
        db = get_mongo_db()
        try:
            m_oid = ObjectId(mention_id_str)
        except Exception:
            m_oid = mention_id_str

        db.mentions.update_one(
            {"_id": m_oid},
            {
                "$set": {
                    "sentiment": sentiment_payload,
                    "sentimentStatus": "completed",
                    "processedAt": datetime.utcnow(),
                }
            }
        )

        return {
            "mention_id": str(mention_id_str),
            "status": "completed",
            "sentiment": sentiment_payload["label"],
            "score": sentiment_payload["final_score"],
        }

    except Exception as exc:
        retries = self.request.retries
        logger.warning(
            f"[Task:Sentiment] Retry {retries}/{self.max_retries} for mention {mention_id_str}: {exc}"
        )

        if retries >= self.max_retries:
            # Permanent failure logging after 3 attempts exhausted
            logger.error(
                f"[Task:Sentiment] PERMANENT FAILURE for mention {mention_id_str} after {self.max_retries} retries: {exc}"
            )
            try:
                db = get_mongo_db()
                try:
                    m_oid = ObjectId(mention_id_str)
                except Exception:
                    m_oid = mention_id_str

                db.mentions.update_one(
                    {"_id": m_oid},
                    {
                        "$set": {
                            "sentimentStatus": "failed",
                            "failureReason": str(exc),
                            "failedAt": datetime.utcnow(),
                        }
                    }
                )
            except Exception as db_err:
                logger.error(f"[Task:Sentiment] Failed to update failure status in DB: {db_err}")

            return {
                "mention_id": str(mention_id_str),
                "status": "failed",
                "error": str(exc),
            }

        # Exponential backoff retry (5s, 10s, 20s)
        countdown = 5 * (2 ** retries)
        raise self.retry(exc=exc, countdown=countdown)


@celery_app.task(name="tasks.check_spike_callback")
def check_spike_callback(results: list, project_id: int):
    """
    Chord Barrier Callback:
    Executes ONLY AFTER all parallel mention sentiment tasks have completed or permanently failed.
    Calculates spike anomaly math ONCE, and triggers Gemini intent analysis if spike detected.
    """
    try:
        total = len(results)
        completed = [r for r in results if r and r.get("status") == "completed"]
        failed = [r for r in results if r and r.get("status") == "failed"]

        logger.info(
            f"[Task:SpikeBarrier] Batch completed for Project {project_id}: "
            f"{len(completed)}/{total} succeeded, {len(failed)} failed."
        )

        db = get_mongo_db()

        # 1. Calculate 6-hour sentiment vs 7-day baseline
        now = datetime.utcnow()
        six_hours_ago = now - timedelta(hours=6)
        seven_days_ago = now - timedelta(days=7)

        # Baseline: last 7 days
        baseline_query = {
            "projectId": project_id,
            "collectedAt": {"$gte": seven_days_ago},
            "sentimentStatus": "completed",
        }
        total_baseline = db.mentions.count_documents(baseline_query)

        if total_baseline < 5:
            baseline_neg_pct = 15.0
        else:
            neg_baseline = db.mentions.count_documents({**baseline_query, "sentiment.label": "negative"})
            baseline_neg_pct = (neg_baseline / total_baseline) * 100

        # Current window: last 6 hours
        current_query = {
            "projectId": project_id,
            "collectedAt": {"$gte": six_hours_ago},
            "sentimentStatus": "completed",
        }
        total_current = db.mentions.count_documents(current_query)

        if total_current == 0:
            return {"status": "normal", "completed": len(completed), "failed": len(failed)}

        neg_current = db.mentions.count_documents({**current_query, "sentiment.label": "negative"})
        current_neg_pct = (neg_current / total_current) * 100

        deviation = current_neg_pct / max(1.0, baseline_neg_pct)

        logger.info(
            f"[Task:SpikeBarrier] Project {project_id} - Baseline Neg: {baseline_neg_pct:.1f}%, "
            f"Current 6h Neg: {current_neg_pct:.1f}%, Deviation: {deviation:.2f}x"
        )

        is_spike = (deviation >= 1.4 and current_neg_pct >= 25) or (total_current >= 5)

        if not is_spike:
            logger.info(f"[Task:SpikeBarrier] Sentiment within normal bounds ({deviation:.2f}x).")
            return {
                "status": "normal",
                "deviation": round(deviation, 2),
                "completed": len(completed),
                "failed": len(failed),
            }

        # 2. SPIKE DETECTED / BATCH COMPLETE -> Trigger Agent Loop on Backend Server
        logger.info(f"[Task:SpikeBarrier] ⚠️ SPIKE/SURGE DETECTED ({deviation:.2f}x)! Triggering Agentic Workflow on Backend.")
        try:
            resp = requests.post(
                f"{BACKEND_URL}/api/agent/trigger-pipeline",
                json={"projectId": project_id, "spikeType": "negative_spike", "deviation": deviation},
                timeout=10,
            )
            logger.info(f"[Task:SpikeBarrier] Backend notified: status {resp.status_code}")
        except Exception as net_err:
            logger.warning(f"[Task:SpikeBarrier] Could not notify backend immediately: {net_err}")

        return {
            "status": "spike_detected",
            "deviation": round(deviation, 2),
            "completed": len(completed),
            "failed": len(failed),
        }

    except Exception as exc:
        logger.error(f"[Task:SpikeBarrier] Error in spike callback: {exc}", exc_info=True)
        return {"status": "error", "error": str(exc)}
