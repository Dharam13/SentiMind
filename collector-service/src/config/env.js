/**
 * Environment configuration for Collector Service
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
  port: optionalIntEnv("PORT", 8021),
  nodeEnv: optionalEnv("NODE_ENV", "development"),

  mongoUri: optionalEnv("MONGODB_URI", "mongodb://localhost:27017/sentimind_collector"),

  defaultHours: optionalIntEnv("COLLECTOR_DEFAULT_HOURS", 24),

  platformDefaults: {
    reddit: optionalIntEnv("REDDIT_DEFAULT_HOURS", 24),
    twitter: optionalIntEnv("TWITTER_DEFAULT_HOURS", 24),
    youtube: optionalIntEnv("YOUTUBE_DEFAULT_HOURS", 24),
    medium: optionalIntEnv("MEDIUM_DEFAULT_HOURS", 24),
    linkedin: optionalIntEnv("LINKEDIN_DEFAULT_HOURS", 24),
    news: optionalIntEnv("NEWS_DEFAULT_HOURS", 24),
  },

  // External API keys
  twitterApiKey: optionalEnv("TWITTER_API_KEY", ""),
  twitterBearerToken: optionalEnv("TWITTER_BEARER_TOKEN", ""),
  youtubeApiKey: optionalEnv("YOUTUBE_API_KEY", ""),
  newsApiKey: optionalEnv("NEWSAPI_KEY", ""),
  gnewsApiKey: optionalEnv("GNEWS_API_KEY", ""),
  newsdataApiKey: optionalEnv("NEWSDATA_API_KEY", ""),
  // Reddit API credentials
  redditClientId: optionalEnv("REDDIT_CLIENT_ID", ""),
  redditClientSecret: optionalEnv("REDDIT_CLIENT_SECRET", ""),
  redditUserAgent: optionalEnv("REDDIT_USER_AGENT", "SentiMind/1.0"),

  // Sentiment Analysis microservice (Python)
  sentimentServiceUrl: optionalEnv("SENTIMENT_SERVICE_URL", "http://localhost:8030").replace(/\/$/, ""),
  sentimentPollIntervalMs: optionalIntEnv("SENTIMENT_POLL_INTERVAL_MS", 30_000),
  sentimentBatchSize: optionalIntEnv("SENTIMENT_BATCH_SIZE", 10),
};

module.exports = { env };

