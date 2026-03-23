"use client";

import { useServiceWorker } from "@/lib/service-worker";
import type { ReactNode } from "react";

/**
 * AppProviders
 * ─────────────────────────────────────────────────────────────────────────────
 * Client-side provider wrapper rendered inside the root layout.
 *
 * Responsibilities:
 *   1. Register the Service Worker (/sw.js) once on mount.
 *   2. Attach the SW_NAVIGATE message handler for push-notification routing.
 *
 * All heavyweight providers (AuthProvider, RealtimeProvider, ThemeProvider)
 * live in the Server Component root layout (app/layout.tsx) so they can be
 * tree-shaken correctly. This component handles only the client-only side
 * effects that cannot run in a Server Component.
 *
 * Usage (already wired in app/layout.tsx):
 *
 *   import { AppProviders } from "./providers";
 *
 *   <ThemeProvider>
 *     <AuthProvider>
 *       <RealtimeProvider>
 *         <AppProviders>{children}</AppProviders>
 *       </RealtimeProvider>
 *     </AuthProvider>
 *   </ThemeProvider>
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function AppProviders({ children }: { children: ReactNode }) {
  // Register /sw.js and attach the SW_NAVIGATE push-notification router.
  // This hook is a no-op in SSR and in browsers without Service Worker support.
  useServiceWorker();

  return <>{children}</>;
}
