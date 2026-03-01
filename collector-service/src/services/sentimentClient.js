/**
 * HTTP client for the Python Sentiment Analysis microservice.
 * Sends raw text to POST /analyze and returns sentiment scores, label, confidence, and optional processed_text.
 */

const axios = require("axios");
const { env } = require("../config/env");

const DEFAULT_TIMEOUT_MS = 15000;

/**
 * Call the Sentiment Analysis service to analyze raw text.
 * @param {string} text - Raw post content (tweet, review, etc.)
 * @param {object} [metadata] - Optional { timestamp, source, userId }
 * @returns {Promise<{
 *   vader_score: number,
 *   distilbert_score: number,
 *   final_score: number,
 *   sentiment: string,
 *   confidence: number,
 *   processed_text?: string
 * }>}
 */
async function analyzeSentiment(text, metadata = {}) {
  const baseUrl = env.sentimentServiceUrl;
  if (!baseUrl) {
    throw new Error("SENTIMENT_SERVICE_URL is not configured");
  }

  const url = `${baseUrl.replace(/\/$/, "")}/analyze`;
  const payload = {
    text: typeof text === "string" ? text : String(text || ""),
    metadata: metadata.timestamp || metadata.source || metadata.userId ? metadata : undefined,
  };

  const { data } = await axios.post(url, payload, {
    headers: { "Content-Type": "application/json" },
    timeout: DEFAULT_TIMEOUT_MS,
  });

  return {
    vader_score: data.vader_score,
    distilbert_score: data.distilbert_score,
    final_score: data.final_score,
    sentiment: data.sentiment,
    confidence: data.confidence,
    processed_text: data.processed_text,
  };
}

module.exports = { analyzeSentiment };
