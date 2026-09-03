const mongoose = require("mongoose");
const { env } = require("../config/env");

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
    console.log("🔄 Connecting Agent Service to MongoDB...");
    await mongoose.connect(env.mongoUri, options);
    console.log("✅ Agent Service connected to MongoDB successfully");
    console.log(`   Database: ${mongoose.connection.db.databaseName}`);
  } catch (error) {
    console.error("❌ Agent Service MongoDB connection failed:", error.message);
    throw error;
  }

  mongoose.connection.on("error", (err) => {
    console.error("[Agent DB] MongoDB connection error:", err.message);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("[Agent DB] MongoDB disconnected");
  });

  process.on("SIGINT", async () => {
    await mongoose.connection.close();
    process.exit(0);
  });
}

module.exports = { connectMongo };
