/**
 * OntDekker — Central TypeScript Type Definitions
 *
 * All domain types used across the frontend are exported from this single
 * module. Components, hooks, services, and state providers should import
 * from "@/types" rather than defining local interfaces.
 *
 * Organisation:
 *   1. Primitives & shared utilities
 *   2. Enumerations (mirrored from backend constants)
 *   3. User & identity
 *   4. Community
 *   5. Expedition (Trip)
 *   6. Guide
 *   7. Story / Post / Feed
 *   8. Messaging
 *   9. Notifications
 *  10. Navigation & routing
 *  11. API / pagination wrappers
 */

// ---------------------------------------------------------------------------
// 1. Primitives & shared utilities
// ---------------------------------------------------------------------------

/** ISO-8601 datetime string, e.g. "2026-07-25T02:32:48.126Z" */
export type ISODateString = string;

/** UUID string, e.g. "550e8400-e29b-41d4-a716-446655440000" */
export type UUID = string;

/** Generic key–value map */
export type Dictionary<T = unknown> = Record<string, T>;

// ---------------------------------------------------------------------------
// 2. Enumerations (mirrored from backend)
// ---------------------------------------------------------------------------

// ── Expedition ──────────────────────────────────────────────────────────────

export type ExpeditionStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "ACTIVE"
  | "COMPLETED"
  | "CANCELLED"
  | "ARCHIVED";

export type ExpeditionVisibility = "PUBLIC" | "PRIVATE";

export type ParticipantRole = "ORGANIZER" | "CO_ORGANIZER" | "PARTICIPANT";

export type ParticipantStatus = "ACTIVE" | "LEFT" | "REMOVED";

export type JoinRequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export type GearCategory = "BASE_PACK" | "CONSUMABLES" | "WORN_GEAR";

export type PackWeightClassification =
  | "ULTRALIGHT"
  | "LIGHTWEIGHT"
  | "STANDARD"
  | "HEAVY";

// ── Guide ────────────────────────────────────────────────────────────────────

export type VerificationStatus = "PENDING" | "VERIFIED" | "SUSPENDED" | "REVOKED";

export type AvailabilityStatus = "AVAILABLE" | "UNAVAILABLE" | "VACATION" | "BUSY";

export type ApplicationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED";

// ── Messaging ────────────────────────────────────────────────────────────────

export type ConversationType = "PRIVATE" | "COMMUNITY" | "EXPEDITION";

export type MessageStatus = "SENDING" | "SENT" | "DELIVERED" | "READ" | "FAILED";

// ── Notifications ────────────────────────────────────────────────────────────

export type NotificationType =
  | "INVITE"
  | "LIKE"
  | "COMMENT"
  | "SYSTEM"
  | "JOIN_REQUEST"
  | "EXPEDITION_UPDATE"
  | "GUIDE_REVIEW"
  | "MESSAGE";

// ── Feed / Posts ─────────────────────────────────────────────────────────────

export type PostType = "STORY" | "PHOTO" | "UPDATE" | "RECOMMENDATION";

export type TravelPace = "SLOW" | "MODERATE" | "FAST";

// ---------------------------------------------------------------------------
// 3. User & identity
// ---------------------------------------------------------------------------

export interface UserProfile {
  id: UUID;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  coverImageUrl: string | null;
  /** Countries or regions visited */
  countriesVisited: number;
  /** Total expeditions participated in */
  expeditionsCount: number;
  /** Number of followers */
  followersCount: number;
  /** Number of accounts the user follows */
  followingCount: number;
  /** Whether the current authenticated user follows this profile */
  isFollowing: boolean;
  createdAt: ISODateString;
}

/** Minimal user reference used inside nested objects (e.g., post author) */
export interface UserSummary {
  id: UUID;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

/** Authenticated session data stored in AppState */
export interface AuthUser extends UserSummary {
  email: string;
  /** JWT access token — never expose in UI */
  accessToken: string;
}

// ---------------------------------------------------------------------------
// 4. Community
// ---------------------------------------------------------------------------

export interface Community {
  id: UUID;
  name: string;
  slug: string;
  description: string;
  bannerUrl: string | null;
  avatarUrl: string | null;
  /** Country / region the community is based in */
  location: string | null;
  membersCount: number;
  expeditionsCount: number;
  isPublic: boolean;
  /** Whether the authenticated user is a member */
  isMember: boolean;
  createdAt: ISODateString;
}

export interface CommunityMember {
  userId: UUID;
  user: UserSummary;
  role: "ADMIN" | "MODERATOR" | "MEMBER";
  joinedAt: ISODateString;
}

// ---------------------------------------------------------------------------
// 5. Expedition (Trip)
// ---------------------------------------------------------------------------

export interface Expedition {
  id: UUID;
  communityId: UUID;
  organizerId: UUID;
  organizer: UserSummary;
  title: string;
  destination: string;
  description: string;
  meetingPoint: string | null;
  startDate: string | null; // ISO date "YYYY-MM-DD"
  endDate: string | null;
  maxParticipants: number;
  currentParticipantsCount: number;
  budget: number | null;
  visibility: ExpeditionVisibility;
  status: ExpeditionStatus;
  coverImageUrl: string | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface ExpeditionSummary {
  id: UUID;
  title: string;
  destination: string;
  startDate: string | null;
  endDate: string | null;
  status: ExpeditionStatus;
  visibility: ExpeditionVisibility;
  coverImageUrl: string | null;
  organizerName: string;
  currentParticipantsCount: number;
  maxParticipants: number;
}

export interface ExpeditionParticipant {
  expeditionId: UUID;
  userId: UUID;
  user: UserSummary;
  role: ParticipantRole;
  status: ParticipantStatus;
  joinedAt: ISODateString;
}

export interface ExpeditionItineraryDay {
  expeditionId: UUID;
  dayNumber: number;
  title: string;
  description: string;
  location: string;
  activityTime: string | null; // "HH:MM:SS"
}

export interface GearItem {
  id: UUID;
  expeditionId: UUID;
  name: string;
  category: GearCategory;
  weightGrams: number;
  quantity: number;
  isPacked: boolean;
  addedBy: UUID;
}

export interface PackWeightSummary {
  totalWeightGrams: number;
  classification: PackWeightClassification;
  byCategory: Record<GearCategory, number>;
}

export interface GalleryPhoto {
  id: UUID;
  expeditionId: UUID;
  imageUrl: string;
  caption: string | null;
  displayOrder: number;
  uploadedBy: UUID;
  uploadedAt: ISODateString;
}

export interface ExpeditionReview {
  id: UUID;
  expeditionId: UUID;
  reviewerId: UUID;
  reviewer: UserSummary;
  revieweeId: UUID;
  reviewee: UserSummary;
  ratingOverall: number;
  ratingKnowledge: number;
  ratingFriendliness: number;
  ratingCommunication: number;
  ratingSafety: number;
  ratingProfessionalism: number;
  comment: string | null;
  wouldTravelAgain: boolean;
  createdAt: ISODateString;
}

// ---------------------------------------------------------------------------
// 6. Guide
// ---------------------------------------------------------------------------

export interface GuideProfile {
  id: UUID;
  userId: UUID;
  user: UserSummary;
  bio: string | null;
  profileImageUrl: string | null;
  coverImageUrl: string | null;
  yearsExperience: number | null;
  rating: number | null;
  reviewCount: number;
  verificationStatus: VerificationStatus;
  locations: GuideLocation[];
  languages: GuideLanguage[];
  availability: GuideAvailability | null;
  createdAt: ISODateString;
}

export interface GuideProfileSummary {
  id: UUID;
  userId: UUID;
  displayName: string;
  profileImageUrl: string | null;
  rating: number | null;
  reviewCount: number;
  verificationStatus: VerificationStatus;
  yearsExperience: number | null;
  bio: string | null;
  locations: GuideLocation[];
  languages: GuideLanguage[];
  availability: GuideAvailability | null;
}

export interface GuideLocation {
  id: UUID;
  guideId: UUID;
  country: string;
  region: string | null;
  city: string | null;
}

export interface GuideLanguage {
  id: UUID;
  guideId: UUID;
  language: string;
}

export interface GuideAvailability {
  guideId: UUID;
  status: AvailabilityStatus;
  note: string | null;
}

export interface GuideReview {
  id: UUID;
  guideId: UUID;
  reviewerId: UUID;
  reviewer: UserSummary;
  expeditionId: UUID | null;
  ratingOverall: number;
  ratingKnowledge: number;
  ratingFriendliness: number;
  ratingCommunication: number;
  ratingSafety: number;
  ratingProfessionalism: number;
  wouldRecommend: boolean;
  comment: string | null;
  createdAt: ISODateString;
}

export interface GuideRatingSummary {
  guideId: UUID;
  averageOverall: number | null;
  averageKnowledge: number | null;
  averageFriendliness: number | null;
  averageCommunication: number | null;
  averageSafety: number | null;
  averageProfessionalism: number | null;
  wouldRecommendPercentage: number | null;
  totalReviews: number;
}

export interface TravelConnection {
  id: UUID;
  guideId: UUID;
  guide: GuideProfileSummary;
  travelerId: UUID;
  firstMet: ISODateString;
  lastInteraction: ISODateString | null;
  expeditionsTogether: number;
  conversationCount: number;
  photosShared: number;
  bookmarked: boolean;
}

// ---------------------------------------------------------------------------
// 7. Story / Post / Feed
// ---------------------------------------------------------------------------

export interface Post {
  id: UUID;
  authorId: UUID;
  author: UserSummary;
  type: PostType;
  title: string;
  coverImageUrl: string | null;
  body: string;
  tags: string[];
  location: string | null;
  communityId: UUID | null;
  expeditionId: UUID | null;
  pace: TravelPace | null;
  readTimeMinutes: number | null;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isSaved: boolean;
  publishedAt: ISODateString;
  createdAt: ISODateString;
}

export interface PostComment {
  id: UUID;
  postId: UUID;
  authorId: UUID;
  author: UserSummary;
  body: string;
  likesCount: number;
  isLiked: boolean;
  createdAt: ISODateString;
}

// ---------------------------------------------------------------------------
// 8. Messaging
// ---------------------------------------------------------------------------

export interface Conversation {
  id: UUID;
  type: ConversationType;
  /** For PRIVATE: the other participant. For group: null */
  otherParticipant: UserSummary | null;
  /** For COMMUNITY / EXPEDITION: the group name */
  groupName: string | null;
  groupAvatarUrl: string | null;
  lastMessage: ChatMessage | null;
  unreadCount: number;
  updatedAt: ISODateString;
}

export interface ChatMessage {
  id: UUID;
  conversationId: UUID;
  senderId: UUID;
  sender: UserSummary;
  body: string;
  imageUrl: string | null;
  status: MessageStatus;
  sentAt: ISODateString;
}

// ---------------------------------------------------------------------------
// 9. Notifications
// ---------------------------------------------------------------------------

export interface Notification {
  id: UUID;
  userId: UUID;
  type: NotificationType;
  title: string;
  message: string;
  /** Optional deep-link target (view + id pair) */
  targetView: string | null;
  targetId: UUID | null;
  isRead: boolean;
  createdAt: ISODateString;
}

// ---------------------------------------------------------------------------
// 10. Navigation & routing
// ---------------------------------------------------------------------------

/**
 * All top-level views recognised by the virtual router.
 * Values match the sidebar item keys and are used as the discriminator
 * for rendering the correct workspace.
 */
export type ViewName =
  | "discover"
  | "communities"
  | "community-detail"
  | "my-trips"
  | "expedition-workspace"
  | "guides"
  | "guide-portfolio"
  | "my-guides"
  | "messages"
  | "profile"
  | "settings";

export interface NavigationHistory {
  view: ViewName;
  id?: UUID;
  /** Scroll position to restore when navigating back */
  scrollY?: number;
}

export interface RouterState {
  currentView: ViewName;
  currentId?: UUID;
  history: NavigationHistory[];
}

/** A single item in the sidebar / bottom navigation */
export interface NavigationItem {
  id: ViewName;
  label: string;
  /** Lucide icon component type */
  icon: React.ComponentType<{ className?: string }>;
  /** Badge count for unread messages / notifications */
  badgeCount?: number;
}

// ---------------------------------------------------------------------------
// 11. API / pagination wrappers
// ---------------------------------------------------------------------------

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

/** Standard API error shape returned by all backend services */
export interface ApiError {
  detail: string;
  status: number;
}

// ---------------------------------------------------------------------------
// Filter parameter types (mirrored from backend query schemas)
// ---------------------------------------------------------------------------

/** Query filters for the guide directory endpoint */
export interface GuideFilter {
  country?: string;
  language?: string;
  availability?: AvailabilityStatus;
  verification_status?: VerificationStatus;
  page?: number;
  page_size?: number;
}
