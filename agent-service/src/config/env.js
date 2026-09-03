/**
 * Environment configuration for SentiMind Agent Service
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

function optionalFloatEnv(name, defaultValue) {
  const raw = process.env[name];
  if (!raw) return defaultValue;
  const v = parseFloat(raw);
  return Number.isFinite(v) ? v : defaultValue;
}

const env = {
  port: optionalIntEnv("PORT", 8040),
  nodeEnv: optionalEnv("NODE_ENV", "development"),
  mongoUri: optionalEnv(
    "MONGODB_URI",
    "mongodb+srv://dharamhpatel2005_db_user:dharam123@cluster0.x4gjggk.mongodb.net/sentimind_collector?appName=Cluster0"
  ),

  // Razorpay Test Mode Credentials
  razorpayKeyId: optionalEnv("RAZORPAY_KEY_ID", "rzp_test_mock_sentimind"),
  razorpayKeySecret: optionalEnv("RAZORPAY_KEY_SECRET", "mock_secret_key_12345"),
  razorpayWebhookSecret: optionalEnv("RAZORPAY_WEBHOOK_SECRET", "webhook_secret_key_123"),
  razorpaySimulationMode: optionalEnv("RAZORPAY_SIMULATION_MODE", "true").toLowerCase() === "true",

  // Google Gemini API Key
  geminiApiKey: optionalEnv("GEMINI_API_KEY", ""),

  // Guardrails & Policy Limits
  maxActionsPerDay: optionalIntEnv("MAX_AGENT_ACTIONS_PER_DAY", 50),
  maxDiscountPercent: optionalIntEnv("MAX_DISCOUNT_PERCENT", 25),
  maxCampaignBudget: optionalIntEnv("MAX_CAMPAIGN_BUDGET", 5000000), // In paise (₹50,000)
  requireApprovalAboveAmount: optionalIntEnv("REQUIRE_APPROVAL_ABOVE_AMOUNT", 100000), // In paise (₹1,000)
  minCredibilityScore: optionalFloatEnv("MIN_CREDIBILITY_SCORE", 0.4),

  // Agent Loop Timing
  signalCheckIntervalMs: optionalIntEnv("SIGNAL_CHECK_INTERVAL_MS", 60000), // 1 min in dev, 5 min in prod
  agentProcessIntervalMs: optionalIntEnv("AGENT_PROCESS_INTERVAL_MS", 15000), // 15 sec check
  measurementDelayHours: optionalIntEnv("MEASUREMENT_DELAY_HOURS", 1), // 1 hour for testing, 24 in prod
  retryIntervalMs: optionalIntEnv("RETRY_INTERVAL_MS", 60000), // 1 min retry

  // Spike Detection Parameters
  spikeDeviationThreshold: optionalFloatEnv("SPIKE_DEVIATION_THRESHOLD", 1.5), // 1.5x deviation triggers spike
  spikeMinMentions: optionalIntEnv("SPIKE_MIN_MENTIONS", 3), // Minimum mentions in window to trigger spike
  baselineHours: optionalIntEnv("BASELINE_HOURS", 168), // 7 days baseline
  windowHours: optionalIntEnv("WINDOW_HOURS", 6), // Recent window
};

module.exports = { env };
