"use client";

/**
 * OntDekker StoryCard
 *
 * Editorial story preview card for the Discover feed.
 *
 * Information displayed (per 05-component-library.md § Story Card):
 *   - Author avatar + display name
 *   - Cover image (4:3 aspect ratio per 07-visual-style-guide.md)
 *   - Title
 *   - Location + read time (JetBrains Mono metadata)
 *   - Travel pace badge
 *   - Tags
 *
 * Actions:
 *   Like    — Heart, spring scale 0.8→1.3→1 (organic spring)
 *   Save    — Bookmark, spring scale 1→1.2→1
 *   Comment — Opens comment section
 *   Open    — onClick navigates to Story Modal
 *
 * Motion (06-motion-design.md):
 *   Entry : opacity 0→1, y 15→0, staggered 50ms per card
 *   Like  : organic spring cubic-bezier(0.34,1.56,0.64,1)
 *   Bookmark: spring pull 1→1.2→1
 */

import React from "react";
import { motion } from "motion/react";
import { Heart, Bookmark, MessageCircle, MapPin, Clock } from "lucide-react";
import Avatar from "@/components/feedback/Avatar";
import Badge from "@/components/feedback/Badge";
import BaseCard from "@/components/cards/BaseCard";
import type { StoryCardProps } from "./StoryCard.types";

// Pace label map
const PACE_LABEL: Record<string, string> = {
  SLOW: "Slow Travel",
  MODERATE: "Moderate",
  FAST: "Fast Pace",
};

export default function StoryCard({
  post,
  onLikeToggle,
  onSaveToggle,
  onCommentClick,
  onClick,
  index = 0,
}: StoryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        ease: [0, 0, 0.2, 1],
        delay: index * 0.05,
      }}
    >
      <BaseCard onClick={onClick} ariaLabel={`Read story: ${post.title}`} className="p-0 overflow-hidden space-y-0">
        {/* Cover image */}
        {post.coverImageUrl && (
          <div className="aspect-[4/3] w-full overflow-hidden bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.coverImageUrl}
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-[var(--duration-intimate)] group-hover:scale-105"
              loading="lazy"
            />
          </div>
        )}

        {/* Content */}
        <div className="p-5 space-y-3">
          {/* Author row */}
          <div className="flex items-center gap-2">
            <Avatar
              src={post.author.avatarUrl}
              alt={post.author.displayName}
              size="xs"
            />
            <span className="text-xs font-medium text-charcoal">
              {post.author.displayName}
            </span>
            {post.pace && (
              <Badge variant="info" size="sm" className="ml-auto">
                {PACE_LABEL[post.pace] ?? post.pace}
              </Badge>
            )}
          </div>

          {/* Title */}
          <h3 className="text-sm font-semibold tracking-tight text-ink leading-snug line-clamp-2">
            {post.title}
          </h3>

          {/* Metadata row — location + read time */}
          <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-muted-slate">
            {post.location && (
              <span className="flex items-center gap-1">
                <MapPin size={10} strokeWidth={2} aria-hidden="true" />
                {post.location}
              </span>
            )}
            {post.readTimeMinutes && (
              <span className="flex items-center gap-1">
                <Clock size={10} strokeWidth={2} aria-hidden="true" />
                {post.readTimeMinutes} min read
              </span>
            )}
          </div>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {post.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="default" size="sm">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-gray-100" aria-hidden="true" />

          {/* Actions row */}
          <div
            className="flex items-center gap-1 -mb-1"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Like */}
            <motion.button
              type="button"
              aria-label={post.isLiked ? "Unlike story" : "Like story"}
              aria-pressed={post.isLiked}
              onClick={onLikeToggle}
              className={[
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl",
                "text-xs font-medium transition-colors duration-[var(--duration-responsive)]",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
                post.isLiked
                  ? "text-red-500 bg-red-50"
                  : "text-muted-slate hover:text-ink hover:bg-gray-50",
              ].join(" ")}
              whileTap={{ scale: 0.85 }}
              animate={post.isLiked ? { scale: [0.8, 1.3, 1] } : { scale: 1 }}
              transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <Heart
                size={14}
                strokeWidth={2}
                fill={post.isLiked ? "currentColor" : "none"}
                aria-hidden="true"
              />
              <span className="font-mono">{post.likesCount}</span>
            </motion.button>

            {/* Comment */}
            <button
              type="button"
              aria-label={`${post.commentsCount} comments`}
              onClick={onCommentClick}
              className="
                flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl
                text-xs font-medium text-muted-slate
                hover:text-ink hover:bg-gray-50
                transition-colors duration-[var(--duration-responsive)]
                focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink
              "
            >
              <MessageCircle size={14} strokeWidth={2} aria-hidden="true" />
              <span className="font-mono">{post.commentsCount}</span>
            </button>

            {/* Save / Bookmark */}
            <motion.button
              type="button"
              aria-label={post.isSaved ? "Unsave story" : "Save story"}
              aria-pressed={post.isSaved}
              onClick={onSaveToggle}
              className={[
                "ml-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl",
                "text-xs font-medium transition-colors duration-[var(--duration-responsive)]",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
                post.isSaved
                  ? "text-amber-600 bg-amber-50"
                  : "text-muted-slate hover:text-ink hover:bg-gray-50",
              ].join(" ")}
              whileTap={{ scale: 0.9 }}
              animate={post.isSaved ? { scale: [1, 1.2, 1] } : { scale: 1 }}
              transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <Bookmark
                size={14}
                strokeWidth={2}
                fill={post.isSaved ? "currentColor" : "none"}
                aria-hidden="true"
              />
            </motion.button>
          </div>
        </div>
      </BaseCard>
    </motion.div>
  );
}
