"use client";

/**
 * OntDekker MyGuidesView
 *
 * Displays guides the user has saved (bookmarked) or connected with.
 * Reads from AppState.savedGuides — populated by SWR in Phase 2.
 *
 * Layout: 3-column grid of GuideCard (matches GuidesView directory grid).
 * Empty state: illustration + CTA to discover guides.
 */

import React from "react";
import { motion } from "motion/react";
import { Compass } from "lucide-react";
import GuideCard from "@/components/cards/GuideCard";
import Button from "@/components/feedback/Button";
import { useAppState } from "@/contexts/AppStateProvider";
import { useRouter } from "next/navigation";

export default function MyGuidesView() {
  const { state } = useAppState();
  const router = useRouter();
  const { savedGuides } = state;

  return (
    <motion.div
      className="pb-20"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
    >
      <div className="container-main pt-6 space-y-6">
        {/* Page header */}
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-slate">
            Guides
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-ink mt-1">
            My Guides
          </h1>
          <p className="text-sm text-muted-slate mt-1">
            Guides you&apos;ve saved or connected with.
          </p>
        </div>

        {/* Content */}
        {savedGuides.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center py-20 gap-4 text-center">
            <Compass
              size={40}
              strokeWidth={1}
              className="text-gray-200"
              aria-hidden="true"
            />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-ink">
                No saved guides yet.
              </p>
              <p className="text-xs text-muted-slate max-w-xs">
                Bookmark guides from the directory to keep them here for easy
                access.
              </p>
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={() => router.push("/guides")}
            >
              Discover guides
            </Button>
          </div>
        ) : (
          /* Guide grid */
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            role="list"
            aria-label="Saved guides"
          >
            {savedGuides.map((guide, i) => (
              <motion.div
                key={guide.id}
                role="listitem"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.25 }}
              >
                <GuideCard
                  guide={guide}
                  onBookmarkToggle={() => {}}
                  onClick={() => router.push(`/guides/${guide.id}`)}
                  index={i}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
