/**
 * Auth API client - talks to Sentimind auth service
 */

const AUTH_BASE =
  (import.meta.env.VITE_AUTH_API_URL as string) || "http://localhost:8011";

export interface SignupBody {
  firstName: string;
  lastName?: string | null;
  email: string;
  password: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface User {
  id: number;
  firstName: string;
  lastName: string | null;
  email: string;
  isVerified: boolean;
  role: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface SignupResponse {
  message: string;
  user: User;
}

async function request<T>(
  path: string,
  options: RequestInit & { accessToken?: string } = {}
): Promise<T> {
  const { accessToken, ...init } = options;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };
  if (accessToken) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${accessToken}`;
  }
  const res = await fetch(`${AUTH_BASE}/auth${path}`, { ...init, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error || data?.details?.[0]?.message || "Request failed";
    throw new Error(msg);
  }
  return data as T;
}

export async function signup(body: SignupBody): Promise<SignupResponse> {
  return request<SignupResponse>("/signup", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function login(body: LoginBody): Promise<AuthResponse> {
  return request<AuthResponse>("/login", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function refresh(refreshToken: string): Promise<AuthResponse> {
  return request<AuthResponse>("/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}

export async function logout(refreshToken: string): Promise<{ message: string }> {
  return request("/logout", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}

export async function me(accessToken: string): Promise<{
  userId: string;
  email: string;
  role: string;
}> {
  return request("/me", { accessToken });
}
