"use client";

/**
 * OntDekker GlobalSearch
 *
 * Full-screen search overlay triggered by the search icon in the Navbar.
 * Searches across guides, communities, and expeditions client-side against
 * already-loaded AppState data. Wired to real API endpoints in Phase 2.
 *
 * Motion:
 *   Backdrop  : opacity 0 → 1  duration 150ms
 *   Panel     : y -12 → 0, opacity 0 → 1  duration 200ms decelerate
 *   Results   : stagger 40ms per item, opacity 0 → 1 y 4 → 0
 *
 * Accessibility:
 *   role="dialog" aria-modal aria-label
 *   Input auto-focused on open
 *   Escape closes
 *   Portal rendered to document.body
 */

import React, { useEffect, useRef, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { Search, X, Compass, Users, Map } from "lucide-react";
import Avatar from "@/components/feedback/Avatar";
import { VerificationBadge } from "@/components/feedback/Badge";
import { useAppState } from "@/contexts/AppStateProvider";
import { useRouter } from "@/router/Router";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SearchResult {
  id: string;
  type: "guide" | "community" | "expedition";
  title: string;
  subtitle: string;
  avatarUrl: string | null;
  isVerified?: boolean;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Result row
// ---------------------------------------------------------------------------

function ResultRow({
  result,
  index,
  onSelect,
}: {
  result: SearchResult;
  index: number;
  onSelect: (result: SearchResult) => void;
}) {
  const Icon =
    result.type === "guide"
      ? Compass
      : result.type === "community"
        ? Users
        : Map;

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(result)}
      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-[var(--duration-responsive)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.2 }}
    >
      {result.avatarUrl ? (
        <Avatar src={result.avatarUrl} alt={result.title} size="sm" className="shrink-0" />
      ) : (
        <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
          <Icon size={14} strokeWidth={1.75} className="text-muted-slate" aria-hidden="true" />
        </span>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-ink truncate">{result.title}</span>
          {result.isVerified && <VerificationBadge size="sm" />}
        </div>
        <p className="text-xs text-muted-slate truncate mt-0.5">{result.subtitle}</p>
      </div>
      <span className="text-[10px] font-mono uppercase tracking-wider text-muted-slate shrink-0 bg-gray-100 px-2 py-0.5 rounded-full">
        {result.type}
      </span>
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// GlobalSearch
// ---------------------------------------------------------------------------

export default function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const { state } = useAppState();
  const { navigateTo } = useRouter();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  // Escape to close
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  // Build results from AppState
  const results: SearchResult[] = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const guides: SearchResult[] = state.savedGuides
      .filter(
        (g) =>
          g.displayName.toLowerCase().includes(q) ||
          (g.bio ?? "").toLowerCase().includes(q),
      )
      .slice(0, 4)
      .map((g) => ({
        id: g.id,
        type: "guide",
        title: g.displayName,
        subtitle:
          g.locations.length > 0
            ? g.locations.map((l) => l.country).join(", ")
            : "Guide",
        avatarUrl: g.profileImageUrl,
        isVerified: g.verificationStatus === "VERIFIED",
      }));

    const communities: SearchResult[] = [
      ...state.joinedCommunities,
      ...state.suggestedCommunities,
    ]
      .filter(
        (c, i, arr) => arr.findIndex((x) => x.id === c.id) === i, // dedup
      )
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q),
      )
      .slice(0, 4)
      .map((c) => ({
        id: c.id,
        type: "community",
        title: c.name,
        subtitle: c.location ?? `${c.membersCount} members`,
        avatarUrl: c.avatarUrl,
      }));

    const expeditions: SearchResult[] = state.myExpeditions
      .filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.destination.toLowerCase().includes(q),
      )
      .slice(0, 4)
      .map((e) => ({
        id: e.id,
        type: "expedition",
        title: e.title,
        subtitle: e.destination,
        avatarUrl: e.coverImageUrl,
      }));

    return [...guides, ...communities, ...expeditions].slice(0, 8);
  }, [query, state]);

  function handleSelect(result: SearchResult) {
    onClose();
    if (result.type === "guide") navigateTo("guide-portfolio", result.id);
    else if (result.type === "community") navigateTo("community-detail", result.id);
    else navigateTo("expedition-workspace", result.id);
  }

  if (typeof window === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[55] flex items-start justify-center px-4 pt-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onKeyDown={handleKeyDown}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            aria-hidden="true"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Global search"
            className="relative z-10 w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
              <Search size={17} strokeWidth={1.75} className="text-muted-slate shrink-0" aria-hidden="true" />
              <input
                ref={inputRef}
                type="search"
                placeholder="Search guides, communities, expeditions…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 text-sm text-ink bg-transparent focus:outline-none placeholder:text-muted-slate"
                aria-label="Search"
              />
              {query && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setQuery("")}
                  className="text-muted-slate hover:text-ink transition-colors"
                >
                  <X size={15} strokeWidth={2} aria-hidden="true" />
                </button>
              )}
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto">
              {query.trim() === "" ? (
                <div className="flex flex-col items-center py-10 gap-2 text-center">
                  <Search size={28} strokeWidth={1} className="text-gray-200" aria-hidden="true" />
                  <p className="text-sm text-muted-slate">
                    Search for guides, communities, or expeditions.
                  </p>
                </div>
              ) : results.length === 0 ? (
                <div className="flex flex-col items-center py-10 gap-2 text-center">
                  <p className="text-sm text-charcoal">
                    No results for &ldquo;{query}&rdquo;
                  </p>
                  <p className="text-xs text-muted-slate">
                    Try a different search term.
                  </p>
                </div>
              ) : (
                <div role="list" aria-label="Search results">
                  {results.map((result, i) => (
                    <div key={result.id} role="listitem">
                      <ResultRow result={result} index={i} onSelect={handleSelect} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
