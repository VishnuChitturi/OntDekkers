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
// Realistic Mock Fallback Communities
// ---------------------------------------------------------------------------

const MOCK_COMMUNITIES: CommunitySummary[] = [
  {
    id: "comm-1",
    name: "Alpine Explorers",
    slug: "alpine-explorers",
    description: "Passionate mountain hikers, summit seekers, and slow travelers in the European Alps.",
    bannerUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80",
    logoUrl: null,
    visibility: "PUBLIC",
    category: "Mountain Treks",
    location: "Alps, Europe",
    memberCount: 1420,
    expeditionCount: 8,
    isMember: true,
    status: "ACTIVE",
  },
  {
    id: "comm-2",
    name: "Nordic Trail Seekers",
    slug: "nordic-trail-seekers",
    description: "Fjord kayaking, hut-to-hut trekking, and winter expeditions across Norway and Sweden.",
    bannerUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    logoUrl: null,
    visibility: "PUBLIC",
    category: "Slow Travel",
    location: "Scandinavia",
    memberCount: 980,
    expeditionCount: 5,
    isMember: false,
    status: "ACTIVE",
  },
  {
    id: "comm-3",
    name: "Mediterranean Coast & Sailing",
    slug: "mediterranean-coast",
    description: "Island hopping, coastal trail hiking, and culinary journeys around the Med.",
    bannerUrl: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80",
    logoUrl: null,
    visibility: "PUBLIC",
    category: "Coastal & Sailing",
    location: "Southern Europe",
    memberCount: 2150,
    expeditionCount: 12,
    isMember: false,
    status: "ACTIVE",
  },
  {
    id: "comm-4",
    name: "Sahara & Oasis Society",
    slug: "sahara-oasis-society",
    description: "Desert expeditions, stargazing encampments, and Berber cultural exchanges.",
    bannerUrl: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80",
    logoUrl: null,
    visibility: "PRIVATE",
    category: "Desert Treks",
    location: "North Africa",
    memberCount: 540,
    expeditionCount: 3,
    isMember: false,
    status: "ACTIVE",
  },
  {
    id: "comm-5",
    name: "Kyoto Cultural Heritage",
    slug: "kyoto-heritage",
    description: "Exploring ancient temples, traditional tea farms, and hidden alleyways of Kansai.",
    bannerUrl: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80",
    logoUrl: null,
    visibility: "PUBLIC",
    category: "Cultural Immersion",
    location: "Kyoto, Japan",
    memberCount: 1890,
    expeditionCount: 7,
    isMember: true,
    status: "ACTIVE",
  },
  {
    id: "comm-6",
    name: "Patagonia Wilderness Club",
    slug: "patagonia-wilderness",
    description: "Torres del Paine W-Trek, glacier kayaking, and remote camping in southern Chile & Argentina.",
    bannerUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80",
    logoUrl: null,
    visibility: "PUBLIC",
    category: "Backpacking",
    location: "Patagonia, South America",
    memberCount: 760,
    expeditionCount: 4,
    isMember: false,
    status: "ACTIVE",
  },
];

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

  // Combine API results with fallback mock communities
  const filteredCommunities = useMemo(() => {
    let list = data?.items && data.items.length > 0 ? data.items : MOCK_COMMUNITIES;

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
