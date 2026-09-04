const { Campaign } = require("../models/Campaign");
const { Signal } = require("../models/Signal");
const { Mention } = require("../models/Mention");
const { AgentAction } = require("../models/AgentAction");
const { assessMentionCredibility } = require("../services/credibilityService");
const { createPaymentLink } = require("../services/razorpayService");
const { computeCampaignMeasurement } = require("../services/measurementService");
const { logger } = require("../utils/logger");
const { env } = require("../config/env");

const MODULE_NAME = "Agent:Payment";

/**
 * Agent 4: Policy & Payment Agent
 * Enforces policy gates, executes bounded Razorpay money actions with strict idempotency,
 * and recovers gracefully from transient API failures without duplicate transactions.
 */
async function executeApprovedCampaigns(targetProjectId = null) {
  const query = {
    status: { $in: ["approved", "executing"] },
  };
  if (targetProjectId) {
    query.projectId = targetProjectId;
  }
  const approvedCampaigns = await Campaign.find(query).limit(5);

  const actionsExecuted = [];

  for (const campaign of approvedCampaigns) {
    try {
      campaign.status = "executing";
      if (!campaign.executedAt) campaign.executedAt = new Date();
      await campaign.save();

      logger.info(MODULE_NAME, `Executing campaign: "${campaign.campaignName}"`, {
        campaignId: campaign._id,
        projectId: campaign.projectId,
      });

      // Retrieve triggering mentions for this campaign
      let mentions = [];
      if (campaign.signalId) {
        const signal = await Signal.findById(campaign.signalId);
        if (signal && signal.triggeringMentionIds?.length) {
          mentions = await Mention.find({ _id: { $in: signal.triggeringMentionIds } }).lean();
        }
      }

      if (!mentions.length) {
        mentions = await Mention.find({
          projectId: campaign.projectId,
          sentimentStatus: "completed",
          agentStatus: { $ne: "processed" },
        })
          .sort({ publishedAt: -1 })
          .limit(10)
          .lean();
      }

      // Check Daily Action Limits
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayActionsCount = await AgentAction.countDocuments({
        projectId: campaign.projectId,
        createdAt: { $gte: todayStart },
        status: { $nin: ["blocked", "failed"] },
      });

      const maxDaily = env.maxActionsPerDay || env.maxAgentActionsPerDay || 50;
      if (todayActionsCount >= maxDaily) {
        logger.warn(MODULE_NAME, `Daily action limit reached (${todayActionsCount}/${maxDaily}). Gating execution.`);
        continue;
      }

      for (const mention of mentions) {
        // IDEMPOTENCY KEY: Guarantees no duplicate payment action can ever be created for this mention & campaign
        const idempotencyKey = `sentimind_act_${campaign._id}_${mention._id}`;

        const existingAction = await AgentAction.findOne({ idempotencyKey });
        if (existingAction) {
          // Already executed or currently executing - skip to maintain idempotency
          continue;
        }

        // 1. Anti-Abuse Credibility Scoring
        const credibility = await assessMentionCredibility(mention);

        // 2. Select appropriate planned action based on intent / sentiment
        const isNegative = mention.sentiment?.label === "negative";
        const matchedPlan =
          campaign.plannedActions.find((a) => (isNegative ? a.targetSegment === "complaint" : a.targetSegment === "purchase_intent")) ||
          campaign.plannedActions[0];

        const actionType = isNegative ? "create_discount_offer" : "create_payment_link";
        const amountPaise = matchedPlan ? matchedPlan.finalAmount : 299900;

        // 3. Safety Guardrail Verification
        const safetyChecks = {
          isActionablePlatform: ["twitter", "reddit", "youtube"].includes(mention.platform),
          isDuplicateUser: credibility.isFlaggedFarmer,
          withinDailyBudget: todayActionsCount < maxDaily,
          withinDiscountCap: (matchedPlan?.discountPercent || 0) <= env.maxDiscountPercent,
          passedCredibilityGate: credibility.isCredible,
          requiresHumanApproval: false,
        };

        const isSafeToExecute =
          safetyChecks.isActionablePlatform &&
          safetyChecks.withinDailyBudget &&
          safetyChecks.withinDiscountCap &&
          safetyChecks.passedCredibilityGate &&
          !credibility.isFlaggedFarmer;

        // Initialize Audit Record in 'executing' state
        const actionRecord = new AgentAction({
          idempotencyKey,
          projectId: campaign.projectId,
          campaignId: campaign._id,
          mentionId: mention._id,
          platform: mention.platform,
          author: mention.author || "user",
          mentionContent: mention.content,
          sourceUrl: mention.sourceUrl,
          sentimentLabel: mention.sentiment?.label,
          sentimentConfidence: mention.sentiment?.confidence,
          intentClassification: isNegative ? "complaint" : "purchase_intent",
          intentConfidence: 0.88,
          intentReasoning: matchedPlan?.reasoning || "Campaign targeted remediation",
          actionType: isSafeToExecute ? actionType : "blocked_by_safety",
          actionReason: isSafeToExecute
            ? matchedPlan?.reasoning
            : `Blocked by Anti-Abuse Gate: ${credibility.reasons.join(", ")}`,
          credibilityScore: credibility.score,
          credibilityFactors: credibility.reasons,
          safetyChecks,
          status: isSafeToExecute ? "executing" : "blocked",
        });

        if (!isSafeToExecute) {
          const blockedReason = !safetyChecks.isActionablePlatform
            ? `Non-conversational platform (${mention.platform}) - direct discount link not appropriate for B2B/PR article.`
            : !safetyChecks.passedCredibilityGate
            ? `Account credibility score (${Math.round(credibility.score * 100)}%) is below 50% anti-abuse threshold.`
            : "Exceeded daily budget limit.";
          actionRecord.actionReason = blockedReason;
          actionRecord.outreachMessage = `[BLOCKED BY POLICY GUARDRAIL] ${blockedReason}`;
          await actionRecord.save();
          campaign.actionsBlockedBySafety += 1;
          logger.info(MODULE_NAME, `Action blocked by safety gate for @${mention.author}`, {
            credibilityScore: credibility.score,
            reasons: credibility.reasons,
          });
          continue;
        }

        // 4. Razorpay Execution
        try {
          // Trigger Razorpay Payment Link API
          const rzpResponse = await createPaymentLink({
            amountPaise,
            description: `${matchedPlan?.product || "SentiMind"} — ${isNegative ? "Customer Loyalty Remediation" : "Instant 1-Click Order"}`,
            customerName: mention.author || "Valued Customer",
            notes: {
              source_platform: mention.platform,
              source_mention_id: String(mention._id),
              campaign_id: String(campaign._id),
              idempotency_key: idempotencyKey,
              credibility_score: String(credibility.score),
            },
            idempotencyKey,
          });

          const productName = matchedPlan?.product || "Exclusive Selection";
          const discountPct = matchedPlan?.discountPercent || 15;
          actionRecord.outreachMessage = isNegative
            ? `Hi @${mention.author || "customer"}, we noticed your feedback regarding ${productName}. As an apology and gesture of trust, our team formulated an exclusive ${discountPct}% resolution voucher: ${rzpResponse.paymentLinkUrl}. We'd love for you to give our authentic range another taste!`
            : `Hi @${mention.author || "customer"}, thanks for your interest in ${productName}! Here is your direct 1-click checkout link with an exclusive ${discountPct}% community discount: ${rzpResponse.paymentLinkUrl}`;

          actionRecord.razorpay = rzpResponse;
          actionRecord.status = "approved";
          await actionRecord.save();

          campaign.actionsTriggered += 1;
          campaign.actionsSucceeded += 1;
          actionsExecuted.push(actionRecord);

          logger.info(MODULE_NAME, `Created payment link: ${rzpResponse.paymentLinkUrl}`, {
            amountINR: rzpResponse.amountINR,
            author: mention.author,
          });

          // Mark mention processed
          await Mention.updateOne({ _id: mention._id }, { $set: { agentStatus: "processed" } });
        } catch (rzpError) {
          logger.warn(MODULE_NAME, `Payment link creation failed gracefully: ${rzpError.message}`);

          actionRecord.status = "failed";
          actionRecord.error = {
            code: rzpError.code || "RAZORPAY_API_ERROR",
            message: rzpError.message,
            statusCode: rzpError.statusCode || 500,
            willRetry: rzpError.statusCode === 429 || rzpError.statusCode >= 500,
            retryCount: 0,
            lastRetryAt: new Date(),
            resolvedGracefully: false,
          };

          await actionRecord.save();
          campaign.actionsFailed += 1;
        }
      }

      campaign.status = "active";
      await campaign.save();

      // Trigger Measurement Loop closure
      await computeCampaignMeasurement(campaign._id).catch((err) => {
        logger.warn(MODULE_NAME, `Measurement computation note: ${err.message}`);
      });
    } catch (err) {
      logger.error(MODULE_NAME, `Error executing campaign ${campaign._id}`, err);
    }
  }

  return actionsExecuted;
}

/**
 * Idempotent Retry Worker for failed actions
 */
async function retryFailedActions() {
  const retryableActions = await AgentAction.find({
    status: "failed",
    "error.willRetry": true,
    "error.retryCount": { $lt: 3 },
    "error.lastRetryAt": { $lt: new Date(Date.now() - 30 * 1000) }, // Retry after 30s
  }).limit(5);

  for (const action of retryableActions) {
    try {
      logger.info("Agent:PaymentRetry", `Retrying failed action: ${action.idempotencyKey}`);

      const rzpResponse = await createPaymentLink({
        amountPaise: 299900,
        description: "Recovered SentiMind Payment Link",
        customerName: action.author,
        idempotencyKey: action.idempotencyKey,
      });

      action.razorpay = rzpResponse;
      action.status = "approved";
      action.error.resolvedGracefully = true;
      action.error.willRetry = false;
      await action.save();

      logger.info("Agent:PaymentRetry", `Action recovered successfully: ${action.idempotencyKey}`);
    } catch (retryErr) {
      action.error.retryCount += 1;
      action.error.lastRetryAt = new Date();
      if (action.error.retryCount >= 3) {
        action.error.willRetry = false;
        action.status = "permanently_failed";
      }
      await action.save();
      logger.warn("Agent:PaymentRetry", `Retry attempt ${action.error.retryCount} failed for ${action.idempotencyKey}`);
    }
  }
}

module.exports = {
  executeApprovedCampaigns,
  retryFailedActions,
};
