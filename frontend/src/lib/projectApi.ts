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

