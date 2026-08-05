import type { UUID, ISODateString } from "./primitives";
import type { UserSummary } from "./user";

// ---------------------------------------------------------------------------
// Feed enumerations
// ---------------------------------------------------------------------------

export type PostVisibility = "PUBLIC" | "PRIVATE" | "COMMUNITY";

export type PostStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED" | "DELETED";

export type MediaType = "IMAGE" | "VIDEO";

// ---------------------------------------------------------------------------
// Post (Travel Story) interfaces
// ---------------------------------------------------------------------------

export interface Post {
  id: UUID;
  authorId: UUID;
  /** Populated when user-service integration is available; null until then */
  author?: UserSummary | null;
  communityId: UUID | null;
  expeditionId: UUID | null;
  title: string;
  content: string;
  location: string | null;
  visibility: PostVisibility;
  status: PostStatus;
  tags: string[];
  media: PostMedia[];
  likeCount: number;
  commentCount: number;
  shareCount: number;
  viewCount: number;
  /** Whether the current authenticated user has liked this post */
  isLiked: boolean;
  /** Whether the current authenticated user has bookmarked this post */
  isBookmarked: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface PostSummary {
  id: UUID;
  authorId: UUID;
  /** Populated when user-service integration is available; null until then */
  author?: UserSummary | null;
  communityId: UUID | null;
  title: string;
  location: string | null;
  visibility: PostVisibility;
  status: PostStatus;
  tags: string[];
  /** Cover image — first media item, or null */
  coverImageUrl: string | null;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  viewCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  createdAt: ISODateString;
}

// ---------------------------------------------------------------------------
// Media interfaces
// ---------------------------------------------------------------------------

export interface PostMedia {
  id: UUID;
  postId: UUID;
  mediaUrl: string;
  mediaType: MediaType;
  displayOrder: number;
  createdAt: ISODateString;
}

export interface MediaUploadRequest {
  /** The MIME type of the file, e.g. "image/jpeg" */
  contentType: string;
  /** Number of bytes */
  fileSize: number;
  /** Display order within the post's media gallery */
  displayOrder?: number;
}

export interface MediaUploadResponse {
  /** Pre-signed PUT URL for uploading directly to MinIO */
  uploadUrl: string;
  /** Permanent object URL stored in the database after upload */
  objectUrl: string;
  /** Opaque key to pass back to the create/update post endpoint */
  storageKey: string;
}

// ---------------------------------------------------------------------------
// Comment / Reply interfaces
// ---------------------------------------------------------------------------

export interface Comment {
  id: UUID;
  postId: UUID;
  authorId: UUID;
  /** Populated when user-service integration is available; null until then */
  author?: UserSummary | null;
  /** null = top-level comment; UUID = reply to another comment */
  parentCommentId: UUID | null;
  content: string;
  likeCount: number;
  replyCount: number;
  /** Whether the current authenticated user has liked this comment */
  isLiked: boolean;
  replies?: Comment[];
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Reply {
  id: UUID;
  postId: UUID;
  parentCommentId: UUID;
  authorId: UUID;
  /** Populated when user-service integration is available; null until then */
  author?: UserSummary | null;
  content: string;
  likeCount: number;
  isLiked: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// ---------------------------------------------------------------------------
// Bookmark interface
// ---------------------------------------------------------------------------

export interface Bookmark {
  postId: UUID;
  userId: UUID;
  createdAt: ISODateString;
}

// ---------------------------------------------------------------------------
// Share interface
// ---------------------------------------------------------------------------

export interface Share {
  postId: UUID;
  userId: UUID;
  /** Deep-link URL for sharing externally */
  shareUrl: string;
  shareCount: number;
  createdAt: ISODateString;
}

// ---------------------------------------------------------------------------
// Request / response shapes for mutations
// ---------------------------------------------------------------------------

export interface CreatePostRequest {
  communityId?: UUID | null;
  expeditionId?: UUID | null;
  title: string;
  content: string;
  location?: string | null;
  visibility: PostVisibility;
  tags?: string[];
  /** Storage keys returned by the media upload flow */
  mediaKeys?: string[];
}

export interface UpdatePostRequest {
  title?: string;
  content?: string;
  location?: string | null;
  visibility?: PostVisibility;
  tags?: string[];
}

export interface CreateCommentRequest {
  content: string;
  parentCommentId?: UUID | null;
}

export interface UpdateCommentRequest {
  content: string;
}

// ---------------------------------------------------------------------------
// Filter parameter types (mirrored from backend query schemas)
// ---------------------------------------------------------------------------

/** Query filters for the feed discovery endpoint */
export interface FeedFilter {
  community_id?: UUID;
  author_id?: UUID;
  tag?: string;
  visibility?: PostVisibility;
  page?: number;
  page_size?: number;
}
