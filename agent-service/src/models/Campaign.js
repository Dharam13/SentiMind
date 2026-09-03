const mongoose = require("mongoose");

const PlannedActionSchema = new mongoose.Schema(
  {
    targetSegment: {
      type: String,
      enum: ["complaint", "churn_risk", "purchase_intent", "comparison", "advocacy", "all_affected"],
      required: true,
    },
    actionType: {
      type: String,
      enum: ["payment_link", "discount_offer", "bundle_offer", "support_route"],
      required: true,
    },
    product: { type: String, required: true },
    originalAmount: { type: Number, required: true }, // in paise
    discountPercent: { type: Number, default: 0 },
    finalAmount: { type: Number, required: true }, // in paise
    estimatedCount: { type: Number, default: 1 },
    reasoning: { type: String, required: true },
  },
  { _id: true }
);

const MeasurementSchema = new mongoose.Schema(
  {
    measuredAt: { type: Date, default: Date.now },
    before: {
      positivePercent: Number,
      neutralPercent: Number,
      negativePercent: Number,
      mentionCount: Number,
    },
    after: {
      positivePercent: Number,
      neutralPercent: Number,
      negativePercent: Number,
      mentionCount: Number,
    },
    sentimentShift: {
      positiveChange: Number,
      negativeChange: Number,
    },
    revenueImpact: {
      totalLinksCreated: { type: Number, default: 0 },
      totalConverted: { type: Number, default: 0 },
      conversionRate: { type: Number, default: 0 },
      totalRevenuePaise: { type: Number, default: 0 },
      totalRevenueINR: { type: Number, default: 0 },
    },
    roiStatus: {
      type: String,
      enum: ["positive_roi", "neutral_roi", "negative_roi", "evaluating"],
      default: "evaluating",
    },
    summaryText: { type: String },
  },
  { _id: false }
);

const CampaignSchema = new mongoose.Schema(
  {
    projectId: { type: Number, required: true, index: true },
    signalId: { type: mongoose.Schema.Types.ObjectId, ref: "Signal", index: true },
    rootCauseId: { type: mongoose.Schema.Types.ObjectId, ref: "RootCause", index: true },

    campaignName: { type: String, required: true },
    campaignType: {
      type: String,
      enum: ["recovery", "growth", "retention", "celebration", "direct_checkout"],
      required: true,
      index: true,
    },
    description: { type: String, required: true },
    targetAudienceDescription: { type: String, required: true },

    plannedActions: [PlannedActionSchema],

    totalBudgetEstimate: { type: Number, default: 0 }, // in paise
    expectedRevenue: { type: Number, default: 0 }, // in paise
    expectedConversionRate: { type: Number, default: 0.1 },

    // Policy & Approval Gates
    requiresApproval: { type: Boolean, default: true },
    approvalReason: { type: String },
    status: {
      type: String,
      enum: [
        "draft",
        "pending_approval",
        "approved",
        "rejected",
        "executing",
        "active",
        "completed",
        "measured",
      ],
      default: "pending_approval",
      index: true,
    },
    approvedBy: { type: String, default: null },
    approvedAt: { type: Date, default: null },
    rejectedReason: { type: String, default: null },

    // Execution statistics
    actionsTriggered: { type: Number, default: 0 },
    actionsSucceeded: { type: Number, default: 0 },
    actionsFailed: { type: Number, default: 0 },
    actionsBlockedBySafety: { type: Number, default: 0 },

    executedAt: { type: Date, default: null },

    // Loop closure: Measurement
    measurement: { type: MeasurementSchema, default: null },
  },
  { timestamps: true }
);

const Campaign = mongoose.models.Campaign || mongoose.model("Campaign", CampaignSchema);

module.exports = { Campaign };
