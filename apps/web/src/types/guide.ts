import type { UUID, ISODateString } from "./primitives";
import type { UserSummary } from "./user";

// ---------------------------------------------------------------------------
// Guide enumerations
// ---------------------------------------------------------------------------

export type VerificationStatus = "PENDING" | "VERIFIED" | "SUSPENDED" | "REVOKED";

export type AvailabilityStatus = "AVAILABLE" | "UNAVAILABLE" | "VACATION" | "BUSY";

export type ApplicationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED";

// ---------------------------------------------------------------------------
// Guide interfaces
// ---------------------------------------------------------------------------

export interface GuideProfile {
  id: UUID;
  userId: UUID;
  /** Populated when user-service integration is available; null until then */
  user?: UserSummary | null;
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
  updatedAt: ISODateString;
}

export interface GuideProfileSummary {
  id: UUID;
  userId: UUID;
  /** Populated when user-service integration is available; null until then */
  displayName: string | null;
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
  /** Backend field: review_count → camelCase: reviewCount */
  reviewCount: number;
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
