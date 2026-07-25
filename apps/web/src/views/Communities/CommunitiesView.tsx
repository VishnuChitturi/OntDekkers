"use client";

/**
 * OntDekker CommunitiesView
 *
 * Community discovery directory. Entry from Sidebar "Communities".
 *
 * Layout: search header + 3-column responsive CommunityCard grid
 * States: loading / empty / error / success
 *
 * Data (Service Layer only):
 *   useSWR(communityKeys.list(params), swrFetcherWithParams)
 *   joinCommunity / leaveCommunity from api.ts
 *   dispatch COMMUNITY_JOIN_TOGGLED for optimistic update
 *
 * Navigation: card click → navigateTo("community-detail", community.id)
 */

import React, { useState, useCallback, useMemo } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "motion/react";
import { Users, RefreshCw } from "lucide-react";

import CommunityCard from "@/components/cards/CommunityCard";
import Button from "@/components/feedback/Button";
import Search from "@/components/navigation/Search";

import { swrFetcherWithParams, communityKeys } from "@/services/cache";
import { joinCommunity, leaveCommunity } from "@/services/api";

import { useRouter } from "@/router/Router";
import { useAppState } from "@/contexts/AppStateProvider";
import { useToast } from "@/hooks/useToast";

import CommunityCardSkeleton from "./CommunityCardSkeleton";

import type { Community, PaginatedResponse } from "@/types";

// ---------------------------------------------------------------------------
// Empty + Error states
// ---------------------------------------------------------------------------

function EmptyCommunities() {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-20 text-center space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <Users size={40} strokeWidth={1} className="text-gray-200" aria-hidden="true" />
      <div className="space-y-1">
        <p className="text-sm font-semibold text-ink">No communities found.</p>
        <p className="text-xs text-muted-slate max-w-xs">
          Try a different search term or check back later for new communities.
        </p>
      </div>
    </motion.div>
  );
}

function ErrorBanner({ onRetry }: { onRetry: () => void }) {
  return (
    <motion.div
      className="flex items-center justify-between gap-4 bg-red-50 border border-red-100 rounded-2xl px-5 py-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      role="alert"
    >
      <p className="text-sm text-red-700">Unable to load communities. Please try again.</p>
      <Button variant="outline" size="sm" icon={RefreshCw} onClick={onRetry}>Retry</Button>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// CommunitiesView
// ---------------------------------------------------------------------------

export default function CommunitiesView() {
  const { navigateTo } = useRouter();
  const { state, dispatch } = useAppState();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");

  const params = useMemo(() => ({ page_size: 18 }), []);

  // ── SWR ───────────────────────────────────────────────────────────────────
  const { data, error, isLoading, mutate } = useSWR<PaginatedResponse<Community>>(
    communityKeys.list(params),
    ([url, p]: [string, Record<string, unknown>]) => swrFetcherWithParams(url, p),
    { revalidateOnFocus: false },
  );

  // Client-side search
  const communities = useMemo(() => {
    const all = data?.items ?? [];
    if (!searchQuery.trim()) return all;
    const q = searchQuery.toLowerCase();
    return all.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.location?.toLowerCase().includes(q),
    );
  }, [data?.items, searchQuery]);

  // ── Join / Leave ───────────────────────────────────────────────────────────
  const handleJoinToggle = useCallback(
    async (e: React.MouseEvent, community: Community) => {
      e.stopPropagation();
      const wasJoined = community.isMember;
      // Optimistic update
      dispatch({ type: "COMMUNITY_JOIN_TOGGLED", communityId: community.id, joined: !wasJoined });
      try {
        if (wasJoined) {
          await leaveCommunity(community.id);
          showToast(`Left ${community.name}.`, "info");
        } else {
          await joinCommunity(community.id);
          showToast(`Joined ${community.name}!`, "success");
        }
        mutate();
      } catch {
        // Roll back
        dispatch({ type: "COMMUNITY_JOIN_TOGGLED", communityId: community.id, joined: wasJoined });
        showToast("Could not update membership. Please try again.", "error");
      }
    },
    [dispatch, mutate, showToast],
  );

  // Determine join state — prefer AppState over SWR data
  function isJoined(communityId: string): boolean {
    return (
      communities.find((c) => c.id === communityId)?.isMember ??
      state.joinedCommunities.some((c) => c.id === communityId)
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <motion.div
      className="container-main py-8 space-y-6 pb-20"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
    >
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Communities</h1>
        <p className="text-sm text-charcoal">
          Join location-based groups and plan expeditions together.
        </p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <Search
          placeholder="Search communities…"
          value={searchQuery}
          onChange={setSearchQuery}
          className="max-w-sm"
          ariaLabel="Search communities"
        />
        {data && (
          <span className="text-[10px] font-mono text-muted-slate ml-auto">
            {communities.length} of {data.pagination.total}
          </span>
        )}
      </div>

      {/* Grid — all states */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <CommunityCardSkeleton key="skeleton" count={6} />
        ) : error ? (
          <ErrorBanner key="error" onRetry={() => mutate()} />
        ) : communities.length === 0 ? (
          <EmptyCommunities key="empty" />
        ) : (
          <div
            key="communities"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {communities.map((community, index) => (
              <CommunityCard
                key={community.id}
                community={community}
                isJoined={isJoined(community.id)}
                index={index}
                onJoinToggle={(e) => handleJoinToggle(e, community)}
                onClick={() => navigateTo("community-detail", community.id)}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
