import { useMemo, useState, useEffect } from "react";
import * as collectorApi from "../lib/collectorApi";

type Platform = collectorApi.Platform;
type SortBy = "composite" | "mentions" | "engagement" | "reach" | "sentiment";
type SentimentFilter = "all" | "positive" | "neutral" | "negative" | "mixed";

interface InfluencersViewProps {
  projectId: number;
  hours: number;
  keyword?: string;
  loadingParent?: boolean;
}

function platformLabel(platform: string) {
  switch (platform) {
    case "twitter":
      return "Twitter";
    case "reddit":
      return "Reddit";
    case "youtube":
      return "YouTube";
    case "medium":
      return "Medium";
    case "linkedin":
      return "LinkedIn";
    case "news":
      return "News";
    default:
      return platform;
  }
}

function platformIcon(platform: string) {
  switch (platform) {
    case "twitter":
      return "𝕏";
    case "reddit":
      return "r/";
    case "youtube":
      return "▶";
    case "medium":
      return "M";
    case "linkedin":
      return "in";
    case "news":
      return "📰";
    default:
      return "•";
  }
}

function getScoreColor(score: number) {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400 bg-emerald-600/10";
  if (score >= 60) return "text-blue-600 dark:text-blue-400 bg-blue-600/10";
  if (score >= 40) return "text-amber-600 dark:text-amber-400 bg-amber-600/10";
  return "text-orange-600 dark:text-orange-400 bg-orange-600/10";
}

function getSentimentColor(sentiment: number) {
  if (sentiment > 0.3) return "text-emerald-600 dark:text-emerald-400";
  if (sentiment < -0.3) return "text-red-600 dark:text-red-400";
  return "text-amber-600 dark:text-amber-400";
}

export function InfluencersView({
  projectId,
  hours,
  keyword,
  loadingParent,
}: InfluencersViewProps) {
  const [influencers, setInfluencers] = useState<collectorApi.Influencer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedInfluencer, setExpandedInfluencer] = useState<string | null>(null);

  // Filters and sorting
  const [sortBy, setSortBy] = useState<SortBy>("composite");
  const [platformFilter, setPlatformFilter] = useState<Platform | "all">("all");
  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilter>("all");
  const [minScore, setMinScore] = useState(0);
  const [maxMentions, setMaxMentions] = useState<number | null>(null);

  // Load influencers
  useEffect(() => {
    const fetchInfluencers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await collectorApi.getProjectInfluencers({
          projectId,
          keyword,
          hours,
          limit: 100,
        });
        setInfluencers(response.influencers);
      } catch (err) {
        console.error("Failed to load influencers:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load influencers"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchInfluencers();
  }, [projectId, keyword, hours]);

  // Apply filters and sorting
  const filtered = useMemo(() => {
    let result = influencers;

    // Platform filter
    if (platformFilter !== "all") {
      result = result.filter((inf) =>
        inf.platforms.some((p) => p.platform === platformFilter)
      );
    }

    // Score filter
    result = result.filter((inf) => inf.compositeScore >= minScore);

    // Sentiment filter
    if (sentimentFilter !== "all") {
      result = result.filter((inf) => {
        const sentiment = inf.stats.avgSentiment;
        switch (sentimentFilter) {
          case "positive":
            return sentiment > 0.2;
          case "negative":
            return sentiment < -0.2;
          case "neutral":
            return sentiment >= -0.2 && sentiment <= 0.2;
          case "mixed":
            return Math.abs(sentiment) <= 0.2;
          default:
            return true;
        }
      });
    }

    // Sort
    const sorted = [...result];
    switch (sortBy) {
      case "composite":
        sorted.sort((a, b) => b.compositeScore - a.compositeScore);
        break;
      case "mentions":
        sorted.sort((a, b) => b.stats.totalMentions - a.stats.totalMentions);
        break;
      case "engagement":
        sorted.sort((a, b) => b.stats.totalEngagement - a.stats.totalEngagement);
        break;
      case "reach":
        sorted.sort((a, b) => b.stats.totalReach - a.stats.totalReach);
        break;
      case "sentiment":
        sorted.sort((a, b) => b.stats.avgSentiment - a.stats.avgSentiment);
        break;
    }

    return sorted;
  }, [influencers, platformFilter, sortBy, minScore, sentimentFilter]);

  const maxMentionsInData = Math.max(...influencers.map((i) => i.stats.totalMentions), 1);

  return (
    <div className="flex flex-col gap-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card/50 hover:bg-card/80 p-4 transition">
          <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
            👥 Total Influencers
          </div>
          <div className="text-3xl font-bold text-foreground">
            {loading ? "—" : influencers.length}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">Across all platforms</div>
        </div>

        <div className="rounded-xl border border-border bg-card/50 hover:bg-card/80 p-4 transition">
          <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
            📊 Avg Score
          </div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {loading
              ? "—"
              : influencers.length > 0
              ? Math.round(
                  (influencers.reduce((sum, i) => sum + i.compositeScore, 0) / influencers.length) * 10
                ) / 10
              : 0}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">Influence score</div>
        </div>

        <div className="rounded-xl border border-border bg-card/50 hover:bg-card/80 p-4 transition">
          <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
            🎯 Top Influencer
          </div>
          <div className="text-lg font-bold text-foreground truncate">
            {loading
              ? "—"
              : influencers.length > 0
              ? influencers[0].author
              : "No data"}
          </div>
          {influencers.length > 0 && !loading && (
            <div className="text-[11px] text-muted-foreground mt-1">
              Score: {influencers[0].compositeScore}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card/50 hover:bg-card/80 p-4 transition">
          <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
            💬 Total Mentions
          </div>
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
            {loading
              ? "—"
              : influencers.reduce((sum, i) => sum + i.stats.totalMentions, 0)}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">By all influencers</div>
        </div>
      </div>

      {/* Filters and Sorting */}
      <div className="rounded-xl border border-border bg-card/50 p-4 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            🔧 Filters & Sorting
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Sort By */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-2">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="w-full rounded-lg border border-border bg-card/50 px-3 py-2.5 text-sm font-medium text-foreground focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition"
            >
              <option value="composite">Composite Score</option>
              <option value="mentions">Mentions Count</option>
              <option value="engagement">Engagement</option>
              <option value="reach">Reach</option>
              <option value="sentiment">Sentiment</option>
            </select>
          </div>

          {/* Platform Filter */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-2">
              Platform
            </label>
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value as Platform | "all")}
              className="w-full rounded-lg border border-border bg-card/50 px-3 py-2.5 text-sm font-medium text-foreground focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition"
            >
              <option value="all">All Platforms</option>
              <option value="twitter">Twitter</option>
              <option value="youtube">YouTube</option>
              <option value="reddit">Reddit</option>
              <option value="medium">Medium</option>
              <option value="linkedin">LinkedIn</option>
              <option value="news">News</option>
            </select>
          </div>

          {/* Sentiment Filter */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-2">
              Sentiment
            </label>
            <select
              value={sentimentFilter}
              onChange={(e) => setSentimentFilter(e.target.value as SentimentFilter)}
              className="w-full rounded-lg border border-border bg-card/50 px-3 py-2.5 text-sm font-medium text-foreground focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition"
            >
              <option value="all">All Sentiments</option>
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>

          {/* Min Score Filter */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-2">
              Min Score: {minScore}
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={minScore}
              onChange={(e) => setMinScore(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
        </div>
      </div>

      {/* Influencers List */}
      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {loading || loadingParent ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-12 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse"></div>
            Loading influencers…
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-12 text-center">
          <p className="text-sm font-medium text-foreground">No influencers found</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Try adjusting filters or run collection to get fresh data
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((influencer) => {
            const isExpanded = expandedInfluencer === influencer.author;
            const topPlatform = influencer.platforms[0];

            return (
              <div
                key={influencer.author}
                className="rounded-xl border border-border bg-card/50 hover:bg-card/80 transition overflow-hidden"
              >
                {/* Main Row */}
                <button
                  type="button"
                  onClick={() =>
                    setExpandedInfluencer(isExpanded ? null : influencer.author)
                  }
                  className="w-full px-6 py-4 text-left"
                >
                  <div className="flex items-center justify-between gap-4">
                    {/* Left: Author info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/20 text-sm font-bold flex-shrink-0">
                          {platformIcon(topPlatform?.platform || "twitter")}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-foreground truncate">
                            {influencer.author}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {influencer.stats.totalMentions} mention
                            {influencer.stats.totalMentions !== 1 ? "s" : ""} • {influencer.platforms.length} platform
                            {influencer.platforms.length !== 1 ? "s" : ""}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Scores and metrics */}
                    <div className="flex items-center gap-3 flex-wrap justify-end sm:flex-nowrap">
                      {/* Composite Score */}
                      {(() => {
                        const composite = typeof influencer.compositeScore === "number"
                          ? influencer.compositeScore
                          : 0;
                        return (
                          <div
                            className={`rounded-lg px-4 py-2 font-bold text-sm ${getScoreColor(
                              composite
                            )}`}
                          >
                            {composite.toFixed(1)}
                          </div>
                        );
                      })()}

                      {/* Engagement Badge */}
                      <div className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs font-semibold text-muted-foreground">
                        💬 {influencer.stats.totalEngagement.toLocaleString()}
                      </div>

                      {/* Sentiment Indicator */}
                      <div
                        className={`rounded-lg px-3 py-2 text-xs font-semibold ${getSentimentColor(
                          influencer.stats.avgSentiment
                        )}`}
                      >
                        {influencer.stats.avgSentiment > 0.2
                          ? "😊 Positive"
                          : influencer.stats.avgSentiment < -0.2
                          ? "😞 Negative"
                          : "😐 Neutral"}
                      </div>

                      {/* Expand Icon */}
                      <button
                        type="button"
                        className="text-xl transition-transform duration-200 text-muted-foreground flex-shrink-0"
                      >
                        {isExpanded ? "▼" : "▶"}
                      </button>
                    </div>
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-border/40 bg-muted/10 px-6 py-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {/* Metrics */}
                      <div>
                        <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                          📊 Metrics
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Mentions:</span>
                            <span className="font-semibold text-foreground">
                              {influencer.stats.totalMentions}
                            </span>
                          </div>
                          <div className="flex items-center justify-between rounded-lg bg-card/50 border border-border px-3 py-2">
                            <span className="text-sm text-muted-foreground">Engagement:</span>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground">
                                {influencer.stats.totalEngagement.toLocaleString()}
                              </span>
                              {influencer.dataQuality.hasEstimatedMetrics && !influencer.dataQuality.hasActualMetrics && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400">
                                  Est.
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between rounded-lg bg-card/50 border border-border px-3 py-2">
                            <span className="text-sm text-muted-foreground">Reach (K):</span>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground">
                                {(influencer.stats.totalReach / 1000).toLocaleString(undefined, { maxFractionDigits: 1 })}
                              </span>
                              {influencer.dataQuality.hasEstimatedMetrics && !influencer.dataQuality.hasActualMetrics && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400">
                                  Est.
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Data Quality Confidence */}
                          <div className="mt-3 pt-3 border-t border-border/40">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-muted-foreground">Data Quality:</span>
                              <div className="flex items-center gap-1">
                                <div className="w-12 h-2 rounded-full bg-muted overflow-hidden">
                                  <div
                                    className={`h-full transition-all ${
                                      influencer.dataQuality.overallConfidence > 0.8
                                        ? "bg-emerald-600"
                                        : influencer.dataQuality.overallConfidence > 0.5
                                        ? "bg-amber-600"
                                        : "bg-orange-600"
                                    }`}
                                    style={{ width: `${influencer.dataQuality.overallConfidence * 100}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs font-bold text-muted-foreground">
                                  {Math.round(influencer.dataQuality.overallConfidence * 100)}%
                                </span>
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground mt-2">
                              {influencer.dataQuality.hasActualMetrics && influencer.dataQuality.hasEstimatedMetrics
                                ? "Mixed data sources"
                                : influencer.dataQuality.hasActualMetrics
                                ? "Verified metrics"
                                : "Estimated metrics"}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Platforms */}
                      <div>
                        <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                          🌐 Platforms
                        </div>
                        <div className="space-y-2">
                          {influencer.platforms.map((p) => (
                            <div
                              key={p.platform}
                              className="flex flex-col rounded-lg bg-card/50 border border-border px-3 py-2 gap-1"
                            >
                              <div className="flex items-center justify-between">
                                <span className="inline-flex items-center gap-2 text-sm">
                                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-blue-600/20 text-xs font-bold">
                                    {platformIcon(p.platform)}
                                  </span>
                                  <span className="font-medium">{platformLabel(p.platform)}</span>
                                </span>
                                <span
                                  className={`rounded-full px-2 py-1 text-xs font-bold ${getScoreColor(
                                    p.influenceScore
                                  )}`}
                                >
                                  {p.influenceScore.toFixed(1)}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground grid grid-cols-2 gap-2">
                                <div>💬 Engagement: {p.engagement.toLocaleString()}</div>
                                <div>📡 Reach: {(p.reach / 1000).toLocaleString(undefined, { maxFractionDigits: 1 })}K</div>
                              </div>
                              {p.isEstimated && (
                                <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                                  ⚡ Estimated metrics
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Sentiment Breakdown */}
                      <div>
                        <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                          💭 Sentiment
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-2 text-sm">
                              <span className="inline-block h-2 w-2 rounded-full bg-emerald-600/40"></span>
                              <span className="text-muted-foreground">Positive</span>
                            </span>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                              {influencer.stats.sentimentBreakdown.positive}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-2 text-sm">
                              <span className="inline-block h-2 w-2 rounded-full bg-amber-600/40"></span>
                              <span className="text-muted-foreground">Neutral</span>
                            </span>
                            <span className="font-semibold text-amber-600 dark:text-amber-400">
                              {influencer.stats.sentimentBreakdown.neutral}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-2 text-sm">
                              <span className="inline-block h-2 w-2 rounded-full bg-red-600/40"></span>
                              <span className="text-muted-foreground">Negative</span>
                            </span>
                            <span className="font-semibold text-red-600 dark:text-red-400">
                              {influencer.stats.sentimentBreakdown.negative}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Results summary */}
      {!loading && !loadingParent && influencers.length > 0 && (
        <div className="text-xs text-muted-foreground text-center">
          Showing {filtered.length} of {influencers.length} influencers
        </div>
      )}
    </div>
  );
}
