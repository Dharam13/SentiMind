/**
 * Environment configuration - all secrets and config from env vars
 */

require("dotenv").config();

function requireEnv(name) {
  const value = process.env[name];
  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name, defaultValue) {
  return process.env[name] ?? defaultValue;
}

const env = {
  port: parseInt(optionalEnv("PORT", "8000"), 10),
  nodeEnv: optionalEnv("NODE_ENV", "development"),
  isProduction: process.env.NODE_ENV === "production",

  databaseUrl: requireEnv("DATABASE_URL"),
  mongodbUri: optionalEnv(
    "MONGODB_URI",
    "mongodb+srv://dharamhpatel2005_db_user:dharam123@cluster0.x4gjggk.mongodb.net/sentimind_collector?appName=Cluster0"
  ),

  jwt: {
    secret: requireEnv("JWT_SECRET"),
    accessExpiresIn: optionalEnv("JWT_ACCESS_EXPIRES_IN", "15m"),
  },
  refreshTokenExpiryDays: parseInt(
    optionalEnv("REFRESH_TOKEN_EXPIRY_DAYS", "7"),
    10
  ),

  bcryptRounds: parseInt(optionalEnv("BCRYPT_ROUNDS", "10"), 10),

  corsOrigins: optionalEnv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173,http://localhost:8000")
    .split(",")
    .map((o) => o.trim()),

  collectorServiceUrl: optionalEnv("COLLECTOR_SERVICE_URL", "http://localhost:8021"),
  sentimentServiceUrl: optionalEnv("SENTIMENT_SERVICE_URL", "http://localhost:8030"),

  razorpayKeyId: optionalEnv("RAZORPAY_KEY_ID", "rzp_test_SaAq34nBoaqnl4"),
  razorpayKeySecret: optionalEnv("RAZORPAY_KEY_SECRET", "mock_secret_key_12345"),
  razorpayWebhookSecret: optionalEnv("RAZORPAY_WEBHOOK_SECRET", "webhook_secret_key_123"),
  razorpaySimulationMode: optionalEnv("RAZORPAY_SIMULATION_MODE", "false") === "true",

  geminiApiKey: optionalEnv("GEMINI_API_KEY", ""),

  maxAgentActionsPerDay: parseInt(optionalEnv("MAX_AGENT_ACTIONS_PER_DAY", "50"), 10),
  maxActionsPerDay: parseInt(optionalEnv("MAX_AGENT_ACTIONS_PER_DAY", "50"), 10),
  maxDiscountPercent: parseInt(optionalEnv("MAX_DISCOUNT_PERCENT", "25"), 10),
  maxCampaignBudget: parseInt(optionalEnv("MAX_CAMPAIGN_BUDGET", "5000000"), 10),
  requireApprovalAboveAmount: parseInt(optionalEnv("REQUIRE_APPROVAL_ABOVE_AMOUNT", "100000"), 10),
  minCredibilityScore: parseFloat(optionalEnv("MIN_CREDIBILITY_SCORE", "0.4")),
  signalCheckIntervalMs: parseInt(optionalEnv("SIGNAL_CHECK_INTERVAL_MS", "60000"), 10),
  agentProcessIntervalMs: parseInt(optionalEnv("AGENT_PROCESS_INTERVAL_MS", "15000"), 10),
  measurementDelayHours: parseInt(optionalEnv("MEASUREMENT_DELAY_HOURS", "1"), 10),
  retryIntervalMs: parseInt(optionalEnv("RETRY_INTERVAL_MS", "60000"), 10),
  spikeDeviationThreshold: parseFloat(optionalEnv("SPIKE_DEVIATION_THRESHOLD", "1.5")),
  spikeMinMentions: parseInt(optionalEnv("SPIKE_MIN_MENTIONS", "2"), 10),
  baselineHours: parseInt(optionalEnv("BASELINE_HOURS", "168"), 10),
  windowHours: parseInt(optionalEnv("WINDOW_HOURS", "6"), 10),
};

module.exports = { env };
