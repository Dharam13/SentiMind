const mongoose = require("mongoose");

const RootCauseSchema = new mongoose.Schema(
  {
    signalId: { type: mongoose.Schema.Types.ObjectId, ref: "Signal", required: true, index: true },
    projectId: { type: Number, required: true, index: true },

    rootCause: { type: String, required: true },
    category: {
      type: String,
      enum: [
        "product_quality",
        "customer_service",
        "pricing_value",
        "delivery_shipping",
        "checkout_payment",
        "feature_request",
        "brand_advocacy",
        "competitor_comparison",
        "other",
      ],
      default: "other",
    },
    specificIssue: { type: String, required: true },
    affectedProduct: { type: String, default: "General Brand / Store" },
    urgency: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    customerSentimentSummary: { type: String, required: true },

    // Intent breakdowns discovered in batch
    intentBreakdown: {
      purchase_intent: { type: Number, default: 0 },
      complaint: { type: Number, default: 0 },
      comparison: { type: Number, default: 0 },
      advocacy: { type: Number, default: 0 },
      churn_risk: { type: Number, default: 0 },
      irrelevant: { type: Number, default: 0 },
    },

    // Suspicious mentions identified during root cause
    suspiciousMentions: [
      {
        mentionId: { type: mongoose.Schema.Types.ObjectId, ref: "Mention" },
        author: { type: String },
        reason: { type: String },
      },
    ],

    suggestedResponseType: {
      type: String,
      enum: [
        "discount_recovery_campaign",
        "direct_checkout_campaign",
        "bundle_cross_sell_campaign",
        "apology_clarification",
        "advocacy_reward",
        "no_monetary_action",
      ],
      default: "no_monetary_action",
    },
    confidence: { type: Number, default: 0.8 },
    rawAiResponse: { type: mongoose.Schema.Types.Mixed },

    status: {
      type: String,
      enum: ["analyzed", "campaign_created", "closed"],
      default: "analyzed",
      index: true,
    },
  },
  { timestamps: true }
);

const RootCause = mongoose.models.RootCause || mongoose.model("RootCause", RootCauseSchema);

module.exports = { RootCause };
