const { GoogleGenerativeAI } = require("@google/generative-ai");
const { logger } = require("../utils/logger");
const { env } = require("../config/env");

const MODULE_NAME = "GeminiService";

let genAI = null;
if (env.geminiApiKey) {
  try {
    genAI = new GoogleGenerativeAI(env.geminiApiKey);
    logger.info(MODULE_NAME, "GoogleGenerativeAI initialized successfully");
  } catch (err) {
    logger.warn(MODULE_NAME, "Failed to initialize GoogleGenerativeAI", err);
  }
}

/**
 * Robust JSON parser that handles LLM markdown blocks (```json ... ```)
 */
function extractJsonFromText(rawText) {
  if (!rawText) return null;
  try {
    const cleaned = rawText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const jsonSub = cleaned.substring(firstBrace, lastBrace + 1);
      return JSON.parse(jsonSub);
    }
    return JSON.parse(cleaned);
  } catch (err) {
    logger.warn(MODULE_NAME, `JSON parse failed: ${err.message}`);
    return null;
  }
}

/**
 * Invoke Gemini with prompt, or return intelligent deterministic fallback if API key is not configured
 */
async function generateJsonAnalysis(prompt, fallbackGenerator) {
  if (genAI && env.geminiApiKey) {
    const candidateModels = ["gemini-3.6-flash", "gemini-flash-latest", "gemini-3.5-flash"];
    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const text = result?.response?.text();
        const parsed = extractJsonFromText(text);
        if (parsed) {
          return parsed;
        }
      } catch (err) {
        logger.warn(MODULE_NAME, `Gemini model ${modelName} failed: ${err.message}. Trying next candidate.`);
      }
    }
  }

  // Graceful fallback heuristics
  return fallbackGenerator();
}

module.exports = {
  generateJsonAnalysis,
  extractJsonFromText,
};
