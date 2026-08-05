/**
 * OntDekker Community API Functions
 *
 * All API calls for the Community Service (Developer 2 scope).
 * Follows the same pattern as guideApi.ts and expeditionApi.ts.
 *
 * Endpoint mapping:
 *   Communities : /communities/api/v1/communities/*
 *
 * All paths are relative to the Traefik gateway base URL configured
 * in axios.ts (NEXT_PUBLIC_API_BASE_URL).
 */

import apiClient from "./axios";
import type {
  PaginatedResponse,
  Community,
  CommunitySummary,
  CommunityMember,
  JoinRequest,
  Discussion,
  DiscussionSummary,
  DiscussionComment,
  CommunityRule,
  CreateCommunityRequest,
  UpdateCommunityRequest,
  CreateDiscussionRequest,
  CreateDiscussionCommentRequest,
  JoinRequestPayload,
  CommunityFilter,
  DiscussionFilter,
  CommunityMediaUploadRequest,
  CommunityMediaUploadResponse,
} from "@/types";

// ---------------------------------------------------------------------------
// Communities
// ---------------------------------------------------------------------------

/** Fetch paginated community directory */
export async function getCommunities(
  filters: Partial<CommunityFilter> = {},
): Promise<PaginatedResponse<CommunitySummary>> {
  const { data } = await apiClient.get("/communities/api/v1/communities", {
    params: filters,
  });
  return data;
}

/** Fetch a single community's full detail */
export async function getCommunityById(
  communityId: string,
): Promise<Community> {
  const { data } = await apiClient.get(
    `/communities/api/v1/communities/${communityId}`,
  );
  return data;
}

/** Create a new community */
export async function createCommunity(
  payload: CreateCommunityRequest,
): Promise<Community> {
  const { data } = await apiClient.post(
    "/communities/api/v1/communities",
    payload,
  );
  return data;
}

/** Update an existing community */
export async function updateCommunity(
  communityId: string,
  payload: UpdateCommunityRequest,
): Promise<Community> {
  const { data } = await apiClient.put(
    `/communities/api/v1/communities/${communityId}`,
    payload,
  );
  return data;
}

/** Archive (soft-delete) a community */
export async function archiveCommunity(communityId: string): Promise<void> {
  await apiClient.delete(`/communities/api/v1/communities/${communityId}`);
}

// ---------------------------------------------------------------------------
// Community media uploads
// ---------------------------------------------------------------------------

/** Request a pre-signed upload URL for a community banner or logo */
export async function requestCommunityMediaUploadUrl(
  payload: CommunityMediaUploadRequest,
): Promise<CommunityMediaUploadResponse> {
  const { data } = await apiClient.post(
    "/communities/api/v1/communities/media/upload-url",
    payload,
  );
  return data;
}

// ---------------------------------------------------------------------------
// Membership
// ---------------------------------------------------------------------------

/** Join a public community or submit a join request for a private community */
export async function joinCommunity(
  communityId: string,
  payload: JoinRequestPayload = {},
): Promise<void> {
  await apiClient.post(
    `/communities/api/v1/communities/${communityId}/join`,
    payload,
  );
}

/** Leave a community */
export async function leaveCommunity(communityId: string): Promise<void> {
  await apiClient.delete(
    `/communities/api/v1/communities/${communityId}/leave`,
  );
}

/** Fetch paginated member list for a community */
export async function getCommunityMembers(
  communityId: string,
  params: { page?: number; page_size?: number } = {},
): Promise<PaginatedResponse<CommunityMember>> {
  const { data } = await apiClient.get(
    `/communities/api/v1/communities/${communityId}/members`,
    { params },
  );
  return data;
}

/** Remove a member from a community (moderator/owner action) */
export async function removeCommunityMember(
  communityId: string,
  userId: string,
): Promise<void> {
  await apiClient.delete(
    `/communities/api/v1/communities/${communityId}/members/${userId}`,
  );
}

/** Promote a member to moderator */
export async function promoteMember(
  communityId: string,
  userId: string,
): Promise<CommunityMember> {
  const { data } = await apiClient.post(
    `/communities/api/v1/communities/${communityId}/members/${userId}/promote`,
  );
  return data;
}

/** Demote a moderator back to member */
export async function demoteModerator(
  communityId: string,
  userId: string,
): Promise<CommunityMember> {
  const { data } = await apiClient.post(
    `/communities/api/v1/communities/${communityId}/members/${userId}/demote`,
  );
  return data;
}

// ---------------------------------------------------------------------------
// Join requests (private communities)
// ---------------------------------------------------------------------------

/** Fetch pending join requests for a community (owner/moderator action) */
export async function getJoinRequests(
  communityId: string,
  params: { page?: number; page_size?: number } = {},
): Promise<PaginatedResponse<JoinRequest>> {
  const { data } = await apiClient.get(
    `/communities/api/v1/communities/${communityId}/join-requests`,
    { params },
  );
  return data;
}

/** Approve a join request */
export async function approveJoinRequest(
  communityId: string,
  requestId: string,
): Promise<void> {
  await apiClient.post(
    `/communities/api/v1/communities/${communityId}/join-requests/${requestId}/approve`,
  );
}

/** Reject a join request */
export async function rejectJoinRequest(
  communityId: string,
  requestId: string,
): Promise<void> {
  await apiClient.post(
    `/communities/api/v1/communities/${communityId}/join-requests/${requestId}/reject`,
  );
}

// ---------------------------------------------------------------------------
// Community rules
// ---------------------------------------------------------------------------

/** Fetch all rules for a community */
export async function getCommunityRules(
  communityId: string,
): Promise<CommunityRule[]> {
  const { data } = await apiClient.get(
    `/communities/api/v1/communities/${communityId}/rules`,
  );
  return data;
}

// ---------------------------------------------------------------------------
// Discussions
// ---------------------------------------------------------------------------

/** Fetch paginated discussions for a community */
export async function getCommunityDiscussions(
  communityId: string,
  filters: Partial<DiscussionFilter> = {},
): Promise<PaginatedResponse<DiscussionSummary>> {
  const { data } = await apiClient.get(
    `/communities/api/v1/communities/${communityId}/discussions`,
    { params: filters },
  );
  return data;
}

/** Fetch a single discussion's full detail */
export async function getDiscussionById(
  discussionId: string,
): Promise<Discussion> {
  const { data } = await apiClient.get(
    `/communities/api/v1/discussions/${discussionId}`,
  );
  return data;
}

/** Create a new discussion inside a community */
export async function createDiscussion(
  communityId: string,
  payload: CreateDiscussionRequest,
): Promise<Discussion> {
  const { data } = await apiClient.post(
    `/communities/api/v1/communities/${communityId}/discussions`,
    payload,
  );
  return data;
}

/** Delete a discussion */
export async function deleteDiscussion(discussionId: string): Promise<void> {
  await apiClient.delete(`/communities/api/v1/discussions/${discussionId}`);
}

// ---------------------------------------------------------------------------
// Discussion comments
// ---------------------------------------------------------------------------

/** Fetch paginated comments for a discussion */
export async function getDiscussionComments(
  discussionId: string,
  params: { page?: number; page_size?: number } = {},
): Promise<PaginatedResponse<DiscussionComment>> {
  const { data } = await apiClient.get(
    `/communities/api/v1/discussions/${discussionId}/comments`,
    { params },
  );
  return data;
}

/** Post a comment on a discussion */
export async function createDiscussionComment(
  discussionId: string,
  payload: CreateDiscussionCommentRequest,
): Promise<DiscussionComment> {
  const { data } = await apiClient.post(
    `/communities/api/v1/discussions/${discussionId}/comments`,
    payload,
  );
  return data;
}

/** Delete a discussion comment */
export async function deleteDiscussionComment(
  commentId: string,
): Promise<void> {
  await apiClient.delete(
    `/communities/api/v1/discussions/comments/${commentId}`,
  );
}
