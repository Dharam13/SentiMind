const mongoose = require("mongoose");

const SignalSchema = new mongoose.Schema(
  {
    projectId: { type: Number, required: true, index: true },
    keyword: { type: String, default: null },
    type: {
      type: String,
      enum: ["negative_spike", "positive_spike", "volume_spike", "churn_threat", "viral_advocacy"],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    title: { type: String, required: true },
    description: { type: String, required: true },

    // Statistics & baseline comparisons
    baseline: {
      positivePercent: { type: Number, default: 0 },
      neutralPercent: { type: Number, default: 0 },
      negativePercent: { type: Number, default: 0 },
      avgDailyVolume: { type: Number, default: 0 },
      hoursWindow: { type: Number, default: 168 },
    },
    current: {
      positivePercent: { type: Number, default: 0 },
      neutralPercent: { type: Number, default: 0 },
      negativePercent: { type: Number, default: 0 },
      mentionCount: { type: Number, default: 0 },
      hoursWindow: { type: Number, default: 6 },
    },
    deviationFactor: { type: Number, default: 1.0 },

    // Mentions participating in this anomaly
    triggeringMentionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Mention" }],
    platforms: [{ type: String }],

    // Lifecycle state
    status: {
      type: String,
      enum: ["detected", "analyzed", "campaign_planned", "dismissed"],
      default: "detected",
      index: true,
    },
    rootCauseId: { type: mongoose.Schema.Types.ObjectId, ref: "RootCause" },
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign" },

    detectedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

const Signal = mongoose.models.Signal || mongoose.model("Signal", SignalSchema);

module.exports = { Signal };
