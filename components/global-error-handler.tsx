"use client";

import { useEffect } from "react";
import { toast } from "sonner";

/**
 * Registers a global handler for unhandled promise rejections.
 * Logs the error and shows a generic toast to the user.
 */
export function GlobalErrorHandler() {
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      console.error("[unhandledrejection]", event.reason);
      toast.error("An unexpected error occurred. Please try again.");
    };

    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, []);

  return null;
}
