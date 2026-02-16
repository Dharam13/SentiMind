const axios = require("axios");
const { env } = require("../config/env");
const { resolveHours, getWindowRange } = require("./timeWindow");

/**
 * Fetch recent news articles from NewsAPI.org
 */

async function fetchNewsMentions({ keyword, limit = 20, hours }) {
  if (!env.newsApiKey) {
    const err = new Error("NewsAPI key is not configured");
    err.status = 500;
    err.code = "NEWS_CONFIG_MISSING";
    throw err;
  }

  const effectiveHours = resolveHours("news", hours);
  
  // Try 24 hours first, then fallback to 7 days if no results
  let timeWindows = [effectiveHours];
  if (effectiveHours <= 24) {
    timeWindows = [24, 168]; // Try 24h, then 7 days
  } else {
    timeWindows = [effectiveHours];
  }

  const url = "https://newsapi.org/v2/everything";
  let articles = [];
  let finalHoursUsed = effectiveHours;

  // Try each time window until we get results
  for (const windowHours of timeWindows) {
    const { start } = getWindowRange(windowHours);

    try {
      const res = await axios.get(url, {
        params: {
          apiKey: env.newsApiKey,
          q: keyword,
          sortBy: "publishedAt",
          pageSize: Math.min(limit, 100),
          from: start.toISOString(),
          language: "en",
        },
      });

      articles = res.data?.articles ?? [];
      finalHoursUsed = windowHours;

      // If we got results, break out of the loop
      if (articles.length > 0) {
        break;
      }
    } catch (error) {
      // If it's not the last window, continue to next
      if (windowHours !== timeWindows[timeWindows.length - 1]) {
        continue;
      }
      // If it's the last window and we got an error, throw it
      throw error;
    }
  }

  const mentions = articles.map((article) => {
    const published = article.publishedAt ? new Date(article.publishedAt) : new Date();
    return {
      platform: "news",
      keyword,
      content: article.description || article.content || article.title || "",
      author: article.author || "",
      sourceUrl: article.url,
      publishedAt: published,
      timeWindowUsed: finalHoursUsed,
      metadata: {
        title: article.title,
        description: article.description,
        source: article.source?.name,
        url: article.url,
      },
      rawJson: article,
    };
  });

  return { mentions, hoursUsed: finalHoursUsed };
}

module.exports = {
  fetchNewsMentions,
};

