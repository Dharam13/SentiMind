const COLLECTOR_BASE =
  (import.meta.env.VITE_API_GATEWAY_URL as string) ||
  (import.meta.env.VITE_COLLECTOR_API_URL as string) ||
  "http://localhost:8000";

export type Platform = "reddit" | "twitter" | "youtube" | "tumblr" | "news";

export interface RunCollectionBody {
  projectId: number;
  keyword: string;
  limit?: number;
  hours?: number;
  platforms?: Platform[];
}

export interface RunCollectionResponse {
  projectId: number;
  keyword: string;
  hoursUsed: number;
  fetchedByPlatform: Record<string, number>;
  errorsByPlatform: Record<string, string>;
  insertedCount: number;
  skippedExisting: number;
}

export interface SummaryTimePoint {
  date: string;
  count: number;
}

export interface SummaryPlatformPoint {
  platform: string;
  count: number;
}

export interface SummaryMention {
  id: string;
  projectId: number;
  keyword: string;
  platform: string;
  content?: string;
  author?: string;
  sourceUrl?: string;
  publishedAt: string;
  timeWindowUsed: number;
  metadata: Record<string, any>;
}

export interface ProjectSummaryResponse {
  projectId: number;
  keyword: string | null;
  hoursUsed: number;
  totalMentions: number;
  timeSeries: SummaryTimePoint[];
  byPlatform: SummaryPlatformPoint[];
  mentions: SummaryMention[];
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${COLLECTOR_BASE}${path}`, {
    ...(init ?? {}),
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers as Record<string, string>),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data as any)?.error || "Request failed";
    throw new Error(msg);
  }
  return data as T;
}

export async function runCollection(body: RunCollectionBody): Promise<RunCollectionResponse> {
  return request<RunCollectionResponse>("/api/collect/run", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getProjectSummary(params: {
  projectId: number;
  keyword?: string;
  hours?: number;
}): Promise<ProjectSummaryResponse> {
  const q = new URLSearchParams();
  q.set("projectId", String(params.projectId));
  if (params.keyword) q.set("keyword", params.keyword);
  if (params.hours) q.set("hours", String(params.hours));
  return request<ProjectSummaryResponse>(`/api/collect/summary?${q.toString()}`, {
    method: "GET",
  });
}

