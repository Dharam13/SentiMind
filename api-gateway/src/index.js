/**
 * Sentimind API Gateway - single entry point for microservice routing
 * Proxies: /auth, /projects -> Auth Service; /api/collect -> Collector Service
 */

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { createProxyMiddleware } = require("http-proxy-middleware");
const { env } = require("./config/env");

const app = express();

// Set server timeout to handle long-running collector requests
app.timeout = 180000; // 3 minutes

const corsOrigins = env.corsOrigin.split(",").map((o) => o.trim());
app.use(
  cors({
    origin: corsOrigins.length === 1 ? corsOrigins[0] : corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

// Set timeout for all requests FIRST
app.use((req, res, next) => {
  req.setTimeout(180000); // 3 minutes
  res.setTimeout(180000); // 3 minutes
  next();
});

// CRITICAL: Proxy middleware MUST come BEFORE express.json()
// Otherwise express.json() consumes the body stream and proxy can't forward it

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "sentimind-api-gateway" });
});

app.use(
  "/auth",
  createProxyMiddleware({
    target: env.authServiceUrl,
    changeOrigin: true,
    pathRewrite: { "^/": "/auth/" },
    timeout: 30000,
    proxyTimeout: 30000,
    on: {
      proxyReq(proxyReq, req) {
        if (req.headers.origin) {
          proxyReq.setHeader("Origin", req.headers.origin);
        }
      },
      error(err, req, res) {
        console.error("[gateway] auth proxy error:", err.message);
        if (!res.headersSent) {
          res.status(502).json({ error: "Auth service unavailable" });
        }
      },
    },
  })
);

app.use(
  "/projects",
  createProxyMiddleware({
    target: env.authServiceUrl,
    changeOrigin: true,
    pathRewrite: { "^/": "/projects/" },
    timeout: 30000,
    proxyTimeout: 30000,
    on: {
      proxyReq(proxyReq, req) {
        if (req.headers.origin) {
          proxyReq.setHeader("Origin", req.headers.origin);
        }
      },
      error(err, req, res) {
        console.error("[gateway] projects proxy error:", err.message);
        if (!res.headersSent) {
          res.status(502).json({ error: "Auth service unavailable" });
        }
      },
    },
  })
);

app.use(
  "/api/collect",
  createProxyMiddleware({
    target: env.collectorServiceUrl,
    changeOrigin: true,
    pathRewrite: { "^/": "/api/collect/" },
    timeout: 180000, // 3 minutes timeout for collector requests
    proxyTimeout: 180000,
    xfwd: true,
    on: {
      proxyReq(proxyReq, req) {
        // Set longer timeout on the proxied request
        proxyReq.setTimeout(180000);
        
        // Log when request is being proxied
        console.log(`[gateway] Proxying ${req.method} ${req.path} to collector (timeout: 180s)`);
        console.log(`[gateway] Content-Length: ${req.headers["content-length"] || "unknown"}`);
        console.log(`[gateway] Content-Type: ${req.headers["content-type"] || "unknown"}`);
        
        // Copy important headers
        if (req.headers.origin) {
          proxyReq.setHeader("Origin", req.headers.origin);
        }
        // Body stream will be automatically forwarded by proxy middleware
        // since express.json() hasn't consumed it yet
      },
      proxyRes(proxyRes, req, res) {
        // Log successful proxy response
        console.log(`[gateway] Collector responded: ${proxyRes.statusCode} for ${req.method} ${req.path}`);
      },
      error(err, req, res) {
        console.error(`[gateway] collector proxy error for ${req.method} ${req.path}:`, err.message, err.code);
        if (!res.headersSent) {
          // Provide more specific error messages
          let statusCode = 502;
          let errorMessage = "Collector service unavailable";
          
          if (err.code === "ECONNRESET" || err.message.includes("socket hang up")) {
            errorMessage = "Connection to collector service was reset. The request may have timed out.";
            statusCode = 504; // Gateway Timeout
          } else if (err.code === "ETIMEDOUT" || err.message.includes("timeout")) {
            errorMessage = "Collector service request timed out";
            statusCode = 504;
          }
          
          res.status(statusCode).json({ 
            error: errorMessage,
            code: "PROXY_ERROR",
            details: err.message,
            errCode: err.code,
          });
        }
      },
    },
  })
);

app.use(
  "/api/sentiment",
  createProxyMiddleware({
    target: env.sentimentServiceUrl,
    changeOrigin: true,
    pathRewrite: { "^/api/sentiment": "" },
    timeout: 30000,
    proxyTimeout: 30000,
    on: {
      proxyReq(proxyReq, req) {
        if (req.headers.origin) proxyReq.setHeader("Origin", req.headers.origin);
      },
      error(err, req, res) {
        console.error("[gateway] sentiment proxy error:", err.message);
        if (!res.headersSent) {
          res.status(502).json({ error: "Sentiment service unavailable" });
        }
      },
    },
  })
);

// Parse JSON ONLY for non-proxy routes (like /health)
// Proxy routes handle raw body streams automatically
app.use(express.json({ limit: "10mb" }));

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

const server = app.listen(env.port, () => {
  // Set server timeout
  server.timeout = 180000; // 3 minutes
  server.keepAliveTimeout = 65000; // 65 seconds
  server.headersTimeout = 66000; // 66 seconds
  
  console.log("\n" + "=".repeat(60));
  console.log("🚀 API Gateway Started");
  console.log("=".repeat(60));
  console.log(`   Port: ${env.port}`);
  console.log(`   Server Timeout: 180s`);
  console.log(`   Health: http://localhost:${env.port}/health`);
  console.log(`   Auth:   http://localhost:${env.port}/auth/* -> ${env.authServiceUrl}`);
  console.log(`   Projects: http://localhost:${env.port}/projects/* -> ${env.authServiceUrl}`);
  console.log(`   Collector: http://localhost:${env.port}/api/collect/* -> ${env.collectorServiceUrl}`);
  console.log(`   Sentiment: http://localhost:${env.port}/api/sentiment/* -> ${env.sentimentServiceUrl}`);
  console.log("=".repeat(60) + "\n");
});

process.on("SIGTERM", () => {
  server.close(() => process.exit(0));
});
