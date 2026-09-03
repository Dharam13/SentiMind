/**
 * Campaign Orchestrator Prompts
 */

/**
 * Builds the prompt for formulating response campaigns
 * @param {Object} params
 * @param {Object} params.rc - Diagnosed root cause object
 * @param {Array} params.catalog - Merchant product catalog
 * @param {Object} params.policy - Policy constraints (max discount, budget, etc.)
 * @returns {string} Prompt string
 */
function buildCampaignPrompt({ rc, catalog, policy }) {
  const catalogText = catalog
    .map((p) => `- ${p.name} (ID: ${p.id}, Price: ₹${p.amountPaise / 100})`)
    .join("\n");

  return `You are the Lead Campaign Orchestrator for an autonomous merchant growth and retention agent.
A root-cause analysis has diagnosed the following situation:

Root Cause: "${rc.rootCause}"
Category: ${rc.category}
Urgency: ${rc.urgency}
Customer Intent Breakdown:
- Purchase Intent: ${rc.intentBreakdown?.purchase_intent || 0}
- Complaints: ${rc.intentBreakdown?.complaint || 0}
- Churn Risk: ${rc.intentBreakdown?.churn_risk || 0}
- Comparisons: ${rc.intentBreakdown?.comparison || 0}

Merchant Catalog:
${catalogText}

Policy Bounds:
- Max discount allowed: ${policy.maxDiscountPercent}%
- Max campaign budget: ₹${policy.maxCampaignBudget / 100}
- Actions above ₹${policy.requireApprovalAboveAmount / 100} require human approval.

Design a targeted campaign to recover churn-risk customers and convert active purchase intent.
Respond ONLY in JSON format:
{
  "campaign_name": "Catchy name for this campaign",
  "campaign_type": "recovery|growth|retention|celebration|direct_checkout",
  "description": "2-sentence strategic rationale",
  "target_audience_description": "Who will be reached and why",
  "planned_actions": [
    {
      "target_segment": "complaint|churn_risk|purchase_intent|comparison|advocacy",
      "action_type": "discount_offer|payment_link|bundle_offer|support_route",
      "product": "Product name from catalog",
      "original_amount": 299900,
      "discount_percent": 15,
      "final_amount": 254915,
      "estimated_count": 3,
      "reasoning": "Why this specific commercial action was chosen"
    }
  ],
  "total_budget_estimate": 1000000,
  "expected_revenue": 1500000,
  "expected_conversion_rate": 0.18,
  "requires_approval": true,
  "approval_reason": "High-value commercial action requiring policy review"
}`;
}

module.exports = {
  buildCampaignPrompt,
};
