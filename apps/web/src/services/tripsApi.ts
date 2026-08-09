/**
 * OntDekker Trips API
 *
 * All API calls for /api/v1/trips (expedition-service, trip-centric surface).
 * Traefik routes /api/v1/trips/* → expedition-service.
 *
 * Endpoints:
 *   POST   /api/v1/trips
 *   GET    /api/v1/trips
 *   GET    /api/v1/trips/{id}
 *   PUT    /api/v1/trips/{id}
 *   DELETE /api/v1/trips/{id}
 *   POST   /api/v1/trips/{id}/join
 *   POST   /api/v1/trips/{id}/leave
 *   GET    /api/v1/users/me/trips
 */

import apiClient from "./axios";
import type { PaginatedResponse } from "@/types";
import type {
  Trip,
  TripSummary,
  CreateTripRequest,
  UpdateTripRequest,
  TripListParams,
  MyTripsParams,
} from "@/types/trip";

// ---------------------------------------------------------------------------
// CREATE
// ---------------------------------------------------------------------------

export async function createTrip(payload: CreateTripRequest): Promise<Trip> {
  // Convert camelCase fields to snake_case for the backend
  const body = {
    title: payload.title,
    destination: payload.destination,
    description: payload.description ?? null,
    cover_image_url: payload.coverImageUrl ?? null,
    start_date: payload.startDate ?? null,
    end_date: payload.endDate ?? null,
    budget: payload.budget ?? null,
    max_participants: payload.maxParticipants,
    visibility: payload.visibility,
    community_id: payload.communityId ?? null,
  };
  const { data } = await apiClient.post<Trip>("/api/v1/trips", body);
  return data;
}

// ---------------------------------------------------------------------------
// LIST
// ---------------------------------------------------------------------------

export async function getTrips(
  params: TripListParams = {},
): Promise<PaginatedResponse<TripSummary>> {
  const { data } = await apiClient.get<PaginatedResponse<TripSummary>>(
    "/api/v1/trips",
    { params },
  );
  return data;
}

// ---------------------------------------------------------------------------
// GET single
// ---------------------------------------------------------------------------

export async function getTripById(tripId: string): Promise<Trip> {
  const { data } = await apiClient.get<Trip>(`/api/v1/trips/${tripId}`);
  return data;
}

// ---------------------------------------------------------------------------
// UPDATE
// ---------------------------------------------------------------------------

export async function updateTrip(
  tripId: string,
  payload: UpdateTripRequest,
): Promise<Trip> {
  const body = {
    ...(payload.title !== undefined && { title: payload.title }),
    ...(payload.destination !== undefined && { destination: payload.destination }),
    ...(payload.description !== undefined && { description: payload.description }),
    ...(payload.coverImageUrl !== undefined && { cover_image_url: payload.coverImageUrl }),
    ...(payload.startDate !== undefined && { start_date: payload.startDate }),
    ...(payload.endDate !== undefined && { end_date: payload.endDate }),
    ...(payload.budget !== undefined && { budget: payload.budget }),
    ...(payload.maxParticipants !== undefined && { max_participants: payload.maxParticipants }),
    ...(payload.visibility !== undefined && { visibility: payload.visibility }),
  };
  const { data } = await apiClient.put<Trip>(`/api/v1/trips/${tripId}`, body);
  return data;
}

// ---------------------------------------------------------------------------
// DELETE
// ---------------------------------------------------------------------------

export async function deleteTrip(tripId: string): Promise<void> {
  await apiClient.delete(`/api/v1/trips/${tripId}`);
}

// ---------------------------------------------------------------------------
// JOIN
// ---------------------------------------------------------------------------

export async function joinTrip(tripId: string): Promise<void> {
  await apiClient.post(`/api/v1/trips/${tripId}/join`);
}

// ---------------------------------------------------------------------------
// LEAVE
// ---------------------------------------------------------------------------

export async function leaveTrip(tripId: string): Promise<void> {
  await apiClient.post(`/api/v1/trips/${tripId}/leave`);
}

// ---------------------------------------------------------------------------
// MY TRIPS
// ---------------------------------------------------------------------------

export async function getMyTrips(
  params: MyTripsParams = {},
): Promise<PaginatedResponse<TripSummary>> {
  const { data } = await apiClient.get<PaginatedResponse<TripSummary>>(
    "/api/v1/users/me/trips",
    { params },
  );
  return data;
}
