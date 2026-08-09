import type { UUID, ISODateString } from "./primitives";

// ---------------------------------------------------------------------------
// Trip enumerations (reuses expedition status/visibility)
// ---------------------------------------------------------------------------

export type TripStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "ACTIVE"
  | "COMPLETED"
  | "CANCELLED"
  | "ARCHIVED";

export type TripVisibility = "PUBLIC" | "PRIVATE";

// ---------------------------------------------------------------------------
// Trip interfaces
// ---------------------------------------------------------------------------

/** Full trip detail — returned by GET /api/v1/trips/{id} */
export interface Trip {
  id: UUID;
  communityId: UUID | null;
  hostId: UUID;
  title: string;
  destination: string;
  description: string | null;
  coverImageUrl: string | null;
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  maxParticipants: number;
  currentParticipantsCount: number;
  visibility: TripVisibility;
  status: TripStatus;
  hostName: string | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/** Lightweight card — returned by GET /api/v1/trips list */
export interface TripSummary {
  id: UUID;
  communityId: UUID | null;
  hostId: UUID;
  title: string;
  destination: string;
  coverImageUrl: string | null;
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  maxParticipants: number;
  currentParticipantsCount: number;
  visibility: TripVisibility;
  status: TripStatus;
  hostName: string | null;
  createdAt: ISODateString;
}

// ---------------------------------------------------------------------------
// Request shapes
// ---------------------------------------------------------------------------

export interface CreateTripRequest {
  title: string;
  destination: string;
  description?: string | null;
  coverImageUrl?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  budget?: number | null;
  maxParticipants: number;
  visibility: TripVisibility;
  communityId?: string | null;
}

export interface UpdateTripRequest {
  title?: string;
  destination?: string;
  description?: string | null;
  coverImageUrl?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  budget?: number | null;
  maxParticipants?: number;
  visibility?: TripVisibility;
}

// ---------------------------------------------------------------------------
// Filter params
// ---------------------------------------------------------------------------

export interface TripListParams {
  search?: string;
  community_id?: string;
  personal_only?: boolean;
  status?: TripStatus;
  page?: number;
  page_size?: number;
}

export interface MyTripsParams {
  status?: TripStatus;
  page?: number;
  page_size?: number;
}
