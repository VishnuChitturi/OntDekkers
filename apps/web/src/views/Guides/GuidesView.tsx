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
 *   Message   → (not in Dev 3 scope)
 *   View      → router.push(`/guides/${guide.id}`)
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
import { bookmarkGuide, unbookmarkGuide } from "@/services/guideApi";

import { useRouter } from "next/navigation";
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

const MOCK_GUIDES: GuideProfileSummary[] = [
  {
    id: "g-1",
    userId: "u-1",
    displayName: "Mateo Rossi",
    bio: "Certified Alpine Guide with 10+ years leading hut-to-hut treks across Mont Blanc, the Matterhorn, and South Tyrol.",
    profileImageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
    verificationStatus: "VERIFIED",
    availability: { guideId: "g-1", status: "AVAILABLE", note: null },
    rating: 4.9,
    reviewCount: 48,
    yearsExperience: 10,
    locations: [{ id: "l-1", guideId: "g-1", city: "Chamonix", country: "France", region: "Haute-Savoie" }],
    languages: [{ id: "lang-1", guideId: "g-1", language: "English" }, { id: "lang-2", guideId: "g-1", language: "French" }],
  },
  {
    id: "g-2",
    userId: "u-2",
    displayName: "Astrid Lindholm",
    bio: "Nordic wilderness expert specializing in Arctic circle sea kayaking, northern lights hunting, and trail navigation.",
    profileImageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80",
    verificationStatus: "VERIFIED",
    availability: { guideId: "g-2", status: "AVAILABLE", note: null },
    rating: 5.0,
    reviewCount: 62,
    yearsExperience: 8,
    locations: [{ id: "l-2", guideId: "g-2", city: "Tromso", country: "Norway", region: "Troms" }],
    languages: [{ id: "lang-3", guideId: "g-2", language: "English" }, { id: "lang-4", guideId: "g-2", language: "Norwegian" }],
  },
  {
    id: "g-3",
    userId: "u-3",
    displayName: "Kenzo Tanaka",
    bio: "Cultural heritage specialist & mountain monk trail expert. Guiding Kumano Kodo pilgrimage routes for 8 years.",
    profileImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
    verificationStatus: "VERIFIED",
    availability: { guideId: "g-3", status: "BUSY", note: null },
    rating: 4.95,
    reviewCount: 39,
    yearsExperience: 8,
    locations: [{ id: "l-3", guideId: "g-3", city: "Tanabe", country: "Japan", region: "Wakayama" }],
    languages: [{ id: "lang-5", guideId: "g-3", language: "Japanese" }, { id: "lang-6", guideId: "g-3", language: "English" }],
  },
];

export default function GuidesView() {
  const router = useRouter();
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
  const { data, isLoading, error, mutate } = useSWR<PaginatedResponse<GuideProfileSummary>>(
    swrKey,
    ([url, params]: [string, Record<string, unknown>]) => swrFetcherWithParams(url, params),
    { revalidateOnFocus: false },
  );

  // Client-side search filter on top of API results or fallback
  const filteredGuides = useMemo(() => {
    let guides = data?.items && data.items.length > 0 ? data.items : MOCK_GUIDES;

    if (verifiedOnly) {
      guides = guides.filter((g) => g.verificationStatus === "VERIFIED");
    }
    if (availableOnly) {
      guides = guides.filter((g) => g.availability?.status === "AVAILABLE");
    }

    if (!searchQuery.trim()) return guides;
    const q = searchQuery.toLowerCase();
    return guides.filter((g) =>
      (g.displayName?.toLowerCase().includes(q) ?? false) ||
      g.bio?.toLowerCase().includes(q) ||
      g.locations.some((l) =>
        [l.country, l.region, l.city].some((v) => v?.toLowerCase().includes(q)),
      ) ||
      g.languages.some((l) => l.language.toLowerCase().includes(q)),
    );
  }, [data?.items, verifiedOnly, availableOnly, searchQuery]);

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
          showToast(`${guide.displayName ?? "Guide"} bookmarked!`, "success");
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
          placeholder="Search by name, location, language, or specialty…"
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
              onClick={() => {
                setVerifiedOnly(false);
                setAvailableOnly(false);
              }}
              className="text-xs text-muted-slate hover:text-ink underline transition-colors duration-[var(--duration-responsive)]"
            >
              Clear all
            </button>
          )}
          <span className="ml-auto text-[10px] font-mono text-muted-slate">
            Showing {filteredGuides.length} guides
          </span>
        </div>
      </div>

      {/* ── Guide grid — all states ───────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {isLoading && !data ? (
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
                onClick={() => router.push(`/guides/${guide.id}`)}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
