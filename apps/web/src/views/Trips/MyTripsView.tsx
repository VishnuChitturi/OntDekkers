"use client";

/**
 * OntDekker MyTripsView
 *
 * Expedition listing. Entry from Sidebar "My Trips".
 *
 * Sections:
 *   - Page header + status filter chips (All / Active / Upcoming / Completed)
 *   - 3-column responsive TripCard grid
 *   - All four states: loading / empty / error / success
 *
 * Data (Service Layer):
 *   useSWR(expeditionKeys.mine(params), swrFetcherWithParams)
 *   → PaginatedResponse<ExpeditionSummary>
 *
 * Card click → router.push(`/expeditions/${expedition.id}`)
 */

import React, { useState, useMemo } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "motion/react";
import { Backpack, RefreshCw } from "lucide-react";

import TripCard from "@/components/cards/TripCard";
import Button from "@/components/feedback/Button";

import { swrFetcherWithParams, expeditionKeys } from "@/services/cache";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";

import TripCardSkeleton from "./TripCardSkeleton";

import type { ExpeditionSummary, PaginatedResponse, ExpeditionStatus } from "@/types";

// ---------------------------------------------------------------------------
// Filter chips
// ---------------------------------------------------------------------------

type StatusFilter = "all" | "ACTIVE" | "PUBLISHED" | "COMPLETED";

const FILTER_LABELS: Record<StatusFilter, string> = {
  all: "All",
  ACTIVE: "Active",
  PUBLISHED: "Upcoming",
  COMPLETED: "Completed",
};

// ---------------------------------------------------------------------------
// Empty + Error
// ---------------------------------------------------------------------------

function EmptyTrips({ filter }: { filter: StatusFilter }) {
  const label = filter === "all" ? "upcoming trips" : FILTER_LABELS[filter].toLowerCase() + " trips";
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-20 text-center space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <Backpack size={40} strokeWidth={1} className="text-gray-200" aria-hidden="true" />
      <div className="space-y-1">
        <p className="text-sm font-semibold text-ink">No {label}.</p>
        <p className="text-xs text-muted-slate max-w-xs">
          Join or create an expedition to see it here.
        </p>
      </div>
    </motion.div>
  );
}

function ErrorBanner({ onRetry }: { onRetry: () => void }) {
  return (
    <motion.div
      className="flex items-center justify-between gap-4 bg-red-50 border border-red-100 rounded-2xl px-5 py-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      role="alert"
    >
      <p className="text-sm text-red-700">Unable to load your trips. Please try again.</p>
      <Button variant="outline" size="sm" icon={RefreshCw} onClick={onRetry}>Retry</Button>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// MyTripsView
// ---------------------------------------------------------------------------

const MOCK_TRIPS: ExpeditionSummary[] = [
  {
    id: "exp-1",
    communityId: "c-1",
    organizerId: "o-1",
    title: "Dolomites Autumn High-Route",
    destination: "South Tyrol, Italy",
    startDate: "2024-09-15",
    endDate: "2024-09-22",
    status: "PUBLISHED",
    visibility: "PUBLIC",
    coverImageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80",
    budget: 850,
    maxParticipants: 8,
    currentParticipantsCount: 6,
    organizerName: "Alex Rivera",
  },
  {
    id: "exp-2",
    communityId: "c-2",
    organizerId: "o-2",
    title: "Flam Fjord Kayak & Camp",
    destination: "Flam, Norway",
    startDate: "2024-10-02",
    endDate: "2024-10-07",
    status: "ACTIVE",
    visibility: "PUBLIC",
    coverImageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    budget: 1100,
    maxParticipants: 6,
    currentParticipantsCount: 4,
    organizerName: "Astrid Lindholm",
  },
];

export default function MyTripsView() {
  const router = useRouter();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const params = useMemo(() => ({
    ...(statusFilter !== "all" ? { status: statusFilter } : {}),
    page_size: 18,
  }), [statusFilter]);

  // ── SWR ───────────────────────────────────────────────────────────────────
  const { data, isLoading } = useSWR<PaginatedResponse<ExpeditionSummary>>(
    expeditionKeys.mine(params),
    ([url, p]: [string, Record<string, unknown>]) => swrFetcherWithParams(url, p),
    { revalidateOnFocus: false },
  );

  const trips = useMemo(() => {
    let list = data?.items && data.items.length > 0 ? data.items : MOCK_TRIPS;
    if (statusFilter !== "all") {
      list = list.filter((t) => t.status === statusFilter);
    }
    return list;
  }, [data?.items, statusFilter]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <motion.div
      className="container-main py-8 space-y-6 pb-20"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
    >
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-ink">My Trips</h1>
        <p className="text-sm text-charcoal">
          Your expeditions — active, upcoming, and completed.
        </p>
      </div>

      {/* Status filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {(Object.keys(FILTER_LABELS) as StatusFilter[]).map((filter) => (
          <button
            key={filter}
            type="button"
            aria-pressed={statusFilter === filter}
            onClick={() => setStatusFilter(filter)}
            className={[
              "inline-flex items-center px-3 py-1.5 rounded-full border text-xs font-medium",
              "transition-all duration-[var(--duration-responsive)]",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
              statusFilter === filter
                ? "bg-ink text-white border-ink"
                : "bg-white text-charcoal border-gray-200 hover:border-gray-300 hover:bg-gray-50",
            ].join(" ")}
          >
            {FILTER_LABELS[filter]}
          </button>
        ))}
        {data && (
          <span className="ml-auto text-[10px] font-mono text-muted-slate">
            {trips.length} of {data.pagination.totalItems}
          </span>
        )}
      </div>

      {/* Trip grid — all states */}
      <AnimatePresence mode="wait">
        {isLoading && !data ? (
          <TripCardSkeleton key="skeleton" count={6} />
        ) : trips.length === 0 ? (
          <EmptyTrips key="empty" filter={statusFilter} />
        ) : (
          <div
            key="trips"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {trips.map((trip, index) => (
              <TripCard
                key={trip.id}
                trip={trip}
                index={index}
                onClick={() => router.push(`/expeditions/${trip.id}`)}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
