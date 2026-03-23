/**
 * api-server.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Server-side fetch helper for Next.js Server Components and Route Handlers.
 *
 * Unlike the client-side `api` (Axios) instance which reads the session token
 * from localStorage/cookies in the browser, this helper runs in the Node.js /
 * Edge runtime and must read the token from the incoming request's cookie header.
 *
 * Usage inside a Server Component:
 *
 *   import { serverFetch } from "@/lib/api-server";
 *   import { cookies } from "next/headers";
 *
 *   export default async function ProfilePage({ params }) {
 *     const { userId } = await params;
 *     const profile = await serverFetch(`/profile/${userId}`);
 *     // ...
 *   }
 *
 * Usage inside a Route Handler (app/api/...):
 *
 *   import { serverFetch } from "@/lib/api-server";
 *   import { cookies } from "next/headers";
 *   import { NextResponse } from "next/server";
 *
 *   export async function GET() {
 *     const data = await serverFetch("/posts/feed");
 *     return NextResponse.json(data);
 *   }
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { cookies } from "next/headers";

// ─── Constants ────────────────────────────────────────────────────────────────

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api";

const TOKEN_COOKIE_NAME = "session_token";

const DEFAULT_TIMEOUT_MS = 15_000;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ServerFetchOptions extends Omit<RequestInit, "body"> {
  /** Request body – will be JSON-serialised automatically. */
  body?: unknown;
  /** Override the auth token (useful in Route Handlers that receive it elsewhere). */
  token?: string;
  /** Request timeout in milliseconds. Defaults to 15 000. */
  timeoutMs?: number;
  /**
   * Next.js cache / revalidation options.
   * Passed directly to the underlying `fetch` call.
   *
   * @example { next: { revalidate: 60 } }   // ISR – refresh every 60 s
   * @example { cache: "no-store" }            // Always fetch fresh data
   */
  next?: NextFetchRequestConfig;
  /** If true, a non-2xx response returns null instead of throwing. */
  optional?: boolean;
}

export interface ServerFetchError {
  status: number;
  message: string;
  body?: unknown;
}

// ─── Token resolution ─────────────────────────────────────────────────────────

/**
 * Reads the session token from the Next.js cookie store.
 * Returns null if the cookie is absent or the runtime doesn't support cookies()
 * (e.g. during static generation).
 */
async function resolveToken(override?: string): Promise<string | null> {
  if (override) return override;

  try {
    const cookieStore = await cookies();
    return cookieStore.get(TOKEN_COOKIE_NAME)?.value ?? null;
  } catch {
    // cookies() throws during static generation or when called outside a
    // request context. Return null so the request proceeds without auth.
    return null;
  }
}

// ─── Core fetch helper ────────────────────────────────────────────────────────

/**
 * Perform an authenticated HTTP request from a Server Component or Route Handler.
 *
 * @param path    - API path relative to the base URL (e.g. `/posts/feed`).
 * @param options - Extended fetch options including body, token override, and
 *                  Next.js cache/revalidation config.
 * @returns       Parsed JSON response body typed as `T`.
 * @throws        `ServerFetchError` on non-2xx responses (unless `optional` is true).
 */
export async function serverFetch<T = unknown>(
  path: string,
  options: ServerFetchOptions = {},
): Promise<T> {
  const {
    body,
    token: tokenOverride,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    next,
    optional = false,
    method,
    headers: extraHeaders,
    ...rest
  } = options;

  // ── Resolve the auth token ──────────────────────────────────────────────────
  const token = await resolveToken(tokenOverride);

  // ── Build headers ──────────────────────────────────────────────────────────
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(extraHeaders as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${decodeURIComponent(token)}`;
  }

  // ── Build the full URL ─────────────────────────────────────────────────────
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  // ── Timeout via AbortController ────────────────────────────────────────────
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // ── Execute the fetch ──────────────────────────────────────────────────────
  let response: Response;
  try {
    response = await fetch(url, {
      method: method ?? (body !== undefined ? "POST" : "GET"),
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      // Next.js-specific cache config (passed through transparently)
      ...(next ? { next } : {}),
      ...rest,
    });
  } catch (err) {
    clearTimeout(timeoutId);

    if (err instanceof Error && err.name === "AbortError") {
      throw {
        status: 408,
        message: `Request to ${path} timed out after ${timeoutMs}ms`,
      } satisfies ServerFetchError;
    }

    throw {
      status: 0,
      message:
        err instanceof Error
          ? err.message
          : "Network error – could not reach the backend",
    } satisfies ServerFetchError;
  } finally {
    clearTimeout(timeoutId);
  }

  // ── Handle non-2xx ────────────────────────────────────────────────────────
  if (!response.ok) {
    if (optional) {
      // Caller explicitly opted out of error throwing
      return null as unknown as T;
    }

    let errorBody: unknown;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = await response.text().catch(() => null);
    }

    const message =
      (errorBody as Record<string, string> | null)?.error ??
      (errorBody as Record<string, string> | null)?.message ??
      response.statusText ??
      `HTTP ${response.status}`;

    throw {
      status: response.status,
      message,
      body: errorBody,
    } satisfies ServerFetchError;
  }

  // ── Parse and return body ─────────────────────────────────────────────────
  // 204 No Content – return null (cast to T to match the generic signature)
  if (response.status === 204) {
    return null as unknown as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json() as Promise<T>;
  }

  // Non-JSON response (e.g. plain text) – cast as-is
  return response.text() as unknown as T;
}

// ─── Convenience methods ──────────────────────────────────────────────────────

export const serverApi = {
  /**
   * GET request – useful for data fetching in Server Components.
   *
   * @example
   * const posts = await serverApi.get<Post[]>("/posts/feed", {
   *   next: { revalidate: 30 },
   * });
   */
  get: <T = unknown>(
    path: string,
    options?: Omit<ServerFetchOptions, "method" | "body">,
  ): Promise<T> => serverFetch<T>(path, { ...options, method: "GET" }),

  /**
   * POST request.
   *
   * @example
   * const session = await serverApi.post<AuthResponse>("/auth/login", { email, password });
   */
  post: <T = unknown>(
    path: string,
    body?: unknown,
    options?: Omit<ServerFetchOptions, "method">,
  ): Promise<T> => serverFetch<T>(path, { ...options, method: "POST", body }),

  /**
   * PUT request.
   */
  put: <T = unknown>(
    path: string,
    body?: unknown,
    options?: Omit<ServerFetchOptions, "method">,
  ): Promise<T> => serverFetch<T>(path, { ...options, method: "PUT", body }),

  /**
   * DELETE request.
   */
  delete: <T = unknown>(
    path: string,
    options?: Omit<ServerFetchOptions, "method" | "body">,
  ): Promise<T> => serverFetch<T>(path, { ...options, method: "DELETE" }),

  /**
   * PATCH request.
   */
  patch: <T = unknown>(
    path: string,
    body?: unknown,
    options?: Omit<ServerFetchOptions, "method">,
  ): Promise<T> => serverFetch<T>(path, { ...options, method: "PATCH", body }),
};

// ─── ISR / Static helpers ─────────────────────────────────────────────────────

/**
 * Fetch with ISR caching.
 * Data is cached and revalidated every `revalidateSeconds` seconds.
 *
 * @example
 * const trending = await cachedFetch<TrendingSearch[]>("/search/trending", 300);
 */
export async function cachedFetch<T = unknown>(
  path: string,
  revalidateSeconds: number,
  options?: Omit<ServerFetchOptions, "next" | "cache">,
): Promise<T> {
  return serverFetch<T>(path, {
    ...options,
    method: "GET",
    next: { revalidate: revalidateSeconds },
  });
}

/**
 * Fetch with no-store (always fresh, no caching).
 * Use for user-specific or real-time data.
 *
 * @example
 * const notifications = await freshFetch<Notification[]>("/notifications");
 */
export async function freshFetch<T = unknown>(
  path: string,
  options?: Omit<ServerFetchOptions, "cache" | "next">,
): Promise<T> {
  return serverFetch<T>(path, {
    ...options,
    cache: "no-store",
  });
}

// ─── Type guard ───────────────────────────────────────────────────────────────

/**
 * Returns true if the thrown value is a `ServerFetchError` (has `status` and
 * `message` fields). Use this in `try/catch` blocks inside Server Components.
 *
 * @example
 * try {
 *   const user = await serverApi.get<User>(`/profile/${userId}`);
 * } catch (err) {
 *   if (isServerFetchError(err) && err.status === 404) notFound();
 *   throw err;
 * }
 */
export function isServerFetchError(err: unknown): err is ServerFetchError {
  return (
    typeof err === "object" &&
    err !== null &&
    "status" in err &&
    "message" in err &&
    typeof (err as ServerFetchError).status === "number"
  );
}
