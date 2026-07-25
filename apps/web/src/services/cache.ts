/**
 * OntDekker SWR Cache Helpers
 *
 * Provides:
 *   1. A generic SWR fetcher backed by the shared Axios instance.
 *      Pass this as the `fetcher` argument to useSWR() / useSWRInfinite().
 *
 *   2. Typed SWR key factories for every data domain.
 *      Centralising keys prevents typos and makes cache invalidation
 *      predictable — mutate(feedKeys.posts()) to refresh the feed,
 *      mutate(guideKeys.byId(id)) to refresh a single guide, etc.
 *
 * Architecture (08-frontend-architecture.md § Caching Strategy):
 *   OntDekker follows Stale-While-Revalidate (SWR):
 *     Cached data → render immediately → background fetch → update cache
 *
 * Usage:
 *   import useSWR from "swr";
 *   import { swrFetcher, feedKeys } from "@/services/cache";
 *
 *   const { data, error, isLoading } = useSWR(feedKeys.posts(), swrFetcher);
 */

import apiClient from "./axios";

// ---------------------------------------------------------------------------
// Generic SWR fetcher
// ---------------------------------------------------------------------------

/**
 * Fetches the given URL using the shared Axios client and returns the
 * response body.  Errors thrown here are caught by SWR and surfaced in
 * the `error` field of the useSWR return value.
 */
export async function swrFetcher<T>(url: string): Promise<T> {
  const { data } = await apiClient.get<T>(url);
  return data;
}

/**
 * Fetcher with query params serialised from a [url, params] tuple key.
 * Use with useSWR([url, params], swrFetcherWithParams).
 */
export async function swrFetcherWithParams<T>(
  url: string,
  params: Record<string, unknown>,
): Promise<T> {
  const { data } = await apiClient.get<T>(url, { params });
  return data;
}

// ---------------------------------------------------------------------------
// Key factories
// ---------------------------------------------------------------------------

/** Feed / Posts */
export const feedKeys = {
  posts: (page = 1, pageSize = 20) =>
    `/feed/api/v1/posts?page=${page}&page_size=${pageSize}`,
  post: (id: string) => `/feed/api/v1/posts/${id}`,
} as const;

/** Guides */
export const guideKeys = {
  list: (params: Record<string, unknown> = {}) =>
    ["/guides/api/v1/guides", params] as [string, Record<string, unknown>],
  byId: (id: string) => `/guides/api/v1/guides/${id}`,
  reviews: (id: string, page = 1) =>
    `/guides/api/v1/guides/${id}/reviews?page=${page}`,
  ratingSummary: (id: string) =>
    `/guides/api/v1/guides/${id}/reviews/summary`,
  myConnections: () => `/guides/api/v1/guides/my-connections`,
} as const;

/** Communities */
export const communityKeys = {
  list: (params: Record<string, unknown> = {}) =>
    ["/communities/api/v1/communities", params] as [string, Record<string, unknown>],
  byId: (id: string) => `/communities/api/v1/communities/${id}`,
} as const;

/** Expeditions */
export const expeditionKeys = {
  mine: (params: Record<string, unknown> = {}) =>
    ["/expeditions/api/v1/expeditions", params] as [string, Record<string, unknown>],
  byId: (id: string) => `/expeditions/api/v1/expeditions/${id}`,
  gear: (id: string) => `/expeditions/api/v1/expeditions/${id}/gear`,
  gallery: (id: string) => `/expeditions/api/v1/expeditions/${id}/gallery`,
  participants: (id: string) =>
    `/expeditions/api/v1/expeditions/${id}/participants`,
  itinerary: (id: string) =>
    `/expeditions/api/v1/expeditions/${id}/itinerary`,
} as const;

/** Notifications */
export const notificationKeys = {
  unread: () => "/notifications/api/v1/notifications/unread",
  all: (page = 1) => `/notifications/api/v1/notifications?page=${page}`,
} as const;

/** User / Profile */
export const userKeys = {
  profile: (userId: string) => `/users/api/v1/users/${userId}`,
  me: () => "/users/api/v1/users/me",
} as const;
