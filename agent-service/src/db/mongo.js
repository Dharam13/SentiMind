const mongoose = require("mongoose");
const { logger } = require("../utils/logger");
const { env } = require("../config/env");

const MODULE_NAME = "Database";

async function connectMongo() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  mongoose.set("strictQuery", true);

  const options = {
    autoIndex: env.nodeEnv !== "production",
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    maxPoolSize: 10,
    minPoolSize: 1,
    retryWrites: true,
    w: "majority",
  };

  try {
    logger.info(MODULE_NAME, "Connecting to MongoDB...");
    await mongoose.connect(env.mongoUri, options);
    logger.info(MODULE_NAME, `Connected to MongoDB successfully (db: ${mongoose.connection.db.databaseName})`);
  } catch (error) {
    logger.error(MODULE_NAME, `MongoDB connection failed: ${error.message}`, error);
    throw error;
  }

  mongoose.connection.on("error", (err) => {
    logger.error(MODULE_NAME, `MongoDB connection error: ${err.message}`, err);
  });

  mongoose.connection.on("disconnected", () => {
    logger.warn(MODULE_NAME, "MongoDB disconnected");
  });

  process.on("SIGINT", async () => {
    await mongoose.connection.close();
    process.exit(0);
  });
}

module.exports = { connectMongo };
