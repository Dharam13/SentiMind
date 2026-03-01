/**
 * API Gateway - environment configuration
 */

require("dotenv").config();

function optionalEnv(name, defaultValue) {
  return process.env[name] ?? defaultValue;
}

function optionalIntEnv(name, defaultValue) {
  const raw = process.env[name];
  if (!raw) return defaultValue;
  const v = parseInt(raw, 10);
  return Number.isFinite(v) ? v : defaultValue;
}

const env = {
  port: optionalIntEnv("PORT", 8000),
  nodeEnv: optionalEnv("NODE_ENV", "development"),

  authServiceUrl: optionalEnv("AUTH_SERVICE_URL", "http://localhost:8001").replace(/\/$/, ""),
  collectorServiceUrl: optionalEnv("COLLECTOR_SERVICE_URL", "http://localhost:8021").replace(
    /\/$/,
    ""
  ),
  sentimentServiceUrl: optionalEnv("SENTIMENT_SERVICE_URL", "http://localhost:8030").replace(
    /\/$/,
    ""
  ),

  corsOrigin: optionalEnv("CORS_ORIGIN", "http://localhost:3000,http://localhost:3001"),
};

module.exports = { env };
