import { useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
  AreaChart, Area,
} from "recharts";
import { Brain, Clock, Award, ArrowUpRight, ArrowDownRight, Zap } from "lucide-react";
import type { ProjectSummaryResponse } from "../../lib/collectorApi";

interface Props {
  summary: ProjectSummaryResponse | null;
  loading: boolean;
}

function platformLabel(p: string) {
  const map: Record<string, string> = { twitter: "Twitter", reddit: "Reddit", youtube: "YouTube", medium: "Medium", linkedin: "LinkedIn", tumblr: "Tumblr", news: "News" };
  return map[p] ?? p;
}

export function DeepAnalysisView({ summary, loading }: Props) {
  const [analysisTab, setAnalysisTab] = useState<"sentiment" | "engagement" | "authors">("sentiment");
  const mentions = summary?.mentions ?? [];
  const analyzed = mentions.filter((m) => m.sentimentStatus === "completed" && m.sentiment?.label);

  // Sentiment score distribution (buckets)
  const scoreDist = useMemo(() => {
    const buckets = [
      { range: "Very Negative", min: -1, max: -0.5, count: 0 },
      { range: "Negative", min: -0.5, max: -0.1, count: 0 },
      { range: "Neutral", min: -0.1, max: 0.1, count: 0 },
      { range: "Positive", min: 0.1, max: 0.5, count: 0 },
      { range: "Very Positive", min: 0.5, max: 1, count: 0 },
    ];
    for (const m of analyzed) {
      const score = m.sentiment?.final_score ?? 0;
      for (const b of buckets) {
        if (score >= b.min && score < b.max) { b.count++; break; }
      }
    }
    return buckets;
  }, [analyzed]);

  // Per-platform sentiment radar
  const radarData = useMemo(() => {
    const map = new Map<string, { pos: number; neg: number; neu: number; total: number }>();
    for (const m of analyzed) {
      const p = m.platform;
      const row = map.get(p) || { pos: 0, neg: 0, neu: 0, total: 0 };
      const l = (m.sentiment!.label ?? "").toLowerCase();
      if (l === "positive") row.pos++;
      else if (l === "negative") row.neg++;
      else row.neu++;
      row.total++;
      map.set(p, row);
    }
    return Array.from(map.entries()).map(([platform, d]) => ({
      platform: platformLabel(platform),
      positive: d.total ? Math.round(d.pos / d.total * 100) : 0,
      negative: d.total ? Math.round(d.neg / d.total * 100) : 0,
      neutral: d.total ? Math.round(d.neu / d.total * 100) : 0,
    }));
  }, [analyzed]);

  // Top authors
  const topAuthors = useMemo(() => {
    const map = new Map<string, { count: number; avgScore: number; totalScore: number }>();
    for (const m of analyzed) {
      const author = m.author || "Anonymous";
      const row = map.get(author) || { count: 0, avgScore: 0, totalScore: 0 };
      row.count++;
      row.totalScore += m.sentiment?.final_score ?? 0;
      row.avgScore = row.totalScore / row.count;
      map.set(author, row);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([author, data]) => ({ author, ...data }));
  }, [analyzed]);

  // Hourly activity pattern
  const hourlyData = useMemo(() => {
    const hours = new Array(24).fill(0);
    for (const m of mentions) {
      if (m.publishedAt) {
        const h = new Date(m.publishedAt).getHours();
        hours[h]++;
      }
    }
    return hours.map((count, h) => ({ hour: `${h.toString().padStart(2, "0")}:00`, count }));
  }, [mentions]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl p-12 text-center">
        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" /> Analyzing data…
        </div>
      </div>
    );
  }

  if (!summary || mentions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/80 backdrop-blur-xl p-12 text-center">
        <Brain className="h-10 w-10 text-primary mx-auto mb-3 opacity-60" />
        <p className="text-foreground font-semibold">No data for analysis</p>
        <p className="text-sm text-muted-foreground mt-1">Run a collection first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab selector */}
      <div className="flex gap-3 flex-wrap">
        {([
          ["sentiment", Brain, "Sentiment Patterns"],
          ["engagement", Zap, "Activity Patterns"],
          ["authors", Award, "Top Authors"],
        ] as const).map(([key, Icon, label]) => (
          <button key={key} onClick={() => setAnalysisTab(key)} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition duration-200 border ${analysisTab === key ? "border-primary/50 bg-primary/10 text-primary shadow-neon" : "border-border bg-transparent text-muted-foreground hover:text-foreground"}`}>
            <Icon className="h-4 w-4" />{label}
          </button>
        ))}
      </div>

      {analysisTab === "sentiment" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Score Distribution */}
          <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl p-6 shadow-neon">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Score Distribution</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreDist}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                  <XAxis dataKey="range" stroke="hsl(var(--muted-foreground))" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                  <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "10px" }} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} animationDuration={800} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Platform Sentiment Radar */}
          <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl p-6 shadow-neon">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Platform Sentiment Radar</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="platform" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <PolarRadiusAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                  <Radar name="Positive %" dataKey="positive" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
                  <Radar name="Negative %" dataKey="negative" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} />
                  <Legend wrapperStyle={{ paddingTop: 8 }} formatter={(v) => <span className="text-xs text-muted-foreground">{String(v)}</span>} iconType="circle" iconSize={6} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {analysisTab === "engagement" && (
        <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl p-6 shadow-neon">
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4" /> Hourly Activity Pattern
          </h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "10px" }} />
                <Area type="monotone" dataKey="count" name="Mentions" stroke="#06b6d4" strokeWidth={2} fill="url(#actGrad)" animationDuration={800} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {analysisTab === "authors" && (
        <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl p-6 shadow-neon">
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
            <Award className="h-4 w-4" /> Top Authors by Volume
          </h3>
          <div className="space-y-3">
            {topAuthors.map((a, i) => (
              <div key={a.author} className="flex items-center gap-4 rounded-lg border border-border/60 bg-card/50 p-4 hover:shadow-neon transition duration-200">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                  #{i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{a.author}</p>
                  <p className="text-xs text-muted-foreground">{a.count} mention{a.count !== 1 ? "s" : ""}</p>
                </div>
                <div className="flex items-center gap-1 text-sm font-bold">
                  {a.avgScore > 0.05 ? (
                    <><ArrowUpRight className="h-4 w-4 text-emerald-500" /><span className="text-emerald-500">{(a.avgScore * 100).toFixed(0)}%</span></>
                  ) : a.avgScore < -0.05 ? (
                    <><ArrowDownRight className="h-4 w-4 text-red-500" /><span className="text-red-500">{(a.avgScore * 100).toFixed(0)}%</span></>
                  ) : (
                    <span className="text-gray-400">Neutral</span>
                  )}
                </div>
              </div>
            ))}
            {topAuthors.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No author data available.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
