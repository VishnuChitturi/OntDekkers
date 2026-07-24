/**
 * OntDekker Frontend — User Service API
 *
 * Typed TypeScript functions for all User Service endpoints.
 * Contracts match the backend schemas defined in:
 *   services/user-service/app/schemas/user.py
 *
 * All functions use the userHttp instance from api.ts, which:
 *   - Auto-attaches Bearer token when available
 *   - Normalizes backend error envelopes to ApiError
 *
 * Deferred (out of scope for this checkpoint):
 *   - POST /users/me/avatar — multipart avatar upload
 *   - POST /users/me/cover  — multipart cover upload
 *
 * Does NOT:
 *   - Store tokens (AuthContext responsibility)
 *   - Log sensitive values
 *   - Implement token refresh / 401 retry (AuthContext responsibility)
 *   - Contain React code, hooks, or UI logic
 */

import { userHttp } from "./api";

// ---------------------------------------------------------------------------
// TypeScript types matching backend Pydantic schemas
// ---------------------------------------------------------------------------

export interface InterestResponse {
  interest: string;
  created_at: string;
}

export interface PreferenceResponse {
  travel_style: string | null;
  budget: string | null;
  adventure_level: string | null;
  languages: string[] | null;
  preferred_destinations: string[] | null;
  notifications_enabled: boolean;
  profile_public: boolean;
}

export interface BadgeResponse {
  id: string;
  badge_name: string;
  badge_icon: string | null;
  earned_at: string;
}

export interface ReputationResponse {
  explorer_score: number;
  community_score: number;
  review_score: number;
  expeditions_joined: number;
  expeditions_organized: number;
  guide_interactions: number;
  reviews_received: number;
}

export interface SavedItemResponse {
  id: string;
  entity_type: string;
  entity_id: string;
  created_at: string;
}

export type SavedEntityType = "STORY" | "COMMUNITY" | "EXPEDITION" | "GUIDE";

export interface PrivateProfileResponse {
  id: string;
  auth_user_id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  city: string | null;
  country: string | null;
  follower_count: number;
  following_count: number;
  interests: InterestResponse[];
  preferences: PreferenceResponse | null;
  badges: BadgeResponse[];
  reputation: ReputationResponse | null;
  saved_items: SavedItemResponse[];
  created_at: string;
}

export interface PublicProfileResponse {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  city: string | null;
  country: string | null;
  follower_count: number;
  following_count: number;
  badges: BadgeResponse[];
  reputation: ReputationResponse | null;
  created_at: string;
}

export interface UpdateProfileRequest {
  username?: string | null;
  display_name?: string | null;
  bio?: string | null;
  city?: string | null;
  country?: string | null;
}

export interface UpdateInterestsRequest {
  interests: string[];
}

export interface UpdatePreferencesRequest {
  travel_style?: string | null;
  budget?: string | null;
  adventure_level?: string | null;
  languages?: string[] | null;
  preferred_destinations?: string[] | null;
  notifications_enabled?: boolean | null;
  profile_public?: boolean | null;
}

export interface SaveItemRequest {
  entity_type: SavedEntityType;
  entity_id: string;
}

export interface FollowerSummary {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

export interface PaginatedFollowersResponse {
  items: FollowerSummary[];
  total: number;
  page: number;
  size: number;
}

export interface MessageResponse {
  message: string;
}

// ---------------------------------------------------------------------------
// API Functions
// ---------------------------------------------------------------------------

/**
 * GET /users/me
 *
 * Return the full private profile of the authenticated user.
 * Creates the profile lazily if it does not yet exist.
 * Requires Bearer JWT (auto-attached by userHttp).
 */
export async function getMyProfile(): Promise<PrivateProfileResponse> {
  const response = await userHttp.get<PrivateProfileResponse>("/users/me");
  return response.data;
}

/**
 * PUT /users/me
 *
 * Update editable profile fields for the authenticated user.
 * All fields are optional — send only those to change.
 * Returns the updated private profile.
 */
export async function updateMyProfile(
  data: UpdateProfileRequest
): Promise<PrivateProfileResponse> {
  const response = await userHttp.put<PrivateProfileResponse>("/users/me", data);
  return response.data;
}

/**
 * PATCH /users/me/interests
 *
 * Replace the full set of travel interests for the authenticated user.
 * Sends the complete list; the backend replaces (not merges) existing interests.
 */
export async function updateInterests(
  data: UpdateInterestsRequest
): Promise<PrivateProfileResponse> {
  const response = await userHttp.patch<PrivateProfileResponse>(
    "/users/me/interests",
    data
  );
  return response.data;
}

/**
 * PATCH /users/me/preferences
 *
 * Update travel preferences for the authenticated user.
 * All fields are optional — send only those to change.
 */
export async function updatePreferences(
  data: UpdatePreferencesRequest
): Promise<PrivateProfileResponse> {
  const response = await userHttp.patch<PrivateProfileResponse>(
    "/users/me/preferences",
    data
  );
  return response.data;
}

/**
 * GET /users/me/saved
 *
 * List all saved items for the authenticated user.
 * Optionally filter by entity_type: STORY | COMMUNITY | EXPEDITION | GUIDE
 */
export async function listSaved(
  entity_type?: SavedEntityType
): Promise<SavedItemResponse[]> {
  const response = await userHttp.get<SavedItemResponse[]>("/users/me/saved", {
    params: entity_type ? { entity_type } : undefined,
  });
  return response.data;
}

/**
 * POST /users/me/saved
 *
 * Save an item for the authenticated user.
 * Returns the created SavedItemResponse (HTTP 201).
 */
export async function saveItem(
  data: SaveItemRequest
): Promise<SavedItemResponse> {
  const response = await userHttp.post<SavedItemResponse>(
    "/users/me/saved",
    data
  );
  return response.data;
}

/**
 * DELETE /users/me/saved/{entity_type}/{entity_id}
 *
 * Remove a saved item for the authenticated user.
 * entity_type must be one of: STORY, COMMUNITY, EXPEDITION, GUIDE
 */
export async function unsaveItem(
  entity_type: SavedEntityType,
  entity_id: string
): Promise<MessageResponse> {
  const response = await userHttp.delete<MessageResponse>(
    `/users/me/saved/${entity_type}/${entity_id}`
  );
  return response.data;
}

/**
 * GET /users/{username}
 *
 * Return the public profile for the given username.
 * No authentication required.
 */
export async function getPublicProfile(
  username: string
): Promise<PublicProfileResponse> {
  const response = await userHttp.get<PublicProfileResponse>(
    `/users/${username}`
  );
  return response.data;
}

/**
 * POST /users/{user_id}/follow
 *
 * Follow a user by their profile ID.
 * Requires Bearer JWT (auto-attached by userHttp).
 */
export async function followUser(userId: string): Promise<MessageResponse> {
  const response = await userHttp.post<MessageResponse>(
    `/users/${userId}/follow`
  );
  return response.data;
}

/**
 * DELETE /users/{user_id}/follow
 *
 * Unfollow a user by their profile ID.
 * Requires Bearer JWT (auto-attached by userHttp).
 */
export async function unfollowUser(userId: string): Promise<MessageResponse> {
  const response = await userHttp.delete<MessageResponse>(
    `/users/${userId}/follow`
  );
  return response.data;
}

/**
 * GET /users/{user_id}/followers
 *
 * Return a paginated list of followers for the given user.
 * Defaults: page=1, size=20. Max size=100.
 */
export async function getFollowers(
  userId: string,
  page = 1,
  size = 20
): Promise<PaginatedFollowersResponse> {
  const response = await userHttp.get<PaginatedFollowersResponse>(
    `/users/${userId}/followers`,
    { params: { page, size } }
  );
  return response.data;
}

/**
 * GET /users/{user_id}/following
 *
 * Return a paginated list of users the given user is following.
 * Defaults: page=1, size=20. Max size=100.
 */
export async function getFollowing(
  userId: string,
  page = 1,
  size = 20
): Promise<PaginatedFollowersResponse> {
  const response = await userHttp.get<PaginatedFollowersResponse>(
    `/users/${userId}/following`,
    { params: { page, size } }
  );
  return response.data;
}

/**
 * GET /users/{user_id}/badges
 *
 * Return all badges earned by the given user.
 */
export async function getBadges(userId: string): Promise<BadgeResponse[]> {
  const response = await userHttp.get<BadgeResponse[]>(
    `/users/${userId}/badges`
  );
  return response.data;
}

/**
 * GET /users/{user_id}/reputation
 *
 * Return the reputation details for the given user.
 */
export async function getReputation(
  userId: string
): Promise<ReputationResponse> {
  const response = await userHttp.get<ReputationResponse>(
    `/users/${userId}/reputation`
  );
  return response.data;
}
