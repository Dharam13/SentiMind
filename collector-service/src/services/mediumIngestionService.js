const Parser = require("rss-parser");
const { env } = require("../config/env");
const { resolveHours, getWindowRange } = require("./timeWindow");

const parser = new Parser({
  timeout: 15000,
  headers: { "User-Agent": "SentiMind-Collector/1.0" },
});

const MEDIUM_FEED_BASE = "https://medium.com/feed/tag";

/**
 * Fetch recent posts from Medium via tag RSS feed.
 * No API key required. Returns mentions in the same shape as other platforms for MongoDB.
 */
async function fetchMediumMentions({ keyword, limit = 20, hours }) {
  const effectiveHours = resolveHours("medium", hours);
  const { start } = getWindowRange(effectiveHours);

  const url = `${MEDIUM_FEED_BASE}/${encodeURIComponent(keyword)}`;

  let feed;
  try {
    feed = await parser.parseURL(url);
  } catch (err) {
    const error = new Error(
      err.message || "Failed to fetch Medium RSS feed"
    );
    error.status = err.status || 502;
    error.code = "MEDIUM_FEED_ERROR";
    error.originalError = err;
    throw error;
  }

  const items = feed?.items ?? [];
  const mentions = items
    .filter((item) => {
      if (!item.pubDate) return false;
      const published = new Date(item.pubDate);
      return published >= start;
    })
    .slice(0, Math.min(limit, 100))
    .map((item) => {
      const publishedAt = item.pubDate ? new Date(item.pubDate) : new Date();
      const content = item.contentSnippet || item.content || item.title || "";
      const author = item.creator || item["dc:creator"] || "";

      return {
        platform: "medium",
        keyword,
        content: content.trim(),
        author: String(author).trim(),
        sourceUrl: item.link || "",
        publishedAt,
        timeWindowUsed: effectiveHours,
        sourceType: "rss",
        metadata: {
          title: item.title || "",
          snippet: item.contentSnippet || "",
          link: item.link || "",
          author: author,
        },
        rawJson: {
          title: item.title,
          link: item.link,
          pubDate: item.pubDate,
          creator: item.creator,
          contentSnippet: item.contentSnippet,
          guid: item.guid,
          isoDate: item.isoDate,
        },
      };
    });

  return { mentions, hoursUsed: effectiveHours };
}

module.exports = {
  fetchMediumMentions,
};
