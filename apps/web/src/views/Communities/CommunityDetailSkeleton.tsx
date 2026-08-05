"use client";

/**
 * CommunityDetailSkeleton
 *
 * Animated loading placeholder that mirrors the shape of CommunityDetailView:
 *   - Banner image block
 *   - Logo overlay + name row
 *   - Meta chips row
 *   - Description lines
 *   - Rules section
 *   - Discussions section
 *
 * Motion: opacity pulse 0.4→0.8→0.4 at 1.5s (consistent with all other OntDekker skeletons)
 */

import React from "react";
import { motion } from "motion/react";

export default function CommunityDetailSkeleton() {
  return (
    <motion.div
      className="pb-20"
      animate={{ opacity: [0.4, 0.8, 0.4] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      aria-hidden="true"
      role="status"
      aria-label="Loading community…"
    >
      {/* Banner */}
      <div className="h-52 w-full bg-gray-100" />

      <div className="container-main space-y-6 pt-0">
        {/* Logo overlap + name row */}
        <div className="flex items-end justify-between -mt-10">
          <div className="w-20 h-20 rounded-2xl bg-gray-200 ring-4 ring-white shadow-sm flex-shrink-0" />
          {/* Join button placeholder */}
          <div className="h-9 w-28 rounded-xl bg-gray-100 mb-1" />
        </div>

        {/* Name + category */}
        <div className="space-y-2">
          <div className="h-6 w-56 rounded-full bg-gray-100" />
          <div className="flex items-center gap-3 flex-wrap">
            <div className="h-3 w-14 rounded-full bg-gray-100" />
            <div className="h-3 w-20 rounded-full bg-gray-100" />
            <div className="h-3 w-18 rounded-full bg-gray-100" />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <div className="h-3 w-full rounded-full bg-gray-100" />
          <div className="h-3 w-5/6 rounded-full bg-gray-100" />
          <div className="h-3 w-4/6 rounded-full bg-gray-100" />
        </div>

        {/* Stats row */}
        <div className="flex gap-4">
          <div className="h-14 w-24 rounded-2xl bg-gray-100" />
          <div className="h-14 w-24 rounded-2xl bg-gray-100" />
          <div className="h-14 w-24 rounded-2xl bg-gray-100" />
        </div>

        {/* Rules section */}
        <div className="space-y-3">
          <div className="h-4 w-24 rounded-full bg-gray-100" />
          <div className="bg-white border border-gray-100 rounded-3xl p-5 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-1.5 py-3 border-b border-gray-100 last:border-0">
                <div className="h-3.5 w-32 rounded-full bg-gray-100" />
                <div className="h-3 w-full rounded-full bg-gray-100" />
                <div className="h-3 w-4/5 rounded-full bg-gray-100" />
              </div>
            ))}
          </div>
        </div>

        {/* Discussions section */}
        <div className="space-y-3">
          <div className="h-4 w-36 rounded-full bg-gray-100" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white border border-gray-100 rounded-3xl p-5 flex items-start gap-3"
              >
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-3/4 rounded-full bg-gray-100" />
                  <div className="flex items-center gap-3">
                    <div className="h-2.5 w-16 rounded-full bg-gray-100" />
                    <div className="h-2.5 w-12 rounded-full bg-gray-100" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <span className="sr-only">Loading community…</span>
    </motion.div>
  );
}
