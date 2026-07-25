"use client";

/**
 * OntDekker CommunityHeader
 *
 * Landing section of a community workspace.
 *
 * Information displayed (per 05-component-library.md § Community Header):
 *   - Banner image (16:9 hero)
 *   - Community name + member count
 *   - Location
 *   - Description
 *   - Join / Leave button
 */

import React from "react";
import { motion } from "motion/react";
import { Users, MapPin } from "lucide-react";
import Button from "@/components/feedback/Button";
import type { CommunityHeaderProps } from "./CommunityHeader.types";

export default function CommunityHeader({
  community,
  isJoined,
  onJoinToggle,
}: CommunityHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
      className="w-full"
    >
      {/* Banner — 16:9 */}
      <div className="aspect-video w-full overflow-hidden bg-gray-100 rounded-3xl">
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
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <Users size={40} strokeWidth={1} className="text-gray-200" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Info + action row */}
      <div className="mt-5 flex items-start justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-ink">
            {community.name}
          </h1>
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-muted-slate">
              <Users size={10} strokeWidth={2} aria-hidden="true" />
              {community.membersCount.toLocaleString()} members
            </span>
            {community.location && (
              <span className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-muted-slate">
                <MapPin size={10} strokeWidth={2} aria-hidden="true" />
                {community.location}
              </span>
            )}
          </div>
        </div>

        <Button
          variant={isJoined ? "secondary" : "primary"}
          size="md"
          onClick={onJoinToggle}
          className="flex-shrink-0"
        >
          {isJoined ? "Joined" : "Join Community"}
        </Button>
      </div>

      {/* Description */}
      {community.description && (
        <p className="mt-3 text-sm text-charcoal leading-relaxed max-w-2xl">
          {community.description}
        </p>
      )}
    </motion.div>
  );
}
