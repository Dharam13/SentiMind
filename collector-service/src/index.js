const { start } = require("./app");

// Start collector service
start().catch((err) => {
  console.error("Failed to start Collector Service", err);
  process.exit(1);
});


