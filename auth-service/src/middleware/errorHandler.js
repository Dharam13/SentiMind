/**
 * Central error handler - never leak sensitive data
 */

const { AuthError } = require("../services/authService");
const { env } = require("../config/env");

function errorHandler(err, _req, res, _next) {
  if (err instanceof AuthError) {
    const status =
      err.code === "INVALID_CREDENTIALS" || err.code === "TOKEN_INVALID"
        ? 401
        : err.code === "USER_EXISTS"
          ? 409
          : 400;
    res.status(status).json({ error: err.message });
    return;
  }

  if (err.name === "PrismaClientKnownRequestError") {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  if (env.isProduction) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  } else {
    console.error(err);
    res.status(500).json({
      error: "Internal server error",
      message: err.message,
    });
  }
}

module.exports = { errorHandler };
