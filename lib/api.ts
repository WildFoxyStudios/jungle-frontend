/**
 * Core API client
 * ─────────────────────────────────────────────────────────────────
 * Single Axios instance shared by every api-*.ts module.
 * Base URL already contains /api, so all route paths must start
 * with a plain "/" (e.g. "/auth/login", NOT "/api/auth/login").
 */

import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

// ─── Retry configuration ──────────────────────────────────────────
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500;
const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

function shouldRetry(error: AxiosError): boolean {
  // Always retry on network errors (no response)
  if (!error.response) return true;
  // Retry on specific HTTP status codes
  return RETRYABLE_STATUS_CODES.has(error.response.status);
}

function getRetryDelay(attempt: number, error: AxiosError): number {
  // Respect Retry-After header if present (e.g. for 429 responses)
  const retryAfter = error.response?.headers?.["retry-after"];
  if (retryAfter) {
    const parsed = Number(retryAfter);
    if (!isNaN(parsed)) return parsed * 1000;
  }
  // Exponential backoff: 500ms, 1000ms, 2000ms, ...
  return RETRY_DELAY_MS * Math.pow(2, attempt - 1);
}

// ─── Error utilities (single source of truth in errors.ts) ───────
export { getErrorMessage, parseError } from "./errors";
export type { ApiError } from "./errors";

// ─── Domain types (canonical source: lib/types.ts) ────────────────
// Imported here for use in authApi, then re-exported so AuthContext
// only needs a single import path ("@/lib/api").
import type {
  User,
  AuthResponse,
  RegisterPayload,
  LoginPayload,
} from "./types";

export type { User, AuthResponse, RegisterPayload, LoginPayload };

// ─── Base URL ────────────────────────────────────────────────────
// Set NEXT_PUBLIC_API_URL in .env.local to point at your backend.
// e.g. NEXT_PUBLIC_API_URL=http://localhost:8080/api
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api";

// WebSocket base derived from HTTP base (http → ws, https → wss)
export const WS_BASE_URL = API_BASE_URL.replace(/^http/, "ws").replace(
  /\/api$/,
  "",
);

// ─── Token helpers ───────────────────────────────────────────────
const TOKEN_KEY = "session_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

export const tokenStorage = {
  get(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  },
  set(token: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(TOKEN_KEY, token);
    // Sync to cookie so Next.js middleware (Edge runtime) can read it
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
  },
  remove(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEY);
    // Expire the cookie immediately
    document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
  },
};

// ─── Axios instance ──────────────────────────────────────────────
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
  withCredentials: true,
});

// ── Retry interceptor ─────────────────────────────────────────────
// Attach a retry counter to each request config so we can track
// how many times it has already been retried.
declare module "axios" {
  interface InternalAxiosRequestConfig {
    _retryCount?: number;
  }
}
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor – retry + global 401 handling ────────────
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig & {
      _retryCount?: number;
    };

    // ── Retry logic ────────────────────────────────────────────────
    if (config && shouldRetry(error)) {
      config._retryCount = (config._retryCount ?? 0) + 1;

      if (config._retryCount <= MAX_RETRIES) {
        const delay = getRetryDelay(config._retryCount, error);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return api(config);
      }
    }

    // ── 401 global redirect ────────────────────────────────────────
    if (error.response?.status === 401) {
      // Don't nuke the token for the login request itself
      const url = error.config?.url ?? "";
      const isAuthRequest = url.includes("/auth/login") || url.includes("/auth/register") || url.includes("/auth/2fa");
      if (!isAuthRequest) {
        tokenStorage.remove();
        if (typeof window !== "undefined") {
          const path = window.location.pathname;
          const authPaths = [
            "/login",
            "/register",
            "/forgot-password",
            "/reset-password",
            "/verify-email",
          ];
          if (!authPaths.some((p) => path.startsWith(p))) {
            window.location.href = "/login";
          }
        }
      }
    }
    return Promise.reject(error);
  },
);

// ─── Auth API ────────────────────────────────────────────────────
export const authApi = {
  register: (data: RegisterPayload) =>
    api.post<AuthResponse>("/auth/register", data).then((r) => r.data),

  login: (data: LoginPayload) =>
    api.post<AuthResponse>("/auth/login", data).then((r) => r.data),

  logout: () =>
    api.post<{ message: string }>("/auth/logout").then((r) => r.data),

  me: () => api.get<User>("/auth/me").then((r) => r.data),

  forgotPassword: (email: string) =>
    api
      .post<{ message: string }>("/auth/forgot-password", { email })
      .then((r) => r.data),

  resetPassword: (token: string, new_password: string) =>
    api
      .post<{
        message: string;
      }>("/auth/reset-password", { token, new_password })
      .then((r) => r.data),

  verifyEmail: (token: string) =>
    api
      .post<{ message: string }>("/auth/verify-email", { token })
      .then((r) => r.data),

  resendVerification: (email: string) =>
    api
      .post<{ message: string }>("/auth/resend-verification", { email })
      .then((r) => r.data),

  verify2FALogin: (temp_token: string, code: string) =>
    api
      .post<AuthResponse>("/auth/2fa/verify-login", { temp_token, code })
      .then((r) => r.data),
};
