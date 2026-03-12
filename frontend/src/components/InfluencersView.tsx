import { useMemo, useState, useEffect } from "react";
import * as collectorApi from "../lib/collectorApi";
import {
  Users, BarChart3, Target, MessageSquare, SlidersHorizontal,
  Globe, Radio, Zap, ThumbsUp, ThumbsDown, Minus,
  ChevronDown, ChevronRight
} from "lucide-react";

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
      return "N";
    default:
      return "\u2022";
  }
}

function getScoreColor(score: number) {
  if (score >= 80) return "text-neon-emerald bg-neon-emerald/10";
  if (score >= 60) return "text-primary bg-primary/10";
  if (score >= 40) return "text-neon-amber bg-neon-amber/10";
  return "text-neon-rose bg-neon-rose/10";
}

function getSentimentColor(sentiment: number) {
  if (sentiment > 0.3) return "text-neon-emerald";
  if (sentiment < -0.3) return "text-neon-rose";
  return "text-neon-amber";
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

  return (
    <div className="flex flex-col gap-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="stat-card">
          <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-neon-cyan" /> Total Influencers
          </div>
          <div className="text-3xl font-bold text-foreground">
            {loading ? "—" : influencers.length}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">Across all platforms</div>
        </div>

        <div className="stat-card">
          <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5 text-neon-violet" /> Avg Score
          </div>
          <div className="text-3xl font-bold text-neon-violet">
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

        <div className="stat-card">
          <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-neon-emerald" /> Top Influencer
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

        <div className="stat-card">
          <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5 text-neon-rose" /> Total Mentions
          </div>
          <div className="text-3xl font-bold text-neon-rose">
            {loading
              ? "—"
              : influencers.reduce((sum, i) => sum + i.stats.totalMentions, 0)}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">By all influencers</div>
        </div>
      </div>

      {/* Filters and Sorting */}
      <div className="rounded-xl border border-border/60 bg-card/50 backdrop-blur p-4 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5" /> Filters & Sorting
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
              className="w-full rounded-lg border border-border/60 bg-card/50 px-3 py-2.5 text-sm font-medium text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
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
              className="w-full rounded-lg border border-border/60 bg-card/50 px-3 py-2.5 text-sm font-medium text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
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
              className="w-full rounded-lg border border-border/60 bg-card/50 px-3 py-2.5 text-sm font-medium text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
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
              className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
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
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
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
                className="rounded-xl border border-border/60 bg-card/50 hover:bg-card/80 transition overflow-hidden hover:border-primary/30 hover:shadow-neon"
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
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-sm font-bold flex-shrink-0">
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
                      <div className="rounded-lg border border-border/60 bg-muted/50 px-3 py-2 text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                        <MessageSquare className="h-3 w-3" /> {influencer.stats.totalEngagement.toLocaleString()}
                      </div>

                      {/* Sentiment Indicator */}
                      <div
                        className={`rounded-lg px-3 py-2 text-xs font-semibold ${getSentimentColor(
                          influencer.stats.avgSentiment
                        )}`}
                      >
                        {influencer.stats.avgSentiment > 0.2
                          ? <><ThumbsUp className="h-3 w-3 inline" /> Positive</>
                          : influencer.stats.avgSentiment < -0.2
                          ? <><ThumbsDown className="h-3 w-3 inline" /> Negative</>
                          : <><Minus className="h-3 w-3 inline" /> Neutral</>}
                      </div>

                      {/* Expand Icon */}
                      <span
                        className="transition-transform duration-200 text-muted-foreground flex-shrink-0"
                      >
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </span>
                    </div>
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-border/40 bg-muted/10 px-6 py-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {/* Metrics */}
                      <div>
                        <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
                          <BarChart3 className="h-3.5 w-3.5" /> Metrics
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Mentions:</span>
                            <span className="font-semibold text-foreground">
                              {influencer.stats.totalMentions}
                            </span>
                          </div>
                          <div className="flex items-center justify-between rounded-lg bg-card/50 border border-border/60 px-3 py-2">
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
                          <div className="flex items-center justify-between rounded-lg bg-card/50 border border-border/60 px-3 py-2">
                            <span className="text-sm text-muted-foreground">Reach (K):</span>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground">
                                {(influencer.stats.totalReach / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}
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
                        <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
                          <Globe className="h-3.5 w-3.5" /> Platforms
                        </div>
                        <div className="space-y-2">
                          {influencer.platforms.map((p) => (
                            <div
                              key={p.platform}
                              className="flex flex-col rounded-lg bg-card/50 border border-border/60 px-3 py-2 gap-1"
                            >
                              <div className="flex items-center justify-between">
                                <span className="inline-flex items-center gap-2 text-sm">
                                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary/20 text-xs font-bold">
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
                                <div className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {p.engagement.toLocaleString()}</div>
                                <div className="flex items-center gap-1"><Radio className="h-3 w-3" /> {(p.reach / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}K</div>
                              </div>
                              {p.isEstimated && (
                                <div className="text-[10px] text-neon-amber font-semibold flex items-center gap-1">
                                  <Zap className="h-3 w-3" /> Estimated metrics
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Sentiment Breakdown */}
                      <div>
                        <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
                          <MessageSquare className="h-3.5 w-3.5" /> Sentiment
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-2 text-sm">
                              <span className="inline-block h-2 w-2 rounded-full bg-emerald-600/40"></span>
                              <span className="text-muted-foreground">Positive</span>
                            </span>
                            <span className="font-semibold text-neon-emerald">
                              {influencer.stats.sentimentBreakdown.positive}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-2 text-sm">
                              <span className="inline-block h-2 w-2 rounded-full bg-amber-600/40"></span>
                              <span className="text-muted-foreground">Neutral</span>
                            </span>
                            <span className="font-semibold text-neon-amber">
                              {influencer.stats.sentimentBreakdown.neutral}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-2 text-sm">
                              <span className="inline-block h-2 w-2 rounded-full bg-red-600/40"></span>
                              <span className="text-muted-foreground">Negative</span>
                            </span>
                            <span className="font-semibold text-neon-rose">
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
