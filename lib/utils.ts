import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Admin utility functions ──────────────────────────────────────────────────

export function truncate(str: string, maxLen: number): string {
  if (!str) return "";
  return str.length > maxLen ? str.slice(0, maxLen) + "…" : str;
}

export function formatDate(dateStr: string, formatStr?: string): string {
  if (!dateStr) return "—";
  try {
    if (formatStr) {
      // Simple format support for admin pages
      const d = new Date(dateStr);
      return d.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: formatStr.includes("HH") ? "2-digit" : undefined,
        minute: formatStr.includes("mm") ? "2-digit" : undefined,
      });
    }
    return new Date(dateStr).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}
