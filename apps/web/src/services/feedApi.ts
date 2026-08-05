/**
 * OntDekker Feed API Functions
 *
 * All API calls for the Feed Service (Developer 2 scope).
 * Follows the same pattern as guideApi.ts and expeditionApi.ts.
 *
 * Endpoint mapping:
 *   Feed : /feed/api/v1/feed/*
 *
 * All paths are relative to the Traefik gateway base URL configured
 * in axios.ts (NEXT_PUBLIC_API_BASE_URL).
 */

import apiClient from "./axios";
import type {
  PaginatedResponse,
  Post,
  PostSummary,
  PostMedia,
  Comment,
  Bookmark,
  Share,
  CreatePostRequest,
  UpdatePostRequest,
  CreateCommentRequest,
  UpdateCommentRequest,
  FeedFilter,
  MediaUploadRequest,
  MediaUploadResponse,
} from "@/types";

// ---------------------------------------------------------------------------
// Posts (Travel Stories)
// ---------------------------------------------------------------------------

/** Fetch paginated feed posts (latest / community / user stories) */
export async function getFeedPosts(
  filters: Partial<FeedFilter> = {},
): Promise<PaginatedResponse<PostSummary>> {
  const { data } = await apiClient.get("/feed/api/v1/feed/stories", {
    params: filters,
  });
  return data;
}

/** Fetch a single post's full detail */
export async function getPostById(postId: string): Promise<Post> {
  const { data } = await apiClient.get(`/feed/api/v1/feed/stories/${postId}`);
  return data;
}

/** Fetch posts authored by a specific user */
export async function getPostsByUser(
  userId: string,
  params: { page?: number; page_size?: number } = {},
): Promise<PaginatedResponse<PostSummary>> {
  const { data } = await apiClient.get(
    `/feed/api/v1/feed/users/${userId}`,
    { params },
  );
  return data;
}

/** Fetch posts belonging to a specific community */
export async function getPostsByCommunity(
  communityId: string,
  params: { page?: number; page_size?: number } = {},
): Promise<PaginatedResponse<PostSummary>> {
  const { data } = await apiClient.get(
    `/feed/api/v1/feed/communities/${communityId}`,
    { params },
  );
  return data;
}

/** Create a new travel story post */
export async function createPost(payload: CreatePostRequest): Promise<Post> {
  const { data } = await apiClient.post("/feed/api/v1/feed/stories", payload);
  return data;
}

/** Update an existing post */
export async function updatePost(
  postId: string,
  payload: UpdatePostRequest,
): Promise<Post> {
  const { data } = await apiClient.put(
    `/feed/api/v1/feed/stories/${postId}`,
    payload,
  );
  return data;
}

/** Delete (soft-delete) a post */
export async function deletePost(postId: string): Promise<void> {
  await apiClient.delete(`/feed/api/v1/feed/stories/${postId}`);
}

// ---------------------------------------------------------------------------
// Post media
// ---------------------------------------------------------------------------

/** Request a pre-signed upload URL for a post media item */
export async function requestMediaUploadUrl(
  payload: MediaUploadRequest,
): Promise<MediaUploadResponse> {
  const { data } = await apiClient.post(
    "/feed/api/v1/feed/media/upload-url",
    payload,
  );
  return data;
}

/** Fetch media items for a specific post */
export async function getPostMedia(postId: string): Promise<PostMedia[]> {
  const { data } = await apiClient.get(
    `/feed/api/v1/feed/stories/${postId}/media`,
  );
  return data;
}

// ---------------------------------------------------------------------------
// Likes
// ---------------------------------------------------------------------------

/** Like a post */
export async function likePost(postId: string): Promise<void> {
  await apiClient.post(`/feed/api/v1/feed/stories/${postId}/like`);
}

/** Unlike a post */
export async function unlikePost(postId: string): Promise<void> {
  await apiClient.delete(`/feed/api/v1/feed/stories/${postId}/like`);
}

// ---------------------------------------------------------------------------
// Bookmarks
// ---------------------------------------------------------------------------

/** Bookmark a post */
export async function bookmarkPost(postId: string): Promise<Bookmark> {
  const { data } = await apiClient.post(
    `/feed/api/v1/feed/stories/${postId}/bookmark`,
  );
  return data;
}

/** Remove a post bookmark */
export async function unbookmarkPost(postId: string): Promise<void> {
  await apiClient.delete(`/feed/api/v1/feed/stories/${postId}/bookmark`);
}

// ---------------------------------------------------------------------------
// Shares
// ---------------------------------------------------------------------------

/** Share a post — increments share counter and returns a share link */
export async function sharePost(postId: string): Promise<Share> {
  const { data } = await apiClient.post(
    `/feed/api/v1/feed/stories/${postId}/share`,
  );
  return data;
}

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

/** Fetch paginated comments for a post */
export async function getComments(
  postId: string,
  params: { page?: number; page_size?: number } = {},
): Promise<PaginatedResponse<Comment>> {
  const { data } = await apiClient.get(
    `/feed/api/v1/feed/stories/${postId}/comments`,
    { params },
  );
  return data;
}

/** Create a top-level comment or a nested reply on a post */
export async function createComment(
  postId: string,
  payload: CreateCommentRequest,
): Promise<Comment> {
  const { data } = await apiClient.post(
    `/feed/api/v1/feed/stories/${postId}/comment`,
    payload,
  );
  return data;
}

/** Reply to an existing comment */
export async function replyToComment(
  commentId: string,
  payload: CreateCommentRequest,
): Promise<Comment> {
  const { data } = await apiClient.post(
    `/feed/api/v1/feed/comments/${commentId}/reply`,
    payload,
  );
  return data;
}

/** Update a comment */
export async function updateComment(
  commentId: string,
  payload: UpdateCommentRequest,
): Promise<Comment> {
  const { data } = await apiClient.put(
    `/feed/api/v1/feed/comments/${commentId}`,
    payload,
  );
  return data;
}

/** Delete a comment */
export async function deleteComment(commentId: string): Promise<void> {
  await apiClient.delete(`/feed/api/v1/feed/comments/${commentId}`);
}

/** Like a comment */
export async function likeComment(commentId: string): Promise<void> {
  await apiClient.post(`/feed/api/v1/feed/comments/${commentId}/like`);
}

/** Unlike a comment */
export async function unlikeComment(commentId: string): Promise<void> {
  await apiClient.delete(`/feed/api/v1/feed/comments/${commentId}/like`);
}
