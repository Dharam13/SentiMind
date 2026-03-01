# Sentiment Analysis Service

Hybrid sentiment analysis microservice combining **VADER** (rule-based, fast, social-media oriented) and **DistilBERT** (context-aware transformer) using a weighted ensemble.

## Setup

**You must install dependencies before running.** If you see `ModuleNotFoundError: No module named 'vaderSentiment'`, run the steps below.

```bash
cd sentiment-service
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
# source .venv/bin/activate
pip install -r requirements.txt
```

Then run the service (see **Run** below). The collector will call this service for sentiment; if it is not running, you will see `[SentimentProcessor] Failed to analyze mention ...` with a connection error in the collector logs.

## Run

```bash
python run.py
# or
uvicorn app.main:app --host 0.0.0.0 --port 8030
```

Service listens on **port 8030**. Health: `GET http://localhost:8030/health`

## API

### POST /analyze

**Request body:**

```json
{
  "text": "Your raw text here (tweet, review, post, etc.)",
  "metadata": {
    "timestamp": "2025-03-01T12:00:00Z",
    "source": "twitter",
    "userId": "optional"
  }
}
```

**Response:**

```json
{
  "vader_score": 0.72,
  "distilbert_score": 0.81,
  "final_score": 0.77,
  "sentiment": "positive",
  "confidence": 0.81
}
```

- **Preprocessing:** URLs removed, @mentions removed, lowercase, emojis → text, common abbreviations expanded; negations preserved.
- **Ensemble:** `final_score = 0.4 * vader_normalized + 0.6 * distilbert_score` (α = 0.4).
- **Classification (with improved neutral detection):**
  - **Wider neutral band:** `0.35 ≤ final_score ≤ 0.65` → neutral (positive ≥ 0.65, negative < 0.35).
  - **Uncertainty override:** If DistilBERT score is in [0.25, 0.75], label as **neutral** (model uncertain; common for factual or mixed text).
  - **VADER-neutral override:** If VADER normalized is in [0.45, 0.55], label as **neutral** (no strong sentiment; e.g. factual statements like “The device has 8GB RAM”).
- **Confidence:** Based on DistilBERT probability for the predicted class (or distance from 0.5 for neutral).

DistilBERT is loaded once at startup. Inference time is logged per request; target latency &lt; 100 ms (best-effort; first request may be slower).
