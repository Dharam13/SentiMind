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
        "tumblr",
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
  },
  {
    timestamps: false,
  }
);

const Mention = mongoose.model("Mention", MentionSchema);

module.exports = { Mention };

