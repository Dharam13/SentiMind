/**
 * Sentimind Unified Backend - Entry Point
 * Runs on Port 8000
 */

require("dotenv").config();

const app = require("./app");
const { env } = require("./config/env");
const { connectMongo } = require("./db/mongo");
const { prisma } = require("./lib/prisma");
const { logger } = require("./utils/logger");

const MODULE_NAME = "Backend";

async function startServer() {
  try {
    // 1. Verify PostgreSQL connection via Prisma
    await prisma.$connect();
    logger.info(MODULE_NAME, "Connected to PostgreSQL database successfully");

    // 2. Connect to MongoDB Atlas
    await connectMongo();

    // 3. Start Express HTTP Server on Port 8000
    const server = app.listen(env.port, () => {
      console.log("\n" + "=".repeat(60));
      console.log(`🚀 SentiMind Unified Backend Running on Port ${env.port}`);
      console.log("=".repeat(60));
      console.log(`   Health Check: http://localhost:${env.port}/health`);
      console.log(`   Auth API:     http://localhost:${env.port}/auth/*`);
      console.log(`   Projects API: http://localhost:${env.port}/projects/*`);
      console.log(`   AI Agent API: http://localhost:${env.port}/api/agent/*`);
      console.log(`   Collector:    http://localhost:${env.port}/api/collect/* -> ${env.collectorServiceUrl}`);
      console.log("=".repeat(60) + "\n");
    });

    process.on("SIGTERM", async () => {
      logger.info(MODULE_NAME, "SIGTERM received. Shutting down gracefully...");
      await prisma.$disconnect();
      server.close(() => process.exit(0));
    });
  } catch (err) {
    logger.error(MODULE_NAME, "Failed to initialize backend server", err);
    process.exit(1);
  }
}

startServer();
