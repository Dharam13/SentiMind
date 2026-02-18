const { Mention } = require("../models/Mention");
const { fetchRedditMentions } = require("../services/redditIngestionService");
const { fetchTwitterMentions } = require("../services/twitterIngestionService");
const { fetchYouTubeMentions } = require("../services/youtubeIngestionService");
const { fetchTumblrMentions } = require("../services/tumblrIngestionService");
const { fetchNewsMentions } = require("../services/newsIngestionService");

const DEFAULT_SUMMARY_HOURS = 24;
const DEFAULT_RUN_PLATFORMS = ["reddit", "twitter", "youtube", "tumblr", "news"];

function getFetchFn(platform) {
  switch (platform) {
    case "reddit":
      return fetchRedditMentions;
    case "twitter":
      return fetchTwitterMentions;
    case "youtube":
      return fetchYouTubeMentions;
    case "tumblr":
      return fetchTumblrMentions;
    case "news":
      return fetchNewsMentions;
    default:
      return null;
  }
}

function normalizeUrl(raw) {
  if (!raw || typeof raw !== "string") return null;
  try {
    const u = new URL(raw);
    const stripParams = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "gclid",
      "fbclid",
    ];
    for (const p of stripParams) {
      u.searchParams.delete(p);
    }
    u.hash = "";
    const cleaned = u.toString();
    return cleaned.endsWith("/") ? cleaned.slice(0, -1) : cleaned;
  } catch {
    return raw.trim();
  }
}

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

async function collectNews(req, res, next) {
  return collectForPlatform(req, res, next, "news");
}

async function getProjectSummary(req, res, next) {
  try {
    const { projectId: projectIdRaw, keyword, hours: hoursRaw } = req.query;

    if (!projectIdRaw) {
      return res.status(400).json({ error: "Query parameter 'projectId' is required" });
    }
    const projectId = parseInt(String(projectIdRaw), 10);
    if (!Number.isFinite(projectId)) {
      return res.status(400).json({ error: "Query parameter 'projectId' must be a number" });
    }

    const hoursParsed = hoursRaw ? parseInt(String(hoursRaw), 10) : NaN;
    const hoursUsed =
      Number.isFinite(hoursParsed) && hoursParsed > 0 ? hoursParsed : DEFAULT_SUMMARY_HOURS;

    const end = new Date();
    const start = new Date(end.getTime() - hoursUsed * 60 * 60 * 1000);

    const query = {
      projectId,
      publishedAt: { $gte: start },
    };
    if (keyword && typeof keyword === "string") {
      query.keyword = keyword;
    }

    const mentions = await Mention.find(query)
      .sort({ publishedAt: 1 })
      .limit(1000)
      .lean();

    if (!mentions.length) {
      return res.status(200).json({
        projectId,
        keyword: keyword ?? null,
        hoursUsed,
        totalMentions: 0,
        timeSeries: [],
        byPlatform: [],
        mentions: [],
      });
    }

    const timeSeriesMap = new Map();
    const platformMap = new Map();

    for (const m of mentions) {
      const publishedAt = m.publishedAt ? new Date(m.publishedAt) : new Date();
      const dayKey = publishedAt.toISOString().slice(0, 10);

      const tsBucket = timeSeriesMap.get(dayKey) || { date: dayKey, count: 0 };
      tsBucket.count += 1;
      timeSeriesMap.set(dayKey, tsBucket);

      const platformKey = m.platform || "unknown";
      const platBucket = platformMap.get(platformKey) || { platform: platformKey, count: 0 };
      platBucket.count += 1;
      platformMap.set(platformKey, platBucket);
    }

    const timeSeries = Array.from(timeSeriesMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
    const byPlatform = Array.from(platformMap.values()).sort((a, b) =>
      a.platform.localeCompare(b.platform)
    );

    const slimMentions = [...mentions]
      .sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      )
      .slice(0, 200)
      .map((m) => ({
        id: String(m._id),
        projectId: m.projectId,
        keyword: m.keyword,
        platform: m.platform,
        content: m.content,
        author: m.author,
        sourceUrl: m.sourceUrl,
        publishedAt: m.publishedAt,
        timeWindowUsed: m.timeWindowUsed,
        metadata: m.metadata ?? {},
      }));

    return res.status(200).json({
      projectId,
      keyword: keyword ?? null,
      hoursUsed,
      totalMentions: mentions.length,
      timeSeries,
      byPlatform,
      mentions: slimMentions,
    });
  } catch (err) {
    return next(err);
  }
}

async function runCollection(req, res, next) {
  try {
    const { projectId: projectIdRaw, keyword, limit: limitRaw, hours: hoursRaw, platforms } =
      req.body ?? {};

    if (!projectIdRaw) {
      return res.status(400).json({ error: "projectId is required" });
    }
    const projectId = parseInt(String(projectIdRaw), 10);
    if (!Number.isFinite(projectId)) {
      return res.status(400).json({ error: "projectId must be a number" });
    }

    if (!keyword || typeof keyword !== "string" || !keyword.trim()) {
      return res.status(400).json({ error: "keyword is required" });
    }

    const limitParsed = limitRaw ? parseInt(String(limitRaw), 10) : NaN;
    const limit = Number.isFinite(limitParsed) && limitParsed > 0 ? Math.min(limitParsed, 100) : 20;

    const hoursParsed = hoursRaw ? parseInt(String(hoursRaw), 10) : NaN;
    const hours = Number.isFinite(hoursParsed) && hoursParsed > 0 ? hoursParsed : undefined;

    const requestedPlatforms = Array.isArray(platforms) ? platforms : DEFAULT_RUN_PLATFORMS;
    const platformList = requestedPlatforms
      .map((p) => String(p).toLowerCase())
      .filter((p) => DEFAULT_RUN_PLATFORMS.includes(p));

    if (!platformList.length) {
      return res.status(400).json({ error: "No valid platforms provided" });
    }

    const settled = await Promise.allSettled(
      platformList.map(async (platform) => {
        try {
          const fetchFn = getFetchFn(platform);
          if (!fetchFn) {
            const err = new Error(`Unsupported platform '${platform}'`);
            err.code = "UNSUPPORTED_PLATFORM";
            err.platform = platform;
            throw err;
          }
          const result = await fetchFn({ keyword: keyword.trim(), limit, hours });
          return { platform, ...result };
        } catch (e) {
          if (e && typeof e === "object" && !e.platform) {
            e.platform = platform;
          }
          throw e;
        }
      })
    );

    const fetchedByPlatform = {};
    const errorsByPlatform = {};
    let combinedMentions = [];
    let hoursUsed = hours ?? DEFAULT_SUMMARY_HOURS;

    for (const item of settled) {
      if (item.status === "fulfilled") {
        const { platform, mentions, hoursUsed: used } = item.value;
        fetchedByPlatform[platform] = mentions?.length ?? 0;
        if (used) hoursUsed = used;
        combinedMentions = combinedMentions.concat(mentions ?? []);
      } else {
        const platform = item.reason?.platform || "unknown";
        errorsByPlatform[platform] = item.reason?.message || "Failed to fetch mentions";
      }
    }

    if (!combinedMentions.length) {
      return res.status(200).json({
        projectId,
        keyword: keyword.trim(),
        hoursUsed,
        fetchedByPlatform,
        errorsByPlatform,
        insertedCount: 0,
        skippedExisting: 0,
        message: "No mentions fetched",
      });
    }

    // Dedupe within this run by normalized URL
    const seen = new Set();
    const dedupedMentions = [];

    for (const m of combinedMentions) {
      const nUrl = normalizeUrl(m.sourceUrl);
      const key = nUrl ? nUrl : `${m.platform || "unknown"}|${(m.content || "").slice(0, 80)}|${new Date(m.publishedAt || Date.now()).toISOString().slice(0, 10)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      dedupedMentions.push({ ...m, sourceUrl: nUrl || m.sourceUrl });
    }

    const urls = dedupedMentions.map((m) => m.sourceUrl).filter((u) => typeof u === "string" && u);
    const existingUrlSet = new Set();

    if (urls.length) {
      const existing = await Mention.find({
        projectId,
        keyword: keyword.trim(),
        sourceUrl: { $in: urls },
      })
        .select({ sourceUrl: 1 })
        .lean();
      for (const e of existing) {
        if (e.sourceUrl) existingUrlSet.add(e.sourceUrl);
      }
    }

    const docs = dedupedMentions
      .filter((m) => !m.sourceUrl || !existingUrlSet.has(m.sourceUrl))
      .map((m) => ({
        projectId,
        keyword: keyword.trim(),
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

    const skippedExisting = dedupedMentions.length - docs.length;

    if (docs.length) {
      await Mention.insertMany(docs, { ordered: false });
    }

    return res.status(200).json({
      projectId,
      keyword: keyword.trim(),
      hoursUsed,
      fetchedByPlatform,
      errorsByPlatform,
      insertedCount: docs.length,
      skippedExisting,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  collectReddit,
  collectTwitter,
  collectYouTube,
  collectTumblr,
  collectNews,
  getProjectSummary,
  runCollection,
};

