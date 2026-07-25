"use client";

/**
 * OntDekker CommunityCard
 *
 * Community preview card for the Communities directory.
 *
 * Information displayed (per 05-component-library.md § Community Card):
 *   - Banner / cover image
 *   - Community name
 *   - Members count (mono)
 *   - Location
 *   - Description excerpt
 *   - Join / Leave toggle button
 */

import React from "react";
import { motion } from "motion/react";
import { Users, MapPin } from "lucide-react";
import Button from "@/components/feedback/Button";
import BaseCard from "@/components/cards/BaseCard";
import type { CommunityCardProps } from "./CommunityCard.types";

export default function CommunityCard({
  community,
  isJoined,
  onJoinToggle,
  onClick,
  index = 0,
}: CommunityCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0, 0, 0.2, 1], delay: index * 0.05 }}
    >
      <BaseCard
        onClick={onClick}
        ariaLabel={`Open ${community.name} community`}
        className="p-0 overflow-hidden space-y-0"
      >
        {/* Banner image */}
        <div className="h-28 w-full overflow-hidden bg-gray-100 relative">
          {community.bannerUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={community.bannerUrl}
              alt=""
              aria-hidden="true"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />
          )}
          {/* Community avatar overlaps banner */}
          {community.avatarUrl && (
            <div className="absolute -bottom-4 left-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={community.avatarUrl}
                alt={community.name}
                className="w-9 h-9 rounded-xl border-2 border-white shadow-sm object-cover"
                loading="lazy"
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className={`p-4 space-y-2 ${community.avatarUrl ? "pt-6" : "pt-4"}`}>
          {/* Name + members */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold tracking-tight text-ink leading-snug">
              {community.name}
            </h3>
            <span className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-muted-slate flex-shrink-0">
              <Users size={10} strokeWidth={2} aria-hidden="true" />
              {community.membersCount.toLocaleString()}
            </span>
          </div>

          {/* Location */}
          {community.location && (
            <p className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-muted-slate">
              <MapPin size={10} strokeWidth={2} aria-hidden="true" />
              {community.location}
            </p>
          )}

          {/* Description */}
          {community.description && (
            <p className="text-xs text-charcoal leading-relaxed line-clamp-2">
              {community.description}
            </p>
          )}

          {/* Join / Leave button */}
          <div
            className="pt-1"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant={isJoined ? "secondary" : "primary"}
              size="sm"
              onClick={onJoinToggle}
              className="w-full"
            >
              {isJoined ? "Joined" : "Join Community"}
            </Button>
          </div>
        </div>
      </BaseCard>
    </motion.div>
  );
}
