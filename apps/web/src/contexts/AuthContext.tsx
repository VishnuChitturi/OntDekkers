"use client";

/**
 * OntDekker Frontend — Authentication Context
 *
 * Manages the authenticated user session across the application.
 *
 * Token strategy (matches current backend contract — JSON body, no HttpOnly cookies):
 *   - Access token : in-memory only (never persisted to browser storage)
 *   - Refresh token: localStorage (Phase 1 — backend uses JSON body, not HttpOnly cookie)
 *
 * On mount: reads refresh_token from localStorage, calls POST /auth/refresh,
 * then calls GET /auth/me to restore the session. Clears stale tokens on failure.
 *
 * Does NOT:
 *   - Decode JWT payload client-side as a substitute for /auth/me
 *   - Implement automatic Axios 401 retry (belongs in a later interceptor layer)
 *   - Log tokens or Authorization header values
 *   - Import or modify the Axios transport layer directly (uses authHttp)
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { authHttp, setAccessToken } from "@/services/api";

// ---------------------------------------------------------------------------
// Types — match backend Authentication Service schemas
// ---------------------------------------------------------------------------

export interface AuthUser {
  id: string;
  email: string;
  is_verified: boolean;
  is_active: boolean;
  roles: string[];
  created_at: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

interface AccessTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// ---------------------------------------------------------------------------
// Storage key
// ---------------------------------------------------------------------------

const REFRESH_TOKEN_KEY = "ontdekker_refresh_token";

function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

function storeRefreshToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

function clearStoredRefreshToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Guard against concurrent initialisation (React StrictMode mounts twice)
  const initialising = useRef(false);

  /** Fetch the current authenticated user identity from GET /auth/me. */
  const fetchUser = useCallback(async (): Promise<AuthUser> => {
    const response = await authHttp.get<AuthUser>("/auth/me");
    return response.data;
  }, []);

  /** Attempt to restore a session from a stored refresh token on app load. */
  const restoreSession = useCallback(async (): Promise<void> => {
    const storedRefresh = getStoredRefreshToken();
    if (!storedRefresh) return;

    try {
      const response = await authHttp.post<AccessTokenResponse>(
        "/auth/refresh",
        { refresh_token: storedRefresh }
      );
      // Set in-memory access token — never log it
      setAccessToken(response.data.access_token);

      // Load user identity from /auth/me (do not decode JWT client-side)
      const authUser = await fetchUser();
      setUser(authUser);
    } catch {
      // Refresh token is invalid or expired — clear stale state silently
      clearStoredRefreshToken();
      setAccessToken(null);
      setUser(null);
    }
  }, [fetchUser]);

  // Run session restoration once on mount
  useEffect(() => {
    if (initialising.current) return;
    initialising.current = true;

    restoreSession().finally(() => {
      setIsLoading(false);
    });
  }, [restoreSession]);

  // ---------------------------------------------------------------------------
  // login
  // ---------------------------------------------------------------------------

  const login = useCallback(
    async ({ email, password }: LoginCredentials): Promise<void> => {
      const response = await authHttp.post<LoginResponse>("/auth/login", {
        email,
        password,
      });

      const { access_token, refresh_token } = response.data;

      // Persist refresh token (localStorage — Phase 1 strategy)
      storeRefreshToken(refresh_token);

      // Keep access token in memory only
      setAccessToken(access_token);

      // Fetch and store authenticated user identity
      const authUser = await fetchUser();
      setUser(authUser);
    },
    [fetchUser]
  );

  // ---------------------------------------------------------------------------
  // logout
  // ---------------------------------------------------------------------------

  const logout = useCallback(async (): Promise<void> => {
    const storedRefresh = getStoredRefreshToken();

    // Attempt to revoke the refresh token on the backend
    if (storedRefresh) {
      try {
        await authHttp.post("/auth/logout", { refresh_token: storedRefresh });
      } catch {
        // Remote logout failure is non-fatal — always clear local state
      }
    }

    // Clear all local auth state regardless of remote call result
    clearStoredRefreshToken();
    setAccessToken(null);
    setUser(null);
  }, []);

  // ---------------------------------------------------------------------------
  // Context value
  // ---------------------------------------------------------------------------

  const value: AuthContextValue = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ---------------------------------------------------------------------------
// useAuth hook
// ---------------------------------------------------------------------------

/**
 * Access the authentication context.
 * Must be called inside an <AuthProvider> subtree.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
