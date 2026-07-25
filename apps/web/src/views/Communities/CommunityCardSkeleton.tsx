"use client";

/**
 * CommunityCardSkeleton
 * Matches CommunityCard shape: banner, name+members, description, join button.
 */

import React from "react";
import { motion } from "motion/react";

function SkeletonCommunityCard() {
  return (
    <motion.div
      className="bg-white border border-gray-100 rounded-3xl overflow-hidden"
      animate={{ opacity: [0.4, 0.8, 0.4] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      aria-hidden="true"
    >
      {/* Banner */}
      <div className="h-28 w-full bg-gray-100" />
      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="flex justify-between items-start gap-2">
          <div className="h-3.5 w-32 rounded-full bg-gray-100" />
          <div className="h-3 w-10 rounded-full bg-gray-100" />
        </div>
        <div className="h-2.5 w-20 rounded-full bg-gray-100" />
        <div className="space-y-1.5">
          <div className="h-3 w-full rounded-full bg-gray-100" />
          <div className="h-3 w-4/5 rounded-full bg-gray-100" />
        </div>
        <div className="h-8 w-full rounded-xl bg-gray-100" />
      </div>
    </motion.div>
  );
}

export default function CommunityCardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      role="status"
      aria-label="Loading communities…"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
    >
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCommunityCard key={i} />
      ))}
      <span className="sr-only">Loading communities…</span>
    </div>
  );
}
