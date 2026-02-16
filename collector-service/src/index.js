const { start } = require("./app");

start().catch((err) => {
  console.error("Failed to start Collector Service", err);
  process.exit(1);
});

