const axios = require("axios");
const { resolveHours, getWindowRange } = require("./timeWindow");

/**
 * Fetch recent mentions from Reddit search
 * Uses the public Reddit JSON search endpoint (no API key) and filters by time window.
 */

async function fetchRedditMentions({ keyword, limit = 20, hours }) {
  const effectiveHours = resolveHours("reddit", hours);
  const { start } = getWindowRange(effectiveHours);
  const timeFilter = mapHoursToRedditTimeFilter(effectiveHours);

  const url = "https://www.reddit.com/search.json";
  const params = {
    q: keyword,
    sort: "new",
    t: timeFilter,
    limit: Math.min(limit, 50),
  };

  const res = await axios.get(url, {
    params,
    headers: {
      "User-Agent": "sentimind-collector/1.0",
    },
  });

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
      const url = `https://www.reddit.com${post.permalink}`;

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
          upvotes: post.ups,
          commentsCount: post.num_comments,
          subreddit: post.subreddit,
          authorKarma: post.author_fullname ? undefined : undefined, // not available from this endpoint
        },
        rawJson: post,
      };
    });

  return { mentions, hoursUsed: effectiveHours };
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

