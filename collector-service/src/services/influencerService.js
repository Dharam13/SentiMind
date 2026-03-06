const { Mention } = require("../models/Mention");

/**
 * Publication reputation database
 * Maps domain names to publication authority scores (0-100)
 */
const PUBLICATION_AUTHORITY = {
  // High-tier news/tech publications
  "techcrunch.com": 95,
  "theverge.com": 92,
  "wired.com": 90,
  "arstechnica.com": 88,
  "engadget.com": 87,
  "screenrant.com": 86,
  "variety.com": 85,
  "hollywoodreporter.com": 84,
  "businessinsider.com": 82,
  "forbes.com": 90,
  "bloomberg.com": 92,
  "reuters.com": 93,
  "apnews.com": 94,
  "bbc.com": 91,
  "cnn.com": 85,
  "nytimes.com": 93,
  "washingtonpost.com": 92,
  "theguardian.com": 89,
  "ft.com": 88,
  
  // Medium-tier publications
  "medium.com": 65,
  "dev.to": 68,
  "hashnode.com": 67,
  "hackernews.com": 80,
  "slashdot.org": 70,
  "producthunt.com": 75,
  
  // LinkedIn
  "linkedin.com": 72,
  
  // Generic/unknown
  "unknown": 40,
};

/**
 * Estimate engagement for RSS sources based on publication authority
 * This helps normalize RSS mentions with actual API data
 */
function estimateRSSEngagement(sourceUrl, publicationName) {
  let authority = 40; // Default for unknown sources
  
  // Try to extract domain from URL
  if (sourceUrl) {
    try {
      const url = new URL(sourceUrl);
      const domain = url.hostname.replace("www.", "").toLowerCase();
      authority = PUBLICATION_AUTHORITY[domain] || 40;
    } catch (e) {
      // Invalid URL, use publication name
      if (publicationName) {
        const nameLower = publicationName.toLowerCase();
        for (const [domain, score] of Object.entries(PUBLICATION_AUTHORITY)) {
          if (nameLower.includes(domain.split(".")[0])) {
            authority = score;
            break;
          }
        }
      }
    }
  }
  
  return authority;
}

/**
 * Estimate reach metrics for RSS sources
 * Based on publication tier and article freshness
 */
function estimateRSSReach(metadata, sourceUrl, publishedAt) {
  const authority = estimateRSSEngagement(sourceUrl, metadata?.source);
  
  // Time decay: older articles have lower reach estimate
  const hoursOld = (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60);
  const timeFactor = Math.max(0.3, 1 - (hoursOld / 168)); // 7 days = full decay
  
  // Estimate reach based on pub authority
  const baseReach = (authority / 100) * 100000; // Scale to 0-100k
  const estimatedViews = Math.round(baseReach * timeFactor);
  
  // Estimate engagement based on authority
  const engagementRate = (authority / 100) * 0.05; // 0-5% engagement rate for high-authority sources
  const estimatedEngagement = Math.round(estimatedViews * engagementRate);
  
  return {
    estimatedViews,
    estimatedEngagement,
    authority,
    timeFactor,
    isEstimated: true,
  };
}

/**
 * Calculate influence score for a single mention based on platform
 */
function calculateMentionInfluence(mention) {
  const md = mention.metadata || {};
  const platform = mention.platform;
  const sourceUrl = mention.sourceUrl;
  const publishedAt = mention.publishedAt;

  switch (platform) {
    case "twitter":
      return calculateTwitterInfluence(md);
    case "youtube":
      return calculateYouTubeInfluence(md);
    case "reddit":
      return calculateRedditInfluence(md);
    case "medium":
    case "linkedin":
      return calculateBlogInfluence(md, platform, sourceUrl, publishedAt);
    case "news":
      return calculateNewsInfluence(md, sourceUrl, publishedAt);
    default:
      return 0;
  }
}

/**
 * Twitter influence score
 * Factors: likes (0.08), retweets (0.25), replies (0.15), views (0.005), followers impact
 */
function calculateTwitterInfluence(metadata) {
  const likes = metadata.likes || 0;
  const retweets = metadata.retweets || 0;
  const replies = metadata.replies || 0;
  const views = metadata.views || 0;
  const followers = metadata.followers || 100;

  const engagement = likes * 0.08 + retweets * 0.25 + replies * 0.15 + views * 0.005;
  const followerImpact = Math.log10(followers + 1) * 5;

  return {
    score: engagement + followerImpact,
    metrics: { likes, retweets, replies, views, followers },
    isEstimated: false,
    source: "twitter_api",
  };
}

/**
 * YouTube influence score
 * Factors: views (0.03), likes (0.15), comments (0.20), subscriber impact
 */
function calculateYouTubeInfluence(metadata) {
  const views = metadata.views || 0;
  const likes = metadata.likes || 0;
  const comments = metadata.comments || 0;
  const subscribers = metadata.channelSubscribers || 1000;

  const engagement = views * 0.03 + likes * 0.15 + comments * 0.2;
  const subscriberImpact = Math.log10(subscribers + 1) * 4;

  return {
    score: engagement + subscriberImpact,
    metrics: { views, likes, comments, subscribers },
    isEstimated: false,
    source: "youtube_api",
  };
}

/**
 * Reddit influence score
 * Factors: upvotes (0.12), comments (0.08)
 */
function calculateRedditInfluence(metadata) {
  const upvotes = metadata.upvotes || 0;
  const comments = metadata.commentsCount || 0;

  return {
    score: upvotes * 0.12 + comments * 0.08,
    metrics: { upvotes, comments },
    isEstimated: false,
    source: "reddit_api",
  };
}

/**
 * Blog/Medium/LinkedIn influence score (RSS-based)
 * Smart estimation based on publication authority
 */
function calculateBlogInfluence(metadata, platform, sourceUrl, publishedAt) {
  const reach = estimateRSSReach(metadata, sourceUrl, publishedAt);
  
  // Calculate engagement based on estimated metrics
  const estimatedLikes = Math.round(reach.estimatedEngagement * 0.6);
  const estimatedShares = Math.round(reach.estimatedEngagement * 0.3);
  const estimatedComments = Math.round(reach.estimatedEngagement * 0.1);
  
  // Influence formula for blog/RSS
  let score = (reach.authority / 100) * 100; // Max 100, scales with publication authority
  
  // Boost for freshness and engagement
  score += reach.timeFactor * 20; // Up to +20 for fresh content
  score = Math.min(100, score); // Cap at 100 for RSS sources

  return {
    score,
    metrics: {
      authority: reach.authority,
      estimatedViews: reach.estimatedViews,
      estimatedEngagement: reach.estimatedEngagement,
      estimatedLikes,
      estimatedShares,
      estimatedComments,
    },
    isEstimated: true,
    confidence: reach.authority / 100,
    source: platform === "medium" ? "medium_rss" : "linkedin_rss",
  };
}

/**
 * News source influence score
 * Combines provider tier + publication authority for better scoring
 */
function calculateNewsInfluence(metadata, sourceUrl, publishedAt) {
  const provider = metadata.provider || "generic";
  const reach = estimateRSSReach(metadata, sourceUrl, publishedAt);
  
  // Provider base scores
  const providerScores = {
    newsapi: 0.95,
    gnews: 0.90,
    newsdata: 0.85,
    "google-news-rss": 0.88,
    generic: 0.70,
  };
  
  const providerMultiplier = providerScores[provider] || 0.70;
  
  // Final score: combine publication authority with provider quality
  let score = (reach.authority / 100) * providerMultiplier * 100;
  
  // Boost for freshness
  score += reach.timeFactor * 15;
  score = Math.min(100, score);

  return {
    score,
    metrics: {
      provider,
      authority: reach.authority,
      estimatedViews: reach.estimatedViews,
      estimatedEngagement: reach.estimatedEngagement,
    },
    isEstimated: true,
    confidence: reach.authority / 100,
    source: `news_${provider}`,
  };
}

/**
 * Normalize a score from 0-100
 */
function normalizeScore(scoreObj, maxExpectedScore) {
  if (!scoreObj || !scoreObj.score || scoreObj.score === 0) return 0;
  
  const score = scoreObj.score;
  
  // For RSS and news, score is already normalized to 0-100
  if (scoreObj.isEstimated) {
    return Math.round(Math.min(100, score) * 10) / 10;
  }
  
  // For API sources, normalize using max expected score
  const normalized = Math.min(100, (score / maxExpectedScore) * 100);
  return Math.round(normalized * 10) / 10;
}

/**
 * Calculate platform-specific max scores for normalization
 */
function getMaxScoreForPlatform(platform) {
  switch (platform) {
    case "twitter":
      return 500000 * 0.08 + 250000 * 0.25 + 50000 * 0.15 + 10000000 * 0.005 + Math.log10(100000000) * 5;
    case "youtube":
      return 100000 * 0.03 + 50000 * 0.15 + 10000 * 0.2 + Math.log10(10000000) * 4;
    case "reddit":
      return 100000 * 0.12 + 10000 * 0.08;
    case "medium":
    case "linkedin":
    case "news":
      return 100; // Already normalized
    default:
      return 100;
  }
}

/**
 * Aggregate and rank influencers for a project
 */
async function getProjectInfluencers(projectId, hoursUsed = 24, keyword = null) {
  const query = { projectId };
  
  if (hoursUsed && hoursUsed > 0) {
    const end = new Date();
    const start = new Date(end.getTime() - hoursUsed * 60 * 60 * 1000);
    query.publishedAt = { $gte: start };
  }

  if (keyword) {
    query.keyword = keyword;
  }

  const mentions = await Mention.find(query).lean().exec();
  const influencerMap = new Map();

  for (const mention of mentions) {
    if (!mention.author) continue;

    const authorKey = `${mention.author}::${mention.platform}`;
    const influencer = influencerMap.get(authorKey) || {
      author: mention.author,
      platform: mention.platform,
      mentions: [],
      stats: {
        totalMentions: 0,
        totalEngagement: 0,
        totalReach: 0,
        avgSentiment: 0,
        sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
        platforms: new Set(),
      },
      dataQuality: {
        hasActualMetrics: false,
        hasEstimatedMetrics: false,
        confidence: 0,
        sources: new Set(),
      },
      rawInfluenceScore: 0,
      metricsBreakdown: [],
    };

    influencer.mentions.push(mention);
    influencer.stats.totalMentions += 1;
    influencer.stats.platforms.add(mention.platform);

    // Calculate influence for this mention
    const scoreObj = calculateMentionInfluence(mention);
    const mentionScore = scoreObj.score || scoreObj;
    
    influencer.rawInfluenceScore += mentionScore;
    
    // Track metrics quality
    influencer.dataQuality.hasActualMetrics = influencer.dataQuality.hasActualMetrics || !scoreObj.isEstimated;
    influencer.dataQuality.hasEstimatedMetrics = influencer.dataQuality.hasEstimatedMetrics || scoreObj.isEstimated;
    influencer.dataQuality.sources.add(scoreObj.source);
    if (scoreObj.confidence) {
      influencer.dataQuality.confidence = Math.max(influencer.dataQuality.confidence, scoreObj.confidence);
    }

    // Aggregate metrics
    const metrics = scoreObj.metrics || {};
    
    switch (mention.platform) {
      case "twitter":
        influencer.stats.totalEngagement += (metrics.likes || 0) + (metrics.retweets || 0) + (metrics.replies || 0);
        influencer.stats.totalReach += metrics.views || 0;
        break;
      case "youtube":
        influencer.stats.totalEngagement += (metrics.likes || 0) + (metrics.comments || 0);
        influencer.stats.totalReach += metrics.views || 0;
        break;
      case "reddit":
        influencer.stats.totalEngagement += (metrics.upvotes || 0) + (metrics.comments || 0);
        break;
      case "medium":
      case "linkedin":
      case "news":
        // Use estimated metrics
        influencer.stats.totalEngagement += metrics.estimatedEngagement || metrics.estimatedLikes || 0;
        influencer.stats.totalReach += metrics.estimatedViews || 0;
        break;
    }

    // Track metrics per mention for transparency
    influencer.metricsBreakdown.push({
      published: mention.publishedAt,
      platform: mention.platform,
      isEstimated: scoreObj.isEstimated,
      engagement: metrics.estimatedEngagement || metrics.likes || metrics.upvotes || 0,
      reach: metrics.estimatedViews || metrics.views || 0,
    });

    // Aggregate sentiment
    if (mention.sentimentStatus === "completed" && mention.sentiment?.label) {
      const label = mention.sentiment.label.toLowerCase();
      if (label === "positive") influencer.stats.sentimentBreakdown.positive += 1;
      else if (label === "negative") influencer.stats.sentimentBreakdown.negative += 1;
      else influencer.stats.sentimentBreakdown.neutral += 1;
    }

    influencerMap.set(authorKey, influencer);
  }

  // Convert to array and calculate normalized scores
  let influencers = Array.from(influencerMap.values());

  for (const influencer of influencers) {
    const maxScore = getMaxScoreForPlatform(influencer.platform);
    influencer.influenceScore = normalizeScore(
      { score: influencer.rawInfluenceScore, isEstimated: influencer.dataQuality.hasEstimatedMetrics },
      maxScore
    );
    
    // Calculate average sentiment
    const totalSentiment = influencer.stats.sentimentBreakdown.positive +
      influencer.stats.sentimentBreakdown.neutral +
      influencer.stats.sentimentBreakdown.negative;
    
    if (totalSentiment > 0) {
      influencer.stats.avgSentiment = Math.round(
        ((influencer.stats.sentimentBreakdown.positive - influencer.stats.sentimentBreakdown.negative) / totalSentiment) * 100
      ) / 100;
    }

    // Convert Set to Array for JSON
    influencer.stats.platforms = Array.from(influencer.stats.platforms);
    influencer.dataQuality.sources = Array.from(influencer.dataQuality.sources);
  }

  influencers.sort((a, b) => b.influenceScore - a.influenceScore);

  return influencers;
}

/**
 * Get top influencers across all platforms with cross-platform ranking
 */
async function getTopInfluencersCrossPlatform(projectId, hoursUsed = 24, keyword = null, limit = 50) {
  const influencers = await getProjectInfluencers(projectId, hoursUsed, keyword);
  const combinedInfluencers = new Map();

  for (const influencer of influencers) {
    const authorKey = influencer.author;
    const combined = combinedInfluencers.get(authorKey) || {
      author: influencer.author,
      platforms: [],
      stats: {
        totalMentions: 0,
        totalEngagement: 0,
        totalReach: 0,
        sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
      },
      influenceScores: {},
      compositeScore: 0,
      dataQuality: {
        hasActualMetrics: false,
        hasEstimatedMetrics: false,
        overallConfidence: 0,
        sources: new Set(),
      },
      metricsBreakdown: [],
    };

    combined.platforms.push({
      platform: influencer.platform,
      influenceScore: influencer.influenceScore,
      mentions: influencer.stats.totalMentions,
      engagement: influencer.stats.totalEngagement,
      reach: influencer.stats.totalReach,
      isEstimated: influencer.dataQuality.hasEstimatedMetrics && !influencer.dataQuality.hasActualMetrics,
    });

    combined.stats.totalMentions += influencer.stats.totalMentions;
    combined.stats.totalEngagement += influencer.stats.totalEngagement;
    combined.stats.totalReach += influencer.stats.totalReach;
    combined.stats.sentimentBreakdown.positive += influencer.stats.sentimentBreakdown.positive;
    combined.stats.sentimentBreakdown.neutral += influencer.stats.sentimentBreakdown.neutral;
    combined.stats.sentimentBreakdown.negative += influencer.stats.sentimentBreakdown.negative;

    combined.influenceScores[influencer.platform] = influencer.influenceScore;
    
    // Merge data quality info
    combined.dataQuality.hasActualMetrics = combined.dataQuality.hasActualMetrics || influencer.dataQuality.hasActualMetrics;
    combined.dataQuality.hasEstimatedMetrics = combined.dataQuality.hasEstimatedMetrics || influencer.dataQuality.hasEstimatedMetrics;
    combined.dataQuality.overallConfidence = Math.max(combined.dataQuality.overallConfidence, influencer.dataQuality.confidence);
    influencer.dataQuality.sources.forEach(s => combined.dataQuality.sources.add(s));
    combined.metricsBreakdown.push(...influencer.metricsBreakdown);

    combinedInfluencers.set(authorKey, combined);
  }

  // Calculate composite scores
  for (const influencer of combinedInfluencers.values()) {
    let totalScore = 0;
    let totalWeight = 0;

    for (const platformScore of influencer.platforms) {
      const weight = platformScore.mentions;
      totalScore += platformScore.influenceScore * weight;
      totalWeight += weight;
    }

    influencer.compositeScore = totalWeight > 0 ? Math.round((totalScore / totalWeight) * 10) / 10 : 0;
    
    // Convert Set to Array
    influencer.dataQuality.sources = Array.from(influencer.dataQuality.sources);
  }

  const result = Array.from(combinedInfluencers.values());
  result.sort((a, b) => b.compositeScore - a.compositeScore);

  // Calculate sentiment
  for (const influencer of result) {
    const total = influencer.stats.sentimentBreakdown.positive +
      influencer.stats.sentimentBreakdown.neutral +
      influencer.stats.sentimentBreakdown.negative;
    if (total > 0) {
      influencer.stats.avgSentiment = Math.round(
        ((influencer.stats.sentimentBreakdown.positive - influencer.stats.sentimentBreakdown.negative) / total) * 100
      ) / 100;
    } else {
      influencer.stats.avgSentiment = 0;
    }
  }

  return result.slice(0, limit);
}

module.exports = {
  calculateMentionInfluence,
  getProjectInfluencers,
  getTopInfluencersCrossPlatform,
  normalizeScore,
  getMaxScoreForPlatform,
  estimateRSSReach,
  estimateRSSEngagement,
  PUBLICATION_AUTHORITY,
};
