import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";
import { Scale, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { ProjectSummaryResponse } from "../../lib/collectorApi";

const PLATFORM_COLORS: Record<string, string> = {
  twitter: "#1DA1F2", reddit: "#FF4500", youtube: "#FF0000",
  medium: "#00AB6C", linkedin: "#0A66C2", tumblr: "#35465C", news: "#8b5cf6",
};

function platformLabel(p: string) {
  const map: Record<string, string> = { twitter: "Twitter", reddit: "Reddit", youtube: "YouTube", medium: "Medium", linkedin: "LinkedIn", tumblr: "Tumblr", news: "News" };
  return map[p] ?? p;
}

interface Props {
  summary: ProjectSummaryResponse | null;
  loading: boolean;
}

export function ComparisonView({ summary, loading }: Props) {
  const mentions = summary?.mentions ?? [];

  const comparisonData = useMemo(() => {
    const map = new Map<string, { total: number; positive: number; negative: number; neutral: number; avgScore: number; totalScore: number; authors: Set<string> }>();

    for (const m of mentions) {
      const row = map.get(m.platform) || { total: 0, positive: 0, negative: 0, neutral: 0, avgScore: 0, totalScore: 0, authors: new Set<string>() };
      row.total++;
      if (m.author) row.authors.add(m.author);
      if (m.sentimentStatus === "completed" && m.sentiment?.label) {
        const l = m.sentiment.label.toLowerCase();
        if (l === "positive") row.positive++;
        else if (l === "negative") row.negative++;
        else row.neutral++;
        row.totalScore += m.sentiment.final_score ?? 0;
        row.avgScore = row.totalScore / (row.positive + row.negative + row.neutral);
      }
      map.set(m.platform, row);
    }

    return Array.from(map.entries())
      .map(([platform, d]) => ({
        platform,
        label: platformLabel(platform),
        color: PLATFORM_COLORS[platform] ?? "#8b5cf6",
        total: d.total,
        positive: d.positive,
        negative: d.negative,
        neutral: d.neutral,
        avgScore: d.avgScore,
        positiveRate: d.total ? Math.round(d.positive / d.total * 100) : 0,
        negativeRate: d.total ? Math.round(d.negative / d.total * 100) : 0,
        uniqueAuthors: d.authors.size,
      }))
      .sort((a, b) => b.total - a.total);
  }, [mentions]);

  const barData = useMemo(() => comparisonData.map((d) => ({
    label: d.label,
    Positive: d.positive,
    Negative: d.negative,
    Neutral: d.neutral,
  })), [comparisonData]);

  const radarData = useMemo(() => comparisonData.map((d) => ({
    platform: d.label,
    mentions: d.total,
    positiveRate: d.positiveRate,
    authors: d.uniqueAuthors,
  })), [comparisonData]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl p-12 text-center">
        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground"><div className="h-2 w-2 rounded-full bg-primary animate-pulse" /> Loading comparison…</div>
      </div>
    );
  }

  if (!summary || mentions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/80 backdrop-blur-xl p-12 text-center">
        <Scale className="h-10 w-10 text-primary mx-auto mb-3 opacity-60" />
        <p className="text-foreground font-semibold">No data to compare</p>
        <p className="text-sm text-muted-foreground mt-1">Run a collection first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stacked bar chart */}
      <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl p-6 shadow-neon">
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Platform Sentiment Comparison</h3>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "10px" }} />
              <Legend wrapperStyle={{ paddingTop: 12 }} formatter={(v) => <span className="text-xs text-muted-foreground">{String(v)}</span>} iconType="circle" iconSize={6} />
              <Bar dataKey="Positive" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Neutral" stackId="a" fill="#6b7280" />
              <Bar dataKey="Negative" stackId="a" fill="#ef4444" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Radar + Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl p-6 shadow-neon">
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Multi-Metric Radar</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="platform" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <PolarRadiusAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                <Radar name="Mentions" dataKey="mentions" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.3} />
                <Radar name="Positive %" dataKey="positiveRate" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} />
                <Legend wrapperStyle={{ paddingTop: 8 }} formatter={(v) => <span className="text-xs text-muted-foreground">{String(v)}</span>} iconType="circle" iconSize={6} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Comparison table */}
        <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl p-6 shadow-neon overflow-x-auto">
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Detailed Comparison</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-3 text-muted-foreground font-semibold">Platform</th>
                <th className="pb-3 text-muted-foreground font-semibold text-center">Mentions</th>
                <th className="pb-3 text-muted-foreground font-semibold text-center">Positive</th>
                <th className="pb-3 text-muted-foreground font-semibold text-center">Negative</th>
                <th className="pb-3 text-muted-foreground font-semibold text-center">Score</th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((d) => (
                <tr key={d.platform} className="border-b border-border/40 hover:bg-muted/30 transition">
                  <td className="py-3 font-medium text-foreground flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
                    {d.label}
                  </td>
                  <td className="py-3 text-center text-foreground font-bold">{d.total}</td>
                  <td className="py-3 text-center text-emerald-500 font-semibold">{d.positiveRate}%</td>
                  <td className="py-3 text-center text-red-500 font-semibold">{d.negativeRate}%</td>
                  <td className="py-3 text-center">
                    <span className="inline-flex items-center gap-1 font-bold">
                      {d.avgScore > 0.05 ? <><ArrowUpRight className="h-3 w-3 text-emerald-500" /><span className="text-emerald-500">{(d.avgScore * 100).toFixed(0)}</span></> : d.avgScore < -0.05 ? <><ArrowDownRight className="h-3 w-3 text-red-500" /><span className="text-red-500">{(d.avgScore * 100).toFixed(0)}</span></> : <span className="text-gray-400">0</span>}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
