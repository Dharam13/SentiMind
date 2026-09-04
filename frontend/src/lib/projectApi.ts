const AUTH_BASE =
  (import.meta.env.VITE_API_GATEWAY_URL as string) ||
  (import.meta.env.VITE_AUTH_API_URL as string) ||
  "http://localhost:8000";

export interface Project {
  id: number;
  userId: number;
  primaryKeyword: string;
  description: string | null;
  domain: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectBody {
  primaryKeyword: string;
  description?: string | null;
  domain: string;
}

export interface UpdateProjectBody {
  primaryKeyword?: string;
  description?: string | null;
  domain?: string;
  status?: "ACTIVE" | "INACTIVE";
}

async function request<T>(
  path: string,
  options: RequestInit & { accessToken: string }
): Promise<T> {
  const { accessToken, ...init } = options;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
    Authorization: `Bearer ${accessToken}`,
  };
  const res = await fetch(`${AUTH_BASE}/projects${path}`, { ...init, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401) {
      // 1. Try to silently refresh with refreshToken
      const storedRefresh = localStorage.getItem("sentimind_refresh");
      if (storedRefresh) {
        try {
          const refreshRes = await fetch(`${AUTH_BASE}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken: storedRefresh }),
          });
          const refreshData = await refreshRes.json();
          if (refreshRes.ok && refreshData.accessToken) {
            sessionStorage.setItem("sentimind_access", refreshData.accessToken);
            sessionStorage.setItem("sentimind_user", JSON.stringify(refreshData.user));
            localStorage.setItem("sentimind_refresh", refreshData.refreshToken);

            // Retry original request with fresh token
            const retryHeaders = {
              ...headers,
              Authorization: `Bearer ${refreshData.accessToken}`,
            };
            const retryRes = await fetch(`${AUTH_BASE}/projects${path}`, { ...init, headers: retryHeaders });
            const retryData = await retryRes.json().catch(() => ({}));
            if (retryRes.ok) return retryData as T;
          }
        } catch {
          /* refresh failed */
        }
      }

      // 2. Refresh was impossible or expired: clear storage & redirect to login immediately
      localStorage.removeItem("sentimind_refresh");
      sessionStorage.removeItem("sentimind_access");
      sessionStorage.removeItem("sentimind_user");
      window.location.href = "/login";
      throw new Error("Session expired. Redirecting to login...");
    }

    const msg = (data as any)?.error || "Request failed";
    throw new Error(msg);
  }
  return data as T;
}

export async function listProjects(accessToken: string): Promise<{
  projects: Project[];
}> {
  return request<{ projects: Project[] }>("/", {
    method: "GET",
    accessToken,
  });
}

export async function createProject(
  accessToken: string,
  body: CreateProjectBody
): Promise<{ project: Project }> {
  return request<{ project: Project }>("/", {
    method: "POST",
    body: JSON.stringify(body),
    accessToken,
  });
}

export async function updateProject(
  accessToken: string,
  id: number,
  body: UpdateProjectBody
): Promise<{ project: Project }> {
  return request<{ project: Project }>(`/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
    accessToken,
  });
}

export async function getProject(accessToken: string, id: number): Promise<{ project: Project }> {
  return request<{ project: Project }>(`/${id}`, {
    method: "GET",
    accessToken,
  });
}

export async function deleteProject(
  accessToken: string,
  id: number
): Promise<{ success: boolean; message: string; project: Project }> {
  return request<{ success: boolean; message: string; project: Project }>(`/${id}`, {
    method: "DELETE",
    accessToken,
  });
}

