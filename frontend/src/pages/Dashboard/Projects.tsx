import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import * as projectApi from "../../api/projectApi";
import * as collectorApi from "../../api/collectorApi";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { ProjectCard } from "../../components/projects/ProjectCard";
import { motion, AnimatePresence } from "framer-motion";

type Project = projectApi.Project;

export function Projects() {
  const { user, accessToken, loading, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [showNewProject, setShowNewProject] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // New Project Form
  const [newPrimaryKeyword, setNewPrimaryKeyword] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDomain, setNewDomain] = useState("");
  const [savingProject, setSavingProject] = useState(false);

  // Profile Form
  const [profileFirstName, setProfileFirstName] = useState(user?.firstName ?? "");
  const [profileLastName, setProfileLastName] = useState(user?.lastName ?? "");
  const [savingProfile, setSavingProfile] = useState(false);

  // Action State
  const [runningProjectId, setRunningProjectId] = useState<number | null>(null);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [viewMode, setViewMode] = useState<"LIST" | "KANBAN">("LIST");

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

  // Listen for custom event from Header to open profile modal
  useEffect(() => {
    const handleOpenProfile = () => setShowProfile(true);
    window.addEventListener("open-profile-modal", handleOpenProfile);
    return () => window.removeEventListener("open-profile-modal", handleOpenProfile);
  }, []);

  // Filtered Projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // 1. Status Filter
      if (statusFilter !== "ALL" && p.status !== statusFilter) return false;

      // 2. Search Query
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const matchName = p.primaryKeyword.toLowerCase().includes(query);
        const matchDesc = p.description?.toLowerCase().includes(query) ?? false;
        const matchDomain = p.domain?.toLowerCase().includes(query) ?? false;

        if (!matchName && !matchDesc && !matchDomain) return false;
      }

      return true;
    });
  }, [projects, searchQuery, statusFilter]);

  const activeProjects = useMemo(() => filteredProjects.filter(p => p.status === "ACTIVE"), [filteredProjects]);
  const inactiveProjects = useMemo(() => filteredProjects.filter(p => p.status === "INACTIVE"), [filteredProjects]);

  if (!user) return null;

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
      const res = await projectApi.updateProject(accessToken, project.id, { status: nextStatus });
      setProjects((prev) => prev.map((p) => (p.id === res.project.id ? res.project : p)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update project");
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

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">

        {/* Error Banner */}
        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* Page Header Area */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-senti-text">Your Projects</h1>
            <p className="text-sm text-senti-muted mt-1">
              Manage keywords, track status, and monitor brand mentions.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowNewProject(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-senti-purple to-senti-blue px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:shadow-purple-500/30 transition-shadow w-full md:w-auto"
          >
            <span className="text-lg leading-none">+</span>
            <span>New Project</span>
          </button>
        </div>

        {/* Action Bar (Search, Filters, View Toggle) */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-senti-card/30 p-2 rounded-2xl border border-senti-border/50">

          {/* Search */}
          <div className="relative w-full flex-1 max-w-2xl">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-senti-muted">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-senti-dark/50 border border-senti-border/50 rounded-xl pl-9 pr-4 py-2 text-sm text-senti-text placeholder:text-senti-muted/70 focus:border-senti-purple focus:ring-1 focus:ring-senti-purple outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
            {/* Status Filters */}
            <div className="flex bg-senti-dark/50 rounded-xl p-1 border border-senti-border/50">
              <button
                onClick={() => setStatusFilter("ALL")}
                className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${statusFilter === "ALL" ? "bg-senti-card text-senti-text shadow-sm" : "text-senti-muted hover:text-senti-text"}`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter("ACTIVE")}
                className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${statusFilter === "ACTIVE" ? "bg-emerald-500/20 text-emerald-300 shadow-sm" : "text-senti-muted hover:text-senti-text"}`}
              >
                Active
              </button>
              <button
                onClick={() => setStatusFilter("INACTIVE")}
                className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${statusFilter === "INACTIVE" ? "bg-gray-600/30 text-gray-300 shadow-sm" : "text-senti-muted hover:text-senti-text"}`}
              >
                Inactive
              </button>
            </div>

            <div className="w-px h-6 bg-senti-border/50 mx-1 hidden sm:block"></div>

            {/* View Toggle */}
            <div className="flex bg-senti-dark/50 rounded-xl p-1 border border-senti-border/50 ml-auto sm:ml-0">
              <button
                onClick={() => setViewMode("LIST")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${viewMode === "LIST" ? "bg-senti-card text-senti-purple shadow-sm" : "text-senti-muted hover:text-senti-text"}`}
                title="List View"
              >
                ≣
              </button>
              <button
                onClick={() => setViewMode("KANBAN")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${viewMode === "KANBAN" ? "bg-senti-card text-senti-purple shadow-sm" : "text-senti-muted hover:text-senti-text"}`}
                title="Kanban View"
              >
                ◫
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {loadingProjects ? (
          <div className="flex items-center justify-center py-20 text-sm text-senti-muted">
            Loading projects…
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-senti-card/20 rounded-2xl border border-senti-border border-dashed">
            <div className="text-4xl mb-4 opacity-50">📂</div>
            <h3 className="text-lg font-medium text-senti-text mb-2">No projects found</h3>
            <p className="text-sm text-senti-muted max-w-sm">
              {searchQuery || statusFilter !== "ALL"
                ? "We couldn't find any projects matching your current filters. Try changing them."
                : "You don't have any projects yet. Create your first one to get started tracking brand sentiment."}
            </p>
            {(!searchQuery && statusFilter === "ALL") && (
              <button
                onClick={() => setShowNewProject(true)}
                className="mt-6 text-sm text-senti-purple hover:text-senti-purple/80 font-medium"
              >
                Create a project now →
              </button>
            )}
          </div>

        ) : viewMode === "LIST" ? (

          /* LIST VIEW */
          <div className="flex flex-col gap-3 pb-10">
            <AnimatePresence>
              {filteredProjects.map((project) => (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <ProjectCard
                    project={project}
                    onToggleStatus={handleToggleStatus}
                    onRunCollector={handleRunCollector}
                    isRunning={runningProjectId === project.id}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

        ) : (

          /* KANBAN VIEW */
          <div className="grid md:grid-cols-2 gap-6 pb-10 items-start">
            {/* Active Column */}
            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 flex flex-col gap-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-emerald-400">Active Projects</h3>
                <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2.5 py-0.5 rounded-full font-medium">
                  {activeProjects.length}
                </span>
              </div>

              <div className="flex flex-col gap-3 min-h-[100px]">
                <AnimatePresence>
                  {activeProjects.map((project) => (
                    <motion.div
                      key={`active-${project.id}`}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ProjectCard
                        project={project}
                        onToggleStatus={handleToggleStatus}
                        onRunCollector={handleRunCollector}
                        isRunning={runningProjectId === project.id}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
                {activeProjects.length === 0 && (
                  <div className="text-center text-xs text-emerald-500/50 py-10 border border-dashed border-emerald-500/20 rounded-xl">
                    No active projects
                  </div>
                )}
              </div>
            </div>

            {/* Inactive Column */}
            <div className="bg-senti-card/30 border border-senti-border/50 rounded-2xl p-4 flex flex-col gap-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-senti-muted">Inactive Projects</h3>
                <span className="bg-gray-600/30 text-gray-400 text-xs px-2.5 py-0.5 rounded-full font-medium">
                  {inactiveProjects.length}
                </span>
              </div>

              <div className="flex flex-col gap-3 min-h-[100px]">
                <AnimatePresence>
                  {inactiveProjects.map((project) => (
                    <motion.div
                      key={`inactive-${project.id}`}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ProjectCard
                        project={project}
                        onToggleStatus={handleToggleStatus}
                        onRunCollector={handleRunCollector}
                        isRunning={runningProjectId === project.id}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
                {inactiveProjects.length === 0 && (
                  <div className="text-center text-xs text-senti-muted/50 py-10 border border-dashed border-senti-border/40 rounded-xl">
                    No inactive projects
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- MODALS --- */}

      {/* New project modal */}
      <AnimatePresence>
        {showNewProject && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              className="w-full max-w-md rounded-2xl border border-senti-border bg-senti-card/95 p-6 shadow-2xl"
            >
              <h2 className="mb-1 text-lg font-semibold text-senti-text">Create project</h2>
              <p className="mb-4 text-sm text-senti-muted">
                Define a primary keyword, brand description and domain for this project.
              </p>
              <form onSubmit={handleCreateProject} className="space-y-4 text-sm">
                <div>
                  <label className="mb-1 block text-xs font-medium text-senti-muted">Primary keyword</label>
                  <input
                    type="text"
                    required
                    value={newPrimaryKeyword}
                    onChange={(e) => setNewPrimaryKeyword(e.target.value)}
                    className="w-full rounded-xl border border-senti-border bg-senti-dark px-3 py-2 text-sm text-senti-text placeholder:text-senti-muted focus:border-senti-purple focus:outline-none focus:ring-1 focus:ring-senti-purple"
                    placeholder="e.g. your brand name"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-senti-muted">Brand description</label>
                  <textarea
                    rows={3}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full resize-none rounded-xl border border-senti-border bg-senti-dark px-3 py-2 text-sm text-senti-text placeholder:text-senti-muted focus:border-senti-purple focus:outline-none focus:ring-1 focus:ring-senti-purple"
                    placeholder="Short description about your brand"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-senti-muted">Domain / sector</label>
                  <input
                    type="text"
                    required
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    className="w-full rounded-xl border border-senti-border bg-senti-dark px-3 py-2 text-sm text-senti-text placeholder:text-senti-muted focus:border-senti-purple focus:outline-none focus:ring-1 focus:ring-senti-purple"
                    placeholder="e.g. fintech, e-commerce, healthcare"
                  />
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowNewProject(false)}
                    className="rounded-xl px-4 py-2 text-sm font-medium text-senti-muted hover:bg-senti-border/30 hover:text-senti-text transition-colors"
                    disabled={savingProject}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingProject}
                    className="rounded-xl bg-gradient-to-r from-senti-purple to-senti-blue px-5 py-2 text-sm font-semibold text-white shadow-lg disabled:opacity-60 transition-transform active:scale-95"
                  >
                    {savingProject ? "Creating…" : "Create project"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile modal */}
      <AnimatePresence>
        {showProfile && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              className="w-full max-w-md rounded-2xl border border-senti-border bg-senti-card/95 p-6 shadow-2xl"
            >
              <h2 className="mb-1 text-lg font-semibold text-senti-text">Profile settings</h2>
              <p className="mb-4 text-sm text-senti-muted">
                Update your name details. Your email is fixed for this account.
              </p>
              <form onSubmit={handleSaveProfile} className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-senti-muted">First name</label>
                    <input
                      type="text"
                      required
                      value={profileFirstName}
                      onChange={(e) => setProfileFirstName(e.target.value)}
                      className="w-full rounded-xl border border-senti-border bg-senti-dark px-3 py-2 text-sm text-senti-text placeholder:text-senti-muted focus:border-senti-purple focus:outline-none focus:ring-1 focus:ring-senti-purple"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-senti-muted">Last name</label>
                    <input
                      type="text"
                      value={profileLastName}
                      onChange={(e) => setProfileLastName(e.target.value)}
                      className="w-full rounded-xl border border-senti-border bg-senti-dark px-3 py-2 text-sm text-senti-text placeholder:text-senti-muted focus:border-senti-purple focus:outline-none focus:ring-1 focus:ring-senti-purple"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-senti-muted">Email</label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full cursor-not-allowed rounded-xl border border-senti-border bg-senti-dark/60 px-3 py-2 text-sm text-senti-muted"
                  />
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowProfile(false)}
                    className="rounded-xl px-4 py-2 text-sm font-medium text-senti-muted hover:bg-senti-border/30 hover:text-senti-text transition-colors"
                    disabled={savingProfile}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="rounded-xl bg-gradient-to-r from-senti-purple to-senti-blue px-5 py-2 text-sm font-semibold text-white shadow-lg disabled:opacity-60 transition-transform active:scale-95"
                  >
                    {savingProfile ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </DashboardLayout>
  );
}
