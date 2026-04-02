import { useMemo } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { Globe, ExternalLink } from "lucide-react";
import type { ProjectSummaryResponse } from "../../lib/collectorApi";

const PLATFORM_COLORS: Record<string, string> = {
  twitter: "#1DA1F2", reddit: "#FF4500", youtube: "#FF0000",
  medium: "#00AB6C", linkedin: "#0A66C2", tumblr: "#35465C",
  news: "#8b5cf6",
};

function platformLabel(p: string) {
  const map: Record<string, string> = { twitter: "Twitter", reddit: "Reddit", youtube: "YouTube", medium: "Medium", linkedin: "LinkedIn", tumblr: "Tumblr", news: "News" };
  return map[p] ?? p;
}

function platformIcon(p: string) {
  const map: Record<string, string> = { twitter: "𝕏", reddit: "r/", youtube: "▶", medium: "M", linkedin: "in", tumblr: "t", news: "N" };
  return map[p] ?? "•";
}

interface Props {
  summary: ProjectSummaryResponse | null;
  loading: boolean;
}

export function SourcesView({ summary, loading }: Props) {
  const mentions = summary?.mentions ?? [];
  const byPlatform = summary?.byPlatform ?? [];

  const platformData = useMemo(() => {
    return byPlatform.map((p) => ({
      ...p,
      label: platformLabel(p.platform),
      color: PLATFORM_COLORS[p.platform] ?? "#8b5cf6",
    }));
  }, [byPlatform]);

  const platformDetails = useMemo(() => {
    const map = new Map<string, { count: number; positive: number; negative: number; neutral: number; latestMentions: typeof mentions }>();

    for (const m of mentions) {
      const row = map.get(m.platform) || { count: 0, positive: 0, negative: 0, neutral: 0, latestMentions: [] };
      row.count++;
      if (m.sentimentStatus === "completed" && m.sentiment?.label) {
        const l = m.sentiment.label.toLowerCase();
        if (l === "positive") row.positive++;
        else if (l === "negative") row.negative++;
        else row.neutral++;
      }
      if (row.latestMentions.length < 3) row.latestMentions.push(m);
      map.set(m.platform, row);
    }

    return Array.from(map.entries())
      .map(([platform, data]) => ({ platform, label: platformLabel(platform), icon: platformIcon(platform), color: PLATFORM_COLORS[platform] ?? "#8b5cf6", ...data }))
      .sort((a, b) => b.count - a.count);
  }, [mentions]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl p-12 text-center">
        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" /> Loading sources…
        </div>
      </div>
    );
  }

  if (!summary || mentions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/80 backdrop-blur-xl p-12 text-center">
        <Globe className="h-10 w-10 text-primary mx-auto mb-3 opacity-60" />
        <p className="text-foreground font-semibold">No source data</p>
        <p className="text-sm text-muted-foreground mt-1">Run a collection to see source breakdown.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform distribution pie */}
        <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl p-6 shadow-neon">
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Platform Share</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={platformData} cx="50%" cy="50%" outerRadius={100} dataKey="count" nameKey="label" animationDuration={800} label={({ label, percent }) => `${label} ${(percent * 100).toFixed(0)}%`}>
                  {platformData.map((e, i) => <Cell key={i} fill={e.color} stroke="transparent" />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "10px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Platform bar comparison */}
        <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl p-6 shadow-neon">
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Mentions by Platform</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "10px" }} />
                <Bar dataKey="count" name="Mentions" radius={[6, 6, 0, 0]} animationDuration={800}>
                  {platformData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed per-platform cards */}
      <div className="space-y-4">
        {platformDetails.map((p) => (
          <div key={p.platform} className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl p-6 shadow-neon hover:shadow-neon-lg transition duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold text-white" style={{ backgroundColor: p.color }}>{p.icon}</span>
                <div>
                  <h4 className="text-base font-bold text-foreground">{p.label}</h4>
                  <p className="text-xs text-muted-foreground">{p.count} mention{p.count !== 1 ? "s" : ""} collected</p>
                </div>
              </div>
              <div className="flex gap-3 text-xs font-semibold">
                <span className="rounded-full bg-emerald-500/20 text-emerald-500 px-3 py-1">{p.positive} positive</span>
                <span className="rounded-full bg-red-500/20 text-red-500 px-3 py-1">{p.negative} negative</span>
                <span className="rounded-full bg-gray-500/20 text-gray-400 px-3 py-1">{p.neutral} neutral</span>
              </div>
            </div>

            {/* Sentiment bar */}
            <div className="h-2 rounded-full bg-muted overflow-hidden flex mb-4">
              {(p.positive + p.negative + p.neutral) > 0 && (
                <>
                  <div className="bg-emerald-500 h-full" style={{ width: `${(p.positive / (p.positive + p.negative + p.neutral)) * 100}%` }} />
                  <div className="bg-gray-400 h-full" style={{ width: `${(p.neutral / (p.positive + p.negative + p.neutral)) * 100}%` }} />
                  <div className="bg-red-500 h-full" style={{ width: `${(p.negative / (p.positive + p.negative + p.neutral)) * 100}%` }} />
                </>
              )}
            </div>

            {/* Latest mentions */}
            <div className="space-y-2">
              {p.latestMentions.map((m) => (
                <div key={m.id} className="rounded-lg border border-border/40 bg-card/30 px-4 py-3 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground line-clamp-1">{m.content || m.metadata?.title || "No content"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{m.author ? `By ${m.author} · ` : ""}{new Date(m.publishedAt).toLocaleDateString()}</p>
                  </div>
                  {m.sourceUrl && (
                    <a href={m.sourceUrl} target="_blank" rel="noreferrer" className="text-primary hover:text-primary/80 transition flex-shrink-0">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
