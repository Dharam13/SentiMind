/**
 * Collector API client
 *
 * NOTE: Safe refactor - logic kept identical to previous src/lib/collectorApi.ts
 */

const COLLECTOR_BASE = (import.meta.env.VITE_API_BASE as string) || "http://localhost:8000";

export type Platform = "reddit" | "twitter" | "youtube" | "medium" | "linkedin" | "news";

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
  /** When "rss", mention was collected via RSS feed (e.g. Medium) */
  sourceType?: "api" | "rss";
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

function timeoutPromise<T>(ms: number): Promise<T> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms);
  });
}

async function request<T>(path: string, init?: RequestInit, timeoutMs: number = 120000): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.warn(`[API] Request timeout after ${timeoutMs}ms: ${path}`);
    controller.abort();
  }, timeoutMs);

  try {
    console.log(`[API] Making request: ${init?.method || "GET"} ${path}`);
    const fetchPromise = fetch(`${COLLECTOR_BASE}${path}`, {
      ...(init ?? {}),
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers as Record<string, string>),
      },
    });

    const res = await Promise.race([fetchPromise, timeoutPromise<Response>(timeoutMs)]);
    clearTimeout(timeoutId);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const msg = (data as any)?.error || `Request failed with status ${res.status}`;
      console.error(`[API] Request failed: ${res.status} - ${msg}`);
      throw new Error(msg);
    }

    const data = await res.json().catch((err) => {
      console.error(`[API] Failed to parse JSON response:`, err);
      throw new Error("Invalid response from server");
    });

    console.log(`[API] Request successful: ${path}`);
    return data as T;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error) {
      if (
        error.name === "AbortError" ||
        error.message.includes("timed out") ||
        controller.signal.aborted
      ) {
        const timeoutMsg = `Request timed out after ${timeoutMs}ms. The collector may be taking too long or there may be network issues.`;
        console.error(`[API] ${timeoutMsg}`);
        throw new Error(timeoutMsg);
      }
      console.error(`[API] Request error:`, error.message);
      throw error;
    }
    throw new Error("Request failed");
  }
}

export async function runCollection(body: RunCollectionBody): Promise<RunCollectionResponse> {
  return request<RunCollectionResponse>(
    "/api/collect/run",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    120000
  );
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

