import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import * as projectApi from "../lib/projectApi";
import * as collectorApi from "../lib/collectorApi";

type Project = projectApi.Project;

export function Projects() {
  const { user, accessToken, loading, logout, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  const [running, setRunning] = useState(false);

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
        if (res.projects.length > 0) {
          setSelectedId(res.projects[0].id);
        }
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

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedId) ?? null,
    [projects, selectedId]
  );

  if (!user) {
    return null;
  }

  const initials =
    (user.firstName?.[0] ?? "").toUpperCase() + (user.lastName?.[0] ?? "").toUpperCase();

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
      setSelectedId(res.project.id);
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

  async function handleRunCollector() {
    if (!selectedProject) return;
    setRunning(true);
    setError(null);
    try {
      await collectorApi.runCollection({
        projectId: selectedProject.id,
        keyword: selectedProject.primaryKeyword,
        limit: 25,
        hours: 24,
      });
      navigate(`/projects/${selectedProject.id}`, { replace: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Collector run failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="min-h-screen bg-senti-dark text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-senti-dark to-senti-dark" />
      <div className="relative flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-64 flex-shrink-0 border-r border-senti-border bg-senti-card/40 backdrop-blur md:flex md:flex-col">
          <div className="flex h-16 items-center border-b border-senti-border px-6">
            <span className="bg-gradient-to-r from-senti-purple to-senti-blue bg-clip-text text-lg font-semibold text-transparent">
              Sentimind
            </span>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4 text-sm">
            <div className="px-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Menu
            </div>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-lg bg-senti-purple/10 px-3 py-2 text-left text-gray-100 hover:bg-senti-purple/20"
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-senti-purple/20 text-xs">
                #
              </span>
              <span>Projects</span>
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-gray-400 hover:bg-senti-card/40 hover:text-gray-100"
              disabled
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-senti-card/60 text-xs">
                ⚙
              </span>
              <span>Settings</span>
            </button>
          </nav>
        </aside>

        {/* Main */}
        <div className="flex min-h-screen flex-1 flex-col">
          {/* Top bar */}
          <header className="flex h-16 items-center justify-between border-b border-senti-border bg-senti-dark/90 px-4 backdrop-blur md:px-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-300">Projects</span>
              <span className="hidden text-xs text-gray-500 md:inline">
                • Create & manage brand keywords
              </span>
            </div>
            <div className="relative flex items-center gap-3">
              <div className="hidden text-right text-xs leading-tight sm:block">
                <div className="font-medium text-gray-100">
                  {user.firstName} {user.lastName ?? ""}
                </div>
                <div className="text-gray-500">{user.email}</div>
              </div>
              <button
                type="button"
                onClick={() => setShowUserMenu((open) => !open)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-senti-purple/30 text-sm font-semibold text-white ring-senti-purple/50 transition hover:ring-2"
              >
                {initials || "U"}
              </button>
              {showUserMenu && (
                <div className="absolute right-0 top-11 z-20 w-48 rounded-xl border border-senti-border bg-senti-card/95 p-1 text-sm shadow-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      setShowProfile(true);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-gray-100 hover:bg-senti-card"
                  >
                    <span>Profile</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => logout()}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-red-300 hover:bg-red-500/10"
                  >
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </header>

          {/* Content */}
          <main className="relative flex flex-1 flex-col gap-6 overflow-hidden px-4 py-4 md:px-6 md:py-6">
            {error && (
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-xl font-semibold text-white md:text-2xl">Your Projects</h1>
                <p className="text-sm text-gray-400">
                  Each project tracks a primary keyword and stores mentions over time.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewProject(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-senti-purple to-senti-blue px-4 py-2 text-sm font-semibold text-white shadow-lg hover:shadow-purple-500/30"
              >
                <span className="text-lg leading-none">+</span>
                <span>New Project</span>
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-4 md:flex-row">
              {/* Project list */}
              <section className="md:w-80 md:flex-shrink-0">
                <div className="rounded-2xl border border-senti-border bg-senti-card/60 p-3">
                  <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Projects
                  </h2>
                  {loadingProjects ? (
                    <div className="flex items-center justify-center py-8 text-sm text-gray-400">
                      Loading projects…
                    </div>
                  ) : projects.length === 0 ? (
                    <div className="rounded-xl bg-senti-dark/60 p-4 text-sm text-gray-400">
                      You don&apos;t have any projects yet. Create your first one to get started.
                    </div>
                  ) : (
                    <ul className="space-y-1">
                      {projects.map((project) => (
                        <li key={project.id}>
                          <button
                            type="button"
                            onClick={() => setSelectedId(project.id)}
                            className={`flex w-full items-start justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${
                              project.id === selectedId
                                ? "bg-senti-purple/20 text-gray-50"
                                : "bg-senti-dark/60 text-gray-300 hover:bg-senti-card"
                            }`}
                          >
                            <div className="flex-1">
                              <div className="font-medium">
                                {project.primaryKeyword || "Untitled"}
                              </div>
                              <div className="line-clamp-1 text-xs text-gray-500">
                                {project.domain}
                              </div>
                            </div>
                            <span
                              className={`mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                project.status === "ACTIVE"
                                  ? "bg-emerald-500/15 text-emerald-300"
                                  : "bg-gray-600/20 text-gray-300"
                              }`}
                            >
                              {project.status}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>

              {/* Selected project details */}
              <section className="flex-1">
                <div className="flex h-full flex-col rounded-2xl border border-senti-border bg-senti-card/70 p-4 md:p-6">
                  {selectedProject ? (
                    <>
                      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-senti-purple">
                            Current Project
                          </div>
                          <h2 className="text-xl font-semibold text-white md:text-2xl">
                            {selectedProject.primaryKeyword}
                          </h2>
                          <p className="mt-1 text-sm text-gray-400">{selectedProject.domain}</p>
                        </div>
                        <div className="flex flex-col items-start gap-2 md:items-end">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                              selectedProject.status === "ACTIVE"
                                ? "bg-emerald-500/20 text-emerald-200"
                                : "bg-gray-600/30 text-gray-200"
                            }`}
                          >
                            {selectedProject.status === "ACTIVE" ? "Active" : "Inactive"}
                          </span>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(selectedProject)}
                              className="inline-flex items-center rounded-lg border border-senti-border px-3 py-1.5 text-xs font-medium text-gray-100 hover:border-senti-purple hover:text-senti-purple"
                            >
                              {selectedProject.status === "ACTIVE"
                                ? "Set as Inactive"
                                : "Set as Active"}
                            </button>
                            <button
                              type="button"
                              disabled={running}
                              onClick={handleRunCollector}
                              className="inline-flex items-center rounded-lg bg-gradient-to-r from-senti-purple to-senti-blue px-3 py-1.5 text-xs font-semibold text-white shadow disabled:opacity-60"
                            >
                              {running ? "Running…" : "Run"}
                            </button>
                            <button
                              type="button"
                              onClick={() => navigate(`/projects/${selectedProject.id}`)}
                              className="inline-flex items-center rounded-lg border border-senti-border px-3 py-1.5 text-xs font-medium text-gray-100 hover:border-senti-blue hover:text-senti-blue"
                            >
                              Open dashboard →
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="mb-4 flex flex-1 flex-col gap-4 md:flex-row">
                        <div className="flex-1 space-y-3 text-sm">
                          <div>
                            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Brand Description
                            </div>
                            <div className="rounded-xl border border-senti-border bg-senti-dark/70 p-3 text-gray-200">
                              {selectedProject.description || (
                                <span className="text-gray-500">
                                  No description added for this project yet.
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="grid gap-3 text-xs text-gray-400 md:grid-cols-2">
                            <div className="rounded-xl border border-senti-border bg-senti-dark/70 p-3">
                              <div className="mb-1 font-medium text-gray-200">
                                Primary Keyword
                              </div>
                              <div>{selectedProject.primaryKeyword}</div>
                            </div>
                            <div className="rounded-xl border border-senti-border bg-senti-dark/70 p-3">
                              <div className="mb-1 font-medium text-gray-200">
                                Domain / Sector
                              </div>
                              <div>{selectedProject.domain}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center text-sm text-gray-400">
                      <p className="mb-2">No project selected.</p>
                      <p>Choose a project from the list or create a new one.</p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </main>
        </div>
      </div>

      {/* New project modal */}
      {showNewProject && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl border border-senti-border bg-senti-card/95 p-6 shadow-2xl">
            <h2 className="mb-1 text-lg font-semibold text-white">Create project</h2>
            <p className="mb-4 text-sm text-gray-400">
              Define a primary keyword, brand description and domain for this project.
            </p>
            <form onSubmit={handleCreateProject} className="space-y-4 text-sm">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-300">
                  Primary keyword
                </label>
                <input
                  type="text"
                  required
                  value={newPrimaryKeyword}
                  onChange={(e) => setNewPrimaryKeyword(e.target.value)}
                  className="w-full rounded-xl border border-senti-border bg-senti-dark px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-senti-purple focus:outline-none focus:ring-1 focus:ring-senti-purple"
                  placeholder="e.g. your brand name"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-300">
                  Brand description
                </label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full resize-none rounded-xl border border-senti-border bg-senti-dark px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-senti-purple focus:outline-none focus:ring-1 focus:ring-senti-purple"
                  placeholder="Short description about your brand"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-300">
                  Domain / sector
                </label>
                <input
                  type="text"
                  required
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className="w-full rounded-xl border border-senti-border bg-senti-dark px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-senti-purple focus:outline-none focus:ring-1 focus:ring-senti-purple"
                  placeholder="e.g. fintech, e-commerce, healthcare"
                />
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewProject(false)}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-gray-300 hover:bg-senti-border/60"
                  disabled={savingProject}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProject}
                  className="rounded-xl bg-gradient-to-r from-senti-purple to-senti-blue px-4 py-2 text-sm font-semibold text-white shadow-lg disabled:opacity-60"
                >
                  {savingProject ? "Creating…" : "Create project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Profile modal */}
      {showProfile && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl border border-senti-border bg-senti-card/95 p-6 shadow-2xl">
            <h2 className="mb-1 text-lg font-semibold text-white">Profile settings</h2>
            <p className="mb-4 text-sm text-gray-400">
              Update your name details. Your email is fixed for this account.
            </p>
            <form onSubmit={handleSaveProfile} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-300">
                    First name
                  </label>
                  <input
                    type="text"
                    required
                    value={profileFirstName}
                    onChange={(e) => setProfileFirstName(e.target.value)}
                    className="w-full rounded-xl border border-senti-border bg-senti-dark px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-senti-purple focus:outline-none focus:ring-1 focus:ring-senti-purple"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-300">
                    Last name
                  </label>
                  <input
                    type="text"
                    value={profileLastName}
                    onChange={(e) => setProfileLastName(e.target.value)}
                    className="w-full rounded-xl border border-senti-border bg-senti-dark px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-senti-purple focus:outline-none focus:ring-1 focus:ring-senti-purple"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-300">
                  Email
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full cursor-not-allowed rounded-xl border border-senti-border bg-senti-dark/60 px-3 py-2 text-sm text-gray-400"
                />
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowProfile(false)}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-gray-300 hover:bg-senti-border/60"
                  disabled={savingProfile}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="rounded-xl bg-gradient-to-r from-senti-purple to-senti-blue px-4 py-2 text-sm font-semibold text-white shadow-lg disabled:opacity-60"
                >
                  {savingProfile ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

