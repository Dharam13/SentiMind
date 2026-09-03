const mongoose = require("mongoose");

const MentionCredibilitySchema = new mongoose.Schema(
  {
    author: { type: String, required: true, index: true },
    platform: { type: String, required: true, index: true },
    projectId: { type: Number, required: true, index: true },

    credibilityScore: { type: Number, required: true, min: 0, max: 1 },
    reasons: [{ type: String }],

    totalMentions: { type: Number, default: 1 },
    complaintCount: { type: Number, default: 0 },
    offersReceivedCount: { type: Number, default: 0 },
    lastOfferReceivedAt: { type: Date, default: null },

    isFlaggedFarmer: { type: Boolean, default: false },
    farmingRiskReason: { type: String },

    firstSeenAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

MentionCredibilitySchema.index({ author: 1, platform: 1, projectId: 1 }, { unique: true });

const MentionCredibility =
  mongoose.models.MentionCredibility || mongoose.model("MentionCredibility", MentionCredibilitySchema);

module.exports = { MentionCredibility };
