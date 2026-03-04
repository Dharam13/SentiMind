/**
 * Environment configuration - all secrets and config from env vars
 */

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
  port: parseInt(optionalEnv("PORT", "8001"), 10),
  nodeEnv: optionalEnv("NODE_ENV", "development"),
  isProduction: process.env.NODE_ENV === "production",

  databaseUrl: requireEnv("DATABASE_URL"),

  jwt: {
    secret: requireEnv("JWT_SECRET"),
    accessExpiresIn: optionalEnv("JWT_ACCESS_EXPIRES_IN", "15m"),
  },
  refreshTokenExpiryDays: parseInt(
    optionalEnv("REFRESH_TOKEN_EXPIRY_DAYS", "7"),
    10
  ),

  bcryptRounds: parseInt(optionalEnv("BCRYPT_ROUNDS", "10"), 10),

  googleClientId: requireEnv("GOOGLE_CLIENT_ID"),

  corsOrigins: optionalEnv("CORS_ORIGINS", "http://localhost:3000").split(","),
};

module.exports = { env };
