"use client";

/**
 * OntDekker GuidesView
 *
 * Guide discovery directory. Entry from Sidebar "Guides" item.
 *
 * Layout:
 *   - Page title + search
 *   - Filter chips: Verified Only, Available Now (+ clear all)
 *   - 3-column responsive guide grid
 *   - All four states: loading / empty / error / success
 *
 * Data (via Service Layer only — no direct Axios):
 *   useSWR([guideKeys.list(params)], swrFetcherWithParams)
 *   → PaginatedResponse<GuideProfileSummary>
 *
 * Actions:
 *   Bookmark  → bookmarkGuide / unbookmarkGuide + useToast
 *   Message   → navigateTo("messages")
 *   View      → navigateTo("guide-portfolio", guide.id)
 */

import React, { useState, useCallback, useMemo } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "motion/react";
import { Map, RefreshCw, ShieldCheck, Wifi } from "lucide-react";

import GuideCard from "@/components/cards/GuideCard";
import Button from "@/components/feedback/Button";
import Search from "@/components/navigation/Search";
import Badge from "@/components/feedback/Badge";

import { swrFetcherWithParams, guideKeys } from "@/services/cache";
import { bookmarkGuide, unbookmarkGuide } from "@/services/api";

import { useRouter } from "@/router/Router";
import { useAppState } from "@/contexts/AppStateProvider";
import { useToast } from "@/hooks/useToast";

import GuideCardSkeleton from "./GuideCardSkeleton";

import type { GuideProfileSummary, PaginatedResponse } from "@/types";

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyGuides() {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-20 text-center space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Map size={40} strokeWidth={1} className="text-gray-200" aria-hidden="true" />
      <div className="space-y-1">
        <p className="text-sm font-semibold text-ink">No guides found.</p>
        <p className="text-xs text-muted-slate max-w-xs">
          Try adjusting your filters or search query to discover verified local guides.
        </p>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

function ErrorBanner({ onRetry }: { onRetry: () => void }) {
  return (
    <motion.div
      className="flex items-center justify-between gap-4 bg-red-50 border border-red-100 rounded-2xl px-5 py-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      role="alert"
    >
      <p className="text-sm text-red-700">
        Unable to load guides. Check your connection and try again.
      </p>
      <Button variant="outline" size="sm" icon={RefreshCw} onClick={onRetry}>
        Retry
      </Button>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Filter chip
// ---------------------------------------------------------------------------

function FilterChip({
  label,
  icon: Icon,
  active,
  onToggle,
}: {
  label: string;
  icon: React.ComponentType<{ size?: number | string; strokeWidth?: number | string; className?: string }>;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onToggle}
      className={[
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium",
        "transition-all duration-[var(--duration-responsive)]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
        active
          ? "bg-ink text-white border-ink"
          : "bg-white text-charcoal border-gray-200 hover:border-gray-300 hover:bg-gray-50",
      ].join(" ")}
    >
      <Icon size={12} strokeWidth={2} aria-hidden="true" />
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// GuidesView
// ---------------------------------------------------------------------------

export default function GuidesView() {
  const { navigateTo } = useRouter();
  const { state } = useAppState();
  const { showToast } = useToast();

  // ── Search + filters ───────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(false);

  const filters = useMemo(() => ({
    ...(verifiedOnly ? { verification_status: "VERIFIED" } : {}),
    ...(availableOnly ? { availability: "AVAILABLE" } : {}),
    page_size: 18,
  }), [verifiedOnly, availableOnly]);

  const hasActiveFilters = verifiedOnly || availableOnly;

  // ── SWR ───────────────────────────────────────────────────────────────────
  const swrKey = guideKeys.list(filters);
  const { data, error, isLoading, mutate } = useSWR<PaginatedResponse<GuideProfileSummary>>(
    swrKey,
    ([url, params]: [string, Record<string, unknown>]) => swrFetcherWithParams(url, params),
    { revalidateOnFocus: false },
  );

  // Client-side search filter on top of API results
  const filteredGuides = useMemo(() => {
    const guides = data?.items ?? [];
    if (!searchQuery.trim()) return guides;
    const q = searchQuery.toLowerCase();
    return guides.filter((g) =>
      g.displayName.toLowerCase().includes(q) ||
      g.bio?.toLowerCase().includes(q) ||
      g.locations.some((l) =>
        [l.country, l.region, l.city].some((v) => v?.toLowerCase().includes(q)),
      ) ||
      g.languages.some((l) => l.language.toLowerCase().includes(q)),
    );
  }, [data?.items, searchQuery]);

  // ── Bookmark action ────────────────────────────────────────────────────────
  const handleBookmark = useCallback(
    async (e: React.MouseEvent, guide: GuideProfileSummary) => {
      e.stopPropagation();
      const isCurrentlyBookmarked = state.savedGuides.some((g) => g.id === guide.id);
      try {
        if (isCurrentlyBookmarked) {
          await unbookmarkGuide(guide.id);
          showToast("Bookmark removed.", "info");
        } else {
          await bookmarkGuide(guide.id);
          showToast(`${guide.displayName} bookmarked!`, "success");
        }
      } catch {
        showToast("Could not update bookmark. Please try again.", "error");
      }
    },
    [state.savedGuides, showToast],
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <motion.div
      className="container-main py-8 space-y-6 pb-20"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
    >
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Guides</h1>
        <p className="text-sm text-charcoal">
          Discover verified local guides for your next expedition.
        </p>
      </div>

      {/* ── Search + filters ─────────────────────────────────────────────── */}
      <div className="space-y-3">
        <Search
          placeholder="Search by name, location, or language…"
          value={searchQuery}
          onChange={setSearchQuery}
          className="max-w-sm"
          ariaLabel="Search guides"
        />

        <div className="flex items-center gap-2 flex-wrap">
          <FilterChip
            label="Verified Only"
            icon={ShieldCheck}
            active={verifiedOnly}
            onToggle={() => setVerifiedOnly((v) => !v)}
          />
          <FilterChip
            label="Available Now"
            icon={Wifi}
            active={availableOnly}
            onToggle={() => setAvailableOnly((v) => !v)}
          />
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => { setVerifiedOnly(false); setAvailableOnly(false); }}
              className="text-xs text-muted-slate hover:text-ink underline transition-colors duration-[var(--duration-responsive)]"
            >
              Clear all
            </button>
          )}
          {data && (
            <span className="ml-auto text-[10px] font-mono text-muted-slate">
              {filteredGuides.length} of {data.pagination.total} guides
            </span>
          )}
        </div>
      </div>

      {/* ── Guide grid — all states ───────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <GuideCardSkeleton key="skeleton" count={6} />
        ) : error ? (
          <ErrorBanner key="error" onRetry={() => mutate()} />
        ) : filteredGuides.length === 0 ? (
          <EmptyGuides key="empty" />
        ) : (
          <div
            key="guides"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {filteredGuides.map((guide, index) => (
              <GuideCard
                key={guide.id}
                guide={guide}
                index={index}
                onBookmarkToggle={(e) => handleBookmark(e, guide)}
                onMessage={(e) => {
                  e.stopPropagation();
                  navigateTo("messages");
                }}
                onClick={() => navigateTo("guide-portfolio", guide.id)}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
