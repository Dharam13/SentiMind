const { Signal } = require("../models/Signal");
const { RootCause } = require("../models/RootCause");
const { Mention } = require("../models/Mention");
const { generateJsonAnalysis } = require("../services/geminiService");

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
        continue;
      }

      console.log(`🔍 [Agent 2: Root-Cause Agent] Diagnosing Signal: ${signal.title} (${mentions.length} mentions)`);

      const mentionsText = mentions
        .map(
          (m, idx) =>
            `${idx + 1}. [${m.platform.toUpperCase()}] @${m.author || "user"}: "${(m.content || "").replace(/\n/g, " ")}" (Sentiment: ${m.sentiment?.label || "unknown"})`
        )
        .join("\n");

      const prompt = `You are the Lead Root-Cause Diagnosis Agent for an e-commerce & merchant operations platform.
Analyze this batch of social mentions that triggered a "${signal.type}" anomaly (${signal.severity} severity).

Mentions in anomaly window:
${mentionsText}

Current Sentiment Window:
- Positive: ${signal.current.positivePercent}%
- Neutral: ${signal.current.neutralPercent}%
- Negative: ${signal.current.negativePercent}%

Tasks:
1. Identify the primary root cause and specific pain point/praise.
2. Group the mentions by customer intent (purchase_intent, complaint, comparison, advocacy, churn_risk).
3. Identify affected product category/name.
4. Suggest the appropriate revenue/recovery response type.

Respond ONLY with valid JSON matching this schema:
{
  "root_cause": "Concise summary of the core underlying issue or praise",
  "category": "product_quality|customer_service|pricing_value|delivery_shipping|checkout_payment|feature_request|brand_advocacy|competitor_comparison|other",
  "specific_issue": "Specific failure or talking point (e.g., 'earbud battery draining quickly', 'checkout error')",
  "affected_product": "Name or category of product",
  "urgency": "low|medium|high|critical",
  "customer_sentiment_summary": "1-2 sentence breakdown of what customers are experiencing",
  "intent_breakdown": {
    "purchase_intent": 0,
    "complaint": 0,
    "comparison": 0,
    "advocacy": 0,
    "churn_risk": 0,
    "irrelevant": 0
  },
  "suggested_response_type": "discount_recovery_campaign|direct_checkout_campaign|bundle_cross_sell_campaign|apology_clarification|advocacy_reward|no_monetary_action",
  "confidence": 0.9
}`;

      // Fallback generator for heuristic diagnosis if offline/unconfigured
      const fallbackGenerator = () => {
        const isNegative = signal.type === "negative_spike";
        const complaintCount = mentions.filter((m) => m.sentiment?.label === "negative").length;
        const purchaseCount = mentions.filter((m) => /buy|price|cost|where to get|link/i.test(m.content || "")).length;

        return {
          root_cause: isNegative
            ? "Customer friction regarding product performance and battery longevity"
            : "High customer satisfaction and spontaneous product recommendation",
          category: isNegative ? "product_quality" : "brand_advocacy",
          specific_issue: isNegative ? "battery_drain_and_audio_latency" : "high_sound_quality_satisfaction",
          affected_product: "SentiPulse Wireless Headphones Pro",
          urgency: signal.severity,
          customer_sentiment_summary: isNegative
            ? "Users reported unexpected battery degradation and requested warranty assistance."
            : "Customers are praising acoustic fidelity and asking for checkout links.",
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

      const rootCause = await RootCause.create({
        signalId: signal._id,
        projectId: signal.projectId,
        rootCause: diagnosis.root_cause || "Unspecified trend",
        category: diagnosis.category || "other",
        specificIssue: diagnosis.specific_issue || "general_inquiry",
        affectedProduct: diagnosis.affected_product || "Store Products",
        urgency: diagnosis.urgency || signal.severity,
        customer_sentiment_summary: diagnosis.customer_sentiment_summary || "Analyzed batch of customer mentions",
        intentBreakdown: diagnosis.intent_breakdown || { complaint: 1 },
        suggestedResponseType: diagnosis.suggested_response_type || "no_monetary_action",
        confidence: diagnosis.confidence || 0.8,
        rawAiResponse: diagnosis,
        status: "analyzed",
      });

      signal.status = "analyzed";
      signal.rootCauseId = rootCause._id;
      await signal.save();

      console.log(`💡 [Agent 2] Diagnosed Root Cause: "${rootCause.rootCause}" (${rootCause.category})`);
      rootCausesCreated.push(rootCause);
    } catch (err) {
      console.error(`[Agent 2 Error] Signal ${signal._id}:`, err.message);
    }
  }

  return rootCausesCreated;
}

module.exports = {
  processPendingSignals,
};
