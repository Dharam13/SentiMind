import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "../components/ThemeToggle";
import { useAuth } from "../contexts/AuthContext";
import * as collectorApi from "../lib/collectorApi";
import * as projectApi from "../lib/projectApi";

type Project = projectApi.Project;

type ProjectMetrics = {
  hoursUsed: number;
  totalMentions: number;
  analyzed: number;
  pending: number;
  failed: number;
};

function formatNumber(n: number) {
  return new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(
    n
  );
}

export function Projects() {
  const { user, accessToken, loading, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const userMenuRef = useRef<HTMLDivElement>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "ACTIVE" | "INACTIVE">("all");

  const [metricsByProject, setMetricsByProject] = useState<Record<number, ProjectMetrics>>({});
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  const [showNewProject, setShowNewProject] = useState(false);
  const [newPrimaryKeyword, setNewPrimaryKeyword] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDomain, setNewDomain] = useState("");
  const [savingProject, setSavingProject] = useState(false);

  const [showProfile, setShowProfile] = useState(false);
  const [profileFirstName, setProfileFirstName] = useState(user?.firstName ?? "");
  const [profileLastName, setProfileLastName] = useState(user?.lastName ?? "");
  const [savingProfile, setSavingProfile] = useState(false);

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [runningProjectId, setRunningProjectId] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login", { replace: true });
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user || !accessToken) return;
    setLoadingProjects(true);
    setError(null);
    projectApi
      .listProjects(accessToken)
      .then((res) => {
        setProjects(res.projects);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load projects");
      })
      .finally(() => setLoadingProjects(false));
  }, [user, accessToken]);

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

  useEffect(() => {
    if (projects.length === 0) return;
    let cancelled = false;
    setLoadingMetrics(true);
    setError(null);

    // Fetch all metrics in one optimized bulk call instead of N individual calls
    collectorApi
      .getBulkProjectMetrics({
        projectIds: projects.map((p) => p.id),
        hours: "all",
      })
      .then((res) => {
        if (cancelled) return;
        setMetricsByProject(res.metrics || {});
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load metrics:", err);
        // Don't set error - metrics are optional for UI to work
      })
      .finally(() => {
        if (!cancelled) setLoadingMetrics(false);
      });

    return () => {
      cancelled = true;
    };
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects
      .filter((p) => (statusFilter === "all" ? true : p.status === statusFilter))
      .filter((p) => {
        if (!q) return true;
        const hay = `${p.primaryKeyword} ${p.domain} ${p.description ?? ""}`.toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [projects, search, statusFilter]);

  if (!user) return null;

  const initials =
    (user.firstName?.[0] ?? "").toUpperCase() + (user.lastName?.[0] ?? "").toUpperCase();

  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.status === "ACTIVE").length;
  const totalMentions = Object.values(metricsByProject).reduce((sum, m) => sum + (m.totalMentions || 0), 0);
  const totalAnalyzed = Object.values(metricsByProject).reduce((sum, m) => sum + (m.analyzed || 0), 0);
  const hasMetrics = Object.keys(metricsByProject).length > 0;

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    setSavingProject(true);
    setError(null);
    try {
      const res = await projectApi.createProject(accessToken, {
        primaryKeyword: newPrimaryKeyword.trim(),
        description: newDescription.trim() || null,
        domain: newDomain.trim(),
      });
      setProjects((prev) => [res.project, ...prev]);
      setShowNewProject(false);
      setNewPrimaryKeyword("");
      setNewDescription("");
      setNewDomain("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setSavingProject(false);
    }
  }

  async function handleToggleStatus(project: Project) {
    if (!accessToken) return;
    const nextStatus = project.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      const res = await projectApi.updateProject(accessToken, project.id, {
        status: nextStatus,
      });
      setProjects((prev) => prev.map((p) => (p.id === res.project.id ? res.project : p)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update project");
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

  async function handleRunCollector(project: Project) {
    setRunningProjectId(project.id);
    setError(null);
    try {
      await collectorApi.runCollection({
        projectId: project.id,
        keyword: project.primaryKeyword,
        limit: 25,
        hours: 24,
      });
      navigate(`/projects/${project.id}`, { replace: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Collector run failed");
    } finally {
      setRunningProjectId(null);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />

      {/* Top bar */}
      <header className="relative z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="flex h-16 items-center justify-between gap-3 px-6 lg:px-8">
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Workspace
            </div>
            <div className="truncate text-lg font-semibold tracking-tight">Projects</div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setShowNewProject(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-indigo-600 px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md hover:shadow-lg transition duration-200 hover:scale-105"
            >
              <span className="text-base">+</span>
              <span className="hidden sm:inline">New Project</span>
            </button>

            <div ref={userMenuRef} className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowUserMenu((open) => !open);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-indigo-600 text-sm font-semibold text-primary-foreground hover:shadow-lg hover:scale-105 transition duration-200"
                aria-expanded={showUserMenu}
                aria-haspopup="true"
                title={`${user.firstName} ${user.lastName ?? ""}`}
              >
                {initials || "U"}
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-border bg-card shadow-xl backdrop-blur-sm overflow-hidden">
                  <div className="border-b border-border bg-gradient-to-r from-primary/10 to-indigo-500/10 px-4 py-3">
                    <div className="text-sm font-semibold text-foreground">
                      {user.firstName} {user.lastName ?? ""}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{user.email}</div>
                  </div>
                  <div className="p-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowUserMenu(false);
                        setShowProfile(true);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-foreground hover:bg-primary/10 transition"
                    >
                      <span>👤</span>
                      <span>Profile Settings</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowUserMenu(false);
                        void logout();
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/20 transition"
                    >
                      <span>🚪</span>
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="relative flex flex-col gap-6 px-6 py-6 lg:px-8">
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-200">
            {error}
          </div>
        )}

        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="group rounded-2xl border border-border bg-gradient-to-br from-card to-card/80 dark:from-card dark:to-card/60 p-5 shadow-sm hover:shadow-md transition duration-300">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Total Projects
                </div>
                <div className="mt-3 text-3xl font-bold text-foreground">{formatNumber(totalProjects)}</div>
              </div>
              <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-lg group-hover:scale-110 transition duration-300">
                📊
              </div>
            </div>
          </div>
          <div className="group rounded-2xl border border-border bg-gradient-to-br from-card to-card/80 dark:from-card dark:to-card/60 p-5 shadow-sm hover:shadow-md transition duration-300">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Active Projects
                </div>
                <div className="mt-3 text-3xl font-bold text-emerald-600 dark:text-emerald-400">{formatNumber(activeProjects)}</div>
              </div>
              <div className="h-12 w-12 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-lg group-hover:scale-110 transition duration-300">
                🚀
              </div>
            </div>
          </div>
          <div className="group rounded-2xl border border-border bg-gradient-to-br from-card to-card/80 dark:from-card dark:to-card/60 p-5 shadow-sm hover:shadow-md transition duration-300">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Mentions Collected
                </div>
                <div className="mt-3 text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {loadingMetrics || (!hasMetrics && projects.length > 0) ? "—" : formatNumber(totalMentions)}
                </div>
              </div>
              <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center text-lg group-hover:scale-110 transition duration-300">
                💬
              </div>
            </div>
          </div>
          <div className="group rounded-2xl border border-border bg-gradient-to-br from-card to-card/80 dark:from-card dark:to-card/60 p-5 shadow-sm hover:shadow-md transition duration-300">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Analyzed
                </div>
                <div className="mt-3 text-3xl font-bold text-amber-600 dark:text-amber-400">
                  {loadingMetrics || (!hasMetrics && projects.length > 0) ? "—" : formatNumber(totalAnalyzed)}
                </div>
              </div>
              <div className="h-12 w-12 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center text-lg group-hover:scale-110 transition duration-300">
                ✨
              </div>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, domain..."
              className="flex-1 rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
            >
              <option value="all">All Status</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>

          <div className="text-sm font-medium text-muted-foreground bg-muted/50 rounded-lg px-3 py-2.5">
            {loadingProjects ? "Loading…" : `${filteredProjects.length} project${filteredProjects.length !== 1 ? "s" : ""}`}
          </div>
        </section>

        {/* Projects grid */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loadingProjects ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="relative h-72 rounded-2xl border border-border bg-gradient-to-br from-card to-card/80 p-6 shadow-sm animate-pulse overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-white/5 animate-shimmer" />
              </div>
            ))
          ) : filteredProjects.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground sm:col-span-2 lg:col-span-3">
              No projects found. Create a project to start collecting and analyzing mentions.
            </div>
          ) : (
            filteredProjects.map((project) => {
              const m = metricsByProject[project.id];
              const analyzedPct =
                m && m.totalMentions > 0 ? Math.round((m.analyzed / m.totalMentions) * 100) : 0;
              return (
                <div
                  key={project.id}
                  className="group relative flex flex-col rounded-2xl border border-border bg-gradient-to-br from-card to-card/80 p-6 shadow-sm transition duration-300 hover:shadow-lg hover:-translate-y-1 dark:from-card dark:to-card/60"
                >
                  {/* Hover gradient background */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
                  <div className="relative z-10 flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-lg font-bold text-foreground group-hover:text-primary transition">
                          {project.primaryKeyword}
                        </h3>
                        <p className="mt-1 truncate text-sm text-muted-foreground group-hover:text-muted-foreground/80 transition">
                          {project.domain}
                        </p>
                      </div>
                      <div className={`shrink-0 rounded-full px-3 py-1 text-[12px] font-semibold whitespace-nowrap ${
                        project.status === "ACTIVE"
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {project.status === "ACTIVE" ? "● Active" : "○ Inactive"}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="line-clamp-2 text-sm text-muted-foreground mb-4 flex-shrink-0">
                      {project.description || "No description provided yet."}
                    </p>

                    {/* Metrics Grid */}
                    <div className="mt-auto mb-4 grid grid-cols-3 gap-2 rounded-xl bg-gradient-to-br from-muted/40 to-muted/20 dark:from-muted/30 dark:to-muted/10 p-3 border border-border/50">
                      <div className="text-center">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mentions</div>
                        <div className="mt-2 text-lg font-bold text-foreground">
                          {m ? formatNumber(m.totalMentions) : "—"}
                        </div>
                      </div>
                      <div className="text-center border-l border-r border-border/30">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Analyzed</div>
                        <div className="mt-2 text-lg font-bold text-foreground">
                          {m ? `${formatNumber(m.analyzed)}` : "—"}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-medium">
                          {analyzedPct > 0 && `${analyzedPct}%`}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pending</div>
                        <div className="mt-2 text-lg font-bold text-foreground">
                          {m ? formatNumber(m.pending) : "—"}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/projects/${project.id}`)}
                        className="col-span-2 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground dark:hover:bg-primary font-semibold py-2.5 px-3 text-sm transition duration-200 border border-primary/30 hover:border-primary"
                      >
                        View Dashboard
                      </button>
                      <button
                        type="button"
                        disabled={runningProjectId === project.id}
                        onClick={() => void handleRunCollector(project)}
                        className="rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-semibold py-2 px-3 text-sm transition duration-200 shadow-sm hover:shadow"
                        title={runningProjectId === project.id ? "Collection in progress..." : "Run data collection"}
                      >
                        {runningProjectId === project.id ? "Running…" : "Run"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleToggleStatus(project)}
                        className={`rounded-lg font-semibold py-2 px-3 text-sm transition duration-200 border ${
                          project.status === "ACTIVE"
                            ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30 dark:hover:bg-red-500/20"
                            : "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30 dark:hover:bg-emerald-500/20"
                        }`}
                      >
                        {project.status === "ACTIVE" ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </section>
      </main>

      {/* New project modal */}
      {showNewProject && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-gradient-to-br from-card to-card/80 dark:from-card dark:to-card/60 p-6 shadow-2xl">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-foreground">Create New Project</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Set up a project to track and analyze mentions across platforms.
              </p>
            </div>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-semibold text-foreground uppercase tracking-wider">
                  Primary Keyword *
                </label>
                <input
                  type="text"
                  required
                  value={newPrimaryKeyword}
                  onChange={(e) => setNewPrimaryKeyword(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
                  placeholder="e.g. Apple, Tesla, Your Brand"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold text-foreground uppercase tracking-wider">
                  Brand Description
                </label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full resize-none rounded-lg border border-border bg-background/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
                  placeholder="What is your brand about? (optional)"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold text-foreground uppercase tracking-wider">
                  Domain / Industry *
                </label>
                <input
                  type="text"
                  required
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
                  placeholder="e.g. Tech, E-commerce, Healthcare"
                />
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewProject(false)}
                  className="rounded-lg px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition duration-200"
                  disabled={savingProject}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProject}
                  className="rounded-lg bg-gradient-to-r from-primary to-indigo-600 px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md hover:shadow-lg transition duration-200 disabled:opacity-50"
                >
                  {savingProject ? "Creating…" : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Profile modal */}
      {showProfile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-gradient-to-br from-card to-card/80 dark:from-card dark:to-card/60 p-6 shadow-2xl">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-foreground">Profile Settings</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Update your personal information. Your email cannot be changed.
              </p>
            </div>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-foreground uppercase tracking-wider">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={profileFirstName}
                    onChange={(e) => setProfileFirstName(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold text-foreground uppercase tracking-wider">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={profileLastName}
                    onChange={(e) => setProfileLastName(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold text-foreground uppercase tracking-wider">
                  Email Address (Read-only)
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full cursor-not-allowed rounded-lg border border-border bg-muted/50 px-4 py-2.5 text-sm text-muted-foreground"
                />
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowProfile(false)}
                  className="rounded-lg px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition duration-200"
                  disabled={savingProfile}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="rounded-lg bg-gradient-to-r from-primary to-indigo-600 px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md hover:shadow-lg transition duration-200 disabled:opacity-50"
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

