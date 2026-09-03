"""
Hybrid sentiment: VADER (rule-based) + DistilBERT (transformer) with weighted ensemble.
- VADER compound (-1 to 1) -> normalized to 0-1: (compound + 1) / 2
- DistilBERT SST-2: positive probability as score 0-1
- Ensemble: S = alpha * S_vader + (1 - alpha) * S_distilbert  (alpha = 0.4)
- Classification:
  - Neutral band: 0.38 <= S <= 0.62
  - Transformer uncertainty band: [0.20, 0.80]
  - Neutral VADER protection: [0.42, 0.58]
  - Prevents false-negative bias on short factual titles without description
"""

import logging
import time
from dataclasses import dataclass
from typing import Any, Optional

from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

logger = logging.getLogger(__name__)

ALPHA = 0.4  # weight for VADER; (1 - ALPHA) for DistilBERT

# Neutral detection thresholds
NEUTRAL_FINAL_LOW = 0.38
NEUTRAL_FINAL_HIGH = 0.62
DISTILBERT_UNCERTAIN_LOW = 0.20   # DistilBERT in [this, 1-this] -> uncertain -> neutral
DISTILBERT_UNCERTAIN_HIGH = 0.80
VADER_NEUTRAL_LOW = 0.42          # VADER normalized in [this, 1-this] -> no strong sentiment
VADER_NEUTRAL_HIGH = 0.58

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
            device=-1,  # CPU
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
    """
    if not text or not text.strip():
        return 0.5
    pipe = get_distilbert_pipeline()
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
    Map final ensemble score to sentiment label with balanced neutral protection.
    - Prevents binary DistilBERT from misclassifying factual titles as negative.
    - If VADER is neutral/non-negative (s_vader_norm >= 0.45), text is NOT negative.
    """
    # If VADER detects zero or neutral sentiment, protect against false negative bias
    if VADER_NEUTRAL_LOW <= s_vader_norm <= VADER_NEUTRAL_HIGH:
        return "neutral"

    # If DistilBERT is in the uncertain range, treat as neutral
    if DISTILBERT_UNCERTAIN_LOW <= s_distilbert <= DISTILBERT_UNCERTAIN_HIGH:
        return "neutral"

    # If VADER is neutral/positive but DistilBERT binary SST-2 leans negative on short text, keep neutral
    if s_vader_norm >= 0.48 and final_score < NEUTRAL_FINAL_LOW:
        return "neutral"

    # Standard decision boundaries
    if final_score >= NEUTRAL_FINAL_HIGH:
        return "positive"
    if final_score >= NEUTRAL_FINAL_LOW:
        return "neutral"

    return "negative"


def confidence(final_score: float, distilbert_score_val: float, sentiment: str) -> float:
    """
    Confidence in [0, 1]: use DistilBERT's probability for the predicted class.
    """
    if sentiment == "positive":
        return round(distilbert_score_val, 2)
    if sentiment == "negative":
        return round(1.0 - distilbert_score_val, 2)
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
