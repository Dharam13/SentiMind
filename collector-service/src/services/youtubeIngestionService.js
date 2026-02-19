const { get } = require("../utils/httpClient");
const { env } = require("../config/env");
const { resolveHours, getWindowRange } = require("./timeWindow");

/**
 * Fetch recent mentions from YouTube using search + videos list APIs
 */

async function fetchYouTubeMentions({ keyword, limit = 20, hours }) {
  if (!env.youtubeApiKey) {
    const err = new Error("YouTube API key is not configured");
    err.status = 500;
    err.code = "YOUTUBE_CONFIG_MISSING";
    throw err;
  }

  const effectiveHours = resolveHours("youtube", hours);
  const { start } = getWindowRange(effectiveHours);

  const searchUrl = "https://www.googleapis.com/youtube/v3/search";

  const searchRes = await get(
    searchUrl,
    {
      params: {
        key: env.youtubeApiKey,
        q: keyword,
        part: "snippet",
        type: "video",
        order: "date",
        maxResults: Math.min(limit, 50),
        publishedAfter: start.toISOString(),
      },
    },
    {
      maxRetries: 1,
      retryDelay: 1000,
      timeout: 15000,
    }
  );

  const items = searchRes.data?.items ?? [];
  if (items.length === 0) {
    return { mentions: [], hoursUsed: effectiveHours };
  }

  const videoIds = items
    .map((i) => i.id?.videoId)
    .filter((id) => typeof id === "string");

  const detailsUrl = "https://www.googleapis.com/youtube/v3/videos";
  const detailsRes = await get(
    detailsUrl,
    {
      params: {
        key: env.youtubeApiKey,
        id: videoIds.join(","),
        part: "snippet,statistics",
        maxResults: videoIds.length,
      },
    },
    {
      maxRetries: 1,
      retryDelay: 1000,
      timeout: 15000,
    }
  );

  const details = detailsRes.data?.items ?? [];
  const detailMap = new Map(details.map((d) => [d.id, d]));

  const mentions = items
    .map((item) => {
      const videoId = item.id?.videoId;
      const detail = detailMap.get(videoId);
      if (!detail) return null;

      const snippet = detail.snippet || {};
      const stats = detail.statistics || {};
      const publishedAt = new Date(snippet.publishedAt);
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

      return {
        platform: "youtube",
        keyword,
        content: snippet.description || snippet.title || "",
        author: snippet.channelTitle,
        sourceUrl: videoUrl,
        publishedAt,
        timeWindowUsed: effectiveHours,
        metadata: {
          title: snippet.title,
          description: snippet.description,
          views: Number(stats.viewCount || 0),
          likes: Number(stats.likeCount || 0),
          comments: Number(stats.commentCount || 0),
          channelSubscribers: null, // requires additional channel API call
          videoUrl,
        },
        rawJson: detail,
      };
    })
    .filter(Boolean);

  return { mentions, hoursUsed: effectiveHours };
}

module.exports = {
  fetchYouTubeMentions,
};

