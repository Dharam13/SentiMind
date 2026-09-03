/**
 * Unified SentiMind Backend Server
 * Consolidates Auth, Projects, AI Agents, Razorpay Commerce, and Collector Gateway
 */

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const { createProxyMiddleware } = require("http-proxy-middleware");
const { env } = require("./config/env");

const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const agentRoutes = require("./routes/agentRoutes");
const { requireAuth } = require("./middleware/authMiddleware");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();

// Enable CORS for frontend and API consumers
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        env.corsOrigins.includes(origin) ||
        env.corsOrigins.includes("*") ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in dev
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

// Set long timeout for requests
app.use((req, res, next) => {
  req.setTimeout(180000);
  res.setTimeout(180000);
  next();
});

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "sentimind-backend",
    port: env.port,
    timestamp: new Date().toISOString(),
  });
});

// Proxy /api/collect/* directly to collector-service BEFORE express.json() parses body stream
app.use(
  "/api/collect",
  createProxyMiddleware({
    target: env.collectorServiceUrl,
    changeOrigin: true,
    pathRewrite: { "^/": "/api/collect/" },
    timeout: 180000,
    proxyTimeout: 180000,
    xfwd: true,
    on: {
      proxyReq(proxyReq, req) {
        proxyReq.setTimeout(180000);
        if (req.headers.origin) proxyReq.setHeader("Origin", req.headers.origin);
      },
      error(err, req, res) {
        if (!res.headersSent) {
          res.status(502).json({
            error: "Collector service unavailable",
            details: err.message,
          });
        }
      },
    },
  })
);

// Standard parsers for all backend endpoints
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// 1. Authentication Routes
app.use("/auth", authRoutes);

// 2. Project Management Routes (Protected by native JWT)
app.use("/projects", requireAuth, projectRoutes);

// 3. AI Agentic Commerce & Orchestration Routes
app.use("/api/agent", agentRoutes);

// 4. Centralized Error Handler
app.use(errorHandler);

module.exports = app;
