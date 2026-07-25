/**
 * OntDekker Axios Client
 *
 * Single shared Axios instance used by every API function in api.ts.
 * Never import Axios directly in components or views — always go through
 * this module or the useApi() hook.
 *
 * Configuration:
 *   baseURL   : NEXT_PUBLIC_API_BASE_URL (env) or http://localhost:80 (dev fallback)
 *   timeout   : 15 000 ms
 *   headers   : Content-Type: application/json
 *
 * Request interceptor:
 *   Attaches Authorization: Bearer <token> when a token is present.
 *   The token is injected via setAuthToken() — called from AppStateProvider
 *   whenever the auth state changes.
 *
 * Response interceptor:
 *   Normalises all error responses into ApiError shape:
 *     { detail: string; status: number }
 *   Re-throws as a plain Error with a `status` property so callers
 *   can distinguish HTTP errors from network errors.
 *
 * 401 handling:
 *   Dispatches a SIGN_OUT action by invoking the registered onUnauthorized
 *   callback. This is wired up in AppStateProvider.
 */

import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import type { ApiError } from "@/types";

// ---------------------------------------------------------------------------
// Base URL — reads from Next.js public env var
// ---------------------------------------------------------------------------

const BASE_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:80")
    : "http://localhost:80";

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ---------------------------------------------------------------------------
// Auth token management
// ---------------------------------------------------------------------------

/** Current JWT access token — set by AppStateProvider on auth change */
let _authToken: string | null = null;

/** Register / clear the token used by the request interceptor */
export function setAuthToken(token: string | null): void {
  _authToken = token;
}

/** Retrieve the current token (read-only) */
export function getAuthToken(): string | null {
  return _authToken;
}

// ---------------------------------------------------------------------------
// Unauthorised callback — wired up in AppStateProvider
// ---------------------------------------------------------------------------

let _onUnauthorized: (() => void) | null = null;

export function registerUnauthorizedHandler(handler: () => void): void {
  _onUnauthorized = handler;
}

// ---------------------------------------------------------------------------
// Request interceptor — inject Bearer token
// ---------------------------------------------------------------------------

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (_authToken) {
      config.headers.Authorization = `Bearer ${_authToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ---------------------------------------------------------------------------
// Response interceptor — normalise errors
// ---------------------------------------------------------------------------

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    const status = error.response?.status ?? 0;
    const detail =
      error.response?.data?.detail ??
      error.message ??
      "An unexpected error occurred.";

    // Trigger sign-out on 401 Unauthorized
    if (status === 401 && _onUnauthorized) {
      _onUnauthorized();
    }

    // Produce a normalised error object
    const normalised = new Error(detail) as Error & { status: number; detail: string };
    normalised.status = status;
    normalised.detail = detail;
    return Promise.reject(normalised);
  },
);

export default apiClient;
