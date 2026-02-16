const mongoose = require("mongoose");
const { env } = require("../config/env");

async function connectMongo() {
  if (mongoose.connection.readyState === 1) {
    console.log("MongoDB already connected");
    return;
  }

  mongoose.set("strictQuery", true);

  // Connection options optimized for MongoDB Atlas
  const options = {
    autoIndex: env.nodeEnv !== "production",
    serverSelectionTimeoutMS: 10000, // 10 seconds timeout
    socketTimeoutMS: 45000, // 45 seconds socket timeout
    connectTimeoutMS: 10000, // 10 seconds connection timeout
    maxPoolSize: 10, // Maximum number of connections
    minPoolSize: 1, // Minimum number of connections
    retryWrites: true,
    w: "majority",
  };

  try {
    console.log("🔄 Connecting to MongoDB...");
    console.log(`   URI: ${env.mongoUri.replace(/:[^:@]+@/, ":****@")}`); // Hide password
    
    await mongoose.connect(env.mongoUri, options);
    
    console.log("✅ MongoDB connected successfully");
    console.log(`   Database: ${mongoose.connection.db.databaseName}`);
    console.log(`   Host: ${mongoose.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    
    // Provide helpful error messages
    if (error.message.includes("timeout")) {
      console.error("\n💡 Troubleshooting tips:");
      console.error("   1. Check your internet connection");
      console.error("   2. Verify MongoDB Atlas IP whitelist includes your IP");
      console.error("   3. Check if MongoDB Atlas cluster is running");
      console.error("   4. Verify connection string credentials are correct");
    } else if (error.message.includes("authentication")) {
      console.error("\n💡 Authentication failed:");
      console.error("   1. Check username and password in MONGODB_URI");
      console.error("   2. Verify database user has proper permissions");
    } else if (error.message.includes("ENOTFOUND") || error.message.includes("getaddrinfo")) {
      console.error("\n💡 DNS resolution failed:");
      console.error("   1. Check your internet connection");
      console.error("   2. Verify MongoDB Atlas cluster URL is correct");
    }
    
    throw error;
  }

  mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error:", err.message);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("⚠️  MongoDB disconnected");
  });

  mongoose.connection.on("reconnected", () => {
    console.log("✅ MongoDB reconnected");
  });
}

module.exports = {
  connectMongo,
};

