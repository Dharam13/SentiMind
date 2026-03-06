import { useEffect, useMemo, useRef, useState } from "react";
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
import { ThemeToggle } from "../components/ThemeToggle";
import { InfluencersView } from "../components/InfluencersView";
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
    case "medium":
      return "Medium";
    case "linkedin":
      return "LinkedIn";
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
    case "medium":
      return "M";
    case "linkedin":
      return "in";
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
  if (filter === "blogs") return platform === "medium" || platform === "tumblr";
  if (filter === "social") return platform === "twitter" || platform === "reddit" || platform === "youtube" || platform === "linkedin";
  return true;
}

export function ProjectDashboard() {
  const { id } = useParams();
  const projectId = useMemo(() => parseInt(String(id), 10), [id]);
  const { user, accessToken, loading, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const userMenuRef = useRef<HTMLDivElement>(null);

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

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profileFirstName, setProfileFirstName] = useState(user?.firstName ?? "");
  const [profileLastName, setProfileLastName] = useState(user?.lastName ?? "");
  const [savingProfile, setSavingProfile] = useState(false);

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

  useEffect(() => {
    if (user) {
      setProfileFirstName(user.firstName);
      setProfileLastName(user.lastName ?? "");
    }
  }, [user]);

  useEffect(() => {
    if (!showUserMenu) return;
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showUserMenu]);

  const mentionsReachData = useMemo(() => {
    const ts = summary?.timeSeries ?? [];
    return ts.map((p) => ({
      date: p.date,
      mentions: p.count,
      reach: p.count * 120,
    }));
  }, [summary]);

  // Sentiment chart from stored MongoDB data (group by date, count by sentiment.label)
  const sentimentData = useMemo(() => {
    const list = summary?.mentions ?? [];
    const withSentiment = list.filter(
      (m) => m.sentimentStatus === "completed" && m.sentiment?.label
    );
    if (withSentiment.length === 0) {
      return [];
    }
    const byDate = new Map<
      string,
      { date: string; positive: number; neutral: number; negative: number }
    >();
    for (const m of withSentiment) {
      const d = m.publishedAt
        ? new Date(m.publishedAt).toISOString().slice(0, 10)
        : "";
      if (!d) continue;
      const row = byDate.get(d) || {
        date: d,
        positive: 0,
        neutral: 0,
        negative: 0,
      };
      const label = (m.sentiment!.label || "").toLowerCase();
      if (label === "positive") row.positive += 1;
      else if (label === "negative") row.negative += 1;
      else row.neutral += 1;
      byDate.set(d, row);
    }
    return Array.from(byDate.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  }, [summary]);

  const sentimentChartData = useMemo(() => {
    const data = sentimentData;
    if (data.length === 0) return [];
    return data;
  }, [sentimentData]);

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
      console.log(`[Dashboard] Starting collection for project ${project.id}, keyword: ${project.primaryKeyword}`);
      const result = await collectorApi.runCollection({
        projectId: project.id,
        keyword: project.primaryKeyword,
        limit: 50,
        hours,
      });
      console.log(`[Dashboard] Collection completed:`, result);

      // Show errors if any platforms failed
      if (result.errorsByPlatform && Object.keys(result.errorsByPlatform).length > 0) {
        const errorMessages = Object.entries(result.errorsByPlatform)
          .map(([platform, error]) => `${platform}: ${error}`)
          .join("; ");
        console.warn(`[Dashboard] Some platforms failed:`, errorMessages);
        // Don't set as error if we got some data, just log it
        if (result.insertedCount === 0) {
          setError(`Collection completed but no data fetched. Errors: ${errorMessages}`);
        }
      }

      const res = await collectorApi.getProjectSummary({
        projectId: project.id,
        hours,
      });
      setSummary(res);
    } catch (err) {
      console.error(`[Dashboard] Collection error:`, err);
      setError(err instanceof Error ? err.message : "Collector run failed");
    } finally {
      setRunning(false);
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setError(null);
    try {
      await updateProfile({
        firstName: profileFirstName.trim(),
        lastName: profileLastName.trim() || null,
      });
      setShowProfile(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  }

  if (!user) return null;

  const initials =
    (user.firstName?.[0] ?? "").toUpperCase() + (user.lastName?.[0] ?? "").toUpperCase();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-senti-dark to-senti-dark" />

      <div className="relative flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-72 flex-shrink-0 border-r border-border bg-gradient-to-b from-card to-card/80 dark:from-card dark:to-card/60 backdrop-blur md:flex md:flex-col">
          <div className="flex h-20 items-center justify-between border-b border-border px-6">
            <div>
              <Link
                to="/projects"
                className="text-lg font-bold bg-gradient-to-r from-blue-600 to-emerald-600 dark:from-blue-400 dark:to-emerald-400 bg-clip-text text-transparent"
              >
                Sentimind
              </Link>
              <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Dashboard</p>
            </div>
            <span className="rounded-full bg-blue-100 dark:bg-blue-500/20 px-3 py-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
              Pro
            </span>
          </div>

          <nav className="flex-1 px-3 py-6 text-sm overflow-y-auto">
            <div className="px-3 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
              Analysis
            </div>
            <div className="space-y-1.5">
              {(
                [
                  ["mentions", "�", "Mentions"],
                  ["summary", "📈", "Summary"],
                  ["analysis", "🔎", "Deep Analysis"],
                  ["sources", "🌍", "Sources"],
                  ["influencers", "👥", "Influencers"],
                  ["comparison", "⚖", "Comparison"],
                ] as Array<[NavItem, string, string]>
              ).map(([key, icon, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setNav(key)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition duration-200 ${nav === key
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                >
                  <span className="text-base">{icon}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>

            <div className="mt-8 px-3 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
              Reports
            </div>
            <div className="space-y-1.5">
              {[
                ["✉", "Email Reports"],
                ["📄", "PDF Report"],
                ["📊", "Excel Export"],
                ["🎨", "Infographic"]
              ].map(([icon, label]) => (
                <button
                  key={label}
                  type="button"
                  disabled
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-muted-foreground/60 cursor-not-allowed hover:bg-muted/40 transition duration-200"
                >
                  <span className="text-base">{icon}</span>
                  <span className="flex-1">{label}</span>
                  <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/20 rounded px-2 py-0.5">
                    Coming
                  </span>
                </button>
              ))}
            </div>
          </nav>

          {/* Footer in sidebar */}
          <div className="border-t border-border p-4">
            <div className="rounded-lg bg-primary/10 p-3 text-center">
              <p className="text-xs font-semibold text-foreground">Need help?</p>
              <button className="mt-2 w-full rounded-lg bg-primary/20 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/30 transition">
                Contact Support
              </button>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex min-h-screen flex-1 flex-col">
          {/* Top bar */}
          <header className="relative z-30 flex h-20 flex-shrink-0 items-center justify-between gap-4 border-b border-border bg-gradient-to-r from-card/95 to-background/95 backdrop-blur px-6 lg:px-8">
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                📍 Project Overview
              </div>
              <div className="mt-1 truncate text-xl font-bold text-foreground">
                {loadingProject ? "Loading…" : project?.primaryKeyword ?? "Unknown project"}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
              <ThemeToggle />
              <select
                value={hours}
                onChange={(e) => setHours(parseInt(e.target.value, 10))}
                className="rounded-lg border border-border bg-card/50 px-3 py-2.5 text-sm font-medium text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
              >
                <option value={24}>Last 24 hours</option>
                <option value={168}>Last 7 days</option>
                <option value={720}>Last 30 days</option>
              </select>
              <button
                type="button"
                disabled={running}
                onClick={handleRun}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg hover:scale-105 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{running ? "⏳" : "▶"}</span>
                <span>{running ? "Running…" : "Run"}</span>
              </button>

              <div ref={userMenuRef} className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowUserMenu((open) => !open);
                  }}
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-bold text-white hover:shadow-lg hover:scale-105 transition duration-200"
                  aria-expanded={showUserMenu}
                  aria-haspopup="true"
                  title={`${user?.firstName} ${user?.lastName ?? ""}`}
                >
                  {initials || "U"}
                </button>
                {showUserMenu && (
                  <div
                    className="absolute right-0 top-full z-50 mt-3 w-56 rounded-xl border border-border bg-gradient-to-br from-card to-card/80 dark:from-card dark:to-card/60 shadow-xl backdrop-blur overflow-hidden"
                    role="menu"
                  >
                    <div className="border-b border-border bg-primary/10 px-4 py-3">
                      <p className="text-sm font-semibold text-foreground">
                        {user?.firstName} {user?.lastName ?? ""}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{user?.email}</p>
                    </div>
                    <div className="p-2">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowUserMenu(false);
                          setShowProfile(true);
                        }}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-foreground hover:bg-primary/10 transition"
                      >
                        <span>👤</span>
                        <span>Profile Settings</span>
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowUserMenu(false);
                          void logout();
                        }}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-500/10 transition"
                      >
                        <span>🚪</span>
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          <main className="relative flex flex-1 flex-col gap-6 overflow-hidden px-6 py-6 lg:px-8">
            {error && (
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="grid flex-1 grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-[1fr_320px]">
              {/* Center */}
              <section className="flex min-h-0 flex-col gap-4 sm:gap-6 overflow-hidden">
                {nav === "mentions" && (
                  <>
                    <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-card/80 dark:from-card dark:to-card/60 backdrop-blur p-6 shadow-lg hover:shadow-xl transition duration-200">
                      {/* Header Section */}
                      <div className="mb-6 pb-6 border-b border-border/40">
                        <div className="flex items-center justify-between gap-6">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-foreground mb-1">Analytics Overview</h3>
                            <p className="text-xs text-muted-foreground">Real-time sentiment and mention tracking</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                              {loadingSummary ? "—" : summary?.totalMentions ?? 0}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 font-medium">Total Mentions</p>
                          </div>
                        </div>
                      </div>

                      {/* Tabs Section */}
                      <div className="mb-6 flex gap-3">
                        <button
                          type="button"
                          onClick={() => setGraphTab("mentions-reach")}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition duration-200 border ${
                            graphTab === "mentions-reach"
                              ? "border-blue-600/50 bg-blue-600/10 text-blue-600 dark:text-blue-400"
                              : "border-border bg-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50"
                          }`}
                        >
                          <span className="text-base">📈</span>
                          <span>Mentions & Reach</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setGraphTab("sentiment")}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition duration-200 border ${
                            graphTab === "sentiment"
                              ? "border-emerald-600/50 bg-emerald-600/10 text-emerald-600 dark:text-emerald-400"
                              : "border-border bg-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50"
                          }`}
                        >
                          <span className="text-base">💭</span>
                          <span>Sentiment Breakdown</span>
                        </button>
                      </div>

                      {/* Chart Section */}
                      <div className="h-[380px] w-full rounded-lg border border-border/40 bg-muted/5 p-4">
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
                          ) : sentimentChartData.length === 0 ? (
                            <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background/40 p-6 text-center">
                              <p className="text-sm font-medium text-gray-400">No sentiment data yet</p>
                              <p className="mt-1 text-xs text-gray-400">
                                Run collection, then wait for sentiment to be processed. The chart will show positive / neutral / negative counts by day.
                              </p>
                            </div>
                          ) : (
                            <AreaChart
                              data={sentimentChartData}
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
                                  borderRadius: "8px",
                                }}
                                labelStyle={{ color: "#fff" }}
                                formatter={(value: number) => [Number(value), ""]}
                                labelFormatter={(label) => `Date: ${label}`}
                              />
                              <Legend
                                wrapperStyle={{ paddingTop: 12 }}
                                formatter={(value) => (
                                  <span className="text-sm text-gray-400">{value}</span>
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

                    <div className="min-h-0 rounded-2xl border border-border bg-gradient-to-br from-card to-card/80 dark:from-card dark:to-card/60 backdrop-blur p-6 shadow-lg hover:shadow-xl transition duration-200">
                      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                            <span>💬</span>
                            Feed Stream
                          </div>
                          <h3 className="text-xl font-bold text-foreground">Recent mentions</h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <select
                            value={sourceFilter}
                            onChange={(e) => setSourceFilter(e.target.value as SourceFilter)}
                            className="rounded-lg border border-border bg-muted/50 px-3 py-2.5 text-sm font-medium text-foreground focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition"
                          >
                            <option value="all">🌐 All sources</option>
                            <option value="social">📱 Social Media</option>
                            <option value="news">📰 News</option>
                            <option value="blogs">✍️ Blogs</option>
                          </select>
                          <Link
                            to="/projects"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-muted/50 px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition"
                          >
                            ← Back
                          </Link>
                        </div>
                      </div>

                      {loadingSummary ? (
                        <div className="py-12 text-center">
                          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse"></div>
                            Loading mentions…
                          </div>
                        </div>
                      ) : recentMentions.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-border bg-muted/20 p-8 text-center">
                          <p className="text-sm font-medium text-foreground">No mentions yet</p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            Click the <span className="font-semibold text-blue-600 dark:text-blue-400">Run</span> button to collect fresh data.
                          </p>
                        </div>
                      ) : (
                        <ul className="max-h-[500px] space-y-3 overflow-y-auto pr-2 scroll-smooth">
                          {recentMentions.slice(0, 50).map((m) => {
                            const label = m.sentimentStatus === "completed" && m.sentiment?.label
                              ? m.sentiment.label
                              : null;
                            const displayContent =
                              (m.content || "").trim() ||
                              (m.metadata?.title && typeof m.metadata.title === "string"
                                ? m.metadata.title
                                : "No content");
                            return (
                              <li
                                key={m.id}
                                className="rounded-lg border border-border bg-card/50 hover:bg-card/80 hover:border-blue-600/40 p-4 transition duration-200 hover:shadow-md"
                              >
                                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                  <span className="inline-flex items-center gap-2.5 text-sm">
                                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-blue-600/20 text-xs font-bold">
                                      {platformIcon(m.platform)}
                                    </span>
                                    <span className="font-semibold text-foreground">{platformLabel(m.platform)}</span>
                                    {m.sourceType === "rss" && (
                                      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">RSS</span>
                                    )}
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(m.publishedAt).toLocaleString()}
                                    </span>
                                  </span>
                                  <span className="flex items-center gap-2">
                                    {label && (
                                      <span
                                        className={`rounded-full px-3 py-1 text-xs font-bold ${label.toLowerCase() === "positive"
                                            ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                            : label.toLowerCase() === "negative"
                                              ? "bg-red-500/20 text-red-600 dark:text-red-400"
                                              : "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                                          }`}
                                      >
                                        {label}
                                      </span>
                                    )}
                                    {m.sourceUrl ? (
                                      <a
                                        href={m.sourceUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition"
                                      >
                                        Open ↗
                                      </a>
                                    ) : null}
                                  </span>
                                </div>
                                <div className="mb-2 text-sm text-foreground line-clamp-2">
                                  {displayContent}
                                </div>
                                {(m.author || (m.metadata?.title && (m.content || "").trim())) && (
                                  <div className="text-xs text-muted-foreground">
                                    {m.author ? `By ${m.author}` : m.metadata?.title}
                                  </div>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </>
                )}

                {nav === "influencers" && (
                  <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-card/80 dark:from-card dark:to-card/60 backdrop-blur p-6 shadow-lg hover:shadow-xl transition duration-200 overflow-y-auto">
                    <InfluencersView
                      projectId={projectId}
                      hours={hours}
                      keyword={project?.primaryKeyword}
                      loadingParent={loadingProject || loading}
                    />
                  </div>
                )}

                {nav !== "mentions" && nav !== "influencers" && (
                  <div className="rounded-2xl border border-dashed border-border bg-gradient-to-br from-blue-600/10 to-emerald-600/10 p-6 flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                      <div className="font-bold text-foreground mb-2 text-lg">🚀 Coming Soon</div>
                      <div className="text-sm text-muted-foreground">
                        {nav === "summary" && "Summary and key insights"}
                        {nav === "analysis" && "Deep analysis and patterns"}
                        {nav === "sources" && "Source breakdown and trends"}
                        {nav === "comparison" && "Competitive comparison"}
                        <p className="mt-2">will be available soon.</p>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* Right rail */}
              <aside className="flex flex-col gap-4 sm:gap-6 hidden lg:flex">
                <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-card/80 dark:from-card dark:to-card/60 backdrop-blur p-6 shadow-lg">
                  <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    <span>🌐</span>
                    Platform Sources
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {["twitter", "reddit", "youtube", "linkedin", "news", "medium"].map((p) => (
                      <div
                        key={p}
                        className="group rounded-xl border border-border bg-card/50 hover:bg-card hover:border-blue-600/40 p-4 transition duration-200 hover:shadow-md"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600/20 text-sm font-bold">
                            {platformIcon(p)}
                          </span>
                          <span className="min-w-0 truncate text-xs font-semibold text-foreground">{platformLabel(p)}</span>
                        </div>
                        <div className="text-2xl font-bold text-foreground">
                          {byPlatform.get(p) ?? 0}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-medium">mentions</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-card/80 dark:from-card dark:to-card/60 backdrop-blur p-6 shadow-lg">
                  <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    <span>🔧</span>
                    System Status
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg border border-border bg-card/50 px-4 py-3">
                      <span className="text-sm font-medium text-muted-foreground">Collector</span>
                      <span className={`inline-flex items-center gap-1.5 text-sm font-bold ${running ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                        <span className={`h-2 w-2 rounded-full ${running ? "bg-amber-600 dark:bg-amber-400 animate-pulse" : "bg-emerald-600 dark:bg-emerald-400"}`}></span>
                        {running ? "Running" : "Idle"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-border bg-card/50 px-4 py-3">
                      <span className="text-sm font-medium text-muted-foreground">Sentiment</span>
                      <span className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 dark:text-blue-400">
                        <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse"></span>
                        Ready
                      </span>
                    </div>
                  </div>
                </div>

                {nav !== "mentions" && nav !== "influencers" && (
                  <div className="rounded-2xl border border-dashed border-border bg-gradient-to-br from-blue-600/10 to-emerald-600/10 p-6">
                    <div className="font-bold text-foreground mb-2">🚀 Coming Soon</div>
                    <div className="text-sm text-muted-foreground leading-relaxed">
                      More sections are in development including in-depth analysis, influencer tracking, and competitive insights.
                    </div>
                  </div>
                )}
              </aside>
            </div>
          </main>
        </div>
      </div>

      {/* Profile modal */}
      {showProfile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-gradient-to-br from-card to-card/80 dark:from-card dark:to-card/60 p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-foreground">Profile Settings</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Update your account information
            </p>
            <form onSubmit={handleSaveProfile} className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    First name
                  </label>
                  <input
                    type="text"
                    required
                    value={profileFirstName}
                    onChange={(e) => setProfileFirstName(e.target.value)}
                    className="w-full rounded-lg border border-border bg-card/50 px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    Last name
                  </label>
                  <input
                    type="text"
                    value={profileLastName}
                    onChange={(e) => setProfileLastName(e.target.value)}
                    className="w-full rounded-lg border border-border bg-card/50 px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Email</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full cursor-not-allowed rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowProfile(false)}
                  className="rounded-lg px-4 py-2.5 text-sm font-semibold text-muted-foreground bg-muted/50 hover:bg-muted transition disabled:opacity-50"
                  disabled={savingProfile}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="rounded-lg px-4 py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingProfile ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

