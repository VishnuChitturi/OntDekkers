/**
 * OntDekker API Functions
 *
 * Every network call in the frontend goes through this module.
 * Functions are pure async utilities — no React hooks, no side effects.
 * They accept plain arguments and return typed data from the response body.
 *
 * Error handling: errors are already normalised by the axios interceptor.
 * Callers receive a thrown Error with `.status` and `.detail` properties.
 *
 * Endpoint mapping (from backend docs):
 *   Feed          : GET  /feed/api/v1/posts
 *   Guides        : GET  /guides/api/v1/guides
 *   Communities   : GET  /communities/api/v1/communities
 *   Expeditions   : GET  /expeditions/api/v1/expeditions
 *   Notifications : GET  /notifications/api/v1/notifications
 *
 * All paths are relative to the Traefik gateway base URL configured
 * in axios.ts (NEXT_PUBLIC_API_BASE_URL).
 */

import apiClient from "./axios";
import type {
  PaginatedResponse,
  Post,
  GuideProfileSummary,
  GuideProfile,
  GuideReview,
  GuideRatingSummary,
  Community,
  Expedition,
  ExpeditionSummary,
  GearItem,
  GalleryPhoto,
  PackWeightSummary,
  Notification,
  GuideFilter,
} from "@/types";

// ---------------------------------------------------------------------------
// Types for filter / pagination params
// ---------------------------------------------------------------------------

export interface FeedParams {
  page?: number;
  page_size?: number;
}

export interface CommunityParams {
  page?: number;
  page_size?: number;
  search?: string;
}

export interface ExpeditionParams {
  community_id?: string;
  organizer_id?: string;
  status?: string;
  visibility?: string;
  page?: number;
  page_size?: number;
}

// ---------------------------------------------------------------------------
// Feed / Posts
// ---------------------------------------------------------------------------

/** Fetch the paginated editorial feed */
export async function getPosts(
  params: FeedParams = {},
): Promise<PaginatedResponse<Post>> {
  const { data } = await apiClient.get("/feed/api/v1/posts", { params });
  return data;
}

/** Toggle like on a post */
export async function likePost(postId: string): Promise<void> {
  await apiClient.post(`/feed/api/v1/posts/${postId}/like`);
}

/** Toggle unlike on a post */
export async function unlikePost(postId: string): Promise<void> {
  await apiClient.delete(`/feed/api/v1/posts/${postId}/like`);
}

/** Toggle save / bookmark a post */
export async function savePost(postId: string): Promise<void> {
  await apiClient.post(`/feed/api/v1/posts/${postId}/save`);
}

/** Remove save on a post */
export async function unsavePost(postId: string): Promise<void> {
  await apiClient.delete(`/feed/api/v1/posts/${postId}/save`);
}

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

// ---------------------------------------------------------------------------
// Communities
// ---------------------------------------------------------------------------

/** Fetch paginated community directory */
export async function getCommunities(
  params: CommunityParams = {},
): Promise<PaginatedResponse<Community>> {
  const { data } = await apiClient.get("/communities/api/v1/communities", {
    params,
  });
  return data;
}

/** Fetch a single community by ID */
export async function getCommunityById(communityId: string): Promise<Community> {
  const { data } = await apiClient.get(
    `/communities/api/v1/communities/${communityId}`,
  );
  return data;
}

/** Join a community */
export async function joinCommunity(communityId: string): Promise<void> {
  await apiClient.post(
    `/communities/api/v1/communities/${communityId}/join`,
  );
}

/** Leave a community */
export async function leaveCommunity(communityId: string): Promise<void> {
  await apiClient.delete(
    `/communities/api/v1/communities/${communityId}/join`,
  );
}

// ---------------------------------------------------------------------------
// Expeditions
// ---------------------------------------------------------------------------

/** Fetch my expeditions (as participant or organiser) */
export async function getMyTrips(
  params: ExpeditionParams = {},
): Promise<PaginatedResponse<ExpeditionSummary>> {
  const { data } = await apiClient.get("/expeditions/api/v1/expeditions", {
    params,
  });
  return data;
}

/** Fetch a single expedition by ID */
export async function getExpeditionById(
  expeditionId: string,
): Promise<Expedition> {
  const { data } = await apiClient.get(
    `/expeditions/api/v1/expeditions/${expeditionId}`,
  );
  return data;
}

/** Fetch gear list for an expedition */
export async function getExpeditionGear(expeditionId: string): Promise<{
  items: GearItem[];
  weight_summary: PackWeightSummary;
}> {
  const { data } = await apiClient.get(
    `/expeditions/api/v1/expeditions/${expeditionId}/gear`,
  );
  return data;
}

/** Fetch gallery photos for an expedition */
export async function getExpeditionGallery(
  expeditionId: string,
): Promise<GalleryPhoto[]> {
  const { data } = await apiClient.get(
    `/expeditions/api/v1/expeditions/${expeditionId}/gallery`,
  );
  return data;
}

/** Request to join a public expedition */
export async function joinExpedition(
  expeditionId: string,
  message?: string,
): Promise<void> {
  await apiClient.post(
    `/expeditions/api/v1/expeditions/${expeditionId}/join`,
    { message },
  );
}

/** Leave an expedition */
export async function leaveExpedition(expeditionId: string): Promise<void> {
  await apiClient.delete(
    `/expeditions/api/v1/expeditions/${expeditionId}/leave`,
  );
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

/** Fetch unread notifications count + list */
export async function getUnreadNotifications(): Promise<{
  count: number;
  items: Notification[];
}> {
  const { data } = await apiClient.get(
    "/notifications/api/v1/notifications/unread",
  );
  return data;
}

/** Fetch all notifications paginated */
export async function getNotifications(
  params: { page?: number; page_size?: number } = {},
): Promise<PaginatedResponse<Notification>> {
  const { data } = await apiClient.get(
    "/notifications/api/v1/notifications",
    { params },
  );
  return data;
}

/** Mark a single notification as read */
export async function markNotificationRead(
  notificationId: string,
): Promise<void> {
  await apiClient.patch(
    `/notifications/api/v1/notifications/${notificationId}/read`,
  );
}

/** Mark all notifications as read */
export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.post("/notifications/api/v1/notifications/read-all");
}
