const axios = require("axios");
const { env } = require("../config/env");
const { resolveHours } = require("./timeWindow");

/**
 * Fetch web mentions using Google Custom Search API (Programmable Search Engine)
 * Replaces WordPress and Blogger integrations with global web search
 */

// Simple in-memory cache to reduce API usage (TTL: 5 minutes)
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(keyword, hours) {
  return `google_search_${keyword}_${hours}`;
}

function getCached(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

function buildGoogleQuery(keyword) {
  // Build optimized queries for blog and web mentions
  // Note: Google Custom Search doesn't support lang:en operator
  // Language filtering should be done via API parameter (lr=lang_en)
  const queries = [
    `"${keyword}" blog`,
    `"${keyword}" review`,
    `"${keyword}" site:blogspot.com OR site:wordpress.com`,
  ];
  
  return queries;
}

function mapHoursToDateRestrict(hours) {
  if (hours <= 24) return "d1"; // Last 24 hours
  if (hours <= 24 * 7) return "d7"; // Last 7 days
  if (hours <= 24 * 30) return "m1"; // Last month
  return "m1"; // Default to month
}

async function fetchGoogleSearchResults(keyword, query, dateRestrict, startIndex = 1) {
  if (!env.googleApiKey || !env.googleSearchCx) {
    const err = new Error("Google Custom Search API configuration is missing (GOOGLE_API_KEY or GOOGLE_SEARCH_CX)");
    err.status = 500;
    err.code = "GOOGLE_SEARCH_CONFIG_MISSING";
    throw err;
  }

  const url = "https://www.googleapis.com/customsearch/v1";
  
  const res = await axios.get(url, {
    params: {
      key: env.googleApiKey,
      cx: env.googleSearchCx,
      q: query,
      num: 10, // Max results per request
      start: startIndex,
      dateRestrict: dateRestrict,
      lr: "lang_en", // Language filter: English only
      safe: "active",
    },
  });

  return res.data;
}

async function fetchGoogleSearchMentions({ keyword, limit = 20, hours }) {
  const effectiveHours = resolveHours("web", hours);
  const dateRestrict = mapHoursToDateRestrict(effectiveHours);

  // Check cache first
  const cacheKey = getCacheKey(keyword, effectiveHours);
  const cached = getCached(cacheKey);
  if (cached) {
    return { mentions: cached.slice(0, limit), hoursUsed: effectiveHours, cached: true };
  }

  const queries = buildGoogleQuery(keyword, effectiveHours);
  let allResults = [];
  const seenUrls = new Set(); // For deduplication

  try {
    // Execute multiple queries to get diverse results
    for (const query of queries) {
      if (allResults.length >= limit) break;

      let startIndex = 1;
      let hasMore = true;
      let pageCount = 0;
      const maxPages = Math.ceil(limit / 10); // Google returns max 10 per page

      while (hasMore && allResults.length < limit && pageCount < maxPages) {
        // Throttle: delay between API calls to respect rate limits
        if (pageCount > 0) {
          await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay
        }

        const data = await fetchGoogleSearchResults(keyword, query, dateRestrict, startIndex);
        const items = data.items || [];

        for (const item of items) {
          // Deduplicate by URL
          if (seenUrls.has(item.link)) {
            continue;
          }
          seenUrls.add(item.link);

          // Parse date (Google returns date in various formats)
          let publishedAt = new Date();
          if (item.pagemap?.metatags?.[0]?.["article:published_time"]) {
            publishedAt = new Date(item.pagemap.metatags[0]["article:published_time"]);
          } else if (item.pagemap?.metatags?.[0]?.["og:updated_time"]) {
            publishedAt = new Date(item.pagemap.metatags[0]["og:updated_time"]);
          }

          allResults.push({
            platform: "web",
            keyword,
            content: item.snippet || item.htmlTitle || "",
            author: item.pagemap?.person?.[0]?.name || item.displayLink || "",
            sourceUrl: item.link,
            publishedAt,
            timeWindowUsed: effectiveHours,
            metadata: {
              title: item.title,
              snippet: item.snippet,
              displayLink: item.displayLink,
              formattedUrl: item.formattedUrl,
              query: query,
            },
            rawJson: item,
          });

          if (allResults.length >= limit) break;
        }

        // Check if there are more results
        const totalResults = parseInt(data.searchInformation?.totalResults || "0", 10);
        const currentResults = startIndex + items.length - 1;
        
        if (currentResults >= totalResults || items.length < 10) {
          hasMore = false;
        } else {
          startIndex += 10;
          pageCount++;
        }
      }
    }

    // Cache results
    setCache(cacheKey, allResults);

    return { mentions: allResults.slice(0, limit), hoursUsed: effectiveHours };
  } catch (error) {
    if (error.response) {
      const apiError = error.response.data || {};
      const errorMessage =
        apiError.error?.message ||
        apiError.message ||
        error.message;

      const err = new Error(`Google Custom Search API error: ${errorMessage}`);
      err.status = error.response.status;
      err.code = apiError.error?.code || "GOOGLE_SEARCH_API_ERROR";
      err.details = apiError;
      err.platform = "web";
      err.isAxiosError = true;
      err.response = error.response;
      throw err;
    }
    throw error;
  }
}

module.exports = {
  fetchGoogleSearchMentions,
};
