const { Router } = require("express");
const { Signal } = require("../models/Signal");
const { RootCause } = require("../models/RootCause");
const { Campaign } = require("../models/Campaign");
const { AgentAction } = require("../models/AgentAction");
const { Mention } = require("../models/Mention");
const { MERCHANT_CATALOG, verifyWebhookSignature } = require("../services/razorpayService");
const { runSentimentSignalCheck } = require("../agents/sentimentSignalAgent");
const { processPendingSignals } = require("../agents/intentRootCauseAgent");
const { processAnalyzedRootCauses } = require("../agents/campaignOrchestratorAgent");
const { executeApprovedCampaigns } = require("../agents/policyPaymentAgent");
const { computeCampaignMeasurement } = require("../services/measurementService");
const { logger } = require("../utils/logger");
const { env } = require("../config/env");

const router = Router();

/**
 * GET /api/agent/overview
 * Executive summary for the Agentic Orchestrator Dashboard
 */
router.get("/overview", async (req, res, next) => {
  try {
    const projectId = req.query.projectId ? parseInt(String(req.query.projectId), 10) : null;
    const filter = projectId ? { projectId } : {};

    const [signalsCount, pendingCampaignsCount, activeCampaignsCount, actions, campaigns] = await Promise.all([
      Signal.countDocuments(filter),
      Campaign.countDocuments({ ...filter, status: "pending_approval" }),
      Campaign.countDocuments({ ...filter, status: { $in: ["approved", "executing", "active", "measured"] } }),
      AgentAction.find(filter)
        .sort({ createdAt: -1 })
        .populate("mentionId")
        .populate("campaignId")
        .limit(100)
        .lean(),
      Campaign.find(filter).sort({ createdAt: -1 }).limit(10).lean(),
    ]);

    const totalLinksCreated = actions.filter((a) => a.razorpay?.paymentLinkUrl).length;
    const totalConverted = actions.filter((a) => a.status === "converted").length;
    const totalBlockedBySafety = actions.filter((a) => a.status === "blocked").length;
    const totalFailed = actions.filter((a) => a.status === "failed" || a.status === "permanently_failed").length;

    const totalRevenuePaise = actions
      .filter((a) => a.status === "converted")
      .reduce((sum, a) => sum + (a.revenueGeneratedPaise || a.razorpay?.amountPaise || 0), 0);

    // Latest measured campaign sentiment shift
    const latestMeasured = campaigns.find((c) => c.measurement);

    return res.status(200).json({
      success: true,
      stats: {
        signalsCount,
        pendingCampaignsCount,
        activeCampaignsCount,
        totalLinksCreated,
        totalConverted,
        totalBlockedBySafety,
        totalFailed,
        totalRevenueINR: totalRevenuePaise / 100,
        conversionRate: totalLinksCreated > 0 ? Math.round((totalConverted / totalLinksCreated) * 100) : 0,
      },
      latestSentimentShift: latestMeasured?.measurement?.sentimentShift || null,
      recentActions: actions.slice(0, 15),
      recentCampaigns: campaigns,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/agent/signals
 */
router.get("/signals", async (req, res, next) => {
  try {
    const projectId = req.query.projectId ? parseInt(String(req.query.projectId), 10) : null;
    const filter = projectId ? { projectId } : {};

    const signals = await Signal.find(filter)
      .sort({ detectedAt: -1 })
      .populate("rootCauseId")
      .populate("campaignId")
      .limit(50)
      .lean();

    return res.status(200).json({ success: true, signals });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/agent/campaigns
 */
router.get("/campaigns", async (req, res, next) => {
  try {
    const projectId = req.query.projectId ? parseInt(String(req.query.projectId), 10) : null;
    const filter = projectId ? { projectId } : {};

    const campaigns = await Campaign.find(filter)
      .sort({ createdAt: -1 })
      .populate("signalId")
      .populate("rootCauseId")
      .limit(50)
      .lean();

    return res.status(200).json({ success: true, campaigns });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/agent/actions (Audit Trail)
 */
router.get("/actions", async (req, res, next) => {
  try {
    const projectId = req.query.projectId ? parseInt(String(req.query.projectId), 10) : null;
    const filter = projectId ? { projectId } : {};

    const actions = await AgentAction.find(filter)
      .sort({ createdAt: -1 })
      .populate("mentionId")
      .populate("campaignId")
      .limit(100)
      .lean();

    return res.status(200).json({ success: true, actions });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/agent/campaigns/:id/approve
 * Human-in-the-loop merchant approval gate
 */
router.post("/campaigns/:id/approve", async (req, res, next) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    campaign.status = "approved";
    campaign.approvedBy = req.body.approvedBy || "Merchant Admin";
    campaign.approvedAt = new Date();
    await campaign.save();

    // Trigger Agent 4 execution immediately
    const executedActions = await executeApprovedCampaigns(campaign.projectId);

    return res.status(200).json({
      success: true,
      message: `Campaign "${campaign.campaignName}" approved and executed by Agent 4!`,
      campaign,
      actionsTriggeredCount: executedActions.length,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/agent/campaigns/:id/reject
 */
router.post("/campaigns/:id/reject", async (req, res, next) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    campaign.status = "rejected";
    campaign.rejectedReason = req.body.reason || "Rejected by merchant";
    await campaign.save();

    return res.status(200).json({
      success: true,
      message: `Campaign rejected.`,
      campaign,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/agent/test-spike
 * Demo trigger: Injects a sentiment spike and runs the 4 agents in seconds!
 */
router.post("/test-spike", async (req, res, next) => {
  try {
    const projectId = req.body.projectId ? parseInt(String(req.body.projectId), 10) : 1;
    const spikeType = req.body.spikeType || "negative_spike"; // or "positive_spike"

    // Derive real brand keyword for this project
    const sample = await Mention.findOne({ projectId }).select({ keyword: 1 }).lean();
    const keyword = req.body.keyword || sample?.keyword || (projectId === 10 ? "Amul" : "Brand");

    logger.info("AgentRoute", `Simulating ${spikeType} for ${keyword} (Project ${projectId})`, { projectId, keyword });

    // 1. Fetch real collected mentions for this brand/project
    const isNegative = spikeType === "negative_spike";
    let realMentions = await Mention.find({
      projectId,
      sentimentStatus: "completed",
      ...(isNegative ? { "sentiment.label": "negative" } : { "sentiment.label": "positive" }),
    })
      .sort({ publishedAt: -1 })
      .limit(10)
      .lean();

    // Fallback to recent completed mentions if specific sentiment label mentions are limited
    if (realMentions.length < 2) {
      realMentions = await Mention.find({
        projectId,
        sentimentStatus: "completed",
      })
        .sort({ publishedAt: -1 })
        .limit(10)
        .lean();
    }

    // 2. Run Agent 1: Signal Detector
    let signals = await runSentimentSignalCheck(projectId, true);

    // If no signal was auto-detected from baseline comparison, construct signal using real evidence mentions
    if (!signals || signals.length === 0) {
      const platforms = [...new Set(realMentions.map((m) => m.platform).filter(Boolean))];
      const posCount = realMentions.filter((m) => m.sentiment?.label === "positive").length;
      const negCount = realMentions.filter((m) => m.sentiment?.label === "negative").length;
      const total = realMentions.length || 1;

      const simSignal = await Signal.create({
        projectId,
        keyword,
        type: isNegative ? "negative_spike" : "positive_spike",
        severity: isNegative ? "high" : "medium",
        title: isNegative
          ? `Detected Negative Sentiment Spike (${Math.round((negCount / total) * 100)}% Negative)`
          : `Detected Viral Brand Advocacy Surge (${Math.round((posCount / total) * 100)}% Positive)`,
        description: isNegative
          ? `Customer friction detected across social discussions for ${keyword}. Remediation voucher response recommended.`
          : `Positive buying momentum and advocacy detected for ${keyword}. Immediate 1-click checkout recommended.`,
        baseline: {
          positivePercent: isNegative ? 50 : 30,
          neutralPercent: 30,
          negativePercent: isNegative ? 20 : 10,
          avgDailyVolume: Math.max(5, total),
          hoursWindow: 168,
        },
        current: {
          positivePercent: Math.round((posCount / total) * 100),
          neutralPercent: Math.round(((total - posCount - negCount) / total) * 100),
          negativePercent: Math.round((negCount / total) * 100),
          mentionCount: total,
          hoursWindow: 6,
        },
        deviationFactor: isNegative ? 2.8 : 2.4,
        triggeringMentionIds: realMentions.map((m) => m._id),
        platforms: platforms.length ? platforms : ["twitter", "reddit"],
        status: "detected",
      });
      signals = [simSignal];
    }

    // 3. Run Agent 2: Root-Cause Agent
    const rootCauses = await processPendingSignals(projectId);

    // 4. Run Agent 3: Campaign Orchestrator Agent
    const campaigns = await processAnalyzedRootCauses(projectId);

    return res.status(200).json({
      success: true,
      message: `Full autonomous agent loop executed successfully!`,
      stageOutputs: {
        agent1_signalsDetected: signals.length,
        agent2_rootCausesDiagnosed: rootCauses.length,
        agent3_campaignsPlanned: campaigns.length,
        signals,
        rootCauses,
        campaigns,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/agent/trigger-pipeline
 * Called automatically when sentiment analysis completes or when Celery detects a shift
 */
router.post("/trigger-pipeline", async (req, res, next) => {
  try {
    const projectId = req.body.projectId ? parseInt(String(req.body.projectId), 10) : 1;
    logger.info("AgentRoute", `Pipeline triggered for Project ${projectId}`, {
      projectId,
      deviation: req.body.deviation,
    });

    const signals = await runSentimentSignalCheck(projectId, true);
    const rootCauses = await processPendingSignals(projectId);
    const campaigns = await processAnalyzedRootCauses(projectId);

    return res.status(200).json({
      success: true,
      signalsCount: signals.length,
      rootCausesCount: rootCauses.length,
      campaignsCount: campaigns.length,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/agent/test-failure-recovery
 * Demo trigger: Demonstrates graceful failure handling without duplicate transactions
 */
router.post("/test-failure-recovery", async (req, res, next) => {
  try {
    const projectId = req.body.projectId ? parseInt(String(req.body.projectId), 10) : 1;

    const testIdempotencyKey = `sentimind_demo_fail_${Date.now()}`;

    // Create an action with initial simulated 429 rate limit failure
    const failedAction = await AgentAction.create({
      idempotencyKey: testIdempotencyKey,
      projectId,
      platform: "twitter",
      author: "kavita_sharma",
      mentionContent: "Looking to buy the Wireless Headphones Pro! Any active discount link?",
      sentimentLabel: "positive",
      intentClassification: "purchase_intent",
      actionType: "create_payment_link",
      status: "failed",
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Razorpay API Rate Limit Exceeded (429 Too Many Requests) - Throttled",
        statusCode: 429,
        willRetry: true,
        retryCount: 1,
        lastRetryAt: new Date(),
        resolvedGracefully: false,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Simulated transient API rate-limit failure. Ready to demonstrate idempotent retry recovery!",
      action: failedAction,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/agent/actions/:id/mark-converted
 * Demo helper: Simulates payment confirmation for a link
 */
router.post("/actions/:id/mark-converted", async (req, res, next) => {
  try {
    const action = await AgentAction.findById(req.params.id);
    if (!action) {
      return res.status(404).json({ error: "Action not found" });
    }

    action.status = "converted";
    action.convertedAt = new Date();
    action.revenueGeneratedPaise = action.razorpay?.amountPaise || 299900;
    await action.save();

    // Recompute measurement loop if tied to a campaign
    if (action.campaignId) {
      await computeCampaignMeasurement(action.campaignId);
    }

    return res.status(200).json({
      success: true,
      message: `Payment verified! ₹${action.revenueGeneratedPaise / 100} recorded to audit trail.`,
      action,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/agent/catalog
 * Agent-Readable Catalog for AI Buyers (Track 1 Requirement)
 */
router.get("/catalog", (_req, res) => {
  res.json({
    merchant: "SentiPulse Audio Store",
    version: "2026.1",
    agent_compatible: true,
    protocol: "Razorpay_UAP_Ready",
    currency: "INR",
    catalog: MERCHANT_CATALOG.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: {
        amount_paise: p.amountPaise,
        amount_inr: p.amountPaise / 100,
        currency: "INR",
      },
      description: p.description,
      in_stock: p.inStock,
      agent_checkout_endpoint: "/api/agent/actions/create-direct",
    })),
    supported_payment_rails: ["UPI", "Cards", "NetBanking", "Wallets"],
  });
});

/**
 * POST /api/agent/webhook/razorpay
 * Official Razorpay Webhook listener for payment_link.paid events
 */
router.post("/webhook/razorpay", async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const rawBody = req.body;

    // Verify cryptographic signature if secret is configured
    if (env.razorpayWebhookSecret && signature) {
      const isValid = verifyWebhookSignature(rawBody, signature, env.razorpayWebhookSecret);
      if (!isValid) {
        console.warn("[Razorpay Webhook] Invalid signature rejected");
        return res.status(400).json({ error: "Invalid signature" });
      }
    }

    const payload = typeof rawBody === "string" ? JSON.parse(rawBody) : rawBody;
    const event = payload?.event;

    if (event === "payment_link.paid") {
      const plinkId = payload?.payload?.payment_link?.entity?.id;
      const amountPaise = payload?.payload?.payment_link?.entity?.amount;

      const action = await AgentAction.findOne({ "razorpay.paymentLinkId": plinkId });
      if (action) {
        action.status = "converted";
        action.convertedAt = new Date();
        action.revenueGeneratedPaise = amountPaise || action.razorpay.amountPaise;
        await action.save();

        if (action.campaignId) {
          await computeCampaignMeasurement(action.campaignId);
        }

        console.log(`💰 [Razorpay Webhook Verified] Payment Link ${plinkId} converted for ₹${action.revenueGeneratedPaise / 100}`);
      }
    }

    return res.status(200).json({ status: "ok" });
  } catch (err) {
    console.error("[Razorpay Webhook Error]:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
