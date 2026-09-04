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
  // Build query directly using keyword (no timeline restriction so recent tweets are always returned)
  const query = keyword;

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
          maxRetries: 2,
          retryDelay: 5500, // 5.5s delay respects Twitter API.io 5s free-tier rate limit
          timeout: 20000,
          onRetry: (attempt, maxAttempts, delay, error) => {
            console.warn(
              `[Twitter] Retry ${attempt}/${maxAttempts} after ${delay}ms (rate limit backoff): ${error.message || error.code}`
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

      // Delay to respect Twitter API.io 5-second rate limit
      if (page < maxPages - 1) {
        await new Promise((resolve) => setTimeout(resolve, 5500));
      }
    }

    // If time-constrained query returned 0, fallback to general keyword query
    if (allTweets.length === 0) {
      await new Promise((resolve) => setTimeout(resolve, 5500));
      const broadRes = await get(
        url,
        {
          params: { query: keyword, queryType: "Latest" },
          headers: { "X-API-Key": env.twitterApiKey },
        },
        {
          maxRetries: 1,
          retryDelay: 5500,
          timeout: 15000,
        }
      ).catch(() => null);
      if (broadRes?.data?.tweets?.length) {
        allTweets = broadRes.data.tweets;
      }
    }

    // Fallback to official Twitter v2 API if Twitter API.io returned empty and bearer token is present
    if (allTweets.length === 0 && env.twitterBearerToken) {
      try {
        const v2Res = await get(
          "https://api.twitter.com/2/tweets/search/recent",
          {
            params: {
              query: `${keyword} -is:retweet`,
              max_results: Math.min(Math.max(limit, 10), 100),
              "tweet.fields": "created_at,public_metrics,author_id",
            },
            headers: {
              Authorization: `Bearer ${env.twitterBearerToken}`,
            },
          },
          { maxRetries: 0, timeout: 10000 }
        );
        const v2Tweets = v2Res.data?.data || [];
        allTweets = v2Tweets.map((t) => ({
          id: t.id,
          text: t.text,
          createdAt: t.created_at,
          likeCount: t.public_metrics?.like_count || 0,
          retweetCount: t.public_metrics?.retweet_count || 0,
          replyCount: t.public_metrics?.reply_count || 0,
          url: `https://x.com/i/web/status/${t.id}`,
        }));
      } catch (v2Err) {
        console.warn(`[Twitter] Official v2 fallback note: ${v2Err.message}`);
      }
    }

    // Filter by time window first, then slice to limit
    allTweets = allTweets
      .filter((tweet) => {
        if (!tweet.createdAt) return true;
        const tweetDate = new Date(tweet.createdAt);
        return isNaN(tweetDate.getTime()) || tweetDate >= start;
      })
      .slice(0, limit);

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

