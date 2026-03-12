const mongoose = require("mongoose");

const MentionSchema = new mongoose.Schema(
  {
    projectId: {
      type: Number,
      required: true,
      index: true,
    },
    keyword: {
      type: String,
      required: true,
      index: true,
    },
    platform: {
      type: String,
      required: true,
      index: true,
      enum: [
        "reddit",
        "twitter",
        "youtube",
        "medium",
        "linkedin",
        "web",
        "news",
      ],
    },
    content: {
      type: String,
    },
    author: {
      type: String,
    },
    sourceUrl: {
      type: String,
    },
    publishedAt: {
      type: Date,
      required: true,
      index: true,
    },
    collectedAt: {
      type: Date,
      required: true,
      default: () => new Date(),
      index: true,
    },
    timeWindowUsed: {
      type: Number,
      required: true,
    },
    // When set to "rss", this mention was collected via RSS feed (e.g. Medium); otherwise API
    sourceType: {
      type: String,
      enum: ["api", "rss"],
    },
    // Dynamic, platform-specific engagement metadata (views, likes, etc.)
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Full raw JSON response for this mention for later processing/debugging
    rawJson: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    // Sentiment pipeline: "pending" until Collector sends text to Sentiment Service and gets result
    sentimentStatus: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
      index: true,
    },
    // Populated after sentiment analysis (when sentimentStatus === "completed")
    sentiment: {
      vader_score: { type: Number },
      distilbert_score: { type: Number },
      final_score: { type: Number },
      label: { type: String },
      confidence: { type: Number },
      processed_text: { type: String },
      analyzedAt: { type: Date },
    },
  },
  {
    timestamps: false,
  }
);

const Mention = mongoose.model("Mention", MentionSchema);

module.exports = { Mention };

