"use client";

import { useAuth } from "@/contexts/AuthContext";
import type { User } from "@/lib/api";

/**
 * Convenience hook that returns the authenticated user.
 * Throws if used outside AuthProvider.
 *
 * @example
 * const user = useCurrentUser(); // user is User (never null inside (main) layout)
 */
export function useCurrentUser(): User {
  const { user } = useAuth();
  if (!user) {
    throw new Error(
      "useCurrentUser() called outside an authenticated context. " +
        "Wrap the component tree with <AuthProvider> and make sure the route " +
        "is protected by the (main) layout.",
    );
  }
  return user;
}

/**
 * Safe version – returns null if not authenticated instead of throwing.
 */
export function useOptionalUser(): User | null {
  const { user } = useAuth();
  return user;
}
