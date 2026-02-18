const axios = require("axios");
const { env } = require("../config/env");
const { resolveHours, getWindowRange } = require("./timeWindow");

const NEWS_API_URL = "https://newsapi.org/v2/everything";
const GNEWS_API_URL = "https://gnews.io/api/v4/search";

async function fetchFromNewsApi({ keyword, limit, hours }) {
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
    timeWindows = [24, 168];
  } else {
    timeWindows = [effectiveHours];
  }

  let articles = [];
  let finalHoursUsed = effectiveHours;

  // Try each time window until we get results
  for (const windowHours of timeWindows) {
    const { start } = getWindowRange(windowHours);

    try {
      const res = await axios.get(NEWS_API_URL, {
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
        provider: "newsapi",
      },
      rawJson: article,
    };
  });

  return { mentions, hoursUsed: finalHoursUsed };
}

async function fetchFromGNews({ keyword, limit, hours }) {
  if (!env.gnewsApiKey) {
    return { mentions: [], hoursUsed: resolveHours("news", hours) };
  }

  const effectiveHours = resolveHours("news", hours);

  const res = await axios.get(GNEWS_API_URL, {
    params: {
      q: keyword,
      lang: "en",
      max: Math.min(limit, 100),
      apikey: env.gnewsApiKey,
    },
  });

  const articles = res.data?.articles ?? [];

  const mentions = articles.map((article) => {
    const published = article.publishedAt ? new Date(article.publishedAt) : new Date();
    return {
      platform: "news",
      keyword,
      content: article.description || article.content || article.title || "",
      author: article.source?.name || "",
      sourceUrl: article.url,
      publishedAt: published,
      timeWindowUsed: effectiveHours,
      metadata: {
        title: article.title,
        description: article.description,
        source: article.source?.name,
        url: article.url,
        image: article.image,
        provider: "gnews",
      },
      rawJson: article,
    };
  });

  return { mentions, hoursUsed: effectiveHours };
}

async function fetchNewsMentions({ keyword, limit = 20, hours }) {
  const [newsApiResult, gnewsResult] = await Promise.allSettled([
    fetchFromNewsApi({ keyword, limit, hours }),
    fetchFromGNews({ keyword, limit, hours }),
  ]);

  let combined = [];
  let hoursUsed;
  let lastError = null;

  if (newsApiResult.status === "fulfilled") {
    combined = combined.concat(newsApiResult.value.mentions);
    hoursUsed = newsApiResult.value.hoursUsed;
  } else {
    lastError = newsApiResult.reason;
  }

  if (gnewsResult.status === "fulfilled") {
    combined = combined.concat(gnewsResult.value.mentions);
    if (!hoursUsed) {
      hoursUsed = gnewsResult.value.hoursUsed;
    }
  } else if (!lastError) {
    lastError = gnewsResult.reason;
  }

  if (combined.length === 0 && lastError) {
    throw lastError;
  }

  const seenUrls = new Set();
  const deduped = [];

  for (const mention of combined) {
    const url = mention.sourceUrl;
    if (!url) {
      deduped.push(mention);
      continue;
    }
    if (seenUrls.has(url)) {
      continue;
    }
    seenUrls.add(url);
    deduped.push(mention);
  }

  return {
    mentions: deduped.slice(0, limit),
    hoursUsed: hoursUsed ?? resolveHours("news", hours),
  };
}

module.exports = {
  fetchNewsMentions,
};

