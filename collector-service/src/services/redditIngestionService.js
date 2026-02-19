const { get, post } = require("../utils/httpClient");
const { env } = require("../config/env");
const { resolveHours, getWindowRange } = require("./timeWindow");

/**
 * Get Reddit OAuth access token
 */
let redditAccessToken = null;
let redditTokenExpiry = 0;

async function getRedditAccessToken() {
  // Return cached token if still valid
  if (redditAccessToken && Date.now() < redditTokenExpiry) {
    return redditAccessToken;
  }

  if (!env.redditClientId || !env.redditClientSecret) {
    return null;
  }

  try {
    const auth = Buffer.from(`${env.redditClientId}:${env.redditClientSecret}`).toString("base64");
    const res = await post(
      "https://www.reddit.com/api/v1/access_token",
      "grant_type=client_credentials",
      {
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": env.redditUserAgent,
        },
      },
      {
        maxRetries: 1,
        timeout: 10000,
      }
    );

    redditAccessToken = res.data?.access_token;
    const expiresIn = res.data?.expires_in || 3600;
    redditTokenExpiry = Date.now() + (expiresIn - 60) * 1000; // Refresh 1 min early
    
    return redditAccessToken;
  } catch (error) {
    console.warn("[Reddit] Failed to get OAuth token, falling back to public API:", error.message);
    return null;
  }
}

/**
 * Fetch recent mentions from Reddit search
 * Uses Reddit OAuth API if credentials are available, otherwise falls back to public JSON endpoint
 */

async function fetchRedditMentions({ keyword, limit = 20, hours }) {
  const effectiveHours = resolveHours("reddit", hours);
  const { start } = getWindowRange(effectiveHours);
  const timeFilter = mapHoursToRedditTimeFilter(effectiveHours);

  // Try OAuth API first if credentials are available
  const accessToken = await getRedditAccessToken();
  
  let url, headers, params;

  if (accessToken) {
    // Use OAuth API
    url = "https://oauth.reddit.com/search";
    headers = {
      "Authorization": `Bearer ${accessToken}`,
      "User-Agent": env.redditUserAgent,
    };
    params = {
      q: keyword,
      sort: "new",
      t: timeFilter,
      limit: Math.min(limit, 100), // OAuth API allows up to 100
      type: "link",
    };
  } else {
    // Fallback to public JSON endpoint
    url = "https://www.reddit.com/search.json";
    headers = {
      "User-Agent": env.redditUserAgent,
    };
    params = {
      q: keyword,
      sort: "new",
      t: timeFilter,
      limit: Math.min(limit, 50),
    };
  }

  try {
    const res = await get(
      url,
      {
        params,
        headers,
      },
      {
        maxRetries: 1,
        retryDelay: 1000,
        timeout: 15000,
        onRetry: (attempt, maxAttempts, delay, error) => {
          console.warn(
            `[Reddit] Retry ${attempt}/${maxAttempts} after ${delay}ms: ${error.message || error.code}`
          );
        },
      }
    );

    // Handle both OAuth API and public JSON API response formats
    const children = res.data?.data?.children ?? [];

    const mentions = children
      .map((c) => c.data)
      .filter((post) => {
        if (!post?.created_utc) return false;
        const created = new Date(post.created_utc * 1000);
        return created >= start;
      })
      .map((post) => {
        const createdAt = new Date(post.created_utc * 1000);
        const permalink = post.permalink || (post.url && post.url.includes("reddit.com") ? new URL(post.url).pathname : "");
        const url = permalink.startsWith("http") ? permalink : `https://www.reddit.com${permalink}`;

        return {
          platform: "reddit",
          keyword,
          content: post.selftext || post.title || "",
          author: post.author,
          sourceUrl: url,
          publishedAt: createdAt,
          timeWindowUsed: effectiveHours,
          metadata: {
            title: post.title,
            upvotes: post.ups || 0,
            commentsCount: post.num_comments || 0,
            subreddit: post.subreddit,
            authorKarma: post.author_fullname ? undefined : undefined,
          },
          rawJson: post,
        };
      });

    if (accessToken) {
      console.log(`[Reddit] OAuth API: Found ${mentions.length} mentions`);
    } else {
      console.log(`[Reddit] Public API: Found ${mentions.length} mentions`);
    }

    return { mentions, hoursUsed: effectiveHours };
  } catch (error) {
    // Enhance error message for better debugging
    if (error.code === "ENOTFOUND" || error.code === "EAI_AGAIN") {
      const err = new Error(
        `Failed to connect to Reddit API. DNS resolution failed. Please check your internet connection. Original error: ${error.message}`
      );
      err.status = 503;
      err.code = "REDDIT_DNS_ERROR";
      err.originalError = error;
      throw err;
    }

    if (error.response) {
      const err = new Error(
        `Reddit API error: ${error.response.status} - ${error.response.statusText}`
      );
      err.status = error.response.status;
      err.code = "REDDIT_API_ERROR";
      err.details = error.response.data;
      throw err;
    }

    throw error;
  }
}

function mapHoursToRedditTimeFilter(hours) {
  if (hours <= 1) return "hour";
  if (hours <= 24) return "day";
  if (hours <= 24 * 7) return "week";
  if (hours <= 24 * 30) return "month";
  if (hours <= 24 * 365) return "year";
  return "all";
}

module.exports = {
  fetchRedditMentions,
};

