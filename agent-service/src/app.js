const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { env } = require("./config/env");
const { connectMongo } = require("./db/mongo");
const agentRoutes = require("./routes/agentRoutes");

const { runSentimentSignalCheck } = require("./agents/sentimentSignalAgent");
const { processPendingSignals } = require("./agents/intentRootCauseAgent");
const { processAnalyzedRootCauses } = require("./agents/campaignOrchestratorAgent");
const { executeApprovedCampaigns, retryFailedActions } = require("./agents/policyPaymentAgent");

const app = express();

app.use(cors({ origin: "*" }));
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

// For webhook endpoint: raw buffer parsing
app.use("/api/agent/webhook", express.raw({ type: "application/json" }));

// Standard JSON parsing for other routes
app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "sentimind-agent-service" });
});

app.use("/api/agent", agentRoutes);

// Error Handler Middleware
app.use((err, _req, res, _next) => {
  console.error("[Agent Service Error]:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal Agent Error",
    code: err.code || "AGENT_SERVICE_ERROR",
  });
});

let intervalIds = [];

/**
 * Start the 4 Agent Background Orchestration Loops
 */
function startAgentWorkers() {
  console.log("🤖 Starting 4-Agent Autonomous Orchestration Loops...");

  // Agent 1: Signal & Spike Detector (every 1-5 min)
  const id1 = setInterval(async () => {
    try {
      await runSentimentSignalCheck();
    } catch (e) {
      console.error("[Worker Agent 1] Error:", e.message);
    }
  }, env.signalCheckIntervalMs);

  // Agent 2, 3, 4: Continuous Pipeline Worker (every 15-30s)
  const id2 = setInterval(async () => {
    try {
      // 1. Diagnose Root Causes (Agent 2)
      await processPendingSignals();

      // 2. Plan Campaigns (Agent 3)
      await processAnalyzedRootCauses();

      // 3. Execute Approved Campaigns (Agent 4)
      await executeApprovedCampaigns();

      // 4. Retry Failed Transient Actions Idempotently
      await retryFailedActions();
    } catch (e) {
      console.error("[Worker Pipeline] Error:", e.message);
    }
  }, env.agentProcessIntervalMs);

  intervalIds.push(id1, id2);
}

function stopAgentWorkers() {
  intervalIds.forEach(clearInterval);
  intervalIds = [];
}

async function start() {
  try {
    await connectMongo();
    startAgentWorkers();

    const server = app.listen(env.port, () => {
      console.log("\n" + "=".repeat(60));
      console.log("🚀 SentiMind Agent Service (4-Agent Orchestrator) Started");
      console.log("=".repeat(60));
      console.log(`   Port: ${env.port}`);
      console.log(`   Health: http://localhost:${env.port}/health`);
      console.log(`   Catalog: http://localhost:${env.port}/api/agent/catalog`);
      console.log(`   Overview: http://localhost:${env.port}/api/agent/overview`);
      console.log("=".repeat(60) + "\n");
    });

    return server;
  } catch (error) {
    console.error("❌ Failed to start Agent Service:", error.message);
    process.exit(1);
  }
}

module.exports = { app, start, startAgentWorkers, stopAgentWorkers };
