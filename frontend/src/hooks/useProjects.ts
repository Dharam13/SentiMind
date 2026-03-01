import { useEffect, useState } from "react";
import type { Project } from "../api/projectApi";
import * as projectApi from "../api/projectApi";

/**
 * Minimal projects hook (safe refactor helper).
 * Not wired into pages yet; does not change runtime behavior unless used.
 */
export function useProjects(accessToken: string | null) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    projectApi
      .listProjects(accessToken)
      .then((res) => setProjects(res.projects))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load projects"))
      .finally(() => setLoading(false));
  }, [accessToken]);

  return { projects, setProjects, loading, error };
}

