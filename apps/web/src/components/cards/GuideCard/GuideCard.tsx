"use client";

/**
 * OntDekker GuideCard
 *
 * Guide discovery card used in the Guides directory.
 *
 * Information displayed (per 05-component-library.md § Guide Card):
 *   - Avatar (md)
 *   - Display name + VerificationBadge when VERIFIED
 *   - Star rating (mono) + review count
 *   - Cities (first 2) + languages (first 2)
 *   - Bio excerpt (2-line clamp)
 *
 * Actions:
 *   Bookmark — spring scale 1→1.2→1 (organic spring)
 *   Message  — opens conversation
 *   View Profile — onClick navigates to guide portfolio
 */

import React from "react";
import { motion } from "motion/react";
import { Bookmark, MessageCircle, Star, MapPin, Languages } from "lucide-react";
import Avatar from "@/components/feedback/Avatar";
import { VerificationBadge } from "@/components/feedback/Badge";
import Button from "@/components/feedback/Button";
import BaseCard from "@/components/cards/BaseCard";
import type { GuideCardProps } from "./GuideCard.types";

export default function GuideCard({
  guide,
  onBookmarkToggle,
  onMessage,
  onClick,
  index = 0,
}: GuideCardProps) {
  const isVerified = guide.verificationStatus === "VERIFIED";
  const isBookmarked = false; // bookmarked state comes from parent via TravelConnection

  // First 2 cities
  const cities = guide.locations
    .slice(0, 2)
    .map((l) => l.city ?? l.region ?? l.country)
    .filter(Boolean)
    .join(", ");

  // First 2 languages
  const langs = guide.languages.slice(0, 2).map((l) => l.language).join(", ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0, 0, 0.2, 1], delay: index * 0.05 }}
    >
      <BaseCard onClick={onClick} ariaLabel={`View ${guide.displayName}'s profile`}>
        <div className="space-y-4">
          {/* Top row: avatar + name + bookmark */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar
                src={guide.profileImageUrl}
                alt={guide.displayName}
                size="md"
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink truncate">
                  {guide.displayName}
                </p>
                {isVerified && (
                  <VerificationBadge size="sm" className="mt-0.5" />
                )}
              </div>
            </div>

            {/* Bookmark button */}
            <motion.button
              type="button"
              aria-label={isBookmarked ? "Remove bookmark" : "Bookmark guide"}
              aria-pressed={isBookmarked}
              onClick={onBookmarkToggle}
              className={[
                "flex-shrink-0 flex items-center justify-center",
                "w-8 h-8 rounded-xl border",
                "transition-colors duration-[var(--duration-responsive)]",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
                isBookmarked
                  ? "bg-amber-50 border-amber-200 text-amber-600"
                  : "bg-white border-gray-100 text-muted-slate hover:text-ink hover:border-gray-200",
              ].join(" ")}
              whileTap={{ scale: 0.85 }}
              animate={isBookmarked ? { scale: [1, 1.2, 1] } : { scale: 1 }}
              transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <Bookmark
                size={15}
                strokeWidth={2}
                fill={isBookmarked ? "currentColor" : "none"}
                aria-hidden="true"
              />
            </motion.button>
          </div>

          {/* Rating row */}
          {guide.rating !== null && (
            <div className="flex items-center gap-1.5">
              <Star
                size={13}
                strokeWidth={2}
                fill="currentColor"
                className="text-amber-400"
                aria-hidden="true"
              />
              <span className="text-xs font-mono font-medium text-ink">
                {guide.rating.toFixed(1)}
              </span>
              <span className="text-[10px] font-mono text-muted-slate">
                ({guide.reviewCount} reviews)
              </span>
              {guide.yearsExperience !== null && (
                <span className="ml-auto text-[10px] font-mono uppercase tracking-wider text-muted-slate">
                  {guide.yearsExperience} yrs exp
                </span>
              )}
            </div>
          )}

          {/* Location + languages metadata */}
          <div className="flex flex-col gap-1 text-[10px] font-mono uppercase tracking-wider text-muted-slate">
            {cities && (
              <span className="flex items-center gap-1.5">
                <MapPin size={10} strokeWidth={2} aria-hidden="true" />
                {cities}
              </span>
            )}
            {langs && (
              <span className="flex items-center gap-1.5">
                <Languages size={10} strokeWidth={2} aria-hidden="true" />
                {langs}
              </span>
            )}
          </div>

          {/* Bio excerpt */}
          {guide.bio && (
            <p className="text-xs text-charcoal leading-relaxed line-clamp-2">
              {guide.bio}
            </p>
          )}

          {/* Divider */}
          <div className="border-t border-gray-100" aria-hidden="true" />

          {/* Action buttons */}
          <div
            className="flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="outline"
              size="sm"
              icon={MessageCircle}
              onClick={onMessage}
              className="flex-1"
            >
              Message
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onClick}
              className="flex-1"
            >
              View Profile
            </Button>
          </div>
        </div>
      </BaseCard>
    </motion.div>
  );
}
