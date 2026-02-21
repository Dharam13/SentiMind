const Parser = require("rss-parser");
const { get } = require("../utils/httpClient");
const { env } = require("../config/env");
const { resolveHours, getWindowRange } = require("./timeWindow");

const NEWS_API_URL = "https://newsapi.org/v2/everything";
const GNEWS_API_URL = "https://gnews.io/api/v4/search";
const NEWSDATA_API_URL = "https://newsdata.io/api/1/latest";
const GOOGLE_NEWS_RSS_BASE = "https://news.google.com/rss/search";

const rssParser = new Parser({
  timeout: 15000,
  headers: { "User-Agent": "SentiMind-Collector/1.0" },
});

/** Normalize URL for deduplication (strip tracking params, lowercase host, etc.) */
function normalizeNewsUrl(raw) {
  if (!raw || typeof raw !== "string") return "";
  try {
    const u = new URL(raw.trim());
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"].forEach((p) => u.searchParams.delete(p));
    u.hash = "";
    return u.toString();
  } catch {
    return raw.trim();
  }
}

/** Normalize title for deduplication (same story from different providers) */
function normalizeTitle(title) {
  if (!title || typeof title !== "string") return "";
  return title.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Richness score for smart deduplication: prefer API responses (more detail) over RSS.
 * Higher = more detailed; when duplicates exist we keep the highest-scoring one.
 */
function richnessScore(mention) {
  const contentLen = (mention.content && mention.content.length) || 0;
  const descLen = (mention.metadata?.description && mention.metadata.description.length) || 0;
  const isRss = mention.sourceType === "rss";
  const apiBonus = isRss ? 0 : 5000;
  return contentLen + descLen + apiBonus;
}

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
      const res = await get(
        NEWS_API_URL,
        {
          params: {
            apiKey: env.newsApiKey,
            q: keyword,
            sortBy: "publishedAt",
            pageSize: Math.min(limit, 100),
            from: start.toISOString(),
            language: "en",
          },
        },
        {
          maxRetries: 1,
          retryDelay: 1000,
          timeout: 15000,
        }
      );

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

  const res = await get(
    GNEWS_API_URL,
    {
      params: {
        q: keyword,
        lang: "en",
        max: Math.min(limit, 100),
        apikey: env.gnewsApiKey,
      },
    },
    {
      maxRetries: 1,
      retryDelay: 1000,
      timeout: 15000,
    }
  );

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

/**
 * Fetch news from NewsData.io Latest API. Rich content (description, full content when available).
 */
async function fetchFromNewsData({ keyword, limit, hours }) {
  if (!env.newsdataApiKey) {
    return { mentions: [], hoursUsed: resolveHours("news", hours) };
  }

  const effectiveHours = resolveHours("news", hours);
  const timeframeHours = Math.min(Math.max(1, effectiveHours), 48);

  const res = await get(
    NEWSDATA_API_URL,
    {
      params: {
        apikey: env.newsdataApiKey,
        q: keyword,
        language: "en",
        timeframe: timeframeHours,
      },
    },
    {
      maxRetries: 1,
      retryDelay: 1000,
      timeout: 15000,
    }
  );

  if (res.data?.status === "error") {
    return { mentions: [], hoursUsed: effectiveHours };
  }

  const results = res.data?.results ?? [];
  const mentions = results.slice(0, Math.min(limit, 100)).map((article) => {
    const published = article.pubDate ? new Date(article.pubDate) : new Date();
    const content = article.content || article.description || article.title || "";
    return {
      platform: "news",
      keyword,
      content: content.trim(),
      author: article.creator || article.source_name || "",
      sourceUrl: article.link || "",
      publishedAt: published,
      timeWindowUsed: effectiveHours,
      metadata: {
        title: article.title,
        description: article.description,
        source: article.source_name,
        url: article.link,
        image_url: article.image_url,
        provider: "newsdata",
      },
      rawJson: article,
    };
  });

  return { mentions, hoursUsed: effectiveHours };
}

/**
 * Fetch news from Google News RSS. No time window requirement in our code —
 * we take whatever the feed returns (feed uses when:7d). No API key needed.
 */
async function fetchFromGoogleNewsRss({ keyword, limit }) {
  const url = `${GOOGLE_NEWS_RSS_BASE}?q=${encodeURIComponent(keyword)}+when:7d&hl=en-US&gl=US&ceid=US:en`;

  let feed;
  try {
    feed = await rssParser.parseURL(url);
  } catch (err) {
    return { mentions: [], hoursUsed: 168 };
  }

  const items = feed?.items ?? [];
  const mentions = items.slice(0, Math.min(limit, 100)).map((item) => {
    const publishedAt = item.pubDate ? new Date(item.pubDate) : new Date();
    const title = item.title || "";
    const content = item.contentSnippet || item.content || title;
    const sourceUrl = item.link || "";

    return {
      platform: "news",
      keyword,
      content: (content || title).trim(),
      author: item.creator || item["dc:creator"] || "",
      sourceUrl,
      publishedAt,
      timeWindowUsed: 168,
      sourceType: "rss",
      metadata: {
        title,
        snippet: item.contentSnippet || "",
        link: sourceUrl,
        provider: "google-news-rss",
      },
      rawJson: {
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
        contentSnippet: item.contentSnippet,
        guid: item.guid,
      },
    };
  });

  return { mentions, hoursUsed: 168 };
}

async function fetchNewsMentions({ keyword, limit = 20, hours }) {
  const [newsApiResult, gnewsResult, newsDataResult, googleRssResult] = await Promise.allSettled([
    fetchFromNewsApi({ keyword, limit, hours }),
    fetchFromGNews({ keyword, limit, hours }),
    fetchFromNewsData({ keyword, limit, hours }),
    fetchFromGoogleNewsRss({ keyword, limit }),
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
    if (!hoursUsed) hoursUsed = gnewsResult.value.hoursUsed;
  } else if (!lastError) {
    lastError = gnewsResult.reason;
  }

  if (newsDataResult.status === "fulfilled" && newsDataResult.value.mentions.length) {
    combined = combined.concat(newsDataResult.value.mentions);
    if (!hoursUsed) hoursUsed = newsDataResult.value.hoursUsed;
  }

  if (googleRssResult.status === "fulfilled" && googleRssResult.value.mentions.length) {
    combined = combined.concat(googleRssResult.value.mentions);
    if (!hoursUsed) hoursUsed = googleRssResult.value.hoursUsed;
  }

  if (combined.length === 0 && lastError) {
    throw lastError;
  }

  // Smart deduplication: sort by richness (API + longer content first) so we keep the best when deduping
  combined.sort((a, b) => richnessScore(b) - richnessScore(a));

  const seenUrls = new Set();
  const seenTitles = new Set();
  const deduped = [];
  const MIN_TITLE_LENGTH_FOR_DEDUPE = 15;

  for (const mention of combined) {
    const normUrl = normalizeNewsUrl(mention.sourceUrl);
    const rawTitle = mention.metadata?.title || mention.content || "";
    const normTitle = normalizeTitle(rawTitle);
    const useTitleDedupe = normTitle.length >= MIN_TITLE_LENGTH_FOR_DEDUPE;

    if (normUrl && seenUrls.has(normUrl)) continue;
    if (useTitleDedupe && seenTitles.has(normTitle)) continue;

    if (normUrl) seenUrls.add(normUrl);
    if (useTitleDedupe) seenTitles.add(normTitle);
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

