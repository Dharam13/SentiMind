const { GoogleGenerativeAI } = require("@google/generative-ai");
const { logger } = require("../utils/logger");
const { env } = require("../config/env");
const { langsmith } = require("./langsmithService");

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
 * Invoke Gemini with prompt, or return intelligent deterministic fallback if API key is not configured.
 * Fully traced in LangSmith with prompt, outputs, latency, and model metadata.
 */
async function generateJsonAnalysis(prompt, fallbackGenerator, traceOptions = {}) {
  const {
    parentRunId = null,
    runName = "Gemini_Analysis",
    metadata = {},
    tags = ["gemini", "llm"],
  } = traceOptions;

  const llmRun = await langsmith.startRun({
    name: runName,
    runType: "llm",
    inputs: { prompt },
    parentRunId,
    metadata: {
      provider: "google-gemini",
      ...metadata,
    },
    tags,
  });

  const startTime = Date.now();

  if (genAI && env.geminiApiKey) {
    const candidateModels = ["gemini-3.6-flash", "gemini-flash-latest", "gemini-3.5-flash"];
    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const text = result?.response?.text();
        const parsed = extractJsonFromText(text);
        if (parsed) {
          await langsmith.endRun(llmRun.runId, {
            outputs: { text, parsedJson: parsed },
            metadata: {
              selectedModel: modelName,
              latencyMs: Date.now() - startTime,
              success: true,
            },
          });
          return parsed;
        }
      } catch (err) {
        logger.warn(MODULE_NAME, `Gemini model ${modelName} failed: ${err.message}. Trying next candidate.`);
      }
    }
  }

  // Graceful fallback heuristics
  const fallbackOutput = fallbackGenerator();
  await langsmith.endRun(llmRun.runId, {
    outputs: {
      isFallback: true,
      parsedJson: fallbackOutput,
      reason: genAI ? "Model parsing fallback" : "GEMINI_API_KEY_UNAVAILABLE",
    },
    metadata: {
      latencyMs: Date.now() - startTime,
      fallbackUsed: true,
    },
  });

  return fallbackOutput;
}

module.exports = {
  generateJsonAnalysis,
  extractJsonFromText,
};
