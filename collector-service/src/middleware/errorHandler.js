/**
 * Central error handler for Collector Service
 */

function errorHandler(err, _req, res, _next) {
  console.error(err);

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
      details: data.errors || data,
    });
  }

  const status = err.status || 500;
  const body = {
    error: err.message || "Internal server error",
    code: err.code,
  };

  res.status(status).json(body);
}

module.exports = { errorHandler };

