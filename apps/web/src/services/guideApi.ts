/**
 * OntDekker Guide API Functions
 *
 * All API calls for the Guide Service (Developer 3 scope).
 * Extracted from the monolithic api.ts as part of the service-layer split.
 *
 * Endpoint mapping:
 *   Guides : GET  /guides/api/v1/guides
 *
 * All paths are relative to the Traefik gateway base URL configured
 * in axios.ts (NEXT_PUBLIC_API_BASE_URL).
 */

import apiClient from "./axios";
import type {
  PaginatedResponse,
  GuideProfileSummary,
  GuideProfile,
  GuideReview,
  GuideRatingSummary,
  GuideFilter,
} from "@/types";

// ---------------------------------------------------------------------------
// Guides
// ---------------------------------------------------------------------------

/** Fetch paginated guide directory */
export async function getGuides(
  filters: Partial<GuideFilter> = {},
): Promise<PaginatedResponse<GuideProfileSummary>> {
  const { data } = await apiClient.get("/guides/api/v1/guides", {
    params: filters,
  });
  return data;
}

/** Fetch a single guide's full profile */
export async function getGuideById(guideId: string): Promise<GuideProfile> {
  const { data } = await apiClient.get(`/guides/api/v1/guides/${guideId}`);
  return data;
}

/** Fetch reviews for a guide */
export async function getGuideReviews(
  guideId: string,
  params: { page?: number; page_size?: number } = {},
): Promise<PaginatedResponse<GuideReview>> {
  const { data } = await apiClient.get(
    `/guides/api/v1/guides/${guideId}/reviews`,
    { params },
  );
  return data;
}

/** Fetch aggregated rating summary for a guide */
export async function getGuideRatingSummary(
  guideId: string,
): Promise<GuideRatingSummary> {
  const { data } = await apiClient.get(
    `/guides/api/v1/guides/${guideId}/reviews/summary`,
  );
  return data;
}

/** Bookmark a guide */
export async function bookmarkGuide(guideId: string): Promise<void> {
  await apiClient.post(`/guides/api/v1/guides/${guideId}/bookmark`);
}

/** Remove guide bookmark */
export async function unbookmarkGuide(guideId: string): Promise<void> {
  await apiClient.delete(`/guides/api/v1/guides/${guideId}/bookmark`);
}
