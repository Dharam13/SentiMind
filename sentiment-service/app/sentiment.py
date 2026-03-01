"""
Hybrid sentiment: VADER (rule-based) + DistilBERT (transformer) with weighted ensemble.
- VADER compound (-1 to 1) -> normalized to 0-1: (compound + 1) / 2
- DistilBERT SST-2: positive probability as score 0-1
- Ensemble: S = alpha * S_vader + (1 - alpha) * S_distilbert  (alpha = 0.4)
- Classification:
  - Wider neutral band: 0.35 <= S <= 0.65 (positive >= 0.65, negative < 0.35)
  - Uncertainty override: if DistilBERT in [0.25, 0.75] -> neutral (model uncertain)
  - VADER-neutral override: if VADER normalized in [0.45, 0.55] -> neutral (factual/no sentiment)
"""

import logging
import time
from dataclasses import dataclass
from typing import Any, Optional

from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

logger = logging.getLogger(__name__)

ALPHA = 0.4  # weight for VADER; (1 - ALPHA) for DistilBERT

# Neutral detection: wider band + overrides for factual/uncertain cases
NEUTRAL_FINAL_LOW = 0.35
NEUTRAL_FINAL_HIGH = 0.65
DISTILBERT_UNCERTAIN_LOW = 0.25   # DistilBERT in [this, 1-this] -> uncertain -> neutral
DISTILBERT_UNCERTAIN_HIGH = 0.75
VADER_NEUTRAL_LOW = 0.45          # VADER normalized in [this, 1-this] -> no strong sentiment
VADER_NEUTRAL_HIGH = 0.55

# Global analyzer (created once)
_vader_analyzer: Optional[SentimentIntensityAnalyzer] = None
_distilbert_pipeline: Any = None
_distilbert_model_name: str = "distilbert-base-uncased-finetuned-sst-2-english"


def get_vader_analyzer() -> SentimentIntensityAnalyzer:
    global _vader_analyzer
    if _vader_analyzer is None:
        _vader_analyzer = SentimentIntensityAnalyzer()
    return _vader_analyzer


def load_distilbert():
    """Load DistilBERT pipeline once at startup."""
    global _distilbert_pipeline
    if _distilbert_pipeline is not None:
        return
    try:
        from transformers import pipeline
        logger.info("Loading DistilBERT sentiment model: %s", _distilbert_model_name)
        _distilbert_pipeline = pipeline(
            "sentiment-analysis",
            model=_distilbert_model_name,
            device=-1,  # CPU; use 0 or "cuda" for GPU
            truncation=True,
            max_length=512,
        )
        logger.info("DistilBERT model loaded successfully")
    except Exception as e:
        logger.exception("Failed to load DistilBERT: %s", e)
        raise


def get_distilbert_pipeline():
    if _distilbert_pipeline is None:
        load_distilbert()
    return _distilbert_pipeline


def vader_score(text: str) -> float:
    """Return VADER compound score in [-1, 1]."""
    analyzer = get_vader_analyzer()
    scores = analyzer.polarity_scores(text)
    return float(scores["compound"])


def vader_normalized(text: str) -> float:
    """VADER compound normalized to [0, 1]: (compound + 1) / 2."""
    compound = vader_score(text)
    return (compound + 1.0) / 2.0


def distilbert_score(text: str) -> float:
    """
    Run DistilBERT sentiment and return positive-class probability in [0, 1].
    Model outputs LABEL (POSITIVE/NEGATIVE) and SCORE. We return score for POSITIVE,
    or 1 - score for NEGATIVE, so higher = more positive.
    """
    if not text or not text.strip():
        return 0.5  # neutral when empty
    pipe = get_distilbert_pipeline()
    # pipeline returns list of dicts, e.g. [{"label": "POSITIVE", "score": 0.9998}]
    result = pipe(text.strip()[:512], truncation=True, max_length=512)
    if not result:
        return 0.5
    item = result[0]
    label = (item.get("label") or "").upper()
    score = float(item.get("score", 0.5))
    if "POSITIVE" in label or label == "POS":
        return score
    return 1.0 - score


def classify(final_score: float, s_vader_norm: float, s_distilbert: float) -> str:
    """
    Map final ensemble score to sentiment label with improved neutral detection.
    - Use a wider neutral band (0.35-0.65).
    - If DistilBERT is uncertain (score in [0.25, 0.75]), treat as neutral.
    - If VADER is neutral (normalized in [0.45, 0.55]), treat as neutral (factual statements).
    """
    # Override 1: DistilBERT uncertain -> neutral (factual/mixed often get mid-range scores)
    if DISTILBERT_UNCERTAIN_LOW <= s_distilbert <= DISTILBERT_UNCERTAIN_HIGH:
        return "neutral"
    # Override 2: VADER found no strong sentiment -> neutral (e.g. "The device has 8GB RAM")
    if VADER_NEUTRAL_LOW <= s_vader_norm <= VADER_NEUTRAL_HIGH:
        return "neutral"
    # Standard band: wider neutral range
    if final_score >= NEUTRAL_FINAL_HIGH:
        return "positive"
    if final_score > NEUTRAL_FINAL_LOW:
        return "neutral"
    return "negative"


def confidence(final_score: float, distilbert_score_val: float, sentiment: str) -> float:
    """
    Confidence in [0, 1]: use DistilBERT's probability for the predicted class.
    - positive -> distilbert_score (prob of positive)
    - negative -> 1 - distilbert_score
    - neutral -> 1 - 2 * abs(distilbert_score - 0.5)  (closeness to 0.5)
    """
    if sentiment == "positive":
        return round(distilbert_score_val, 2)
    if sentiment == "negative":
        return round(1.0 - distilbert_score_val, 2)
    # neutral: how close distilbert is to 0.5
    return round(1.0 - 2.0 * abs(distilbert_score_val - 0.5), 2)


@dataclass
class SentimentResult:
    vader_score: float
    distilbert_score: float
    final_score: float
    sentiment: str
    confidence: float


def analyze(text: str) -> SentimentResult:
    """
    Run full hybrid pipeline: VADER + DistilBERT, then weighted ensemble.
    All scores in 0-1 range (VADER normalized). Logs inference time.
    """
    t0 = time.perf_counter()

    s_vader_norm = vader_normalized(text)
    s_distilbert = distilbert_score(text)

    final = ALPHA * s_vader_norm + (1.0 - ALPHA) * s_distilbert
    sent = classify(final, s_vader_norm, s_distilbert)
    conf = confidence(final, s_distilbert, sent)

    elapsed_ms = (time.perf_counter() - t0) * 1000
    logger.info(
        "sentiment inference: vader=%.3f distilbert=%.3f final=%.3f sentiment=%s confidence=%.2f time_ms=%.2f",
        s_vader_norm, s_distilbert, final, sent, conf, elapsed_ms,
    )

    return SentimentResult(
        vader_score=round(s_vader_norm, 2),
        distilbert_score=round(s_distilbert, 2),
        final_score=round(final, 2),
        sentiment=sent,
        confidence=conf,
    )
