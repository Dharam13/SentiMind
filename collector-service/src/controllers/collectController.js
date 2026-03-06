const { Mention } = require("../models/Mention");
const { fetchRedditMentions } = require("../services/redditIngestionService");
const { fetchTwitterMentions } = require("../services/twitterIngestionService");
const { fetchYouTubeMentions } = require("../services/youtubeIngestionService");
const { fetchMediumMentions } = require("../services/mediumIngestionService");
const { fetchLinkedInMentions } = require("../services/linkedinIngestionService");
const { fetchNewsMentions } = require("../services/newsIngestionService");

const DEFAULT_SUMMARY_HOURS = 24;
const DEFAULT_RUN_PLATFORMS = ["reddit", "twitter", "youtube", "medium", "linkedin", "news"];

function getFetchFn(platform) {
  switch (platform) {
    case "reddit":
      return fetchRedditMentions;
    case "twitter":
      return fetchTwitterMentions;
    case "youtube":
      return fetchYouTubeMentions;
    case "medium":
      return fetchMediumMentions;
    case "linkedin":
      return fetchLinkedInMentions;
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
      case "medium":
        fetchFn = fetchMediumMentions;
        break;
      case "linkedin":
        fetchFn = fetchLinkedInMentions;
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
      sourceType: m.sourceType || undefined,
      metadata: m.metadata ?? {},
      rawJson: m.rawJson,
      sentimentStatus: "pending",
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

async function collectMedium(req, res, next) {
  return collectForPlatform(req, res, next, "medium");
}

async function collectLinkedIn(req, res, next) {
  return collectForPlatform(req, res, next, "linkedin");
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

    const hoursStr = hoursRaw != null ? String(hoursRaw).trim().toLowerCase() : "";
    const allTime = hoursStr === "all" || hoursStr === "total" || hoursStr === "lifetime";

    const hoursParsed = allTime ? NaN : (hoursRaw ? parseInt(String(hoursRaw), 10) : NaN);
    const hoursUsed =
      allTime ? 0 : (Number.isFinite(hoursParsed) && hoursParsed > 0 ? hoursParsed : DEFAULT_SUMMARY_HOURS);

    const query = { projectId };
    if (!allTime) {
      const end = new Date();
      const start = new Date(end.getTime() - hoursUsed * 60 * 60 * 1000);
      query.publishedAt = { $gte: start };
    }
    if (keyword && typeof keyword === "string") {
      query.keyword = keyword;
    }

    const [totalMentions, timeSeriesAgg, byPlatformAgg, sentimentAgg] = await Promise.all([
      Mention.countDocuments(query),
      Mention.aggregate([
        { $match: query },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$publishedAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $project: { _id: 0, date: "$_id", count: 1 } },
        { $sort: { date: 1 } },
      ]),
      Mention.aggregate([
        { $match: query },
        { $group: { _id: { $ifNull: ["$platform", "unknown"] }, count: { $sum: 1 } } },
        { $project: { _id: 0, platform: "$_id", count: 1 } },
        { $sort: { platform: 1 } },
      ]),
      Mention.aggregate([
        { $match: query },
        { $group: { _id: { $ifNull: ["$sentimentStatus", "pending"] }, count: { $sum: 1 } } },
        { $project: { _id: 0, status: "$_id", count: 1 } },
      ]),
    ]);

    if (!totalMentions) {
      return res.status(200).json({
        projectId,
        keyword: keyword ?? null,
        hoursUsed,
        totalMentions: 0,
        timeSeries: [],
        byPlatform: [],
        sentimentCounts: { completed: 0, pending: 0, failed: 0 },
        mentions: [],
      });
    }

    const sentimentCounts = { completed: 0, pending: 0, failed: 0 };
    for (const row of sentimentAgg || []) {
      const key = String(row.status || "").toLowerCase();
      if (key === "completed") sentimentCounts.completed = row.count || 0;
      else if (key === "failed") sentimentCounts.failed = row.count || 0;
      else sentimentCounts.pending += row.count || 0;
    }

    // Keep a slim list for UI feed/charts; totals come from aggregation above.
    const mentions = await Mention.find(query)
      .sort({ publishedAt: -1 })
      .limit(800)
      .lean();

    const slimMentions = [...mentions]
      .sort((a, b) => {
        // Prioritize analyzed (completed) first, then pending, then failed
        const order = { completed: 0, pending: 1, failed: 2 };
        const aOrder = order[a.sentimentStatus] ?? 1;
        const bOrder = order[b.sentimentStatus] ?? 1;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      })
      .slice(0, 500)
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
        sourceType: m.sourceType || undefined,
        metadata: m.metadata ?? {},
        sentimentStatus: m.sentimentStatus,
        sentiment: m.sentiment,
      }));

    return res.status(200).json({
      projectId,
      keyword: keyword ?? null,
      hoursUsed,
      totalMentions,
      timeSeries: timeSeriesAgg || [],
      byPlatform: byPlatformAgg || [],
      sentimentCounts,
      mentions: slimMentions,
    });
  } catch (err) {
    return next(err);
  }
}

async function runCollection(req, res, next) {
  const startTime = Date.now();
  
  // Check if request was aborted before we start
  if (req.aborted || req.destroyed) {
    console.warn("[Collector] Request was aborted before processing");
    if (!res.headersSent) {
      return res.status(400).json({ error: "Request was cancelled", code: "REQUEST_ABORTED" });
    }
    return;
  }

  // Log immediately to confirm handler started
  console.log(`[Collector] Received runCollection request at ${new Date().toISOString()}`);

  // Set up request timeout handler
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      console.error("[Collector] Request timeout after 2 minutes - sending response");
      res.status(504).json({
        error: "Collection request timed out",
        code: "TIMEOUT",
        message: "The collection process took too long to complete",
      });
    }
  }, 120000); // 2 minutes

  // Clean up timeout when response is sent
  const originalEnd = res.end;
  res.end = function (...args) {
    clearTimeout(timeout);
    return originalEnd.apply(this, args);
  };

  // Handle client disconnect
  req.on("close", () => {
    if (!res.headersSent) {
      console.warn("[Collector] Client disconnected before response");
      clearTimeout(timeout);
    }
  });

  try {
    // Validate body exists
    if (!req.body || typeof req.body !== "object") {
      clearTimeout(timeout);
      return res.status(400).json({ error: "Invalid request body", code: "INVALID_BODY" });
    }

    const { projectId: projectIdRaw, keyword, limit: limitRaw, hours: hoursRaw, platforms } =
      req.body;

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

    console.log(`[Collector] Starting collection run for projectId=${projectId}, keyword="${keyword.trim()}", platforms=[${platformList.join(", ")}]`);

    // Initialize result tracking
    const fetchedByPlatform = {};
    const errorsByPlatform = {};
    let combinedMentions = [];
    let hoursUsed = hours ?? DEFAULT_SUMMARY_HOURS;

    // Wrap platform fetching with a timeout to ensure we respond even if platforms hang
    const platformTimeout = 60000; // 60 seconds max per platform (should be enough with 15s HTTP timeout)
    
    const platformPromises = platformList.map(async (platform) => {
      const platformStart = Date.now();
      try {
        console.log(`[Collector] Fetching ${platform} mentions...`);
        const fetchFn = getFetchFn(platform);
        if (!fetchFn) {
          const err = new Error(`Unsupported platform '${platform}'`);
          err.code = "UNSUPPORTED_PLATFORM";
          err.platform = platform;
          throw err;
        }
        
        // Wrap fetch with timeout
        const fetchPromise = fetchFn({ keyword: keyword.trim(), limit, hours });
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`Platform ${platform} timed out after ${platformTimeout}ms`)), platformTimeout);
        });
        
        const result = await Promise.race([fetchPromise, timeoutPromise]);
        const duration = Date.now() - platformStart;
        console.log(`[Collector] ✓ ${platform}: ${result.mentions?.length || 0} mentions (${duration}ms)`);
        return { platform, ...result };
      } catch (e) {
        const duration = Date.now() - platformStart;
        const errorMsg = e?.message || String(e);
        console.error(`[Collector] ✗ ${platform}: ${errorMsg} (${duration}ms)`);
        if (e && typeof e === "object" && !e.platform) {
          e.platform = platform;
        }
        throw e;
      }
    });

    // Wait for all platforms with an overall timeout
    // Set to 60 seconds to ensure we respond well before frontend's 120s timeout
    const overallTimeout = 60000; // 60 seconds total max
    let settled = [];
    let timedOut = false;
    
    try {
      const settledPromise = Promise.allSettled(platformPromises);
      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => {
          console.warn(`[Collector] Overall timeout after ${overallTimeout}ms - returning partial results`);
          resolve("TIMEOUT");
        }, overallTimeout);
      });

      const result = await Promise.race([settledPromise, timeoutPromise]);
      
      if (result === "TIMEOUT") {
        timedOut = true;
        // Don't wait for remaining promises - just mark them as timed out
        // The settled array will be incomplete, but we'll handle that below
        console.warn(`[Collector] Timeout reached - some platforms may still be processing`);
        settled = []; // Will be handled by timeout logic below
      } else {
        settled = result;
      }
    } catch (error) {
      console.error(`[Collector] Error in platform fetching: ${error.message}`);
      settled = [];
    }

    // Process settled results
    if (settled.length > 0) {
      for (let i = 0; i < settled.length; i++) {
        const item = settled[i];
        const platform = platformList[i] || "unknown";
        
        if (item.status === "fulfilled") {
          const { platform: p, mentions, hoursUsed: used } = item.value;
          fetchedByPlatform[p || platform] = mentions?.length ?? 0;
          if (used) hoursUsed = used;
          combinedMentions = combinedMentions.concat(mentions ?? []);
        } else {
          errorsByPlatform[platform] = item.reason?.message || "Failed to fetch mentions";
        }
      }
    }
    
    // If we timed out, mark any platforms that didn't complete
    if (timedOut || settled.length === 0) {
      for (const platform of platformList) {
        if (!fetchedByPlatform[platform] && !errorsByPlatform[platform]) {
          errorsByPlatform[platform] = "Request timed out";
        }
      }
    }

    const totalDuration = Date.now() - startTime;
    console.log(`[Collector] Collection run completed in ${totalDuration}ms. Fetched: ${Object.values(fetchedByPlatform).reduce((a, b) => a + b, 0)}, Errors: ${Object.keys(errorsByPlatform).length}`);

    // Clear the request timeout since we're about to respond
    clearTimeout(timeout);

    // Check if response was already sent
    if (res.headersSent) {
      console.warn("[Collector] Response already sent, skipping");
      return;
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
      try {
        // Add timeout to MongoDB query
        const queryPromise = Mention.find({
          projectId,
          keyword: keyword.trim(),
          sourceUrl: { $in: urls },
        })
          .select({ sourceUrl: 1 })
          .lean()
          .maxTimeMS(10000); // 10 second timeout
        
        const queryTimeout = new Promise((resolve) => {
          setTimeout(() => resolve([]), 10000);
        });
        
        const existing = await Promise.race([queryPromise, queryTimeout]);
        for (const e of existing) {
          if (e.sourceUrl) existingUrlSet.add(e.sourceUrl);
        }
      } catch (dbError) {
        console.warn(`[Collector] MongoDB query timeout/error, continuing without deduplication: ${dbError.message}`);
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
        sourceType: m.sourceType || undefined,
        metadata: m.metadata ?? {},
        rawJson: m.rawJson,
        sentimentStatus: "pending",
      }));

    const skippedExisting = dedupedMentions.length - docs.length;

    let insertedCount = 0;
    if (docs.length) {
      try {
        // Check MongoDB connection before inserting
        const mongoose = require("mongoose");
        if (mongoose.connection.readyState !== 1) {
          console.warn("[Collector] MongoDB not connected, attempting to reconnect...");
          const { connectMongo } = require("../db/mongo");
          await connectMongo();
        }
        
        // Add timeout to insert operation
        const insertPromise = Mention.insertMany(docs, { 
          ordered: false,
          maxTimeMS: 30000, // 30 second timeout
        });
        
        const insertTimeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("MongoDB insert timed out after 30s")), 30000);
        });
        
        await Promise.race([insertPromise, insertTimeout]);
        insertedCount = docs.length;
      } catch (dbError) {
        console.error(`[Collector] Failed to insert mentions to MongoDB: ${dbError.message}`);
        // Still return success with fetched data, but note the DB error
        errorsByPlatform["database"] = `Failed to save to database: ${dbError.message}`;
        insertedCount = 0;
      }
    }

    const finalDuration = Date.now() - startTime;
    console.log(`[Collector] ✓ Run complete: inserted ${insertedCount} mentions, skipped ${skippedExisting} duplicates (${finalDuration}ms total)`);

    // Check if response was already sent (timeout or abort)
    if (res.headersSent) {
      console.warn("[Collector] Response already sent, skipping");
      return;
    }

    clearTimeout(timeout);
    return res.status(200).json({
      projectId,
      keyword: keyword.trim(),
      hoursUsed,
      fetchedByPlatform,
      errorsByPlatform,
      insertedCount,
      skippedExisting,
    });
  } catch (err) {
    const errorDuration = Date.now() - startTime;
    console.error(`[Collector] ✗ Run failed after ${errorDuration}ms:`, err.message || err);
    
    // Check if response was already sent
    if (res.headersSent) {
      console.warn("[Collector] Error occurred but response already sent");
      return;
    }
    
    clearTimeout(timeout);
    return next(err);
  }
}

/**
 * Fetch metrics for multiple projects at once (optimized for dashboard)
 * This is much more efficient than calling getProjectSummary for each project individually
 */
async function getBulkProjectMetrics(req, res, next) {
  try {
    const { projectIds: projectIdsRaw, hours: hoursRaw } = req.query;

    if (!projectIdsRaw) {
      return res.status(400).json({ error: "Query parameter 'projectIds' is required" });
    }

    // Parse project IDs
    const projectIds = String(projectIdsRaw)
      .split(',')
      .map((id) => {
        const parsed = parseInt(id.trim(), 10);
        return Number.isFinite(parsed) ? parsed : null;
      })
      .filter((id) => id !== null);

    if (projectIds.length === 0) {
      return res.status(400).json({ error: "At least one valid project ID is required" });
    }

    const hoursStr = hoursRaw != null ? String(hoursRaw).trim().toLowerCase() : "";
    const allTime = hoursStr === "all" || hoursStr === "total" || hoursStr === "lifetime";
    const hoursParsed = allTime ? NaN : (hoursRaw ? parseInt(String(hoursRaw), 10) : NaN);
    const hoursUsed = allTime ? 0 : (Number.isFinite(hoursParsed) && hoursParsed > 0 ? hoursParsed : DEFAULT_SUMMARY_HOURS);

    // Build date filter
    let dateFilter = {};
    if (!allTime) {
      const end = new Date();
      const start = new Date(end.getTime() - hoursUsed * 60 * 60 * 1000);
      dateFilter = { $gte: start };
    }

    // Fetch metrics for all projects in one query
    const metricsData = await Mention.aggregate([
      {
        $match: {
          projectId: { $in: projectIds },
          ...(Object.keys(dateFilter).length > 0 && { publishedAt: dateFilter }),
        },
      },
      {
        $group: {
          _id: "$projectId",
          totalMentions: { $sum: 1 },
          completedCount: {
            $sum: { $cond: [{ $eq: ["$sentimentStatus", "completed"] }, 1, 0] },
          },
          pendingCount: {
            $sum: { $cond: [{ $eq: ["$sentimentStatus", "pending"] }, 1, 0] },
          },
          failedCount: {
            $sum: { $cond: [{ $eq: ["$sentimentStatus", "failed"] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          projectId: "$_id",
          totalMentions: 1,
          analyzed: "$completedCount",
          pending: "$pendingCount",
          failed: "$failedCount",
        },
      },
    ]);

    // Build response map
    const metricsMap = {};
    for (const metric of metricsData) {
      metricsMap[metric.projectId] = {
        hoursUsed,
        totalMentions: metric.totalMentions,
        analyzed: metric.analyzed,
        pending: metric.pending,
        failed: metric.failed,
      };
    }

    // Return metrics for all requested projects (fill in zeros for projects with no data)
    const result = {};
    for (const projectId of projectIds) {
      result[projectId] = metricsMap[projectId] || {
        hoursUsed,
        totalMentions: 0,
        analyzed: 0,
        pending: 0,
        failed: 0,
      };
    }

    return res.status(200).json({ metrics: result });
  } catch (err) {
    return next(err);
  }
}

/**
 * Get top influencers for a project
 */
async function getProjectInfluencers(req, res, next) {
  try {
    const { projectId: projectIdRaw, hours: hoursRaw, keyword, limit: limitRaw } = req.query;

    if (!projectIdRaw) {
      return res.status(400).json({ error: "Query parameter 'projectId' is required" });
    }
    const projectId = parseInt(String(projectIdRaw), 10);
    if (!Number.isFinite(projectId)) {
      return res.status(400).json({ error: "Query parameter 'projectId' must be a number" });
    }

    const hoursUsed = hoursRaw ? parseInt(String(hoursRaw), 10) : DEFAULT_SUMMARY_HOURS;
    const limit = limitRaw ? Math.min(parseInt(String(limitRaw), 10) || 50, 500) : 50;

    const { getTopInfluencersCrossPlatform } = require("../services/influencerService");

    const influencers = await getTopInfluencersCrossPlatform(projectId, hoursUsed, keyword, limit);

    res.status(200).json({
      projectId,
      keyword: keyword ?? null,
      hoursUsed,
      influencers,
      total: influencers.length,
    });
  } catch (err) {
    console.error("[Collector] Error fetching project influencers:", err);
    next(err);
  }
}

module.exports = {
  collectReddit,
  collectTwitter,
  collectYouTube,
  collectMedium,
  collectLinkedIn,
  collectNews,
  getProjectSummary,
  getBulkProjectMetrics,
  runCollection,
  getProjectInfluencers,
};

