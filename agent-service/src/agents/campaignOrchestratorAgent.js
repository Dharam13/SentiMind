const { RootCause } = require("../models/RootCause");
const { Signal } = require("../models/Signal");
const { Campaign } = require("../models/Campaign");
const { MERCHANT_CATALOG } = require("../services/razorpayService");
const { generateJsonAnalysis } = require("../services/geminiService");
const { env } = require("../config/env");

/**
 * Agent 3: Campaign Orchestrator Agent
 * Converts root-cause diagnoses into structured, bounded marketing & commerce campaigns.
 */
async function processAnalyzedRootCauses() {
  const pendingRootCauses = await RootCause.find({ status: "analyzed" }).limit(5);

  const campaignsCreated = [];

  for (const rc of pendingRootCauses) {
    try {
      const signal = await Signal.findById(rc.signalId);

      console.log(`🎯 [Agent 3: Campaign Orchestrator] Planning campaign for Root Cause: "${rc.rootCause}"`);

      const isRecovery = signal?.type === "negative_spike" || rc.category === "product_quality";

      const prompt = `You are the Lead Campaign Orchestrator for an autonomous merchant growth and retention agent.
A root-cause analysis has diagnosed the following situation:

Root Cause: "${rc.rootCause}"
Category: ${rc.category}
Urgency: ${rc.urgency}
Customer Intent Breakdown:
- Purchase Intent: ${rc.intentBreakdown.purchase_intent}
- Complaints: ${rc.intentBreakdown.complaint}
- Churn Risk: ${rc.intentBreakdown.churn_risk}
- Comparisons: ${rc.intentBreakdown.comparison}

Merchant Catalog:
${MERCHANT_CATALOG.map((p) => `- ${p.name} (ID: ${p.id}, Price: ₹${p.amountPaise / 100})`).join("\n")}

Policy Bounds:
- Max discount allowed: ${env.maxDiscountPercent}%
- Max campaign budget: ₹${env.maxCampaignBudget / 100}
- Actions above ₹${env.requireApprovalAboveAmount / 100} require human approval.

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

      const fallbackGenerator = () => {
        const defaultProduct = MERCHANT_CATALOG[0];
        const discount = isRecovery ? 15 : 0;
        const finalPrice = Math.round(defaultProduct.amountPaise * (1 - discount / 100));

        const plannedActions = [];

        if (isRecovery) {
          plannedActions.push({
            targetSegment: "complaint",
            actionType: "discount_offer",
            product: defaultProduct.name,
            originalAmount: defaultProduct.amountPaise,
            discountPercent: 15,
            finalAmount: finalPrice,
            estimatedCount: Math.max(1, rc.intentBreakdown.complaint || 2),
            reasoning: "Offer 15% loyalty coupon link to turn friction into retention",
          });
        }

        if (rc.intentBreakdown.purchase_intent > 0 || !isRecovery) {
          plannedActions.push({
            targetSegment: "purchase_intent",
            actionType: "payment_link",
            product: defaultProduct.name,
            originalAmount: defaultProduct.amountPaise,
            discountPercent: 0,
            finalAmount: defaultProduct.amountPaise,
            estimatedCount: Math.max(1, rc.intentBreakdown.purchase_intent || 1),
            reasoning: "Instant Razorpay 1-click checkout payment link for hot buyer leads",
          });
        }

        const totalEst = plannedActions.reduce((sum, a) => sum + a.finalAmount * a.estimatedCount, 0);

        return {
          campaign_name: isRecovery
            ? `Rapid Brand Recovery & Retention Initiative`
            : `Viral Growth & Conversational Checkout Campaign`,
          campaign_type: isRecovery ? "recovery" : "growth",
          description: isRecovery
            ? `Autonomous remediation offering bounded 15% recovery payment links to verified customers affected by "${rc.specificIssue}".`
            : `Capitalize on positive brand advocacy by issuing frictionless Razorpay payment links.`,
          target_audience_description: `Targeting verified social authors expressing ${isRecovery ? "service friction or churn signals" : "direct purchase intent"}.`,
          planned_actions: plannedActions,
          total_budget_estimate: totalEst,
          expected_revenue: Math.round(totalEst * 0.8),
          expected_conversion_rate: 0.22,
          requires_approval: totalEst >= env.requireApprovalAboveAmount || isRecovery,
          approval_reason: isRecovery
            ? "Discounted recovery payouts require merchant authorization"
            : "Direct merchant campaign activation",
        };
      };

      const plan = await generateJsonAnalysis(prompt, fallbackGenerator);

      const campaign = await Campaign.create({
        projectId: rc.projectId,
        signalId: rc.signalId,
        rootCauseId: rc._id,
        campaignName: plan.campaign_name || "Autonomous Merchant Campaign",
        campaignType: plan.campaign_type || (isRecovery ? "recovery" : "growth"),
        description: plan.description || "Orchestrated by SentiMind Agent 3",
        targetAudienceDescription: plan.target_audience_description || "Social media brand mentions",
        plannedActions: (plan.planned_actions || []).map((a) => ({
          targetSegment: a.target_segment || "complaint",
          actionType: a.action_type || "payment_link",
          product: a.product || MERCHANT_CATALOG[0].name,
          originalAmount: a.original_amount || MERCHANT_CATALOG[0].amountPaise,
          discountPercent: Math.min(env.maxDiscountPercent, a.discount_percent || 0),
          finalAmount: a.final_amount || MERCHANT_CATALOG[0].amountPaise,
          estimatedCount: a.estimated_count || 1,
          reasoning: a.reasoning || "Agentic commercial trigger",
        })),
        totalBudgetEstimate: plan.total_budget_estimate || 500000,
        expectedRevenue: plan.expected_revenue || 800000,
        expectedConversionRate: plan.expected_conversion_rate || 0.15,
        requiresApproval: plan.requires_approval !== false,
        approvalReason: plan.approval_reason || "Policy threshold review",
        status: plan.requires_approval === false ? "approved" : "pending_approval",
      });

      rc.status = "campaign_created";
      await rc.save();

      if (signal) {
        signal.status = "campaign_planned";
        signal.campaignId = campaign._id;
        await signal.save();
      }

      console.log(`🚀 [Agent 3] Campaign Created: "${campaign.campaignName}" (Status: ${campaign.status})`);
      campaignsCreated.push(campaign);
    } catch (err) {
      console.error(`[Agent 3 Error] RootCause ${rc._id}:`, err.message);
    }
  }

  return campaignsCreated;
}

module.exports = {
  processAnalyzedRootCauses,
};
