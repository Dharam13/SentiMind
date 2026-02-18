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
    tumblr: optionalIntEnv("TUMBLR_DEFAULT_HOURS", 24),
    news: optionalIntEnv("NEWS_DEFAULT_HOURS", 24),
  },

  // External API keys
  twitterApiKey: optionalEnv("TWITTER_API_KEY", ""),
  youtubeApiKey: optionalEnv("YOUTUBE_API_KEY", ""),
  newsApiKey: optionalEnv("NEWSAPI_KEY", ""),
  gnewsApiKey: optionalEnv("GNEWS_API_KEY", ""),
  tumblrApiKey: optionalEnv("TUMBLR_API_KEY", ""),
};

module.exports = { env };

