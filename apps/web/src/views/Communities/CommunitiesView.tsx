"use client";

/**
 * OntDekker CommunitiesView
 *
 * Community discovery directory. Entry from Sidebar "Communities" item.
 * Displays community cards, categories, member counts, and search filters.
 */

import React, { useState, useMemo } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "motion/react";
import { Globe, Lock } from "lucide-react";

import CommunityCard from "@/components/cards/CommunityCard";
import Search from "@/components/navigation/Search";
import { swrFetcherWithParams, communityKeys } from "@/services/cache";
import { useRouter } from "next/navigation";
import CommunityCardSkeleton from "./CommunityCardSkeleton";
import type { CommunitySummary, PaginatedResponse } from "@/types";

// ---------------------------------------------------------------------------
// Filter Chip
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
        "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-medium",
        "transition-all duration-150",
        active
          ? "bg-[#111111] text-white border-[#111111]"
          : "bg-white text-gray-700 border-[#EAE7DF] hover:border-gray-300 hover:bg-gray-50",
      ].join(" ")}
    >
      <Icon size={12} strokeWidth={2} aria-hidden="true" />
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// CommunitiesView
// ---------------------------------------------------------------------------

export default function CommunitiesView() {
  const router = useRouter();

  // Search + filters
  const [searchQuery, setSearchQuery] = useState("");
  const [publicOnly, setPublicOnly] = useState(false);
  const [privateOnly, setPrivateOnly] = useState(false);

  const filters = useMemo(() => ({
    ...(publicOnly ? { visibility: "PUBLIC" } : {}),
    ...(privateOnly ? { visibility: "PRIVATE" } : {}),
    page_size: 18,
  }), [publicOnly, privateOnly]);

  const hasActiveFilters = publicOnly || privateOnly;

  // SWR
  const swrKey = communityKeys.list(filters);
  const { data, isLoading } = useSWR<PaginatedResponse<CommunitySummary>>(
    swrKey,
    ([url, params]: [string, Record<string, unknown>]) =>
      swrFetcherWithParams(url, params),
    { revalidateOnFocus: false }
  );

  // Filter API results — no mock fallback
  const filteredCommunities = useMemo(() => {
    let list: CommunitySummary[] = data?.items ?? [];

    if (publicOnly) {
      list = list.filter((c) => c.visibility === "PUBLIC");
    } else if (privateOnly) {
      list = list.filter((c) => c.visibility === "PRIVATE");
    }

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.description?.toLowerCase().includes(q) ?? false) ||
        (c.category?.toLowerCase().includes(q) ?? false) ||
        (c.location?.toLowerCase().includes(q) ?? false)
    );
  }, [data?.items, publicOnly, privateOnly, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-[#111111]">
          Communities
        </h1>
        <p className="text-sm text-gray-500">
          Discover and join niche travel communities on OntDekker.
        </p>
      </div>

      {/* Search + filters */}
      <div className="space-y-3">
        <Search
          placeholder="Search by name, category, or location…"
          value={searchQuery}
          onChange={setSearchQuery}
          className="max-w-md"
          ariaLabel="Search communities"
        />

        <div className="flex items-center gap-2 flex-wrap">
          <FilterChip
            label="Public Only"
            icon={Globe}
            active={publicOnly}
            onToggle={() => {
              setPublicOnly((v) => !v);
              setPrivateOnly(false);
            }}
          />
          <FilterChip
            label="Private Only"
            icon={Lock}
            active={privateOnly}
            onToggle={() => {
              setPrivateOnly((v) => !v);
              setPublicOnly(false);
            }}
          />
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setPublicOnly(false);
                setPrivateOnly(false);
              }}
              className="text-xs text-gray-500 hover:text-[#111111] underline transition-colors"
            >
              Clear all
            </button>
          )}
          <span className="ml-auto text-xs text-gray-400 font-medium">
            Showing {filteredCommunities.length} communities
          </span>
        </div>
      </div>

      {/* Community grid */}
      <AnimatePresence mode="wait">
        {isLoading && !data ? (
          <CommunityCardSkeleton key="skeleton" count={6} />
        ) : (
          <div
            key="communities"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {filteredCommunities.map((community, index) => (
              <CommunityCard
                key={community.id}
                community={community}
                index={index}
                onClick={() => router.push(`/communities/${community.id}`)}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
