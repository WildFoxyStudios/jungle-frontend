"use client";

/**
 * Admin Toast renderer — not needed because the frontend's ToastProvider
 * (from @/components/ui/toast) already handles toast rendering globally.
 * This file exists only to prevent import errors from admin pages.
 */
export default function ToastRenderer() {
  return null;
}
