const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { env } = require("./config/env");
const { connectMongo } = require("./db/mongo");
const collectRoutes = require("./routes/collectRoutes");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(
  cors({
    origin: "*", // safe for Postman / local testing; tighten if needed
  })
);

// Configure JSON body parser with better error handling
// Use raw body parser first to catch aborted requests early
app.use((req, res, next) => {
  // Log incoming request immediately
  if (req.method === "POST" && req.path.includes("/run")) {
    console.log(`[Collector] Received ${req.method} ${req.path} request`);
    console.log(`[Collector] Content-Type: ${req.headers["content-type"]}`);
    console.log(`[Collector] Content-Length: ${req.headers["content-length"] || "unknown"}`);
  }
  
  // Set longer timeout for reading request body and processing
  req.setTimeout(180000); // 3 minutes to read body and process
  res.setTimeout(180000); // 3 minutes for response
  
  // Handle client disconnect
  req.on("close", () => {
    if (!res.headersSent) {
      console.warn(`[Collector] Client disconnected during ${req.method} ${req.path}`);
    }
  });
  
  // Handle request errors
  req.on("error", (err) => {
    console.error(`[Collector] Request error: ${err.message}`);
  });
  
  next();
});

app.use(
  express.json({
    limit: "10mb",
    strict: false,
    verify: (req, res, buf) => {
      // Log when body starts being parsed
      if (req.method === "POST" && req.path.includes("/run")) {
        console.log(`[Collector] Parsing JSON body, size: ${buf.length} bytes`);
      }
    },
  })
);

// Handle aborted request errors BEFORE routes
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed" || err.message?.includes("aborted") || err.name === "BadRequestError") {
    console.warn(`[Collector] Request parse error: ${req.method} ${req.path} - ${err.message}`);
    if (!res.headersSent) {
      return res.status(400).json({
        error: "Request was cancelled or invalid JSON",
        code: "REQUEST_ABORTED",
        message: err.message,
      });
    }
    return;
  }
  next(err);
});

app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "sentimind-collector" });
});

app.use("/api/collect", collectRoutes);

app.use(errorHandler);

async function start() {
  try {
    await connectMongo();
    const { startSentimentProcessor } = require("./services/sentimentProcessor");
    startSentimentProcessor();
    const server = app.listen(env.port, () => {
      // Set server timeouts to handle long-running requests
      server.timeout = 180000; // 3 minutes
      server.keepAliveTimeout = 65000; // 65 seconds
      server.headersTimeout = 66000; // 66 seconds
      
      console.log("\n" + "=".repeat(60));
      console.log("🚀 Collector Service Started Successfully");
      console.log("=".repeat(60));
      console.log(`   Port: ${env.port}`);
      console.log(`   Server Timeout: 180s`);
      console.log(`   Health: http://localhost:${env.port}/health`);
      console.log(`   Endpoints: http://localhost:${env.port}/api/collect/{platform}`);
      console.log("=".repeat(60) + "\n");
    });
  } catch (error) {
    console.error("\n❌ Failed to start Collector Service");
    console.error(`   Error: ${error.message}\n`);
    process.exit(1);
  }
}

module.exports = { app, start };

