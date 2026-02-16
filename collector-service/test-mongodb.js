/**
 * Test MongoDB connection
 * Run: node test-mongodb.js
 */

require("dotenv").config();
const mongoose = require("mongoose");

const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/sentimind_collector";

console.log("=".repeat(60));
console.log("MongoDB Connection Test");
console.log("=".repeat(60));
console.log(`URI: ${mongoUri.replace(/:[^:@]+@/, ":****@")}`);
console.log("");

const options = {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  retryWrites: true,
  w: "majority",
};

mongoose.set("strictQuery", true);

mongoose
  .connect(mongoUri, options)
  .then(() => {
    console.log("✅ Connection successful!");
    console.log(`   Database: ${mongoose.connection.db.databaseName}`);
    console.log(`   Host: ${mongoose.connection.host}`);
    console.log(`   Port: ${mongoose.connection.port}`);
    console.log(`   Ready State: ${mongoose.connection.readyState}`);
    console.log("");
    console.log("Testing collection access...");
    
    return mongoose.connection.db.listCollections().toArray();
  })
  .then((collections) => {
    console.log(`✅ Found ${collections.length} collections`);
    if (collections.length > 0) {
      console.log("   Collections:", collections.map((c) => c.name).join(", "));
    }
    console.log("");
    console.log("✅ All tests passed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Connection failed!");
    console.error(`   Error: ${error.message}`);
    console.error("");
    
    if (error.message.includes("timeout")) {
      console.log("💡 Troubleshooting:");
      console.log("   1. Check internet connection");
      console.log("   2. MongoDB Atlas IP whitelist:");
      console.log("      - Go to MongoDB Atlas → Network Access");
      console.log("      - Add your current IP address");
      console.log("      - Or add 0.0.0.0/0 (allow all IPs - for testing only)");
      console.log("   3. Verify cluster is running");
      console.log("   4. Check connection string credentials");
    } else if (error.message.includes("authentication")) {
      console.log("💡 Authentication issue:");
      console.log("   1. Check username/password in MONGODB_URI");
      console.log("   2. Verify database user exists and has permissions");
    } else if (error.message.includes("ENOTFOUND")) {
      console.log("💡 DNS/Network issue:");
      console.log("   1. Check internet connection");
      console.log("   2. Verify cluster URL is correct");
      console.log("   3. Try pinging: cluster0.x4gjggk.mongodb.net");
    }
    
    process.exit(1);
  });
