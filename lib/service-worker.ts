/**
 * service-worker.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles registration of /sw.js and listens for SW_NAVIGATE messages so the
 * Service Worker can tell the active tab to navigate to a URL when a push
 * notification is clicked.
 *
 * Call `registerServiceWorker()` once – from a "use client" component that
 * mounts inside the root layout (e.g. a <ServiceWorkerProvider> or directly
 * in the root layout's client wrapper).
 *
 * The module is safe to import in SSR contexts: every DOM/browser API access
 * is guarded by `typeof window !== "undefined"` checks.
 * ─────────────────────────────────────────────────────────────────────────────
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SwNavigateMessage {
  type: "SW_NAVIGATE";
  url: string;
}

export interface SwVersionMessage {
  type: "SW_VERSION";
  version: string;
}

export type SwMessage = SwNavigateMessage | SwVersionMessage;

// ─── Registration ─────────────────────────────────────────────────────────────

/**
 * Register the Service Worker at /sw.js.
 *
 * - Only runs in the browser (SSR-safe).
 * - Only registers if `navigator.serviceWorker` is available.
 * - Logs the registration result in development; silent in production.
 *
 * @returns A Promise that resolves to the ServiceWorkerRegistration, or null
 *          if Service Workers are not supported or registration fails.
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      // `scope` defaults to the directory containing sw.js.
      // Since sw.js is at the root, it controls the entire application.
      scope: "/",
      // `updateViaCache` controls whether the browser fetches the SW script
      // through the HTTP cache. "none" ensures we always check for updates.
      updateViaCache: "none",
    });

    if (process.env.NODE_ENV === "development") {
      console.log("[SW] Registered. Scope:", registration.scope);
    }

    // Listen for SW updates and activate the new version immediately.
    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener("statechange", () => {
        if (
          newWorker.state === "installed" &&
          navigator.serviceWorker.controller
        ) {
          // A new SW has been installed. Tell it to skip waiting so it
          // activates immediately rather than waiting for all tabs to close.
          newWorker.postMessage({ type: "SKIP_WAITING" });

          if (process.env.NODE_ENV === "development") {
            console.log("[SW] New version installed and activated.");
          }
        }
      });
    });

    return registration;
  } catch (err) {
    // Failures are non-fatal: the app works without a SW.
    if (process.env.NODE_ENV === "development") {
      console.warn("[SW] Registration failed:", err);
    }
    return null;
  }
}

/**
 * Unregister all Service Workers for this origin.
 * Call this only when intentionally disabling the SW (e.g. during tests or
 * when rolling back a broken SW deployment).
 */
export async function unregisterServiceWorker(): Promise<void> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((r) => r.unregister()));

    if (process.env.NODE_ENV === "development") {
      console.log(`[SW] Unregistered ${registrations.length} service worker(s).`);
    }
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[SW] Unregistration failed:", err);
    }
  }
}

// ─── SW_NAVIGATE message listener ─────────────────────────────────────────────

/**
 * Attach a `message` listener to `navigator.serviceWorker` that handles
 * `SW_NAVIGATE` messages sent by the Service Worker after a push notification
 * click. When the SW finds an existing client tab to focus instead of opening
 * a new window, it posts a `SW_NAVIGATE` message so the tab can navigate
 * programmatically (using Next.js router) without a full page reload.
 *
 * @param router - The Next.js `AppRouterInstance` from `useRouter()`.
 * @returns A cleanup function that removes the listener.
 */
export function attachSwNavigateListener(
  router: ReturnType<typeof useRouter>,
): () => void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return () => {};
  }

  const handleMessage = (event: MessageEvent<SwMessage>) => {
    if (!event.data || event.data.type !== "SW_NAVIGATE") return;

    const { url } = event.data;

    try {
      // Convert the absolute URL to a relative path so next/navigation
      // can handle it as a client-side navigation.
      const parsed = new URL(url, window.location.origin);

      if (parsed.origin === window.location.origin) {
        // Same-origin: use the Next.js router for a soft navigation.
        router.push(parsed.pathname + parsed.search + parsed.hash);
      } else {
        // Cross-origin (shouldn't happen, but be safe): hard navigation.
        window.location.href = url;
      }
    } catch {
      // URL parsing failed – fall back to hard navigation.
      window.location.href = url;
    }
  };

  navigator.serviceWorker.addEventListener("message", handleMessage);

  return () => {
    navigator.serviceWorker.removeEventListener("message", handleMessage);
  };
}

// ─── React hook ───────────────────────────────────────────────────────────────

/**
 * `useServiceWorker`
 *
 * React hook that:
 *   1. Registers `/sw.js` on mount (once, idempotent).
 *   2. Attaches the `SW_NAVIGATE` message listener so push notification clicks
 *      trigger client-side navigation via the Next.js router.
 *
 * Place this hook in a component that is rendered inside the root layout and
 * has access to the Next.js router (i.e. a "use client" component).
 *
 * @example
 * // In your root providers component:
 * "use client";
 * import { useServiceWorker } from "@/lib/service-worker";
 *
 * export function AppProviders({ children }: { children: React.ReactNode }) {
 *   useServiceWorker();
 *   return <>{children}</>;
 * }
 */
export function useServiceWorker(): void {
  const router = useRouter();

  useEffect(() => {
    // Register the SW (async, non-blocking)
    registerServiceWorker();

    // Attach the SW_NAVIGATE message handler and keep the cleanup ref.
    const cleanup = attachSwNavigateListener(router);

    return cleanup;
    // router is stable across renders in Next.js App Router, but adding it
    // to deps satisfies the exhaustive-deps lint rule.
  }, [router]);
}
