"use client";

/**
 * OntDekker ExpeditionHeader
 *
 * Top section of the Expedition Workspace.
 *
 * Information displayed (per 05-component-library.md § Expedition Header):
 *   - Cover image (full-width hero)
 *   - Back button (calls onBack prop — caller uses router.back())
 *   - Title
 *   - Destination
 *   - Status badge
 *   - Dates (mono)
 *   - Budget (mono)
 *   - Organiser avatar + name
 */

import React from "react";
import { motion } from "motion/react";
import { ArrowLeft, CalendarDays, Wallet, MapPin } from "lucide-react";
import Avatar from "@/components/feedback/Avatar";
import Badge from "@/components/feedback/Badge";
import type { BadgeVariant } from "@/components/feedback/Badge";
import type { ExpeditionHeaderProps } from "./ExpeditionHeader.types";
import type { ExpeditionStatus } from "@/types";

const STATUS_CONFIG: Record<ExpeditionStatus, { variant: BadgeVariant; label: string }> = {
  DRAFT:     { variant: "default",  label: "Draft" },
  PUBLISHED: { variant: "info",     label: "Open" },
  ACTIVE:    { variant: "success",  label: "Active" },
  COMPLETED: { variant: "default",  label: "Completed" },
  CANCELLED: { variant: "error",    label: "Cancelled" },
  ARCHIVED:  { variant: "default",  label: "Archived" },
};

function formatDate(iso: string | null): string {
  if (!iso) return "TBD";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ExpeditionHeader({ expedition, onBack }: ExpeditionHeaderProps) {
  const statusCfg = STATUS_CONFIG[expedition.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
      className="w-full"
    >
      {/* Cover image */}
      <div className="h-52 w-full overflow-hidden bg-gray-100 rounded-3xl relative">
        {expedition.coverImageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={expedition.coverImageUrl}
            alt={expedition.destination}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <MapPin size={40} strokeWidth={1} className="text-gray-200" aria-hidden="true" />
          </div>
        )}

        {/* Back button — overlaid on cover */}
        <button
          type="button"
          aria-label="Go back"
          onClick={onBack}
          className="
            absolute top-4 left-4
            flex items-center justify-center
            w-8 h-8 rounded-xl
            bg-white/80 backdrop-blur-sm
            text-ink hover:bg-white
            shadow-xs
            transition-all duration-[var(--duration-responsive)]
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink
          "
        >
          <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
        </button>

        {/* Status badge — overlaid on cover */}
        <div className="absolute top-4 right-4">
          <Badge variant={statusCfg.variant} size="sm">
            {statusCfg.label}
          </Badge>
        </div>
      </div>

      {/* Content below cover */}
      <div className="mt-5 space-y-3">
        {/* Destination */}
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-slate flex items-center gap-1">
          <MapPin size={10} strokeWidth={2} aria-hidden="true" />
          {expedition.destination}
        </p>

        {/* Title */}
        <h1 className="text-2xl font-bold tracking-tight text-ink leading-snug">
          {expedition.title}
        </h1>

        {/* Meta row — dates + budget */}
        <div className="flex items-center gap-5 flex-wrap text-[10px] font-mono uppercase tracking-wider text-muted-slate">
          <span className="flex items-center gap-1.5">
            <CalendarDays size={11} strokeWidth={2} aria-hidden="true" />
            {formatDate(expedition.startDate)}
            {expedition.endDate && ` — ${formatDate(expedition.endDate)}`}
          </span>
          {expedition.budget !== null && (
            <span className="flex items-center gap-1.5">
              <Wallet size={11} strokeWidth={2} aria-hidden="true" />
              ${expedition.budget.toLocaleString()} budget
            </span>
          )}
        </div>

        {/* Organiser */}
        {expedition.organizer && (
          <div className="flex items-center gap-2">
            <Avatar
              src={expedition.organizer.avatarUrl}
              alt={expedition.organizer.displayName}
              size="xs"
            />
            <span className="text-xs text-charcoal">
              <span className="text-muted-slate">Organised by </span>
              <span className="font-medium">{expedition.organizer.displayName}</span>
            </span>
          </div>
        )}

        {/* Description */}
        {expedition.description && (
          <p className="text-sm text-charcoal leading-relaxed max-w-2xl">
            {expedition.description}
          </p>
        )}
      </div>
    </motion.div>
  );
}
