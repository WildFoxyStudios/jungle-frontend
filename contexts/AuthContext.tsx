"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  authApi,
  tokenStorage,
  getErrorMessage,
  type User,
  type RegisterPayload,
  type LoginPayload,
} from "@/lib/api";

// ─── Context shape ───────────────────────────────────────────────────────────

interface AuthContextType {
  user: User | null;
  loading: boolean;
  /** null  → no 2FA required
   *  string → temp_token returned by the server, UI should ask for the TOTP code */
  pending2FAToken: string | null;
  login: (data: LoginPayload) => Promise<void>;
  verify2FA: (code: string) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  /** Re-fetch /auth/me and refresh the local user object */
  refreshUser: () => Promise<void>;
  /** Update the local user object after a profile edit (avoids a round-trip) */
  updateUser: (partial: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending2FAToken, setPending2FAToken] = useState<string | null>(null);
  const router = useRouter();

  // ── Hydrate from stored token on mount ──
  const refreshUser = useCallback(async () => {
    const token = tokenStorage.get();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await authApi.me();
      setUser(me);
    } catch {
      // Token is invalid / expired – clean up silently
      tokenStorage.remove();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // ── Actions ──────────────────────────────────────────────────────────────

  const login = async (data: LoginPayload) => {
    const response = await authApi.login(data);

    // Server may return a temp_token instead of session_token when 2FA is enabled
    const raw = response as unknown as Record<string, unknown>;
    if (raw.requires_2fa && typeof raw.temp_token === "string") {
      setPending2FAToken(raw.temp_token);
      return; // Caller should redirect to /login/2fa
    }

    tokenStorage.set(response.session_token);
    setUser(response.user);
    setPending2FAToken(null);
    router.push("/home");
  };

  const verify2FA = async (code: string) => {
    if (!pending2FAToken) {
      throw new Error("No hay un proceso de 2FA pendiente");
    }
    const response = await authApi.verify2FALogin(pending2FAToken, code);
    tokenStorage.set(response.session_token);
    setUser(response.user);
    setPending2FAToken(null);
    router.push("/home");
  };

  const register = async (data: RegisterPayload) => {
    const response = await authApi.register(data);
    tokenStorage.set(response.session_token);
    setUser(response.user);
    router.push("/home");
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Best-effort; always clear local state
    } finally {
      tokenStorage.remove();
      setUser(null);
      setPending2FAToken(null);
      router.push("/login");
    }
  };

  const updateUser = (partial: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...partial } : prev));
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        pending2FAToken,
        login,
        verify2FA,
        register,
        logout,
        refreshUser,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
