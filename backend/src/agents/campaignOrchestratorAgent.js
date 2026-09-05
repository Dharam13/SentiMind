const { RootCause } = require("../models/RootCause");
const { Signal } = require("../models/Signal");
const { Campaign } = require("../models/Campaign");
const { Mention } = require("../models/Mention");
const { getBrandCatalog } = require("../services/razorpayService");
const { generateJsonAnalysis } = require("../services/geminiService");
const { buildCampaignPrompt } = require("../constants/prompts");
const { logger } = require("../utils/logger");
const { env } = require("../config/env");
const { langsmith } = require("../services/langsmithService");

const MODULE_NAME = "Agent:Campaign";

/**
 * Agent 3: Campaign Orchestrator Agent
 * Converts root-cause diagnoses into structured, bounded marketing & commerce campaigns.
 */
async function processAnalyzedRootCauses(targetProjectId = null, parentRunId = null) {
  return await langsmith.withSpan(
    {
      name: "Agent3_CampaignOrchestrator",
      runType: "chain",
      inputs: { targetProjectId },
      parentRunId,
      metadata: { agent: "campaignOrchestratorAgent", version: "2.0" },
      tags: ["agent3", "campaign-orchestrator"],
    },
    async (spanId) => {
      const query = { status: "analyzed" };
      if (targetProjectId) {
        query.projectId = targetProjectId;
      }
      const pendingRootCauses = await RootCause.find(query).limit(5);

      const campaignsCreated = [];

  for (const rc of pendingRootCauses) {
    try {
      const signal = await Signal.findById(rc.signalId);

      // Determine real brand keyword for this project
      const sampleMention = await Mention.findOne({ projectId: rc.projectId }).select({ keyword: 1 }).lean();
      const brandKeyword = sampleMention?.keyword || (rc.projectId === 10 ? "Amul" : "Brand");
      const brandCatalog = getBrandCatalog(brandKeyword);

      logger.info(MODULE_NAME, `Planning campaign for ${brandKeyword} - root cause: "${rc.rootCause}"`, {
        rootCauseId: rc._id,
        brand: brandKeyword,
        category: rc.category,
        urgency: rc.urgency,
      });

      const isRecovery = signal?.type === "negative_spike" || rc.category === "product_quality";

      const prompt = buildCampaignPrompt({ rc, catalog: brandCatalog, policy: env });

      const fallbackGenerator = () => {
        const defaultProduct = brandCatalog[0];
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
            estimatedCount: Math.max(1, rc.intentBreakdown?.complaint || 2),
            reasoning: `Offer 15% loyalty resolution voucher to resolve ${brandKeyword} customer friction and prevent churn`,
          });
        }

        if ((rc.intentBreakdown?.purchase_intent || 0) > 0 || !isRecovery) {
          const growthProduct = brandCatalog[1] || defaultProduct;
          plannedActions.push({
            targetSegment: "purchase_intent",
            actionType: "payment_link",
            product: growthProduct.name,
            originalAmount: growthProduct.amountPaise,
            discountPercent: 0,
            finalAmount: growthProduct.amountPaise,
            estimatedCount: Math.max(1, rc.intentBreakdown?.purchase_intent || 1),
            reasoning: `Instant 1-click Razorpay checkout link for hot ${brandKeyword} buyer leads`,
          });
        }

        const totalEst = plannedActions.reduce((sum, a) => sum + a.finalAmount * a.estimatedCount, 0);

        return {
          campaign_name: isRecovery
            ? `${brandKeyword} Customer Care & Quality Recovery`
            : `${brandKeyword} Viral Growth & Conversational Checkout`,
          campaign_type: isRecovery ? "recovery" : "growth",
          description: isRecovery
            ? `Automated outreach providing resolution vouchers to vocal users discussing ${brandKeyword} to restore satisfaction.`
            : `Capitalize on positive organic brand sentiment by offering immediate 1-click checkout links for ${brandKeyword}.`,
          target_audience_description: `Targeting verified social authors discussing ${brandKeyword} with high engagement`,
          planned_actions: plannedActions,
          total_budget_estimate: totalEst,
          expected_revenue: Math.round(totalEst * 1.5),
          expected_conversion_rate: isRecovery ? 0.22 : 0.12,
          requires_approval: isRecovery,
          approval_reason: isRecovery
            ? "Discounted recovery payouts require merchant authorization"
            : "Direct merchant campaign activation",
        };
      };

      const plan = await generateJsonAnalysis(prompt, fallbackGenerator, {
        parentRunId: spanId,
        runName: "Gemini_Campaign_Inference",
        metadata: {
          rootCauseId: String(rc._id),
          brand: brandKeyword,
          category: rc.category,
          urgency: rc.urgency,
        },
      });

      const campaign = await Campaign.create({
        projectId: rc.projectId,
        signalId: rc.signalId,
        rootCauseId: rc._id,
        campaignName: plan.campaign_name || (isRecovery ? `${brandKeyword} Customer Care Recovery` : `${brandKeyword} Viral Growth Surge`),
        campaignType: plan.campaign_type || (isRecovery ? "recovery" : "growth"),
        description: plan.description || `Orchestrated response for ${brandKeyword}`,
        targetAudienceDescription: plan.target_audience_description || `Verified ${brandKeyword} social authors`,
        plannedActions: (plan.planned_actions || []).map((a) => ({
          targetSegment: a.target_segment || "complaint",
          actionType: a.action_type || "payment_link",
          product: a.product || brandCatalog[0].name,
          originalAmount: a.original_amount || brandCatalog[0].amountPaise,
          discountPercent: Math.min(env.maxDiscountPercent, a.discount_percent || 0),
          finalAmount: a.final_amount || brandCatalog[0].amountPaise,
          estimatedCount: a.estimated_count || 1,
          reasoning: a.reasoning || `Agentic commercial trigger for ${brandKeyword}`,
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

      logger.info(MODULE_NAME, `Campaign created: "${campaign.campaignName}"`, {
        campaignId: campaign._id,
        status: campaign.status,
        actionsCount: campaign.plannedActions?.length || 0,
      });
      campaignsCreated.push(campaign);
    } catch (err) {
      logger.error(MODULE_NAME, `Failed to plan campaign for root cause ${rc._id}`, err);
    }
  }

      return campaignsCreated;
    }
  );
}

module.exports = {
  processAnalyzedRootCauses,
};
