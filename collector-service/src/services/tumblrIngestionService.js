const axios = require("axios");
const { env } = require("../config/env");
const { resolveHours, getWindowRange } = require("./timeWindow");

/**
 * Fetch recent tagged posts from Tumblr using the public tagged endpoint
 */

async function fetchTumblrMentions({ keyword, limit = 20, hours }) {
  if (!env.tumblrApiKey) {
    const err = new Error("Tumblr API key is not configured");
    err.status = 500;
    err.code = "TUMBLR_CONFIG_MISSING";
    throw err;
  }

  const effectiveHours = resolveHours("tumblr", hours);
  const { start } = getWindowRange(effectiveHours);

  const url = "https://api.tumblr.com/v2/tagged";

  const res = await axios.get(url, {
    params: {
      tag: keyword,
      api_key: env.tumblrApiKey,
      limit: Math.min(limit, 50),
    },
  });

  const posts = res.data?.response ?? [];

  const mentions = posts
    .filter((post) => {
      const ts = post.timestamp;
      if (!ts) return false;
      const created = new Date(ts * 1000);
      return created >= start;
    })
    .map((post) => {
      const created = new Date(post.timestamp * 1000);
      const blogName = post.blog_name || "";
      const postUrl = post.post_url || "";

      const body =
        post.trail && post.trail.length > 0
          ? post.trail
              .map((t) => t?.content_raw || t?.content)
              .filter(Boolean)
              .join("\n\n")
          : post.summary || "";

      return {
        platform: "tumblr",
        keyword,
        content: body,
        author: blogName,
        sourceUrl: postUrl,
        publishedAt: created,
        timeWindowUsed: effectiveHours,
        metadata: {
          title: post.summary,
          content: body,
          author: blogName,
          blogUrl: `https://${blogName}.tumblr.com`,
        },
        rawJson: post,
      };
    });

  return { mentions, hoursUsed: effectiveHours };
}

module.exports = {
  fetchTumblrMentions,
};

