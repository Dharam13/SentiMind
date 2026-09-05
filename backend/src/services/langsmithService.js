const crypto = require("crypto");
const { logger } = require("../utils/logger");
const { env } = require("../config/env");

const MODULE_NAME = "LangSmith";

class LangSmithService {
  constructor() {
    this.apiKey = env.langchainApiKey || process.env.LANGCHAIN_API_KEY || "";
    this.endpoint = (env.langchainEndpoint || process.env.LANGCHAIN_ENDPOINT || "https://api.smith.langchain.com").replace(/\/$/, "");
    this.projectName = env.langchainProject || process.env.LANGCHAIN_PROJECT || "sentimind-agentic-observability";
    this.enabled = Boolean(this.apiKey && this.apiKey.startsWith("lsv2_"));

    if (this.enabled) {
      logger.info(MODULE_NAME, `LangSmith Tracing active for project: "${this.projectName}"`);
    } else {
      logger.warn(MODULE_NAME, "LangSmith tracing disabled (missing or invalid LANGCHAIN_API_KEY)");
    }
  }

  /**
   * Safe asynchronous HTTP request to LangSmith API
   */
  async _request(path, method, body = null) {
    if (!this.enabled) return null;

    try {
      const url = `${this.endpoint}${path}`;
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok && response.status !== 202) {
        const text = await response.text().catch(() => "");
        logger.warn(MODULE_NAME, `API returned status ${response.status}: ${text.slice(0, 150)}`);
        return null;
      }

      return await response.json().catch(() => ({}));
    } catch (err) {
      // Non-blocking fail-safe: observability should never crash core business logic
      logger.warn(MODULE_NAME, `Failed to post trace event: ${err.message}`);
      return null;
    }
  }

  /**
   * Start a new trace run or sub-span in LangSmith
   */
  async startRun({
    name,
    runType = "chain", // "chain" | "llm" | "tool" | "retriever"
    inputs = {},
    parentRunId = null,
    metadata = {},
    tags = [],
  }) {
    const runId = crypto.randomUUID();
    const startTime = new Date().toISOString();

    if (!this.enabled) {
      return { runId, startTime, parentRunId };
    }

    const payload = {
      id: runId,
      name,
      run_type: runType,
      inputs,
      start_time: startTime,
      session_name: this.projectName,
      project_name: this.projectName,
      tags: ["sentimind", ...tags],
      extra: {
        metadata: {
          environment: env.nodeEnv || "development",
          service: "sentimind-agents",
          ...metadata,
        },
      },
    };

    if (parentRunId) {
      payload.parent_run_id = parentRunId;
    }

    // Fire-and-forget: do not block agent loop execution
    this._request("/runs", "POST", payload);

    return { runId, startTime, parentRunId };
  }

  /**
   * Complete an existing run with outputs or error
   */
  async endRun(runId, { outputs = {}, error = null, metadata = {} } = {}) {
    if (!this.enabled || !runId) return;

    const payload = {
      end_time: new Date().toISOString(),
    };

    if (error) {
      payload.error = String(error.message || error);
    } else {
      payload.outputs = outputs;
    }

    if (Object.keys(metadata).length > 0) {
      payload.extra = { metadata };
    }

    // Fire-and-forget
    this._request(`/runs/${runId}`, "PATCH", payload);
  }

  /**
   * Trace an LLM invocation (e.g. Gemini)
   */
  async traceLlm({
    name = "Gemini_Inference",
    model = "gemini-flash",
    prompt,
    parentRunId = null,
    fn,
  }) {
    const run = await this.startRun({
      name,
      runType: "llm",
      inputs: { prompt },
      parentRunId,
      metadata: { model, provider: "google" },
      tags: ["llm", "gemini"],
    });

    const start = Date.now();
    try {
      const output = await fn();
      const latencyMs = Date.now() - start;
      await this.endRun(run.runId, {
        outputs: { output },
        metadata: { latencyMs },
      });
      return output;
    } catch (err) {
      const latencyMs = Date.now() - start;
      await this.endRun(run.runId, {
        error: err,
        metadata: { latencyMs },
      });
      throw err;
    }
  }

  /**
   * Wrap an async block within an observability span
   */
  async withSpan({ name, runType = "chain", inputs = {}, parentRunId = null, metadata = {}, tags = [] }, fn) {
    const run = await this.startRun({ name, runType, inputs, parentRunId, metadata, tags });
    const start = Date.now();
    try {
      const result = await fn(run.runId);
      const latencyMs = Date.now() - start;
      await this.endRun(run.runId, {
        outputs: typeof result === "object" ? result : { result },
        metadata: { latencyMs },
      });
      return result;
    } catch (err) {
      const latencyMs = Date.now() - start;
      await this.endRun(run.runId, {
        error: err,
        metadata: { latencyMs },
      });
      throw err;
    }
  }

  /**
   * Status check for frontend and health probes
   */
  getStatus() {
    return {
      enabled: this.enabled,
      projectName: this.projectName,
      endpoint: this.endpoint,
      dashboardUrl: `https://smith.langchain.com/o/default/projects/p/${encodeURIComponent(this.projectName)}`,
      hasApiKey: Boolean(this.apiKey),
    };
  }
}

const langsmith = new LangSmithService();

module.exports = {
  langsmith,
  LangSmithService,
};
