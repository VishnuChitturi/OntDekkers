"use client";

/**
 * OntDekker CommunityDetailView
 *
 * Community workspace. Navigated to from CommunitiesView via
 * navigateTo("community-detail", community.id).
 *
 * Structure (per 03-screen-specs.md § Community Workspace):
 *   CommunityHeader (banner, name, members, join button)
 *   Tabs: Feed | Expeditions | Members | About
 *     Feed        → StoryCards from community posts
 *     Expeditions → TripCards for community expeditions
 *     Members     → member list with avatars
 *     About       → description + rules stub
 *
 * Data (Service Layer — no direct Axios):
 *   useSWR(communityKeys.byId(id), swrFetcher)  → Community
 *   joinCommunity / leaveCommunity from api.ts
 *
 * Tabs use the Tabs component (CP24) with animated sliding indicator.
 * Mobile: overflow-x-auto scrollbar-none per design system.
 */

import React, { useState, useCallback } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Users, FileText, Compass, Info } from "lucide-react";

import CommunityHeader from "@/components/headers/CommunityHeader";
import Tabs from "@/components/navigation/Tabs";
import Avatar from "@/components/feedback/Avatar";
import Button from "@/components/feedback/Button";

import { swrFetcher, communityKeys } from "@/services/cache";
import { joinCommunity, leaveCommunity } from "@/services/api";

import { useRouter } from "@/router/Router";
import { useAppState } from "@/contexts/AppStateProvider";
import { useToast } from "@/hooks/useToast";

import type { Community } from "@/types";
import type { TabItem } from "@/components/navigation/Tabs";

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

const TABS: TabItem[] = [
  { id: "feed",        label: "Feed",        icon: FileText },
  { id: "expeditions", label: "Expeditions", icon: Compass },
  { id: "members",     label: "Members",     icon: Users },
  { id: "about",       label: "About",       icon: Info },
];

// ---------------------------------------------------------------------------
// Tab content panels (stubs with placeholder — real content in later CPs)
// ---------------------------------------------------------------------------

function TabPlaceholder({ label }: { label: string }) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-16 text-center space-y-3"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <p className="text-xs font-mono uppercase tracking-widest text-muted-slate">
        {label}
      </p>
      <p className="text-sm text-charcoal max-w-xs">
        This section will be populated with community {label.toLowerCase()} content.
      </p>
    </motion.div>
  );
}

function MembersTab({ community }: { community: Community }) {
  return (
    <motion.div
      className="py-6 space-y-3"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <p className="text-xs font-mono uppercase tracking-wider text-muted-slate">
        {community.membersCount.toLocaleString()} Members
      </p>
      {/* Placeholder member rows — real member list requires member endpoint */}
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
          <Avatar src={null} alt={`Member ${i + 1}`} size="sm" />
          <div className="space-y-1">
            <div className="h-3 w-24 rounded-full bg-gray-100" />
            <div className="h-2.5 w-16 rounded-full bg-gray-100" />
          </div>
        </div>
      ))}
    </motion.div>
  );
}

function AboutTab({ community }: { community: Community }) {
  return (
    <motion.div
      className="py-6 space-y-5"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {community.description && (
        <div className="space-y-2">
          <h3 className="text-xs font-mono uppercase tracking-wider text-muted-slate">About</h3>
          <p className="text-sm text-charcoal leading-relaxed">{community.description}</p>
        </div>
      )}
      <div className="space-y-2">
        <h3 className="text-xs font-mono uppercase tracking-wider text-muted-slate">Details</h3>
        <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-2 text-sm text-charcoal">
          <div className="flex justify-between">
            <span className="text-muted-slate">Members</span>
            <span className="font-mono font-medium text-ink">{community.membersCount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-slate">Visibility</span>
            <span className="font-mono font-medium text-ink capitalize">
              {community.isPublic ? "Public" : "Private"}
            </span>
          </div>
          {community.location && (
            <div className="flex justify-between">
              <span className="text-muted-slate">Location</span>
              <span className="font-mono font-medium text-ink">{community.location}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function DetailSkeleton() {
  return (
    <div className="pb-20">
      <motion.div
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden="true"
      >
        {/* Banner */}
        <div className="aspect-video w-full bg-gray-100" />
        {/* Header content */}
        <div className="container-main pt-5 space-y-3">
          <div className="h-6 w-48 rounded-full bg-gray-100" />
          <div className="h-3 w-32 rounded-full bg-gray-100" />
          <div className="h-3 w-full rounded-full bg-gray-100" />
          <div className="h-3 w-4/5 rounded-full bg-gray-100" />
        </div>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

function DetailError({ onBack }: { onBack: () => void }) {
  return (
    <div className="container-main py-16 flex flex-col items-center gap-4 text-center">
      <p className="text-sm font-semibold text-ink">Could not load community.</p>
      <p className="text-xs text-muted-slate">The community may not exist or there was a network error.</p>
      <Button variant="outline" size="sm" icon={ArrowLeft} onClick={onBack}>Go back</Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CommunityDetailView
// ---------------------------------------------------------------------------

export default function CommunityDetailView() {
  const { currentId, goBack } = useRouter();
  const { state, dispatch } = useAppState();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState("feed");

  const communityId = currentId ?? "";

  // ── SWR ───────────────────────────────────────────────────────────────────
  const { data: community, error, isLoading } = useSWR<Community>(
    communityId ? communityKeys.byId(communityId) : null,
    swrFetcher,
    { revalidateOnFocus: false },
  );

  // Determine join state from AppState (optimistic) or SWR
  const isJoined =
    state.joinedCommunities.some((c) => c.id === communityId) ||
    community?.isMember === true;

  // ── Join / Leave ───────────────────────────────────────────────────────────
  const handleJoinToggle = useCallback(async () => {
    if (!community) return;
    dispatch({ type: "COMMUNITY_JOIN_TOGGLED", communityId, joined: !isJoined });
    try {
      if (isJoined) {
        await leaveCommunity(communityId);
        showToast(`Left ${community.name}.`, "info");
      } else {
        await joinCommunity(communityId);
        showToast(`Joined ${community.name}!`, "success");
      }
    } catch {
      dispatch({ type: "COMMUNITY_JOIN_TOGGLED", communityId, joined: isJoined });
      showToast("Could not update membership. Please try again.", "error");
    }
  }, [community, communityId, dispatch, isJoined, showToast]);

  // ── States ─────────────────────────────────────────────────────────────────
  if (!communityId) return <DetailError onBack={goBack} />;
  if (isLoading) return <DetailSkeleton />;
  if (error || !community) return <DetailError onBack={goBack} />;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <motion.div
      className="pb-20"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
    >
      {/* Back button */}
      <div className="container-main pt-6 pb-2">
        <button
          type="button"
          aria-label="Go back"
          onClick={goBack}
          className="
            flex items-center gap-1.5 text-xs text-muted-slate
            hover:text-ink transition-colors duration-[var(--duration-responsive)]
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink
          "
        >
          <ArrowLeft size={14} strokeWidth={2} aria-hidden="true" />
          Back
        </button>
      </div>

      {/* Community header */}
      <div className="container-main">
        <CommunityHeader
          community={community}
          isJoined={isJoined}
          onJoinToggle={handleJoinToggle}
        />
      </div>

      {/* Tabs — sticky below header */}
      <div className="container-main mt-6">
        <Tabs
          tabs={TABS}
          activeTabId={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* Tab content */}
      <div className="container-main mt-5">
        <AnimatePresence mode="wait">
          {activeTab === "feed" && (
            <TabPlaceholder key="feed" label="Feed" />
          )}
          {activeTab === "expeditions" && (
            <TabPlaceholder key="expeditions" label="Expeditions" />
          )}
          {activeTab === "members" && (
            <MembersTab key="members" community={community} />
          )}
          {activeTab === "about" && (
            <AboutTab key="about" community={community} />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
