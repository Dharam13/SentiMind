const axios = require("axios");

/**
 * HTTP client with retry logic and better error handling
 * Handles DNS errors, timeouts, and network issues gracefully
 */

// Keep per-request budgets small so full collector runs don't hang the UI.
const DEFAULT_TIMEOUT = 15000; // 15 seconds
const DEFAULT_MAX_RETRIES = 1; // initial attempt + 1 retry
const DEFAULT_RETRY_DELAY = 1000; // 1 second

/**
 * Check if an error is retryable
 */
function isRetryableError(error) {
  if (!error) return false;

  // DNS resolution errors
  if (error.code === "ENOTFOUND" || error.code === "EAI_AGAIN") {
    return true;
  }

  // Network errors
  if (error.code === "ECONNRESET" || error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT") {
    return true;
  }

  // Timeout errors
  if (error.code === "ETIMEDOUT" || error.message?.includes("timeout")) {
    return true;
  }

  // 5xx server errors (except 501, 505)
  if (error.response) {
    const status = error.response.status;
    if (status >= 500 && status !== 501 && status !== 505) {
      return true;
    }
    // 429 Too Many Requests
    if (status === 429) {
      return true;
    }
  }

  return false;
}

/**
 * Calculate exponential backoff delay
 */
function getRetryDelay(attempt, baseDelay = DEFAULT_RETRY_DELAY) {
  return baseDelay * Math.pow(2, attempt);
}

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create an axios instance with default timeout
 */
function createAxiosInstance(timeout = DEFAULT_TIMEOUT) {
  return axios.create({
    timeout,
    headers: {
      "User-Agent": "sentimind-collector/1.0",
    },
  });
}

/**
 * Make HTTP request with retry logic
 */
async function requestWithRetry(config, options = {}) {
  const {
    maxRetries = DEFAULT_MAX_RETRIES,
    retryDelay = DEFAULT_RETRY_DELAY,
    timeout = DEFAULT_TIMEOUT,
    onRetry = null,
  } = options;

  const axiosInstance = config.axiosInstance || createAxiosInstance(timeout);
  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await axiosInstance(config);
      return response;
    } catch (error) {
      lastError = error;

      // Don't retry on last attempt
      if (attempt >= maxRetries) {
        break;
      }

      // Check if error is retryable
      if (!isRetryableError(error)) {
        // For timeout errors, still throw immediately to fail fast
        if (error.code === "ETIMEDOUT" || error.message?.includes("timeout")) {
          throw error;
        }
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = getRetryDelay(attempt, retryDelay);

      // Log retry attempt
      if (onRetry) {
        onRetry(attempt + 1, maxRetries + 1, delay, error);
      } else {
        console.warn(
          `[HTTP Client] Retry attempt ${attempt + 1}/${maxRetries + 1} after ${delay}ms for ${config.url || config.method || "request"}: ${error.message || error.code}`
        );
      }

      // Wait before retrying
      await sleep(delay);
    }
  }

  // All retries exhausted
  const errorMessage = lastError?.message || "Request failed";
  const errorCode = lastError?.code || "UNKNOWN_ERROR";

  // Enhance error message for DNS errors
  if (lastError?.code === "ENOTFOUND" || lastError?.code === "EAI_AGAIN") {
    const hostname = lastError?.hostname || new URL(config.url || "").hostname || "unknown";
    throw new Error(
      `DNS resolution failed for ${hostname}. Please check your internet connection and DNS settings. Original error: ${errorMessage}`
    );
  }

  throw lastError;
}

/**
 * GET request with retry
 */
async function get(url, config = {}, options = {}) {
  return requestWithRetry(
    {
      ...config,
      method: "GET",
      url,
    },
    options
  );
}

/**
 * POST request with retry
 */
async function post(url, data = {}, config = {}, options = {}) {
  return requestWithRetry(
    {
      ...config,
      method: "POST",
      url,
      data,
    },
    options
  );
}

module.exports = {
  createAxiosInstance,
  requestWithRetry,
  get,
  post,
  isRetryableError,
  DEFAULT_TIMEOUT,
  DEFAULT_MAX_RETRIES,
  DEFAULT_RETRY_DELAY,
};
