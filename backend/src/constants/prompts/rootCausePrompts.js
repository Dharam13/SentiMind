/**
 * Root-Cause Diagnosis Prompts
 */

/**
 * Builds the prompt for diagnosing signals and identifying root causes
 * @param {Object} params
 * @param {Object} params.signal - Anomaly signal object
 * @param {string} params.mentionsText - Formatted string of sample mentions
 * @returns {string} Prompt string
 */
function buildRootCausePrompt({ signal, mentionsText }) {
  return `You are the Lead Root-Cause Diagnosis Agent for an e-commerce & merchant operations platform.
Analyze this batch of social mentions that triggered a "${signal.type}" anomaly (${signal.severity} severity).

Mentions in anomaly window:
${mentionsText}

Current Sentiment Window:
- Positive: ${signal.current?.positivePercent || 0}%
- Neutral: ${signal.current?.neutralPercent || 0}%
- Negative: ${signal.current?.negativePercent || 0}%

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
}

module.exports = {
  buildRootCausePrompt,
};
