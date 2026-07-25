"use client";

/**
 * OntDekker FeedSkeleton
 *
 * Animated skeleton placeholder cards shown while the feed is loading.
 *
 * Motion spec (06-motion-design.md § Loading — Skeleton):
 *   Opacity pulsing: 30% → 80% → 30%   cycle 1.5s
 *
 * Renders `count` skeleton card shapes that match the dimensions of
 * a StoryCard so the layout shift is zero when real content arrives.
 */

import React from "react";
import { motion } from "motion/react";

// Single skeleton card
function SkeletonCard() {
  return (
    <motion.div
      className="bg-white border border-gray-100 rounded-3xl overflow-hidden"
      animate={{ opacity: [0.4, 0.8, 0.4] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      aria-hidden="true"
    >
      {/* Cover image placeholder */}
      <div className="aspect-[4/3] w-full bg-gray-100" />

      {/* Content placeholder */}
      <div className="p-5 space-y-3">
        {/* Author row */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gray-100" />
          <div className="h-3 w-24 rounded-full bg-gray-100" />
        </div>
        {/* Title */}
        <div className="space-y-1.5">
          <div className="h-3.5 w-full rounded-full bg-gray-100" />
          <div className="h-3.5 w-4/5 rounded-full bg-gray-100" />
        </div>
        {/* Meta */}
        <div className="flex gap-3">
          <div className="h-2.5 w-16 rounded-full bg-gray-100" />
          <div className="h-2.5 w-12 rounded-full bg-gray-100" />
        </div>
        {/* Tags */}
        <div className="flex gap-1.5">
          <div className="h-5 w-12 rounded-full bg-gray-100" />
          <div className="h-5 w-16 rounded-full bg-gray-100" />
        </div>
        {/* Action row */}
        <div className="border-t border-gray-100 pt-3 flex gap-2">
          <div className="h-6 w-14 rounded-xl bg-gray-100" />
          <div className="h-6 w-14 rounded-xl bg-gray-100" />
        </div>
      </div>
    </motion.div>
  );
}

interface FeedSkeletonProps {
  /** Number of skeleton cards to render — defaults to 6 */
  count?: number;
}

export default function FeedSkeleton({ count = 6 }: FeedSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading stories…"
      className="grid grid-cols-1 sm:grid-cols-2 gap-5"
    >
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
      <span className="sr-only">Loading stories…</span>
    </div>
  );
}
