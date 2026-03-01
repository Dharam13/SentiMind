/**
 * Periodic job: find mentions with sentimentStatus "pending", call Sentiment microservice,
 * then update the document with sentiment result and set sentimentStatus to "completed".
 * All MongoDB read/write is done here; the Python service is stateless.
 * For RSS/news we send clean meaningful text: title + description/snippet.
 */

const { Mention } = require("../models/Mention");
const { analyzeSentiment } = require("./sentimentClient");
const { env } = require("../config/env");

let intervalId = null;

/**
 * Build clean, meaningful text for sentiment analysis.
 * For RSS/news: title + description or contentSnippet (so the service gets full context).
 * For social: content or rawJson.text/content. Strips HTML from raw content.
 */
function getTextForSentiment(doc) {
  const platform = (doc.platform || "").toLowerCase();
  const sourceType = doc.sourceType || "";
  const rawJson = doc.rawJson || {};
  const meta = doc.metadata || {};
  const content = doc.content || "";

  // RSS or news: prefer title + description/snippet for clean, meaningful text
  if (sourceType === "rss" || platform === "news") {
    const title = meta.title || rawJson.title || "";
    const description =
      meta.description ||
      meta.snippet ||
      rawJson.contentSnippet ||
      rawJson.description ||
      (typeof rawJson.content === "string" ? rawJson.content.replace(/<[^>]+>/g, " ").trim() : "") ||
      "";
    const combined = [title, description].filter(Boolean).join(" ").trim();
    if (combined) return combined;
  }

  // Social / API: content or raw fields
  let text = content || rawJson.text || rawJson.content || "";
  if (typeof text !== "string") text = String(text);
  // Strip HTML if present
  return text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Process a single batch of pending mentions.
 * @returns {{ processed: number, failed: number }}
 */
async function processPendingBatch() {
  const limit = env.sentimentBatchSize || 10;
  const pending = await Mention.find({
    $or: [
      { sentimentStatus: "pending" },
      { sentimentStatus: { $exists: false } },
    ],
  })
    .limit(limit)
    .lean();

  let processed = 0;
  let failed = 0;

  for (const doc of pending) {
    const textToSend = getTextForSentiment(doc);

    if (!textToSend) {
      await Mention.updateOne(
        { _id: doc._id },
        {
          $set: {
            sentimentStatus: "completed",
            "sentiment.label": "neutral",
            "sentiment.confidence": 0,
            "sentiment.analyzedAt": new Date(),
          },
        }
      );
      processed++;
      continue;
    }

    try {
      const result = await analyzeSentiment(textToSend, {
        source: doc.platform,
        timestamp: doc.publishedAt ? new Date(doc.publishedAt).toISOString() : undefined,
      });

      await Mention.updateOne(
        { _id: doc._id },
        {
          $set: {
            sentimentStatus: "completed",
            sentiment: {
              vader_score: result.vader_score,
              distilbert_score: result.distilbert_score,
              final_score: result.final_score,
              label: result.sentiment,
              confidence: result.confidence,
              processed_text: result.processed_text ?? undefined,
              analyzedAt: new Date(),
            },
          },
        }
      );
      processed++;
    } catch (err) {
      const msg =
        err?.message ||
        err?.code ||
        (err?.response?.data && typeof err.response.data === "object" && err.response.data.detail
          ? err.response.data.detail
          : err?.response?.data) ||
        String(err);
      console.warn(`[SentimentProcessor] Failed to analyze mention ${doc._id}: ${msg}`);
      await Mention.updateOne(
        { _id: doc._id },
        { $set: { sentimentStatus: "failed" } }
      ).catch(() => {});
      failed++;
    }
  }

  return { processed, failed };
}

/**
 * Start the periodic sentiment processor. Runs every SENTIMENT_POLL_INTERVAL_MS.
 */
function startSentimentProcessor() {
  if (intervalId) return;

  const intervalMs = env.sentimentPollIntervalMs || 30_000;
  if (!env.sentimentServiceUrl) {
    console.warn("[SentimentProcessor] SENTIMENT_SERVICE_URL not set; sentiment processor disabled");
    return;
  }

  console.log(`[SentimentProcessor] Starting: poll every ${intervalMs}ms, batch size ${env.sentimentBatchSize}`);

  intervalId = setInterval(async () => {
    try {
      const { processed, failed } = await processPendingBatch();
      if (processed > 0 || failed > 0) {
        console.log(`[SentimentProcessor] Batch done: ${processed} completed, ${failed} failed`);
      }
    } catch (err) {
      console.error("[SentimentProcessor] Error:", err.message);
    }
  }, intervalMs);
}

/**
 * Stop the periodic processor.
 */
function stopSentimentProcessor() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("[SentimentProcessor] Stopped");
  }
}

module.exports = {
  processPendingBatch,
  startSentimentProcessor,
  stopSentimentProcessor,
};
