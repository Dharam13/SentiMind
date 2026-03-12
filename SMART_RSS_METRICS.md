# Smart RSS Feed Metrics - Implementation Guide

## Problem Statement
RSS feeds (Medium, LinkedIn via Google News, News sources) don't provide engagement metrics like views, likes, shares, or comments. The original implementation assigned base scores without any engagement data, resulting in:

- Screen Rant (News, actual authority): Score ~90 (correct)
- Random Medium post (no authority signal): Score ~60 (inflated)

**This was misleading** because we couldn't distinguish between an article on TechCrunch vs an obscure Medium post.

---

## Solution: Smart Metrics Estimation

### 1. **Publication Authority Database**

A comprehensive mapping of domains to authority scores (0-100):

```javascript
const PUBLICATION_AUTHORITY = {
  // Top-tier tech/news
  "techcrunch.com": 95,
  "theverge.com": 92,
  "screenrant.com": 86,
  "forbes.com": 90,
  "bloomberg.com": 92,
  
  // Medium-tier
  "medium.com": 65,
  "dev.to": 68,
  "hashnode.com": 67,
  
  // Generic/unknown
  "unknown": 40,
};
```

**Why this works:**
- Screen Rant (86) now gets a higher base than generic sources (40)
- Medium publications get moderate scores (65) not boosted artificially
- Actual publication reputation influences the score

### 2. **Engagement Estimation Function**

For RSS sources, we estimate engagement using publication authority + article freshness:

```javascript
function estimateRSSReach(metadata, sourceUrl, publishedAt) {
  const authority = estimateRSSEngagement(sourceUrl, publication);
  
  // Time decay: older articles have lower reach
  const hoursOld = (Date.now() - publishedAt) / (1000 * 60 * 60);
  const timeFactor = Math.max(0.3, 1 - (hoursOld / 168)); // 7 day decay
  
  // Estimate reach: authority × time factor
  const baseReach = (authority / 100) * 100000; // Scale to 0-100K impressions
  const estimatedViews = Math.round(baseReach * timeFactor);
  
  // Engagement rate scales with authority
  const engagementRate = (authority / 100) * 0.05; // 0-5% engagement
  const estimatedEngagement = Math.round(estimatedViews * engagementRate);
  
  return { estimatedViews, estimatedEngagement, authority, timeFactor };
}
```

**Key factors:**
1. **Publication Authority** (0-100): Established publications get higher base reach estimates
2. **Time Decay**: Fresh articles (hours old) score higher than old ones (days old)
3. **Engagement Rate**: Varies with publication authority
   - High-authority source: 3-5% engagement rate
   - Medium-authority: 2-3% engagement rate
   - Low-authority: 1-2% engagement rate

### 3. **Smart Influence Scoring for RSS**

```javascript
function calculateBlogInfluence(metadata, platform, sourceUrl, publishedAt) {
  const reach = estimateRSSReach(metadata, sourceUrl, publishedAt);
  
  // Base score from publication authority (0-100 scale)
  let score = (reach.authority / 100) * 100;
  
  // Boost for freshness (+0 to +20)
  score += reach.timeFactor * 20;
  
  // Final score normalized to 0-100
  score = Math.min(100, score);
  
  return {
    score,
    metrics: {
      authority: reach.authority,
      estimatedViews: reach.estimatedViews,
      estimatedEngagement: reach.estimatedEngagement,
    },
    isEstimated: true,
    confidence: reach.authority / 100, // Higher authority = higher confidence
  };
}
```

**Example Calculation:**

| Scenario | Authority | Base | Time Factor | Boost | Final Score | Confidence |
|----------|-----------|------|-------------|-------|-------------|-----------|
| TechCrunch article (1 day old) | 95 | 95 | 0.96 | +19.2 | 100 (capped) | 95% |
| Medium article (1 day old) | 65 | 65 | 0.96 | +19.2 | 84.2 | 65% |
| Unknown blog (1 day old) | 40 | 40 | 0.96 | +19.2 | 59.2 | 40% |
| TechCrunch article (6 days old) | 95 | 95 | 0.14 | +2.8 | 97.8 | 95% |

---

## Per-Platform Metrics Returned

The updated system now returns **actual metrics AND estimated metrics**, allowing the UI to show transparency:

### Twitter/YouTube/Reddit (API Sources)
```json
{
  "isEstimated": false,
  "source": "twitter_api",
  "metrics": {
    "likes": 500,
    "retweets": 100,
    "views": 10000
  }
}
```
**Data Quality**: ✓ Real Data (100% confidence)

### News/Medium/LinkedIn (RSS Sources)
```json
{
  "isEstimated": true,
  "source": "news_newsapi",
  "confidence": 0.92,
  "metrics": {
    "authority": 92,
    "estimatedViews": 92000,
    "estimatedEngagement": 4140,
    "estimatedLikes": 2484,
    "estimatedShares": 1242,
    "estimatedComments": 414
  }
}
```
**Data Quality**: ⚡ Estimated (92% confidence)

---

## Data Quality Tracking

Each influencer now includes quality metadata:

```typescript
interface DataQuality {
  hasActualMetrics: boolean;      // Has real API data
  hasEstimatedMetrics: boolean;   // Has estimated RSS data
  overallConfidence: number;      // 0.0-1.0
  sources: string[];              // ['twitter_api', 'news_newsapi']
}
```

### UI Display Examples

**High Authority News Source:**
```
Screen Rant article
Score: 86/100
Engagement: 4,140 (Est.)
Reach: 92K (Est.)
Data Quality: ⚡ Estimated | 92% confidence
```

**Mixed Source Influencer:**
```
Jane Dev (Twitter + Medium)
Score: 75/100 (composite)

Twitter platform:
  Score: 87/100
  ✓ Real Data (Verified)
  Engagement: 2,345
  Reach: 125K

Medium platform:
  Score: 60/100
  ⚡ Estimated (65% confidence)
  Engagement: 1,040 (Est.)
  Reach: 65K (Est.)
```

---

## API Response Structure

The new API returns complete transparency:

```json
{
  "author": "TechCrunch",
  "compositeScore": 88.5,
  "platforms": [
    {
      "platform": "news",
      "influenceScore": 88.5,
      "mentions": 5,
      "engagement": 12500,
      "reach": 450000,
      "isEstimated": true
    }
  ],
  "stats": {
    "totalMentions": 5,
    "totalEngagement": 12500,
    "totalReach": 450000,
    "sentimentBreakdown": { "positive": 4, "neutral": 1, "negative": 0 },
    "avgSentiment": 0.6,
    "platforms": ["news"]
  },
  "dataQuality": {
    "hasActualMetrics": false,
    "hasEstimatedMetrics": true,
    "overallConfidence": 0.92,
    "sources": ["news_newsapi"]
  },
  "metricsBreakdown": [
    {
      "published": "2026-03-06T10:30:00Z",
      "platform": "news",
      "isEstimated": true,
      "engagement": 2500,
      "reach": 90000
    }
  ]
}
```

---

## Publication Authority Rankings

### **Tier 1: Premium Tech/News (90-100)**
- TechCrunch (95)
- AP News (94)
- Reuters (93)
- New York Times (93)
- Bloomberg (92)
- BBC (91)
- The Verge (92)
- ARS Technica (88)

### **Tier 2: Established Tech Media (80-89)**
- Wired (90)
- Engadget (87)
- Screen Rant (86)
- Variety (85)
- Hollywood Reporter (84)
- Business Insider (82)

### **Tier 3: Aggregators & Professional (70-79)**
- Hacker News (80)
- Product Hunt (75)
- LinkedIn (72)
- Slashdot (70)

### **Tier 4: Content Platforms (60-69)**
- Medium (65)
- Dev.to (68)
- Hashnode (67)

### **Tier 5: Unknown/Generic (30-50)**
- Unknown domain (40)

---

## Freshness Decay Model

Articles lose "reach potential" over time. The time decay function:

```
timeFactor = Math.max(0.3, 1 - (hoursOld / 168))
```

**Impact:**
- **0 hours old**: 1.0x (100% potential)
- **24 hours old**: 0.86x (86% potential)
- **3 days old**: 0.57x (57% potential)
- **7 days old**: 0.0x (floor at 30% minimum)
- **14+ days old**: 0.3x (30% potential)

**Why this matters:**
- Fresh TechCrunch article ≈ 1 week old Medium article in terms of reach potential
- Old articles still have some authority (30% floor) but lose freshness boost

---

## Smart Influencer Ranking Example

For a Netflix keyword search, here's how influencers would rank:

| Rank | Author | Platform | Real Data | Estimated? | Authority | Score | Reasoning |
|------|--------|----------|-----------|-----------|-----------|-------|-----------|
| 1 | Entertainment Weekly | News | ✗ | ✓ 94% | 90 | 92 | High-authority news source + fresh article |
| 2 | Netflix Official | Twitter | ✓ | ✗ | — | 88 | Real engagement data, no estimation needed |
| 3 | Movie Reviewer X | Twitter | ✓ | ✗ | — | 76 | Real data but lower engagement |
| 4 | TechBlog Medium | Medium | ✗ | ✓ 65% | 65 | 62 | Medium platform, moderate authority |
| 5 | Random Blog | News | ✗ | ✓ 35% | 35 | 38 | Unknown source, low confidence |

---

## Benefits of This Approach

✅ **Transparency**: UI clearly shows "Estimated" vs "Real Data"
✅ **Fairness**: High-authority publications rank higher
✅ **Relevance**: Freshness matters - recent articles score higher
✅ **Confidence**: Confidence scores help users understand data quality
✅ **Completeness**: Can now rank ALL mentions, even RSS-only ones
✅ **Intelligence**: Combines publication tier + engagement patterns
✅ **Flexibility**: Easy to update authority scores or decay rates

---

## Configuration

### Update Publication Authority

Edit `PUBLICATION_AUTHORITY` in `influencerService.js`:

```javascript
const PUBLICATION_AUTHORITY = {
  "mynewsite.com": 75,  // Add new publication
  "techcrunch.com": 98, // Adjust existing score
};
```

### Adjust Time Decay

Change the 168 (7 days) in `estimateRSSReach`:

```javascript
const timeFactor = Math.max(0.3, 1 - (hoursOld / 168)); // Change 168 to your preference
```

### Adjust Engagement Rate

Modify the 0.05 (5%) in `estimateRSSReach`:

```javascript
const engagementRate = (authority / 100) * 0.05; // Change 0.05 to 0.03 for 3% max
```

---

## Summary

The system now **intelligently handles RSS feeds** by:
1. Recognizing publication authority from domain reputation
2. Estimating reach based on publication tier + freshness
3. Calculating engagement rates proportional to publication quality
4. Showing confidence scores so users know data quality
5. Displaying "Estimated" labels for clarity
6. Maintaining fair cross-platform rankings

**Result**: Netflix search shows Screen Rant (90) > Random Medium post (60) because we now understand publication authority! ✨
