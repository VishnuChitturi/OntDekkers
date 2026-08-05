import type { UUID, ISODateString } from "./primitives";
import type { UserSummary } from "./user";

// ---------------------------------------------------------------------------
// Community enumerations
// ---------------------------------------------------------------------------

export type CommunityVisibility = "PUBLIC" | "PRIVATE";

export type CommunityStatus = "ACTIVE" | "ARCHIVED" | "DELETED";

export type MemberRole = "OWNER" | "MODERATOR" | "MEMBER";

export type MemberStatus = "PENDING" | "ACTIVE" | "BANNED";

export type CommunityJoinRequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

// ---------------------------------------------------------------------------
// Community interfaces
// ---------------------------------------------------------------------------

export interface Community {
  id: UUID;
  name: string;
  /** URL-safe identifier, e.g. "mountain-trekkers" */
  slug: string;
  description: string | null;
  bannerUrl: string | null;
  logoUrl: string | null;
  visibility: CommunityVisibility;
  category: string | null;
  location: string | null;
  createdBy: UUID;
  memberCount: number;
  expeditionCount: number;
  storyCount: number;
  /** Whether the current authenticated user is a member */
  isMember: boolean;
  /** Role of the current authenticated user; null when not a member */
  currentUserRole: MemberRole | null;
  status: CommunityStatus;
  rules: CommunityRule[];
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface CommunitySummary {
  id: UUID;
  name: string;
  slug: string;
  description: string | null;
  bannerUrl: string | null;
  logoUrl: string | null;
  visibility: CommunityVisibility;
  category: string | null;
  location: string | null;
  memberCount: number;
  expeditionCount: number;
  isMember: boolean;
  status: CommunityStatus;
}

// ---------------------------------------------------------------------------
// Member interface
// ---------------------------------------------------------------------------

export interface CommunityMember {
  communityId: UUID;
  userId: UUID;
  /** Populated when user-service integration is available; null until then */
  user?: UserSummary | null;
  role: MemberRole;
  status: MemberStatus;
  joinedAt: ISODateString;
}

// ---------------------------------------------------------------------------
// Join request interface
// ---------------------------------------------------------------------------

export interface JoinRequest {
  id: UUID;
  communityId: UUID;
  userId: UUID;
  /** Populated when user-service integration is available; null until then */
  user?: UserSummary | null;
  message: string | null;
  status: CommunityJoinRequestStatus;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// ---------------------------------------------------------------------------
// Community Rule interface
// ---------------------------------------------------------------------------

export interface CommunityRule {
  id: UUID;
  communityId: UUID;
  title: string;
  description: string | null;
  displayOrder: number;
}

// ---------------------------------------------------------------------------
// Discussion interfaces
// ---------------------------------------------------------------------------

export interface Discussion {
  id: UUID;
  communityId: UUID;
  authorId: UUID;
  /** Populated when user-service integration is available; null until then */
  author?: UserSummary | null;
  title: string;
  content: string;
  isPinned: boolean;
  isLocked: boolean;
  commentCount: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface DiscussionSummary {
  id: UUID;
  communityId: UUID;
  authorId: UUID;
  title: string;
  commentCount: number;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: ISODateString;
}

export interface DiscussionComment {
  id: UUID;
  discussionId: UUID;
  authorId: UUID;
  /** Populated when user-service integration is available; null until then */
  author?: UserSummary | null;
  content: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// ---------------------------------------------------------------------------
// Community media upload request/response
// ---------------------------------------------------------------------------

export interface CommunityMediaUploadRequest {
  /** "banner" or "logo" */
  mediaType: "banner" | "logo";
  /** The MIME type of the file, e.g. "image/jpeg" */
  contentType: string;
  fileSize: number;
}

export interface CommunityMediaUploadResponse {
  /** Pre-signed PUT URL for uploading directly to MinIO */
  uploadUrl: string;
  /** Permanent object URL stored in the database after upload */
  objectUrl: string;
  storageKey: string;
}

// ---------------------------------------------------------------------------
// Request / response shapes for mutations
// ---------------------------------------------------------------------------

export interface CreateCommunityRequest {
  name: string;
  description?: string | null;
  visibility: CommunityVisibility;
  category?: string | null;
  location?: string | null;
  /** Storage key for the banner image returned by the media upload flow */
  bannerKey?: string | null;
  /** Storage key for the logo image */
  logoKey?: string | null;
}

export interface UpdateCommunityRequest {
  name?: string;
  description?: string | null;
  visibility?: CommunityVisibility;
  category?: string | null;
  location?: string | null;
  bannerKey?: string | null;
  logoKey?: string | null;
}

export interface CreateDiscussionRequest {
  title: string;
  content: string;
}

export interface CreateDiscussionCommentRequest {
  content: string;
}

export interface JoinRequestPayload {
  /** Optional message included with the join request for private communities */
  message?: string | null;
}

// ---------------------------------------------------------------------------
// Filter parameter types (mirrored from backend query schemas)
// ---------------------------------------------------------------------------

/** Query filters for the community directory endpoint */
export interface CommunityFilter {
  category?: string;
  visibility?: CommunityVisibility;
  location?: string;
  page?: number;
  page_size?: number;
}

/** Query filters for the community discussions endpoint */
export interface DiscussionFilter {
  page?: number;
  page_size?: number;
}
