const { Mention } = require("../models/Mention");
const { fetchRedditMentions } = require("../services/redditIngestionService");
const { fetchTwitterMentions } = require("../services/twitterIngestionService");
const { fetchYouTubeMentions } = require("../services/youtubeIngestionService");
const { fetchTumblrMentions } = require("../services/tumblrIngestionService");
const { fetchGoogleSearchMentions } = require("../services/googleSearchIngestionService");
const { fetchNewsMentions } = require("../services/newsIngestionService");

async function collectForPlatform(req, res, next, platform) {
  try {
    const { keyword, limit: limitRaw, hours: hoursRaw, projectId: projectIdRaw } = req.query;

    if (!keyword || typeof keyword !== "string") {
      return res.status(400).json({ error: "Query parameter 'keyword' is required" });
    }

    if (!projectIdRaw) {
      return res.status(400).json({ error: "Query parameter 'projectId' is required" });
    }
    const projectId = parseInt(String(projectIdRaw), 10);
    if (!Number.isFinite(projectId)) {
      return res.status(400).json({ error: "Query parameter 'projectId' must be a number" });
    }

    const limit = limitRaw ? Math.min(parseInt(String(limitRaw), 10) || 20, 100) : 20;
    const hours = hoursRaw ? parseInt(String(hoursRaw), 10) || undefined : undefined;

    let fetchFn;
    switch (platform) {
      case "reddit":
        fetchFn = fetchRedditMentions;
        break;
      case "twitter":
        fetchFn = fetchTwitterMentions;
        break;
      case "youtube":
        fetchFn = fetchYouTubeMentions;
        break;
      case "tumblr":
        fetchFn = fetchTumblrMentions;
        break;
      case "web":
        fetchFn = fetchGoogleSearchMentions;
        break;
      case "news":
        fetchFn = fetchNewsMentions;
        break;
      default:
        return res.status(400).json({ error: `Unsupported platform '${platform}'` });
    }

    const { mentions, hoursUsed } = await fetchFn({ keyword, limit, hours });

    if (!mentions || mentions.length === 0) {
      return res.status(200).json({
        platform,
        keyword,
        projectId,
        hoursUsed,
        count: 0,
        mentions: [],
        message: "No recent mentions found for the given keyword and time window",
      });
    }

    const docs = mentions.map((m) => ({
      projectId,
      keyword: m.keyword,
      platform: m.platform,
      content: m.content,
      author: m.author,
      sourceUrl: m.sourceUrl,
      publishedAt: m.publishedAt,
      collectedAt: new Date(),
      timeWindowUsed: m.timeWindowUsed ?? hoursUsed,
      metadata: m.metadata ?? {},
      rawJson: m.rawJson,
    }));

    await Mention.insertMany(docs, { ordered: false });

    return res.status(200).json({
      platform,
      keyword,
      projectId,
      hoursUsed,
      count: docs.length,
      mentions: docs.map((d) => ({
        projectId: d.projectId,
        keyword: d.keyword,
        platform: d.platform,
        content: d.content,
        author: d.author,
        sourceUrl: d.sourceUrl,
        publishedAt: d.publishedAt,
        collectedAt: d.collectedAt,
        timeWindowUsed: d.timeWindowUsed,
        metadata: d.metadata,
      })),
    });
  } catch (err) {
    return next(err);
  }
}

async function collectReddit(req, res, next) {
  return collectForPlatform(req, res, next, "reddit");
}

async function collectTwitter(req, res, next) {
  return collectForPlatform(req, res, next, "twitter");
}

async function collectYouTube(req, res, next) {
  return collectForPlatform(req, res, next, "youtube");
}

async function collectTumblr(req, res, next) {
  return collectForPlatform(req, res, next, "tumblr");
}

async function collectWeb(req, res, next) {
  return collectForPlatform(req, res, next, "web");
}

async function collectNews(req, res, next) {
  return collectForPlatform(req, res, next, "news");
}

module.exports = {
  collectReddit,
  collectTwitter,
  collectYouTube,
  collectTumblr,
  collectWeb,
  collectNews,
};

