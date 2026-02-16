const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { env } = require("./config/env");
const { connectMongo } = require("./db/mongo");
const collectRoutes = require("./routes/collectRoutes");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(
  cors({
    origin: "*", // safe for Postman / local testing; tighten if needed
  })
);
app.use(express.json());
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "sentimind-collector" });
});

app.use("/api/collect", collectRoutes);

app.use(errorHandler);

async function start() {
  try {
    await connectMongo();
    app.listen(env.port, () => {
      console.log("\n" + "=".repeat(60));
      console.log("🚀 Collector Service Started Successfully");
      console.log("=".repeat(60));
      console.log(`   Port: ${env.port}`);
      console.log(`   Health: http://localhost:${env.port}/health`);
      console.log(`   Endpoints: http://localhost:${env.port}/api/collect/{platform}`);
      console.log("=".repeat(60) + "\n");
    });
  } catch (error) {
    console.error("\n❌ Failed to start Collector Service");
    console.error(`   Error: ${error.message}\n`);
    process.exit(1);
  }
}

module.exports = { app, start };

