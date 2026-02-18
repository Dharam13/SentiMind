import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useAuth } from "../contexts/AuthContext";
import * as projectApi from "../lib/projectApi";
import * as collectorApi from "../lib/collectorApi";

type Project = projectApi.Project;

type SourceFilter = "all" | "social" | "news" | "blogs";
type NavItem = "mentions" | "summary" | "analysis" | "sources" | "influencers" | "comparison";
type GraphTab = "mentions-reach" | "sentiment";

function platformLabel(platform: string) {
  switch (platform) {
    case "twitter":
      return "Twitter";
    case "reddit":
      return "Reddit";
    case "youtube":
      return "YouTube";
    case "tumblr":
      return "Tumblr";
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
    case "tumblr":
      return "t";
    case "news":
      return "📰";
    default:
      return "•";
  }
}

function isPlatformIncluded(platform: string, filter: SourceFilter) {
  if (filter === "all") return true;
  if (filter === "news") return platform === "news";
  if (filter === "blogs") return platform === "tumblr";
  if (filter === "social") return platform === "twitter" || platform === "reddit" || platform === "youtube";
  return true;
}

export function ProjectDashboard() {
  const { id } = useParams();
  const projectId = useMemo(() => parseInt(String(id), 10), [id]);
  const { user, accessToken, loading } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [nav, setNav] = useState<NavItem>("mentions");
  const [graphTab, setGraphTab] = useState<GraphTab>("mentions-reach");

  const [hours, setHours] = useState<number>(24);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");

  const [summary, setSummary] = useState<collectorApi.ProjectSummaryResponse | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingProject, setLoadingProject] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login", { replace: true });
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!accessToken || !Number.isFinite(projectId)) return;
    setLoadingProject(true);
    setError(null);
    projectApi
      .getProject(accessToken, projectId)
      .then((res) => setProject(res.project))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load project"))
      .finally(() => setLoadingProject(false));
  }, [accessToken, projectId]);

  useEffect(() => {
    if (!Number.isFinite(projectId)) return;
    if (!project) return;
    setLoadingSummary(true);
    setError(null);
    // Fetch overall results for the project (not filtered by keyword)
    collectorApi
      .getProjectSummary({ projectId, hours })
      .then((res) => setSummary(res))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load summary"))
      .finally(() => setLoadingSummary(false));
  }, [projectId, project, hours]);

  const mentionsReachData = useMemo(() => {
    const ts = summary?.timeSeries ?? [];
    return ts.map((p) => ({
      date: p.date,
      mentions: p.count,
      reach: p.count * 120,
    }));
  }, [summary]);

  // Generate dummy sentiment data similar to the image
  const sentimentData = useMemo(() => {
    const now = Date.now();
    const points = 24;
    const data = [];
    for (let i = points - 1; i >= 0; i--) {
      const t = new Date(now - i * 60 * 60 * 1000);
      const basePositive = 52 + Math.sin(i * 0.4) * 12 + Math.random() * 6;
      const baseNegative = 25 + Math.sin(i * 0.3) * 5 + Math.random() * 4;
      const neutral = Math.max(0, 100 - basePositive - baseNegative);
      data.push({
        time: t.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        positive: Math.round(basePositive * 10) / 10,
        neutral: Math.round(neutral * 10) / 10,
        negative: Math.round(baseNegative * 10) / 10,
      });
    }
    return data;
  }, []);

  const byPlatform = useMemo(() => {
    const pts = summary?.byPlatform ?? [];
    const map = new Map<string, number>();
    for (const p of pts) {
      map.set(p.platform, p.count);
    }
    return map;
  }, [summary]);

  const recentMentions = useMemo(() => {
    const m = summary?.mentions ?? [];
    return m.filter((x) => isPlatformIncluded(x.platform, sourceFilter));
  }, [summary, sourceFilter]);

  async function handleRun() {
    if (!project) return;
    setRunning(true);
    setError(null);
    try {
      await collectorApi.runCollection({
        projectId: project.id,
        keyword: project.primaryKeyword,
        limit: 50,
        hours,
      });
      const res = await collectorApi.getProjectSummary({
        projectId: project.id,
        hours,
      });
      setSummary(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Collector run failed");
    } finally {
      setRunning(false);
    }
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-senti-dark text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-senti-dark to-senti-dark" />

      <div className="relative flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-72 flex-shrink-0 border-r border-senti-border bg-senti-card/40 backdrop-blur md:flex md:flex-col">
          <div className="flex h-16 items-center justify-between border-b border-senti-border px-6">
            <Link
              to="/projects"
              className="bg-gradient-to-r from-senti-purple to-senti-blue bg-clip-text text-lg font-semibold text-transparent"
            >
              Sentimind
            </Link>
            <span className="rounded-full bg-senti-purple/15 px-2 py-0.5 text-[10px] font-semibold text-senti-purple">
              Dashboard
            </span>
          </div>

          <nav className="flex-1 px-3 py-4 text-sm">
            <div className="px-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Workspace
            </div>
            <div className="mt-2 space-y-1">
              {(
                [
                  ["mentions", "Mentions"],
                  ["summary", "Summary"],
                  ["analysis", "Analysis"],
                  ["sources", "Sources"],
                  ["influencers", "Influencers"],
                  ["comparison", "Comparison"],
                ] as Array<[NavItem, string]>
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setNav(key)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition ${
                    nav === key
                      ? "bg-senti-purple/15 text-gray-100"
                      : "text-gray-400 hover:bg-senti-card/40 hover:text-gray-100"
                  }`}
                >
                  <span>{label}</span>
                  <span className="text-xs text-gray-500">›</span>
                </button>
              ))}
            </div>

            <div className="mt-6 px-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Reports
            </div>
            <div className="mt-2 space-y-1">
              {["Email reports", "PDF report", "Excel export", "Infographic"].map((label) => (
                <button
                  key={label}
                  type="button"
                  disabled
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-gray-500 hover:bg-senti-card/30"
                >
                  <span>{label}</span>
                  <span className="text-[10px] text-gray-600">soon</span>
                </button>
              ))}
            </div>
          </nav>
        </aside>

        {/* Main */}
        <div className="flex min-h-screen flex-1 flex-col">
          {/* Top bar */}
          <header className="flex h-16 items-center justify-between gap-3 border-b border-senti-border bg-senti-dark/90 px-4 backdrop-blur md:px-6">
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Project
              </div>
              <div className="truncate text-lg font-semibold text-gray-50">
                {loadingProject ? "Loading…" : project?.primaryKeyword ?? "Unknown project"}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <select
                value={hours}
                onChange={(e) => setHours(parseInt(e.target.value, 10))}
                className="rounded-xl border border-senti-border bg-senti-card/60 px-3 py-2 text-xs text-gray-100 focus:border-senti-purple focus:outline-none"
              >
                <option value={24}>Last 24h</option>
                <option value={168}>Last 7d</option>
                <option value={720}>Last 30d</option>
              </select>
              <button
                type="button"
                disabled={running}
                onClick={handleRun}
                className="inline-flex items-center rounded-xl bg-gradient-to-r from-senti-purple to-senti-blue px-4 py-2 text-xs font-semibold text-white shadow disabled:opacity-60"
              >
                {running ? "Running…" : "Run"}
              </button>
            </div>
          </header>

          <main className="relative flex flex-1 flex-col gap-4 overflow-hidden px-4 py-4 md:px-6 md:py-6">
            {error && (
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {error}
              </div>
            )}

            <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
              {/* Center */}
              <section className="flex min-h-0 flex-col gap-4">
                <div className="rounded-2xl border border-senti-border bg-senti-card/70 p-4 md:p-6">
                  <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Overview
                      </div>
                      <div className="mb-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setGraphTab("mentions-reach")}
                          className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
                            graphTab === "mentions-reach"
                              ? "bg-senti-purple/20 text-gray-100"
                              : "text-gray-400 hover:text-gray-200"
                          }`}
                        >
                          Mentions & Reach
                        </button>
                        <button
                          type="button"
                          onClick={() => setGraphTab("sentiment")}
                          className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
                            graphTab === "sentiment"
                              ? "bg-senti-purple/20 text-gray-100"
                              : "text-gray-400 hover:text-gray-200"
                          }`}
                        >
                          Sentiment
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {loadingSummary ? "Loading…" : `${summary?.totalMentions ?? 0} mentions`}
                    </div>
                  </div>

                  <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      {graphTab === "mentions-reach" ? (
                        <AreaChart
                          data={mentionsReachData}
                          margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="mentionsFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                              <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="reachFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.25} />
                              <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
                          <XAxis
                            dataKey="date"
                            stroke="#6b7280"
                            tick={{ fill: "#9ca3af", fontSize: 12 }}
                            axisLine={{ stroke: "#2a2a4a" }}
                          />
                          <YAxis
                            stroke="#6b7280"
                            tick={{ fill: "#9ca3af", fontSize: 12 }}
                            axisLine={{ stroke: "#2a2a4a" }}
                            tickFormatter={(v) => `${v}`}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#1a1a2e",
                              border: "1px solid #2a2a4a",
                              borderRadius: "10px",
                            }}
                            labelStyle={{ color: "#fff" }}
                          />
                          <Area
                            type="monotone"
                            dataKey="mentions"
                            name="Mentions"
                            stroke="#8b5cf6"
                            strokeWidth={2}
                            fill="url(#mentionsFill)"
                            isAnimationActive
                            animationDuration={900}
                            animationEasing="ease-out"
                          />
                          <Area
                            type="monotone"
                            dataKey="reach"
                            name="Reach (proxy)"
                            stroke="#38bdf8"
                            strokeWidth={2}
                            fill="url(#reachFill)"
                            isAnimationActive
                            animationDuration={900}
                            animationEasing="ease-out"
                          />
                        </AreaChart>
                      ) : (
                        <AreaChart
                          data={sentimentData}
                          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="positiveFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.4} />
                              <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="neutralFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#6b7280" stopOpacity={0.4} />
                              <stop offset="100%" stopColor="#6b7280" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="negativeFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
                              <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
                          <XAxis
                            dataKey="time"
                            stroke="#6b7280"
                            tick={{ fill: "#9ca3af", fontSize: 12 }}
                            axisLine={{ stroke: "#2a2a4a" }}
                          />
                          <YAxis
                            stroke="#6b7280"
                            tick={{ fill: "#9ca3af", fontSize: 12 }}
                            axisLine={{ stroke: "#2a2a4a" }}
                            domain={[0, 100]}
                            tickFormatter={(v) => `${v}`}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#1a1a2e",
                              border: "1px solid #2a2a4a",
                              borderRadius: "8px",
                            }}
                            labelStyle={{ color: "#fff" }}
                            formatter={(value: number) => [value.toFixed(1), ""]}
                            labelFormatter={(label) => `Time: ${label}`}
                          />
                          <Legend
                            wrapperStyle={{ paddingTop: 12 }}
                            formatter={(value) => (
                              <span className="text-sm text-gray-300">{value}</span>
                            )}
                            iconType="circle"
                            iconSize={8}
                          />
                          <Area
                            type="monotone"
                            dataKey="positive"
                            name="Positive"
                            stroke="#22c55e"
                            strokeWidth={2}
                            fill="url(#positiveFill)"
                            isAnimationActive
                            animationDuration={1000}
                            animationEasing="ease-out"
                          />
                          <Area
                            type="monotone"
                            dataKey="neutral"
                            name="Neutral"
                            stroke="#6b7280"
                            strokeWidth={2}
                            fill="url(#neutralFill)"
                            isAnimationActive
                            animationDuration={1000}
                            animationEasing="ease-out"
                          />
                          <Area
                            type="monotone"
                            dataKey="negative"
                            name="Negative"
                            stroke="#ef4444"
                            strokeWidth={2}
                            fill="url(#negativeFill)"
                            isAnimationActive
                            animationDuration={1000}
                            animationEasing="ease-out"
                          />
                        </AreaChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="min-h-0 rounded-2xl border border-senti-border bg-senti-card/70 p-4 md:p-6">
                  <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Feed
                      </div>
                      <div className="text-lg font-semibold text-gray-50">Recent mentions</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={sourceFilter}
                        onChange={(e) => setSourceFilter(e.target.value as SourceFilter)}
                        className="rounded-xl border border-senti-border bg-senti-card/60 px-3 py-1.5 text-xs text-gray-100 focus:border-senti-purple focus:outline-none"
                      >
                        <option value="all">All sources</option>
                        <option value="social">Social Media</option>
                        <option value="news">News</option>
                        <option value="blogs">Blogs</option>
                      </select>
                      <Link
                        to="/projects"
                        className="text-xs font-medium text-gray-400 hover:text-gray-100"
                      >
                        Back to projects
                      </Link>
                    </div>
                  </div>

                  {loadingSummary ? (
                    <div className="py-8 text-center text-sm text-gray-400">Loading mentions…</div>
                  ) : recentMentions.length === 0 ? (
                    <div className="rounded-xl bg-senti-dark/60 p-4 text-sm text-gray-400">
                      No mentions in this time window. Click <span className="text-gray-200">Run</span>{" "}
                      to collect fresh data.
                    </div>
                  ) : (
                    <ul className="max-h-[320px] space-y-2 overflow-auto pr-1">
                      {recentMentions.slice(0, 30).map((m) => (
                        <li
                          key={m.id}
                          className="rounded-xl border border-senti-border bg-senti-dark/60 p-3"
                        >
                          <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-xs">
                            <span className="inline-flex items-center gap-2 text-gray-300">
                              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-senti-purple/20 px-1 text-[11px] font-semibold text-senti-purple">
                                {platformIcon(m.platform)}
                              </span>
                              <span className="font-medium">{platformLabel(m.platform)}</span>
                              <span className="text-gray-500">•</span>
                              <span className="text-gray-500">
                                {new Date(m.publishedAt).toLocaleString()}
                              </span>
                            </span>
                            {m.sourceUrl ? (
                              <a
                                href={m.sourceUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-gray-400 hover:text-white"
                              >
                                Open ↗
                              </a>
                            ) : null}
                          </div>
                          <div className="text-sm text-gray-200">
                            {(m.content || "").trim() || "No content"}
                          </div>
                          {(m.author || m.metadata?.title) && (
                            <div className="mt-2 text-xs text-gray-500">
                              {m.author ? `By ${m.author}` : m.metadata?.title}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>

              {/* Right rail */}
              <aside className="flex flex-col gap-4">
                <div className="rounded-2xl border border-senti-border bg-senti-card/70 p-4">
                  <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Sources
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {["twitter", "reddit", "youtube", "news", "tumblr"].map((p) => (
                      <div
                        key={p}
                        className="rounded-xl border border-senti-border bg-senti-dark/60 p-3"
                      >
                        <div className="mb-1 flex items-center justify-between text-xs text-gray-400">
                          <span className="inline-flex items-center gap-2">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-senti-card/60 text-[12px] font-semibold text-gray-100">
                              {platformIcon(p)}
                            </span>
                            {platformLabel(p)}
                          </span>
                        </div>
                        <div className="text-lg font-semibold text-gray-50">
                          {byPlatform.get(p) ?? 0}
                        </div>
                        <div className="text-[11px] text-gray-500">mentions</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-senti-border bg-senti-card/70 p-4">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between rounded-xl border border-senti-border bg-senti-dark/60 px-3 py-2">
                      <span className="text-gray-400">Collector</span>
                      <span className="text-gray-100">
                        {running ? "Running…" : "Idle"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-senti-border bg-senti-dark/60 px-3 py-2">
                      <span className="text-gray-400">Sentiment</span>
                      <span className="text-gray-100">Next milestone</span>
                    </div>
                  </div>
                </div>

                {nav !== "mentions" && (
                  <div className="rounded-2xl border border-senti-border bg-senti-card/70 p-4 text-sm text-gray-400">
                    <div className="font-semibold text-gray-100">Coming soon</div>
                    <div className="mt-1">
                      This section will be enabled as we add sentiment scoring, sources analysis,
                      influencers, and competitive comparison.
                    </div>
                  </div>
                )}
              </aside>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

