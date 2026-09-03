const mongoose = require("mongoose");

const MentionSchema = new mongoose.Schema(
  {
    projectId: { type: Number, required: true, index: true },
    keyword: { type: String, required: true, index: true },
    platform: {
      type: String,
      required: true,
      index: true,
      enum: ["reddit", "twitter", "youtube", "medium", "linkedin", "web", "news"],
    },
    content: { type: String },
    author: { type: String },
    sourceUrl: { type: String },
    publishedAt: { type: Date, required: true, index: true },
    collectedAt: { type: Date, required: true, default: () => new Date(), index: true },
    timeWindowUsed: { type: Number, required: true },
    sourceType: { type: String, enum: ["api", "rss"] },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    rawJson: { type: mongoose.Schema.Types.Mixed, required: true },
    sentimentStatus: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
      index: true,
    },
    sentiment: {
      vader_score: { type: Number },
      distilbert_score: { type: Number },
      final_score: { type: Number },
      label: { type: String },
      confidence: { type: Number },
      processed_text: { type: String },
      analyzedAt: { type: Date },
    },
    agentStatus: {
      type: String,
      enum: ["unprocessed", "processed", "skipped"],
      default: "unprocessed",
      index: true,
    },
  },
  { timestamps: false }
);

const Mention = mongoose.models.Mention || mongoose.model("Mention", MentionSchema);

module.exports = { Mention };
