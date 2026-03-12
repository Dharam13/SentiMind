const Parser = require("rss-parser");
const { env } = require("../config/env");
const { resolveHours, getWindowRange } = require("./timeWindow");

const parser = new Parser({
  timeout: 15000,
  headers: { "User-Agent": "SentiMind-Collector/1.0" },
});

const GOOGLE_NEWS_RSS_BASE = "https://news.google.com/rss/search";

/**
 * Fetch LinkedIn posts via Google News RSS (site:linkedin.com/posts).
 * No API key. No time window requirement in our code — we take what the feed returns (when:7d in URL).
 */
async function fetchLinkedInMentions({ keyword, limit = 20, hours }) {
  const effectiveHours = resolveHours("linkedin", hours);
  const q = `site:linkedin.com/posts ${keyword.trim()} when:7d`;
  const url = `${GOOGLE_NEWS_RSS_BASE}?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;

  let feed;
  try {
    feed = await parser.parseURL(url);
  } catch (err) {
    const error = new Error(
      err.message || "Failed to fetch LinkedIn (Google News RSS) feed"
    );
    error.status = err.status || 502;
    error.code = "LINKEDIN_FEED_ERROR";
    error.originalError = err;
    throw error;
  }

  const { start } = getWindowRange(effectiveHours);
  const items = feed?.items ?? [];
  const mentions = items
    .slice(0, Math.min(limit * 3, 150))
    .map((item) => {
      const publishedAt = item.pubDate ? new Date(item.pubDate) : new Date();
      const title = item.title || "";
      const content = item.contentSnippet || item.content || title;
      const sourceUrl = item.link || "";

      return {
        platform: "linkedin",
        keyword,
        content: (content || title).trim(),
        author: item.creator || item["dc:creator"] || "",
        sourceUrl,
        publishedAt,
        timeWindowUsed: effectiveHours,
        sourceType: "rss",
        metadata: {
          title,
          snippet: item.contentSnippet || "",
          link: sourceUrl,
          source: "google-news-rss",
        },
        rawJson: {
          title: item.title,
          link: item.link,
          pubDate: item.pubDate,
          contentSnippet: item.contentSnippet,
          guid: item.guid,
        },
      };
    })
    .filter((m) => m.publishedAt >= start)
    .slice(0, limit);

  return { mentions, hoursUsed: effectiveHours };
}

module.exports = {
  fetchLinkedInMentions,
};
