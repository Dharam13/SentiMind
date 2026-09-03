/**
 * Structured Logger for SentiMind Services
 * Outputs uniform, structured log lines:
 * [YYYY-MM-DD HH:mm:ss.SSS] [LEVEL] [MODULE] Message | { context }
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const CURRENT_LEVEL =
  process.env.LOG_LEVEL && LOG_LEVELS[process.env.LOG_LEVEL.toUpperCase()] !== undefined
    ? LOG_LEVELS[process.env.LOG_LEVEL.toUpperCase()]
    : LOG_LEVELS.INFO;

function getTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const mins = String(now.getMinutes()).padStart(2, "0");
  const secs = String(now.getSeconds()).padStart(2, "0");
  const ms = String(now.getMilliseconds()).padStart(3, "0");
  return `${year}-${month}-${day} ${hours}:${mins}:${secs}.${ms}`;
}

function formatContext(context) {
  if (!context) return "";
  if (context instanceof Error) {
    return ` | Error: ${context.message}${context.stack ? `\n${context.stack}` : ""}`;
  }
  if (typeof context === "object") {
    try {
      return ` | ${JSON.stringify(context)}`;
    } catch {
      return ` | [Object]`;
    }
  }
  return ` | ${context}`;
}

function log(level, moduleName, message, context) {
  if (LOG_LEVELS[level] < CURRENT_LEVEL) return;

  const timestamp = getTimestamp();
  const formattedCtx = formatContext(context);
  const line = `[${timestamp}] [${level}] [${moduleName}] ${message}${formattedCtx}`;

  switch (level) {
    case "ERROR":
      console.error(line);
      break;
    case "WARN":
      console.warn(line);
      break;
    default:
      console.log(line);
      break;
  }
}

const logger = {
  info: (moduleName, message, context) => log("INFO", moduleName, message, context),
  warn: (moduleName, message, context) => log("WARN", moduleName, message, context),
  error: (moduleName, message, context) => log("ERROR", moduleName, message, context),
  debug: (moduleName, message, context) => log("DEBUG", moduleName, message, context),
};

module.exports = { logger };
