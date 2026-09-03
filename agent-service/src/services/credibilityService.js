const { MentionCredibility } = require("../models/MentionCredibility");
const { env } = require("../config/env");

/**
 * Multi-Signal Anti-Abuse Credibility Scorer
 * Prevents discount farming, astroturfing, and coordinated malicious complaint triggers.
 */
async function assessMentionCredibility(mention) {
  const author = mention.author || "anonymous";
  const platform = mention.platform || "unknown";
  const projectId = mention.projectId || 1;

  // Retrieve or initialize author history
  let history = await MentionCredibility.findOne({ author, platform, projectId });
  if (!history) {
    history = new MentionCredibility({
      author,
      platform,
      projectId,
      credibilityScore: 0.5,
      totalMentions: 1,
      complaintCount: 0,
      offersReceivedCount: 0,
    });
  } else {
    history.totalMentions += 1;
    history.lastSeenAt = new Date();
  }

  let score = 0.55; // Base starting point
  const factors = [];

  // Signal 1: Platform actionability
  const actionablePlatforms = ["twitter", "reddit", "youtube"];
  if (!actionablePlatforms.includes(platform)) {
    factors.push(`Passive channel (${platform}): informative context only`);
    score -= 0.2;
  } else {
    factors.push(`Verified interactive channel (${platform})`);
    score += 0.1;
  }

  // Signal 2: Content quality & pattern detection
  const text = (mention.content || "").toLowerCase();
  const genericGripePatterns = [
    /worst (brand|product|service|company|store) ever/i,
    /never buying again/i,
    /total (scam|fraud|waste of money)/i,
    /give me (refund|discount|coupon|money back)/i,
    /boycott/i,
  ];

  const matchedPatterns = genericGripePatterns.filter((pat) => pat.test(text));
  if (matchedPatterns.length >= 2) {
    score -= 0.25;
    factors.push("Suspicious: multiple generic gripe/farming keywords matched");
  } else if (text.length > 80) {
    score += 0.1;
    factors.push("Detailed context provided (>80 chars)");
  }

  // Signal 3: Author historical track record & discount fatigue
  if (history.offersReceivedCount > 0) {
    const daysSinceLastOffer = history.lastOfferReceivedAt
      ? (Date.now() - new Date(history.lastOfferReceivedAt).getTime()) / (1000 * 60 * 60 * 24)
      : 0;

    if (daysSinceLastOffer < 14) {
      score -= 0.35;
      factors.push(`Abuse flag: Already received commercial offer within past 14 days`);
      history.isFlaggedFarmer = true;
      history.farmingRiskReason = "Frequent discount claim attempt";
    }
  }

  if (history.complaintCount > 3) {
    score -= 0.2;
    factors.push(`Serial complainant: ${history.complaintCount} past negative mentions`);
  }

  // Signal 4: Social metadata heuristics (followers, engagement, karma)
  const meta = mention.metadata || {};
  if (meta.likes && meta.likes > 5) {
    score += 0.1;
    factors.push(`Organic social resonance (${meta.likes} likes)`);
  }
  if (meta.views && meta.views > 500) {
    score += 0.1;
    factors.push(`High verified reach (${meta.views} views)`);
  }

  // Clamp score between 0.05 and 0.98
  score = Math.max(0.05, Math.min(0.98, score));
  score = Math.round(score * 100) / 100;

  history.credibilityScore = score;
  history.reasons = factors;
  await history.save();

  return {
    score,
    isCredible: score >= env.minCredibilityScore,
    isHighTrust: score >= 0.75,
    isFlaggedFarmer: history.isFlaggedFarmer,
    reasons: factors,
  };
}

module.exports = {
  assessMentionCredibility,
};
