const { get } = require("../utils/httpClient");
const { env } = require("../config/env");
const { resolveHours, getWindowRange } = require("./timeWindow");

/**
 * Fetch recent mentions from X (Twitter) using Twitter API.io
 */

async function fetchTwitterMentions({ keyword, limit = 20, hours }) {
  if (!env.twitterApiKey) {
    const err = new Error("Twitter API.io key is not configured");
    err.status = 500;
    err.code = "TWITTER_CONFIG_MISSING";
    throw err;
  }

  const effectiveHours = resolveHours("twitter", hours);
  const { start } = getWindowRange(effectiveHours);

  // Twitter API.io endpoint
  const url = "https://api.twitterapi.io/twitter/tweet/advanced_search";

  // Format date for Twitter API.io query (format: YYYY-MM-DD_HH:MM:SS_UTC)
  // Example: 2021-12-31_23:59:59_UTC
  const year = start.getUTCFullYear();
  const month = String(start.getUTCMonth() + 1).padStart(2, "0");
  const day = String(start.getUTCDate()).padStart(2, "0");
  const hoursStr = String(start.getUTCHours()).padStart(2, "0");
  const minutes = String(start.getUTCMinutes()).padStart(2, "0");
  const seconds = String(start.getUTCSeconds()).padStart(2, "0");
  const startDate = `${year}-${month}-${day}_${hoursStr}:${minutes}:${seconds}_UTC`;
  
  // Build query with time filter using Twitter advanced search syntax
  const query = `${keyword} since:${startDate}`;

  const params = {
    query: query,
    queryType: "Latest", // Get latest tweets
  };

  let allTweets = [];
  let cursor = null;
  // Cap to 2 pages so a single platform can't hang the whole run for too long
  const maxPages = Math.min(2, Math.ceil(limit / 20)); // API returns up to 20 per page

  try {
    // Fetch pages until we have enough tweets or no more pages
    for (let page = 0; page < maxPages && allTweets.length < limit; page++) {
      const requestParams = { ...params };
      if (cursor) {
        requestParams.cursor = cursor;
      }

      const res = await get(
        url,
        {
          params: requestParams,
          headers: {
            "X-API-Key": env.twitterApiKey,
          },
        },
        {
          maxRetries: 1,
          retryDelay: 1000,
          timeout: 15000,
          onRetry: (attempt, maxAttempts, delay, error) => {
            console.warn(
              `[Twitter] Retry ${attempt}/${maxAttempts} after ${delay}ms: ${error.message || error.code}`
            );
          },
        }
      );

      const tweets = res.data?.tweets || [];
      allTweets = allTweets.concat(tweets);

      // Check if there are more pages
      if (!res.data?.has_next_page || !res.data?.next_cursor) {
        break;
      }
      cursor = res.data.next_cursor;

      // Small delay to respect rate limits
      if (page < maxPages - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    // Limit to requested amount and filter by time window
    allTweets = allTweets
      .slice(0, limit)
      .filter((tweet) => {
        const tweetDate = new Date(tweet.createdAt);
        return tweetDate >= start;
      });

    const mentions = allTweets.map((tweet) => {
      const tweetUrl = tweet.url || `https://twitter.com/i/web/status/${tweet.id}`;
      const author = tweet.author?.userName || tweet.author?.name || "unknown";

      return {
        platform: "twitter",
        keyword,
        content: tweet.text || "",
        author: author,
        sourceUrl: tweetUrl,
        publishedAt: new Date(tweet.createdAt),
        timeWindowUsed: effectiveHours,
        metadata: {
          text: tweet.text,
          likes: tweet.likeCount || 0,
          retweets: tweet.retweetCount || 0,
          replies: tweet.replyCount || 0,
          views: tweet.viewCount || 0,
          followers: tweet.author?.followers || null,
          tweetUrl,
        },
        rawJson: tweet,
      };
    });

    return { mentions, hoursUsed: effectiveHours };
  } catch (error) {
    // Enhance error message for DNS errors
    if (error.code === "ENOTFOUND" || error.code === "EAI_AGAIN") {
      const err = new Error(
        `Failed to connect to Twitter API.io. DNS resolution failed. Please check your internet connection and verify the API endpoint is correct. Original error: ${error.message}`
      );
      err.status = 503;
      err.code = "TWITTER_DNS_ERROR";
      err.originalError = error;
      throw err;
    }

    if (error.response) {
      const apiError = error.response.data || {};
      const errorMessage =
        apiError.message ||
        apiError.error ||
        apiError.detail ||
        error.message;

      const err = new Error(`Twitter API.io error: ${errorMessage}`);
      err.status = error.response.status;
      err.code = apiError.code || "TWITTER_API_ERROR";
      err.details = apiError;
      err.platform = "twitter";
      err.isAxiosError = true;
      err.response = error.response;
      throw err;
    }
    throw error;
  }
}

module.exports = {
  fetchTwitterMentions,
};

