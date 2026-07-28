"use client";

/**
 * OntDekker TripCard
 *
 * Expedition summary card for the My Trips view.
 *
 * Information displayed (per 05-component-library.md § Trip Card):
 *   - Cover image
 *   - Status badge (colour-coded per ExpeditionStatus)
 *   - Destination + title
 *   - Dates (JetBrains Mono)
 *   - Budget (JetBrains Mono)
 *   - Organiser name
 *   - Participant count / capacity
 */

import React from "react";
import { motion } from "motion/react";
import { CalendarDays, Wallet, Users, MapPin } from "lucide-react";
import Badge from "@/components/feedback/Badge";
import type { BadgeVariant } from "@/components/feedback/Badge";
import BaseCard from "@/components/cards/BaseCard";
import type { TripCardProps } from "./TripCard.types";
import type { ExpeditionStatus } from "@/types";

// Status → Badge variant + label
const STATUS_CONFIG: Record<ExpeditionStatus, { variant: BadgeVariant; label: string }> = {
  DRAFT:      { variant: "default",  label: "Draft" },
  PUBLISHED:  { variant: "info",     label: "Open" },
  ACTIVE:     { variant: "success",  label: "Active" },
  COMPLETED:  { variant: "default",  label: "Completed" },
  CANCELLED:  { variant: "error",    label: "Cancelled" },
  ARCHIVED:   { variant: "default",  label: "Archived" },
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function TripCard({ trip, onClick, index = 0 }: TripCardProps) {
  const statusCfg = STATUS_CONFIG[trip.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0, 0, 0.2, 1], delay: index * 0.05 }}
    >
      <BaseCard
        onClick={onClick}
        ariaLabel={`Open expedition: ${trip.title}`}
        className="p-0 overflow-hidden space-y-0"
      >
        {/* Cover image */}
        <div className="h-36 w-full overflow-hidden bg-gray-100 relative">
          {trip.coverImageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={trip.coverImageUrl}
              alt={trip.destination}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <MapPin size={24} strokeWidth={1.5} className="text-gray-300" aria-hidden="true" />
            </div>
          )}
          {/* Status badge overlay */}
          <div className="absolute top-3 right-3">
            <Badge variant={statusCfg.variant} size="sm">
              {statusCfg.label}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Destination */}
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-slate">
              {trip.destination}
            </p>
            <h3 className="text-sm font-semibold tracking-tight text-ink leading-snug mt-0.5">
              {trip.title}
            </h3>
          </div>

          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-muted-slate">
            {/* Dates */}
            <span className="flex items-center gap-1">
              <CalendarDays size={10} strokeWidth={2} aria-hidden="true" />
              <span>{formatDate(trip.startDate)}</span>
            </span>

            {/* Budget */}
            <span className="flex items-center gap-1">
              <Wallet size={10} strokeWidth={2} aria-hidden="true" />
              <span className="uppercase tracking-wider">
                {trip.status === "DRAFT" ? "Budget TBD" : "Open"}
              </span>
            </span>

            {/* Participants */}
            <span className="flex items-center gap-1 col-span-2">
              <Users size={10} strokeWidth={2} aria-hidden="true" />
              <span>
                {trip.currentParticipantsCount ?? "—"} / {trip.maxParticipants} participants
              </span>
            </span>
          </div>

          {/* Organiser */}
          {trip.organizerName && (
            <p className="text-xs text-charcoal">
              <span className="text-muted-slate">by </span>
              {trip.organizerName}
            </p>
          )}
        </div>
      </BaseCard>
    </motion.div>
  );
}
