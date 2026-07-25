"use client";

/**
 * OntDekker ProfileHeader
 *
 * Top section of user profile pages.
 *
 * Information displayed (per 05-component-library.md § Profile Header):
 *   - Cover image (full-width, h-48)
 *   - XL Avatar overlapping the cover
 *   - Display name + username
 *   - Bio
 *   - Stats: countries visited, expeditions, followers, following
 *   - Edit Profile button (owner only)
 *
 * Entry motion: opacity 0→1, y 12→0, 300ms decelerate
 */

import React from "react";
import { motion } from "motion/react";
import { Pencil, Globe2, Backpack, Users } from "lucide-react";
import Avatar from "@/components/feedback/Avatar";
import Button from "@/components/feedback/Button";
import type { ProfileHeaderProps } from "./ProfileHeader.types";

export default function ProfileHeader({
  user,
  isOwner,
  onEditToggle,
}: ProfileHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
      className="w-full"
    >
      {/* Cover image */}
      <div className="h-48 w-full overflow-hidden bg-gray-100 relative rounded-3xl">
        {user.coverImageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={user.coverImageUrl}
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />
        )}
      </div>

      {/* Avatar + actions row */}
      <div className="px-6 flex items-end justify-between -mt-12 mb-4">
        <Avatar
          src={user.avatarUrl}
          alt={user.displayName}
          size="xl"
          className="ring-4 ring-white shadow-sm"
        />
        {isOwner && (
          <Button
            variant="outline"
            size="sm"
            icon={Pencil}
            onClick={onEditToggle}
          >
            Edit Profile
          </Button>
        )}
      </div>

      {/* Identity */}
      <div className="px-6 space-y-1">
        <h1 className="text-xl font-bold tracking-tight text-ink">
          {user.displayName}
        </h1>
        <p className="text-sm font-mono text-muted-slate">@{user.username}</p>
      </div>

      {/* Bio */}
      {user.bio && (
        <p className="px-6 mt-3 text-sm text-charcoal leading-relaxed max-w-lg">
          {user.bio}
        </p>
      )}

      {/* Stats row */}
      <div className="px-6 mt-4 flex items-center gap-6 flex-wrap">
        <StatItem
          icon={Globe2}
          value={user.countriesVisited}
          label="Countries"
        />
        <StatItem
          icon={Backpack}
          value={user.expeditionsCount}
          label="Expeditions"
        />
        <StatItem
          icon={Users}
          value={user.followersCount}
          label="Followers"
        />
        <StatItem
          icon={Users}
          value={user.followingCount}
          label="Following"
        />
      </div>
    </motion.div>
  );
}

// ── Sub-component ────────────────────────────────────────────────────────────

function StatItem({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ComponentType<{ size?: number | string; strokeWidth?: number | string; className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
  value: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon size={14} strokeWidth={2} className="text-muted-slate" aria-hidden />
      <span className="text-sm font-bold font-mono text-ink">
        {value.toLocaleString()}
      </span>
      <span className="text-xs text-muted-slate">{label}</span>
    </div>
  );
}
