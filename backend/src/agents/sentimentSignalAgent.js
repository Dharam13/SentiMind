const { Mention } = require("../models/Mention");
const { Signal } = require("../models/Signal");
const { logger } = require("../utils/logger");
const { env } = require("../config/env");

/**
 * Agent 1: Sentiment & Signal Agent
 * Detects sentiment anomalies, abnormal negative/positive spikes, and viral momentum.
 */
async function runSentimentSignalCheck(targetProjectId) {
  const query = targetProjectId ? { projectId: targetProjectId } : {};
  const projectIds = targetProjectId ? [targetProjectId] : await Mention.distinct("projectId", query);

  const signalsGenerated = [];

  for (const pid of projectIds) {
    try {
      // 1. Fetch 7-day baseline
      const baselineStart = new Date(Date.now() - env.baselineHours * 60 * 60 * 1000);
      const recentWindowStart = new Date(Date.now() - env.windowHours * 60 * 60 * 1000);

      const allBaselineMentions = await Mention.find({
        projectId: pid,
        publishedAt: { $gte: baselineStart },
        sentimentStatus: "completed",
      }).lean();

      if (allBaselineMentions.length < env.spikeMinMentions) {
        continue;
      }

      // Compute 7-day baseline ratios
      const baseTotal = allBaselineMentions.length;
      const basePos = allBaselineMentions.filter((m) => m.sentiment?.label === "positive").length;
      const baseNeu = allBaselineMentions.filter((m) => m.sentiment?.label === "neutral").length;
      const baseNeg = allBaselineMentions.filter((m) => m.sentiment?.label === "negative").length;

      const baseline = {
        positivePercent: Math.round((basePos / baseTotal) * 100),
        neutralPercent: Math.round((baseNeu / baseTotal) * 100),
        negativePercent: Math.round((baseNeg / baseTotal) * 100),
        avgDailyVolume: Math.round(baseTotal / 7),
        hoursWindow: env.baselineHours,
      };

      // 2. Fetch Recent Window
      const recentMentions = allBaselineMentions.filter(
        (m) => new Date(m.publishedAt).getTime() >= recentWindowStart.getTime()
      );

      if (recentMentions.length < env.spikeMinMentions) {
        continue;
      }

      const recentTotal = recentMentions.length;
      const recentPos = recentMentions.filter((m) => m.sentiment?.label === "positive").length;
      const recentNeu = recentMentions.filter((m) => m.sentiment?.label === "neutral").length;
      const recentNeg = recentMentions.filter((m) => m.sentiment?.label === "negative").length;

      const current = {
        positivePercent: Math.round((recentPos / recentTotal) * 100),
        neutralPercent: Math.round((recentNeu / recentTotal) * 100),
        negativePercent: Math.round((recentNeg / recentTotal) * 100),
        mentionCount: recentTotal,
        hoursWindow: env.windowHours,
      };

      // 3. Spike Detection Logic
      let detectedSpikeType = null;
      let severity = "medium";
      let deviationFactor = 1.0;
      let title = "";
      let description = "";

      // Condition A: Negative sentiment spike
      const baseNegRatio = Math.max(10, baseline.negativePercent);
      const negDeviation = current.negativePercent / baseNegRatio;

      if (current.negativePercent >= 35 && negDeviation >= env.spikeDeviationThreshold) {
        detectedSpikeType = "negative_spike";
        deviationFactor = Math.round(negDeviation * 10) / 10;
        severity = current.negativePercent > 60 ? "critical" : "high";
        title = `Abnormal Negative Sentiment Spike (${current.negativePercent}%, ${deviationFactor}x Baseline)`;
        description = `Customer friction surged to ${current.negativePercent}% negative in the last ${env.windowHours}h (historical baseline is ${baseline.negativePercent}%). Immediate intervention advised.`;
      }
      // Condition B: Positive viral surge
      else if (
        current.positivePercent >= 65 &&
        current.positivePercent / Math.max(10, baseline.positivePercent) >= env.spikeDeviationThreshold
      ) {
        detectedSpikeType = "positive_spike";
        deviationFactor = Math.round((current.positivePercent / Math.max(10, baseline.positivePercent)) * 10) / 10;
        severity = "high";
        title = `Viral Brand Advocacy Surge (${current.positivePercent}% Positive)`;
        description = `Strong positive buying momentum detected across social channels. Prime opportunity for growth and upsell payment links.`;
      }
      // Condition C: Volume surge
      else if (recentTotal > baseline.avgDailyVolume * 1.8 && recentTotal >= 8) {
        detectedSpikeType = "volume_spike";
        deviationFactor = Math.round((recentTotal / Math.max(1, baseline.avgDailyVolume)) * 10) / 10;
        severity = "medium";
        title = `Unusual Mention Volume Surge (${recentTotal} mentions in ${env.windowHours}h)`;
        description = `Brand conversation volume increased by ${deviationFactor}x normal rate.`;
      }

      // Check if we already have an active/recent signal for this project in last 2 hours
      if (detectedSpikeType) {
        const recentSignal = await Signal.findOne({
          projectId: pid,
          type: detectedSpikeType,
          detectedAt: { $gte: new Date(Date.now() - 2 * 60 * 60 * 1000) },
        });

        if (!recentSignal) {
          const platforms = [...new Set(recentMentions.map((m) => m.platform))];
          const triggeringMentionIds = recentMentions.map((m) => m._id);

          const signal = await Signal.create({
            projectId: pid,
            type: detectedSpikeType,
            severity,
            title,
            description,
            baseline,
            current,
            deviationFactor,
            triggeringMentionIds,
            platforms,
            status: "detected",
          });

          logger.info("Agent:Signal", `Discovered ${detectedSpikeType} for Project ${pid}: ${title}`, {
            projectId: pid,
            type: detectedSpikeType,
            severity,
            deviationFactor,
          });
          signalsGenerated.push(signal);
        }
      }
    } catch (err) {
      logger.error("Agent:Signal", `Error checking sentiment signals for Project ${pid}`, err);
    }
  }

  return signalsGenerated;
}

module.exports = {
  runSentimentSignalCheck,
};
