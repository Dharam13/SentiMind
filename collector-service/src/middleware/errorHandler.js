/**
 * Central error handler for Collector Service
 */

function errorHandler(err, req, res, next) {
  // Skip if response already sent
  if (res.headersSent) {
    return next(err);
  }

  // Handle aborted requests
  if (err.message?.includes("aborted") || err.code === "ECONNRESET" || err.name === "BadRequestError") {
    console.warn("[Error Handler] Request aborted:", req.method, req.path);
    return res.status(400).json({
      error: "Request was cancelled or connection closed",
      code: "REQUEST_ABORTED",
    });
  }

  console.error("[Error Handler]", err.message || err);
  if (err.stack && process.env.NODE_ENV === "development") {
    console.error("[Error Stack]", err.stack);
  }

  // DNS/Network errors
  if (err.code === "ENOTFOUND" || err.code === "EAI_AGAIN" || err.code === "ECONNREFUSED" || err.code === "ETIMEDOUT") {
    return res.status(503).json({
      error: err.message || "Service temporarily unavailable - network error",
      code: err.code || "NETWORK_ERROR",
      platform: err.platform || undefined,
      details: {
        message: "Failed to connect to external API. Please check your internet connection and try again.",
        originalError: err.originalError?.message || err.message,
      },
    });
  }

  // Axios errors with response
  if (err.isAxiosError && err.response) {
    const status = err.response.status || 502;
    const data = err.response.data || {};
    const message =
      data.title ||
      data.detail ||
      data.error ||
      data.message ||
      "Upstream API request failed";
    return res.status(status).json({
      error: message,
      upstreamStatus: status,
      platform: err.platform || undefined,
      code: err.code || "UPSTREAM_API_ERROR",
      details: data.errors || data,
    });
  }

  // Custom errors with status and code
  const status = err.status || 500;
  const body = {
    error: err.message || "Internal server error",
    code: err.code || "INTERNAL_ERROR",
    platform: err.platform || undefined,
  };

  // Include details if available
  if (err.details) {
    body.details = err.details;
  }

  res.status(status).json(body);
}

module.exports = { errorHandler };

