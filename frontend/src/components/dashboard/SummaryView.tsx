import { useMemo } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import {
  ThumbsUp, ThumbsDown, Minus, Hash, Activity, TrendingUp,
  Sparkles, Eye, Target,
} from "lucide-react";
import type { ProjectSummaryResponse } from "../../lib/collectorApi";

const COLORS = { positive: "#22c55e", neutral: "#6b7280", negative: "#ef4444" };

interface Props {
  summary: ProjectSummaryResponse | null;
  loading: boolean;
  keyword?: string;
}

export function SummaryView({ summary, loading, keyword }: Props) {
  const mentions = summary?.mentions ?? [];
  const analyzed = mentions.filter((m) => m.sentimentStatus === "completed" && m.sentiment?.label);

  const sentimentDist = useMemo(() => {
    let pos = 0, neu = 0, neg = 0;
    for (const m of analyzed) {
      const l = (m.sentiment!.label ?? "").toLowerCase();
      if (l === "positive") pos++;
      else if (l === "negative") neg++;
      else neu++;
    }
    return [
      { name: "Positive", value: pos, color: COLORS.positive },
      { name: "Neutral", value: neu, color: COLORS.neutral },
      { name: "Negative", value: neg, color: COLORS.negative },
    ];
  }, [analyzed]);

  const totalAnalyzed = analyzed.length;
  const posCount = sentimentDist[0].value;
  const neuCount = sentimentDist[1].value;
  const negCount = sentimentDist[2].value;
  const posPct = totalAnalyzed ? ((posCount / totalAnalyzed) * 100).toFixed(1) : "0";
  const negPct = totalAnalyzed ? ((negCount / totalAnalyzed) * 100).toFixed(1) : "0";
  const neuPct = totalAnalyzed ? ((neuCount / totalAnalyzed) * 100).toFixed(1) : "0";

  const avgConf = useMemo(() => {
    if (!analyzed.length) return 0;
    const sum = analyzed.reduce((a, m) => a + (m.sentiment?.confidence ?? 0), 0);
    return (sum / analyzed.length * 100).toFixed(1);
  }, [analyzed]);

  const topPlatform = useMemo(() => {
    const bp = summary?.byPlatform ?? [];
    if (!bp.length) return "N/A";
    return bp.reduce((a, b) => (b.count > a.count ? b : a), bp[0]).platform;
  }, [summary]);

  // Word frequency from content
  const wordFreq = useMemo(() => {
    const stopWords = new Set(["the","a","an","is","are","was","were","be","been","being","have","has","had","do","does","did","will","would","could","should","may","might","shall","can","to","of","in","for","on","with","at","by","from","as","into","through","during","before","after","above","below","between","out","off","over","under","again","further","then","once","here","there","when","where","why","how","all","each","every","both","few","more","most","other","some","such","no","nor","not","only","own","same","so","than","too","very","just","because","but","and","or","if","while","about","up","it","its","this","that","these","those","i","me","my","we","our","you","your","he","him","his","she","her","they","them","their","what","which","who","whom"]);
    const freq = new Map<string, number>();
    for (const m of mentions) {
      const words = (m.content ?? "").toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/);
      for (const w of words) {
        if (w.length > 2 && !stopWords.has(w)) {
          freq.set(w, (freq.get(w) ?? 0) + 1);
        }
      }
    }
    return Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));
  }, [mentions]);

  const overallSentiment = posCount >= negCount ? (posCount > neuCount ? "Positive" : "Neutral") : "Negative";

  if (loading) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl p-12 text-center">
        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" /> Loading summary…
        </div>
      </div>
    );
  }

  if (!summary || mentions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/80 backdrop-blur-xl p-12 text-center">
        <Sparkles className="h-10 w-10 text-primary mx-auto mb-3 opacity-60" />
        <p className="text-foreground font-semibold">No data yet</p>
        <p className="text-sm text-muted-foreground mt-1">Run a collection to generate the summary.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Mentions", value: summary.totalMentions, icon: Hash, color: "text-primary" },
          { label: "Positive", value: `${posPct}%`, icon: ThumbsUp, color: "text-emerald-500" },
          { label: "Negative", value: `${negPct}%`, icon: ThumbsDown, color: "text-red-500" },
          { label: "Neutral", value: `${neuPct}%`, icon: Minus, color: "text-gray-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border/60 bg-card/80 backdrop-blur-xl p-4 hover:shadow-neon transition duration-200">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{s.label}</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Sentiment donut + AI Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl p-6 shadow-neon">
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4" /> Sentiment Distribution
          </h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sentimentDist} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={4} dataKey="value" animationDuration={800}>
                  {sentimentDist.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "10px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-2">
            {sentimentDist.map((s) => (
              <div key={s.name} className="flex items-center gap-2 text-xs">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-muted-foreground font-medium">{s.name}: {s.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl p-6 shadow-neon">
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> AI Summary
          </h3>
          <div className="space-y-3 text-sm text-foreground leading-relaxed">
            <p>
              Based on <strong>{summary.totalMentions}</strong> collected mentions for "<strong>{keyword ?? "this project"}</strong>",
              the overall sentiment is <span className={`font-bold ${overallSentiment === "Positive" ? "text-emerald-500" : overallSentiment === "Negative" ? "text-red-500" : "text-gray-400"}`}>{overallSentiment}</span>.
            </p>
            <p>
              <strong>{posPct}%</strong> of mentions are positive, <strong>{negPct}%</strong> negative, and <strong>{neuPct}%</strong> neutral. The average confidence score is <strong>{avgConf}%</strong>.
            </p>
            <p>
              The most active platform is <strong className="capitalize">{topPlatform}</strong> with{" "}
              <strong>{summary.byPlatform?.find((p) => p.platform === topPlatform)?.count ?? 0}</strong> mentions.
              Data spans across <strong>{summary.byPlatform?.length ?? 0}</strong> platforms.
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Eye className="h-3 w-3" /> {totalAnalyzed} Analyzed
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-500">
              <Target className="h-3 w-3" /> {avgConf}% Confidence
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-500">
              <TrendingUp className="h-3 w-3" /> {summary.byPlatform?.length} Platforms
            </span>
          </div>
        </div>
      </div>

      {/* Top keywords bar chart */}
      {wordFreq.length > 0 && (
        <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl p-6 shadow-neon">
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
            <Hash className="h-4 w-4" /> Top Keywords
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={wordFreq} layout="vertical" margin={{ left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <YAxis type="category" dataKey="word" stroke="hsl(var(--muted-foreground))" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} width={55} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "10px" }} />
                <Bar dataKey="count" name="Frequency" fill="#8b5cf6" radius={[0, 6, 6, 0]} animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
