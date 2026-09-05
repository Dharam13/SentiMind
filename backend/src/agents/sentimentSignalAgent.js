const { Mention } = require("../models/Mention");
const { Signal } = require("../models/Signal");
const { logger } = require("../utils/logger");
const { env } = require("../config/env");
const { langsmith } = require("../services/langsmithService");

/**
 * Agent 1: Sentiment & Signal Agent
 * Detects sentiment anomalies, abnormal negative/positive spikes, and viral momentum.
 */
async function runSentimentSignalCheck(targetProjectId, force = false, parentRunId = null) {
  return await langsmith.withSpan(
    {
      name: "Agent1_SignalDetector",
      runType: "chain",
      inputs: { targetProjectId, force },
      parentRunId,
      metadata: { agent: "sentimentSignalAgent", version: "2.0" },
      tags: ["agent1", "signal-detector"],
    },
    async (spanId) => {
      const query = targetProjectId ? { projectId: targetProjectId } : {};
      const projectIds = targetProjectId ? [targetProjectId] : await Mention.distinct("projectId", query);

      const signalsGenerated = [];

  for (const pid of projectIds) {
    try {
      // 1. Fetch mentions within the baseline and recent windows
      const baselineStart = new Date(Date.now() - env.baselineHours * 60 * 60 * 1000);
      const recentWindowStart = new Date(Date.now() - env.windowHours * 60 * 60 * 1000);

      const allMentions = await Mention.find({
        projectId: pid,
        publishedAt: { $gte: baselineStart },
        sentimentStatus: "completed",
      }).lean();

      if (!force && allMentions.length < env.spikeMinMentions) {
        continue;
      }

      // Separate into prior history (before recent window) and recent window
      const recentMentions = allMentions.filter(
        (m) => new Date(m.publishedAt || m.collectedAt || Date.now()).getTime() >= recentWindowStart.getTime()
      );
      const priorMentions = allMentions.filter(
        (m) => new Date(m.publishedAt || m.collectedAt || Date.now()).getTime() < recentWindowStart.getTime()
      );

      if (!force && recentMentions.length < env.spikeMinMentions) {
        continue;
      }

      // Compute baseline ratios (use prior history if >= 5 mentions, else industry default)
      const priorTotal = priorMentions.length;
      let baseline;
      if (priorTotal >= 5) {
        const basePos = priorMentions.filter((m) => m.sentiment?.label === "positive").length;
        const baseNeu = priorMentions.filter((m) => m.sentiment?.label === "neutral").length;
        const baseNeg = priorMentions.filter((m) => m.sentiment?.label === "negative").length;
        baseline = {
          positivePercent: Math.round((basePos / priorTotal) * 100),
          neutralPercent: Math.round((baseNeu / priorTotal) * 100),
          negativePercent: Math.round((baseNeg / priorTotal) * 100),
          avgDailyVolume: Math.max(1, Math.round(priorTotal / (env.baselineHours / 24))),
          hoursWindow: env.baselineHours,
        };
      } else {
        baseline = {
          positivePercent: 35,
          neutralPercent: 50,
          negativePercent: 15,
          avgDailyVolume: Math.max(1, Math.round(allMentions.length / 7)),
          hoursWindow: env.baselineHours,
        };
      }

      // 2. Fetch Recent Window Ratios
      const effectiveRecent = recentMentions.length > 0 ? recentMentions : allMentions;
      const recentTotal = effectiveRecent.length;
      if (recentTotal === 0 && !force) {
        continue;
      }

      const recentPos = effectiveRecent.filter((m) => m.sentiment?.label === "positive").length;
      const recentNeu = effectiveRecent.filter((m) => m.sentiment?.label === "neutral").length;
      const recentNeg = effectiveRecent.filter((m) => m.sentiment?.label === "negative").length;

      const current = {
        positivePercent: recentTotal ? Math.round((recentPos / recentTotal) * 100) : (force ? 80 : 35),
        neutralPercent: recentTotal ? Math.round((recentNeu / recentTotal) * 100) : 10,
        negativePercent: recentTotal ? Math.round((recentNeg / recentTotal) * 100) : (force ? 70 : 15),
        mentionCount: recentTotal || 1,
        hoursWindow: env.windowHours,
      };

      // 3. Spike Detection Logic
      let detectedSpikeType = null;
      let severity = "medium";
      let deviationFactor = 1.0;
      let title = "";
      let description = "";

      const sampleMention = effectiveRecent.find((m) => m.keyword);
      const brandName = sampleMention?.keyword || (pid === 10 ? "Amul" : "Brand");

      // Condition A: Negative sentiment spike
      const baseNegRatio = Math.max(10, baseline.negativePercent);
      const negDeviation = current.negativePercent / baseNegRatio;

      // Condition B: Positive viral surge
      const basePosRatio = Math.max(15, baseline.positivePercent);
      const posDeviation = current.positivePercent / basePosRatio;

      if (current.negativePercent >= 35 && (negDeviation >= env.spikeDeviationThreshold || force)) {
        detectedSpikeType = "negative_spike";
        deviationFactor = Math.max(1.5, Math.round(negDeviation * 10) / 10);
        severity = current.negativePercent > 60 ? "critical" : "high";
        title = `Abnormal Negative Sentiment Spike (${current.negativePercent}%, ${deviationFactor}x Baseline)`;
        description = `Customer friction surged to ${current.negativePercent}% negative in the last ${env.windowHours}h for ${brandName} (historical baseline is ${baseline.negativePercent}%). Immediate intervention advised.`;
      } else if (current.positivePercent >= 55 && (posDeviation >= env.spikeDeviationThreshold || force)) {
        detectedSpikeType = "positive_spike";
        deviationFactor = Math.max(1.5, Math.round(posDeviation * 10) / 10);
        severity = "high";
        title = `Viral Brand Advocacy Surge (${current.positivePercent}% Positive)`;
        description = `Strong positive buying momentum detected across social channels for ${brandName}. Prime opportunity for growth and upsell payment links.`;
      } else if (recentTotal > baseline.avgDailyVolume * 1.8 && recentTotal >= 5) {
        detectedSpikeType = "volume_spike";
        deviationFactor = Math.round((recentTotal / Math.max(1, baseline.avgDailyVolume)) * 10) / 10;
        severity = "medium";
        title = `Unusual Mention Volume Surge (${recentTotal} mentions in ${env.windowHours}h)`;
        description = `Brand conversation volume for ${brandName} increased by ${deviationFactor}x normal rate.`;
      } else if (force) {
        // Safe fallback when explicitly forcing detection in simulation/testing
        detectedSpikeType = current.negativePercent >= current.positivePercent ? "negative_spike" : "positive_spike";
        deviationFactor = 2.5;
        severity = "high";
        title = detectedSpikeType === "negative_spike"
          ? `Simulated Negative Sentiment Spike (${current.negativePercent}% Negative)`
          : `Simulated Viral Positive Surge (${current.positivePercent}% Positive)`;
        description = `Elevated customer discussions for ${brandName} triggered autonomous agent loop.`;
      }

      // Check if we already have an active/recent signal for this project in last 2 hours (bypassed if force is true)
      if (detectedSpikeType) {
        const recentSignal = force
          ? null
          : await Signal.findOne({
              projectId: pid,
              type: detectedSpikeType,
              detectedAt: { $gte: new Date(Date.now() - 2 * 60 * 60 * 1000) },
            });

        if (!recentSignal) {
          const platforms = [...new Set(effectiveRecent.map((m) => m.platform).filter(Boolean))];
          const triggeringMentionIds = effectiveRecent.map((m) => m._id);

          const signal = await Signal.create({
            projectId: pid,
            keyword: brandName,
            type: detectedSpikeType,
            severity,
            title,
            description,
            baseline,
            current,
            deviationFactor,
            triggeringMentionIds,
            platforms: platforms.length ? platforms : ["twitter", "reddit"],
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
);
}

module.exports = {
  runSentimentSignalCheck,
};
