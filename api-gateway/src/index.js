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
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "sentimind-api-gateway" });
});

app.use(
  "/auth",
  createProxyMiddleware({
    target: env.authServiceUrl,
    changeOrigin: true,
    on: {
      proxyReq(proxyReq, req) {
        if (req.headers.origin) {
          proxyReq.setHeader("Origin", req.headers.origin);
        }
      },
      error(err, req, res) {
        console.error("[gateway] auth proxy error:", err.message);
        res.status(502).json({ error: "Auth service unavailable" });
      },
    },
  })
);

app.use(
  "/projects",
  createProxyMiddleware({
    target: env.authServiceUrl,
    changeOrigin: true,
    on: {
      proxyReq(proxyReq, req) {
        if (req.headers.origin) {
          proxyReq.setHeader("Origin", req.headers.origin);
        }
      },
      error(err, req, res) {
        console.error("[gateway] projects proxy error:", err.message);
        res.status(502).json({ error: "Auth service unavailable" });
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
    on: {
      proxyReq(proxyReq, req) {
        if (req.headers.origin) {
          proxyReq.setHeader("Origin", req.headers.origin);
        }
      },
      error(err, req, res) {
        console.error("[gateway] collector proxy error:", err.message);
        res.status(502).json({ error: "Collector service unavailable" });
      },
    },
  })
);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

const server = app.listen(env.port, () => {
  console.log("\n" + "=".repeat(60));
  console.log("🚀 API Gateway Started");
  console.log("=".repeat(60));
  console.log(`   Port: ${env.port}`);
  console.log(`   Health: http://localhost:${env.port}/health`);
  console.log(`   Auth:   http://localhost:${env.port}/auth/* -> ${env.authServiceUrl}`);
  console.log(`   Projects: http://localhost:${env.port}/projects/* -> ${env.authServiceUrl}`);
  console.log(`   Collector: http://localhost:${env.port}/api/collect/* -> ${env.collectorServiceUrl}`);
  console.log("=".repeat(60) + "\n");
});

process.on("SIGTERM", () => {
  server.close(() => process.exit(0));
});
