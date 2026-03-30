"use client";

/**
 * Compatibility wrapper for admin pages that use the old toast API.
 * Maps `toast(message, type)` to the frontend's `useToast().success/error/info()`.
 */

import { useToast as useToastOriginal } from "@/components/ui/toast";

export function useToast() {
  const t = useToastOriginal();
  
  const toast = (message: string, type: "success" | "error" | "info" | "warning" = "info") => {
    switch (type) {
      case "success": t.success(message); break;
      case "error": t.error(message); break;
      case "warning": t.info(message); break;
      default: t.info(message); break;
    }
  };

  return { toast };
}
