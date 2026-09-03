const mongoose = require("mongoose");

const AgentActionSchema = new mongoose.Schema(
  {
    // Idempotency key prevents duplicate transactions on server retries/restarts
    idempotencyKey: { type: String, required: true, unique: true, index: true },

    projectId: { type: Number, required: true, index: true },
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign", index: true },
    mentionId: { type: mongoose.Schema.Types.ObjectId, ref: "Mention", required: true, index: true },

    platform: { type: String, required: true },
    author: { type: String, default: "anonymous" },
    mentionContent: { type: String },
    sourceUrl: { type: String },

    // Intent & Sentiment context
    sentimentLabel: { type: String },
    sentimentConfidence: { type: Number },
    intentClassification: { type: String },
    intentConfidence: { type: Number },
    intentReasoning: { type: String },

    // Action specifics
    actionType: {
      type: String,
      enum: [
        "create_payment_link",
        "create_discount_offer",
        "create_bundle_order",
        "route_to_support",
        "no_action",
        "blocked_by_safety",
      ],
      required: true,
    },
    actionReason: { type: String },
    outreachMessage: { type: String },

    // Anti-Abuse & Safety Guardrails
    credibilityScore: { type: Number, default: 0.5 },
    credibilityFactors: [{ type: String }],
    safetyChecks: {
      isActionablePlatform: { type: Boolean, default: true },
      isDuplicateUser: { type: Boolean, default: false },
      withinDailyBudget: { type: Boolean, default: true },
      withinDiscountCap: { type: Boolean, default: true },
      passedCredibilityGate: { type: Boolean, default: true },
      requiresHumanApproval: { type: Boolean, default: false },
    },

    // Razorpay Integration Data
    razorpay: {
      isSimulated: { type: Boolean, default: false },
      paymentLinkId: { type: String, index: true },
      paymentLinkUrl: { type: String },
      orderId: { type: String, index: true },
      amountPaise: { type: Number },
      amountINR: { type: Number },
      currency: { type: String, default: "INR" },
      notes: { type: mongoose.Schema.Types.Mixed },
    },

    // Execution & Conversion State
    status: {
      type: String,
      enum: [
        "executing",
        "pending_approval",
        "approved",
        "sent",
        "converted",
        "expired",
        "rejected",
        "failed",
        "permanently_failed",
        "blocked",
      ],
      default: "executing",
      index: true,
    },
    revenueGeneratedPaise: { type: Number, default: 0 },
    convertedAt: { type: Date, default: null },

    // Graceful Failure & Idempotent Retry Tracking
    error: {
      code: { type: String },
      message: { type: String },
      statusCode: { type: Number },
      willRetry: { type: Boolean, default: false },
      retryCount: { type: Number, default: 0 },
      lastRetryAt: { type: Date },
      resolvedGracefully: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

const AgentAction = mongoose.models.AgentAction || mongoose.model("AgentAction", AgentActionSchema);

module.exports = { AgentAction };
