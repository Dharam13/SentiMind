/**
 * Sentimind Auth Service - entry point
 * Production-ready authentication for brand sentiment analysis platform
 */

require("dotenv").config();

const app = require("./app");
const { env } = require("./config/env");

const server = app.listen(env.port, () => {
  console.log(`Sentimind Auth Service listening on port ${env.port} (${env.nodeEnv})`);
});

process.on("SIGTERM", () => {
  server.close(() => process.exit(0));
});
