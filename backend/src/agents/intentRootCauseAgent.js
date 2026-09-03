const { Signal } = require("../models/Signal");
const { RootCause } = require("../models/RootCause");
const { Mention } = require("../models/Mention");
const { generateJsonAnalysis } = require("../services/geminiService");
const { buildRootCausePrompt } = require("../constants/prompts");
const { logger } = require("../utils/logger");

const MODULE_NAME = "Agent:RootCause";

/**
 * Agent 2: Intent & Root-Cause Agent
 * Evaluates anomalous sentiment signals to extract the underlying cause,
 * intent breakdown, affected product, and response recommendations.
 */
async function processPendingSignals() {
  const pendingSignals = await Signal.find({ status: "detected" }).limit(5);

  const rootCausesCreated = [];

  for (const signal of pendingSignals) {
    try {
      const mentions = await Mention.find({
        _id: { $in: signal.triggeringMentionIds },
      })
        .limit(15)
        .lean();

      if (!mentions.length) {
        signal.status = "dismissed";
        await signal.save();
        logger.info(MODULE_NAME, `Signal ${signal._id} dismissed (no triggering mentions found)`);
        continue;
      }

      logger.info(MODULE_NAME, `Diagnosing signal: ${signal.title}`, {
        signalId: signal._id,
        severity: signal.severity,
        mentionCount: mentions.length,
      });

      const mentionsText = mentions
        .map(
          (m, idx) =>
            `${idx + 1}. [${m.platform.toUpperCase()}] @${m.author || "user"}: "${(m.content || "").replace(/\n/g, " ")}" (Sentiment: ${m.sentiment?.label || "unknown"})`
        )
        .join("\n");

      const prompt = buildRootCausePrompt({ signal, mentionsText });

      // Fallback generator for heuristic diagnosis if offline/unconfigured
      const fallbackGenerator = () => {
        const brandKeyword = mentions.find((m) => m.keyword)?.keyword || (signal.projectId === 10 ? "Amul" : "Brand");
        const isNegative = signal.type === "negative_spike";
        const complaintCount = mentions.filter((m) => m.sentiment?.label === "negative").length;
        const purchaseCount = mentions.filter((m) => /buy|price|cost|where to get|link|order/i.test(m.content || "")).length;

        return {
          root_cause: isNegative
            ? `Customer friction and service consistency reports for ${brandKeyword}`
            : `High customer satisfaction and spontaneous brand advocacy for ${brandKeyword}`,
          category: isNegative ? "product_quality" : "brand_advocacy",
          specific_issue: isNegative ? "customer_friction_and_service" : "brand_satisfaction_and_praise",
          affected_product: `${brandKeyword} Products`,
          urgency: signal.severity,
          customer_sentiment_summary: isNegative
            ? `Users discussed friction with ${brandKeyword} order processing or service responsiveness.`
            : `Customers are praising ${brandKeyword} and seeking purchase and checkout links.`,
          intent_breakdown: {
            purchase_intent: purchaseCount,
            complaint: isNegative ? Math.max(1, complaintCount) : 0,
            comparison: 1,
            advocacy: !isNegative ? mentions.length : 0,
            churn_risk: isNegative ? 2 : 0,
            irrelevant: 0,
          },
          suggested_response_type: isNegative
            ? "discount_recovery_campaign"
            : "direct_checkout_campaign",
          confidence: 0.85,
        };
      };

      const diagnosis = await generateJsonAnalysis(prompt, fallbackGenerator);
      const brandKeyword = mentions.find((m) => m.keyword)?.keyword || (signal.projectId === 10 ? "Amul" : "Brand");

      const rootCause = await RootCause.create({
        signalId: signal._id,
        projectId: signal.projectId,
        rootCause: diagnosis.root_cause || diagnosis.rootCause || `Customer feedback regarding ${brandKeyword}`,
        category: diagnosis.category || "other",
        specificIssue: diagnosis.specific_issue || diagnosis.specificIssue || "general_inquiry",
        affectedProduct: diagnosis.affected_product || diagnosis.affectedProduct || `${brandKeyword} Products`,
        urgency: diagnosis.urgency || signal.severity,
        customerSentimentSummary:
          diagnosis.customerSentimentSummary ||
          diagnosis.customer_sentiment_summary ||
          `Analyzed social mentions for ${brandKeyword}`,
        intentBreakdown: diagnosis.intent_breakdown || diagnosis.intentBreakdown || { complaint: 1 },
        suggestedResponseType: diagnosis.suggested_response_type || diagnosis.suggestedResponseType || "no_monetary_action",
        confidence: diagnosis.confidence || 0.8,
        rawAiResponse: diagnosis,
        status: "analyzed",
      });

      signal.status = "analyzed";
      signal.rootCauseId = rootCause._id;
      await signal.save();

      logger.info(MODULE_NAME, `Diagnosed root cause: "${rootCause.rootCause}"`, {
        category: rootCause.category,
        urgency: rootCause.urgency,
        affectedProduct: rootCause.affectedProduct,
      });
      rootCausesCreated.push(rootCause);
    } catch (err) {
      logger.error(MODULE_NAME, `Failed to diagnose signal ${signal._id}`, err);
    }
  }

  return rootCausesCreated;
}

module.exports = {
  processPendingSignals,
};
