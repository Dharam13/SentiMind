"""
Hybrid Sentiment Analysis API (VADER + DistilBERT ensemble).
- Loads DistilBERT once at startup.
- Async request handling; inference run in thread pool to avoid blocking.
- Logs inference time per request.
- Target response under 100ms (best-effort; first request may be slower due to warmup).
"""

import asyncio
import logging
import time
from contextlib import asynccontextmanager
from typing import Any, Optional

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from app.preprocess import preprocess
from app.sentiment import analyze, load_distilbert

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


# --- Request / Response models ---

class SentimentMetadata(BaseModel):
    timestamp: Optional[str] = None
    source: Optional[str] = None
    userId: Optional[str] = None


class SentimentRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Raw text to analyze (tweet, review, post, etc.)")
    metadata: Optional[SentimentMetadata] = None


class SentimentResponse(BaseModel):
    vader_score: float = Field(..., ge=0, le=1, description="Normalized VADER compound score (0-1)")
    distilbert_score: float = Field(..., ge=0, le=1, description="DistilBERT positive-class probability (0-1)")
    final_score: float = Field(..., ge=0, le=1, description="Weighted ensemble score (0-1)")
    sentiment: str = Field(..., description="One of: positive, neutral, negative")
    confidence: float = Field(..., ge=0, le=1, description="Confidence in the prediction (0-1)")
    processed_text: Optional[str] = Field(None, description="Preprocessed text used for analysis (cleaned)")


# --- Lifespan: load model once at startup ---

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting sentiment service: loading DistilBERT at startup...")
    try:
        # Load in thread so we don't block the event loop during startup
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(None, load_distilbert)
        logger.info("Startup complete. DistilBERT loaded.")
    except Exception as e:
        logger.exception("Startup failed: %s", e)
        raise
    yield
    logger.info("Shutting down sentiment service.")


app = FastAPI(
    title="Sentimind Sentiment Analysis",
    description="Hybrid VADER + DistilBERT weighted ensemble for sentiment analysis.",
    version="1.0.0",
    lifespan=lifespan,
)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "sentiment-analysis"}


@app.post("/analyze", response_model=SentimentResponse)
async def analyze_sentiment(request: SentimentRequest) -> SentimentResponse:
    """
    Analyze sentiment of the given text.
    Preprocessing: remove URLs, @mentions, lowercase, emojis to text, expand abbreviations.
    Returns VADER score, DistilBERT score, final ensemble score, sentiment label, and confidence.
    """
    start = time.perf_counter()
    try:
        cleaned = preprocess(request.text)
        if not cleaned.strip():
            raise HTTPException(status_code=400, detail="Text is empty after preprocessing.")
        # Run blocking inference in thread pool so we don't block the event loop
        loop = asyncio.get_running_loop()
        result = await loop.run_in_executor(None, analyze, cleaned)
        elapsed_ms = (time.perf_counter() - start) * 1000
        logger.info("request_id=analyze total_time_ms=%.2f", elapsed_ms)
        content = {
            "vader_score": result.vader_score,
            "distilbert_score": result.distilbert_score,
            "final_score": result.final_score,
            "sentiment": result.sentiment,
            "confidence": result.confidence,
        }
        if cleaned:
            content["processed_text"] = cleaned
        return JSONResponse(
            content=content,
            headers={"X-Inference-Ms": f"{elapsed_ms:.2f}"},
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("analyze error: %s", e)
        raise HTTPException(status_code=500, detail="Sentiment analysis failed.")
