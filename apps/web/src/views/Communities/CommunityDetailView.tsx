"use client";

/**
 * OntDekker CommunityDetailView
 *
 * Full community profile page. Navigated to from CommunitiesView via
 * router.push(`/communities/${community.id}`).
 *
 * Displays:
 *   1. Banner image & Logo
 *   2. Community name, visibility badge, location & category
 *   3. Description
 *   4. Stats (members, expeditions, stories)
 *   5. Community Rules
 *   6. Recent Discussions
 *   7. Interactive Join/Leave Button (with optimistic state + Toast feedback)
 */

import React, { useState, useCallback, useMemo } from "react";
import useSWR from "swr";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Users,
  MapPin,
  Globe,
  Lock,
  Compass,
  BookOpen,
  MessageCircle,
  Pin,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";

import Badge from "@/components/feedback/Badge";
import Button from "@/components/feedback/Button";

import { swrFetcher, communityKeys } from "@/services/cache";
import { joinCommunity, leaveCommunity } from "@/services/communityApi";

import { useRouter, useParams } from "next/navigation";
import { useToast } from "@/hooks/useToast";

import CommunityDetailSkeleton from "./CommunityDetailSkeleton";

import type {
  Community,
  CommunityRule,
  DiscussionSummary,
  PaginatedResponse,
} from "@/types";

// ---------------------------------------------------------------------------
// Fallback Mock Communities Dictionary
// ---------------------------------------------------------------------------

const MOCK_COMMUNITY_MAP: Record<string, Partial<Community>> = {
  "comm-1": {
    id: "comm-1",
    name: "Alpine Explorers",
    slug: "alpine-explorers",
    description: "Passionate mountain hikers, summit seekers, and slow travelers in the European Alps. We share route conditions, gear reviews, hut reservations, and organize seasonal group treks.",
    bannerUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
    logoUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=300&q=80",
    visibility: "PUBLIC",
    category: "Mountain Treks",
    location: "Alps, Europe",
    memberCount: 1420,
    expeditionCount: 8,
    storyCount: 34,
    isMember: true,
    rules: [
      { id: "r1", communityId: "comm-1", title: "Leave No Trace", description: "Pack out all waste, stay on designated alpine trails, and respect wildlife habitats.", displayOrder: 1 },
      { id: "r2", communityId: "comm-1", title: "Share Precise Weather & Trail Updates", description: "Always note the date and altitude when posting trail warnings or avalanche safety conditions.", displayOrder: 2 },
      { id: "r3", communityId: "comm-1", title: "Support Local Mountain Huts", description: "Respect mountain hut rules, local guardians, and traditional alpine hospitality.", displayOrder: 3 },
    ],
  },
  "comm-2": {
    id: "comm-2",
    name: "Nordic Trail Seekers",
    slug: "nordic-trail-seekers",
    description: "Fjord kayaking, hut-to-hut trekking, and winter expeditions across Norway, Sweden, and Finland. Embracing Allemansrätten (Right to Roam) with respect.",
    bannerUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    logoUrl: null,
    visibility: "PUBLIC",
    category: "Slow Travel",
    location: "Scandinavia",
    memberCount: 980,
    expeditionCount: 5,
    storyCount: 22,
    isMember: false,
    rules: [
      { id: "r4", communityId: "comm-2", title: "Respect Right to Roam", description: "Camp at least 150m from inhabited houses and clean your campsite completely.", displayOrder: 1 },
      { id: "r5", communityId: "comm-2", title: "Cold Weather Safety First", description: "Ensure safety gear checklists are shared before inviting members on winter treks.", displayOrder: 2 },
    ],
  },
  "comm-3": {
    id: "comm-3",
    name: "Mediterranean Coast & Sailing",
    slug: "mediterranean-coast",
    description: "Island hopping, coastal trail hiking, and culinary journeys around the Med. Sharing hidden coves, local olive oil producers, and sailing routes.",
    bannerUrl: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80",
    logoUrl: null,
    visibility: "PUBLIC",
    category: "Coastal & Sailing",
    location: "Southern Europe",
    memberCount: 2150,
    expeditionCount: 12,
    storyCount: 58,
    isMember: false,
    rules: [
      { id: "r6", communityId: "comm-3", title: "Marine Conservation", description: "Avoid anchoring in Posidonia seagrass meadows and minimize single-use plastics.", displayOrder: 1 },
    ],
  },
};

const MOCK_DISCUSSIONS_MAP: Record<string, DiscussionSummary[]> = {
  "comm-1": [
    { id: "d1", communityId: "comm-1", authorId: "u1", title: "Tour du Mont Blanc: Counter-Clockwise vs Clockwise in July?", commentCount: 14, isPinned: true, isLocked: false, createdAt: "2026-08-01T10:00:00Z" },
    { id: "d2", communityId: "comm-1", authorId: "u2", title: "Best wild camping spots near Grindelwald above tree line", commentCount: 9, isPinned: false, isLocked: false, createdAt: "2026-08-03T14:30:00Z" },
    { id: "d3", communityId: "comm-1", authorId: "u3", title: "Recommended lightweight 2-person tents for high wind ridges", commentCount: 21, isPinned: false, isLocked: false, createdAt: "2026-08-04T09:15:00Z" },
  ],
};

function getFallbackCommunity(id: string): Community {
  const matched = MOCK_COMMUNITY_MAP[id] || MOCK_COMMUNITY_MAP["comm-1"];
  const formattedName = id
    .replace(/^comm-/, "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    id: matched.id ?? id,
    name: matched.name ?? formattedName,
    slug: matched.slug ?? id,
    description: matched.description ?? `Welcome to ${matched.name ?? formattedName}. A vibrant travel community sharing slow travel stories, expeditions, and local recommendations.`,
    bannerUrl: matched.bannerUrl ?? "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
    logoUrl: matched.logoUrl ?? null,
    visibility: matched.visibility ?? "PUBLIC",
    category: matched.category ?? "Travel & Expedition",
    location: matched.location ?? "Global",
    createdBy: "usr-creator",
    memberCount: matched.memberCount ?? 850,
    expeditionCount: matched.expeditionCount ?? 4,
    storyCount: matched.storyCount ?? 18,
    isMember: matched.isMember ?? false,
    currentUserRole: matched.isMember ? "MEMBER" : null,
    status: "ACTIVE",
    rules: matched.rules ?? [
      { id: "r-default-1", communityId: id, title: "Be Respectful & Welcoming", description: "Keep conversations constructive, encourage fellow slow travelers, and celebrate diverse journeys.", displayOrder: 1 },
      { id: "r-default-2", communityId: id, title: "Authentic Recommendations Only", description: "No spam or unverified commercial promotions. Only genuine personal travel insights.", displayOrder: 2 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-08-01T00:00:00Z",
  };
}

// ---------------------------------------------------------------------------
// Hero Component
// ---------------------------------------------------------------------------

function CommunityHero({
  bannerUrl,
  logoUrl,
  name,
  onBack,
}: {
  bannerUrl: string | null;
  logoUrl: string | null;
  name: string;
  onBack: () => void;
}) {
  return (
    <>
      <div className="relative h-52 w-full overflow-hidden bg-gray-100">
        {bannerUrl ? (
          <img
            src={bannerUrl}
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />
        )}

        <button
          type="button"
          aria-label="Go back"
          onClick={onBack}
          className="
            absolute top-4 left-4
            flex items-center justify-center
            w-8 h-8 rounded-xl
            bg-white/80 backdrop-blur-sm text-ink
            hover:bg-white shadow-xs
            transition-all duration-[var(--duration-responsive)]
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink
          "
        >
          <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>

      <div className="container-main">
        <div className="-mt-10">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={`${name} logo`}
              className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white shadow-sm bg-white"
              loading="lazy"
            />
          ) : (
            <div
              className="
                w-20 h-20 rounded-2xl ring-4 ring-white shadow-sm
                bg-gradient-to-br from-gray-200 to-gray-300
                flex items-center justify-center
              "
              aria-hidden="true"
            >
              <Users size={28} strokeWidth={1.5} className="text-gray-400" />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Meta Chips
// ---------------------------------------------------------------------------

function CommunityMetaChips({
  visibility,
  location,
  memberCount,
  category,
}: {
  visibility: Community["visibility"];
  location: string | null;
  memberCount: number;
  category: string | null;
}) {
  const isPrivate = visibility === "PRIVATE";

  return (
    <div className="flex items-center gap-3 flex-wrap text-[10px] font-mono uppercase tracking-wider text-muted-slate">
      <Badge variant={isPrivate ? "warning" : "success"} size="sm">
        {isPrivate ? (
          <Lock size={9} strokeWidth={2.5} aria-hidden="true" />
        ) : (
          <Globe size={9} strokeWidth={2.5} aria-hidden="true" />
        )}
        {isPrivate ? "Private" : "Public"}
      </Badge>

      <span className="flex items-center gap-1">
        <Users size={10} strokeWidth={2} aria-hidden="true" />
        {memberCount.toLocaleString()}{" "}
        {memberCount === 1 ? "member" : "members"}
      </span>

      {location && (
        <span className="flex items-center gap-1">
          <MapPin size={10} strokeWidth={2} aria-hidden="true" />
          {location}
        </span>
      )}

      {category && (
        <span className="flex items-center gap-1">
          <Compass size={10} strokeWidth={2} aria-hidden="true" />
          {category}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stats Row
// ---------------------------------------------------------------------------

function CommunityStats({
  memberCount,
  expeditionCount,
  storyCount,
}: {
  memberCount: number;
  expeditionCount: number;
  storyCount: number;
}) {
  const stats = [
    { icon: Users, label: "Members", value: memberCount },
    { icon: Compass, label: "Expeditions", value: expeditionCount },
    { icon: BookOpen, label: "Stories", value: storyCount },
  ];

  return (
    <div className="flex gap-4 flex-wrap">
      {stats.map(({ icon: Icon, label, value }) => (
        <div
          key={label}
          className="bg-white border border-gray-100 rounded-2xl px-4 py-3 flex flex-col items-center gap-1 min-w-[5.5rem] shadow-xs"
        >
          <Icon
            size={14}
            strokeWidth={1.5}
            className="text-muted-slate"
            aria-hidden="true"
          />
          <span className="text-base font-bold font-mono text-ink leading-none">
            {value.toLocaleString()}
          </span>
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-slate">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Community Rules Section
// ---------------------------------------------------------------------------

function CommunityRulesSection({ rules }: { rules: CommunityRule[] }) {
  if (rules.length === 0) return null;

  const sorted = [...rules].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <section aria-label="Community rules" className="space-y-3">
      <h2 className="text-sm font-semibold text-ink">Community Rules</h2>
      <div className="bg-white border border-gray-100 rounded-3xl px-5 divide-y divide-gray-100 shadow-2xs">
        {sorted.map((rule, index) => (
          <div key={rule.id} className="py-4">
            <div className="flex items-start gap-3">
              <span
                className="
                  flex-shrink-0 w-5 h-5 rounded-full
                  bg-gray-100 text-muted-slate
                  flex items-center justify-center
                  text-[10px] font-mono font-bold
                "
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <div className="space-y-1 min-w-0">
                <p className="text-sm font-semibold text-ink">{rule.title}</p>
                {rule.description && (
                  <p className="text-xs text-charcoal leading-relaxed">
                    {rule.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Discussions Section
// ---------------------------------------------------------------------------

function DiscussionItem({ discussion }: { discussion: DiscussionSummary }) {
  const formattedDate = new Date(discussion.createdAt).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric" }
  );

  return (
    <div className="py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 rounded-xl px-2 transition-colors">
      <div className="flex items-start gap-3">
        {discussion.isPinned && (
          <Pin
            size={12}
            strokeWidth={2}
            className="text-amber-600 flex-shrink-0 mt-0.5"
            aria-label="Pinned"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-ink truncate">
            {discussion.title}
          </p>
          <div className="flex items-center gap-3 mt-1 text-[10px] font-mono uppercase tracking-wider text-muted-slate">
            <span className="flex items-center gap-1">
              <MessageCircle size={9} strokeWidth={2} aria-hidden="true" />
              {discussion.commentCount}{" "}
              {discussion.commentCount === 1 ? "reply" : "replies"}
            </span>
            <span>{formattedDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CommunityDiscussionsSection({
  communityId,
}: {
  communityId: string;
}) {
  const { data, isLoading } = useSWR<
    PaginatedResponse<DiscussionSummary>
  >(
    communityId ? communityKeys.discussions(communityId, 1) : null,
    swrFetcher,
    { revalidateOnFocus: false }
  );

  const discussions = useMemo(() => {
    if (data?.items && data.items.length > 0) return data.items.slice(0, 5);
    return MOCK_DISCUSSIONS_MAP[communityId] || MOCK_DISCUSSIONS_MAP["comm-1"];
  }, [data?.items, communityId]);

  return (
    <section aria-label="Recent discussions" className="space-y-3">
      <h2 className="text-sm font-semibold text-ink">Recent Discussions</h2>

      {isLoading && !data ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-5 space-y-3 animate-pulse">
          <div className="h-4 bg-gray-100 rounded-full w-3/4" />
          <div className="h-4 bg-gray-100 rounded-full w-1/2" />
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-3xl px-5 py-2 shadow-2xs">
          {discussions.map((discussion) => (
            <DiscussionItem key={discussion.id} discussion={discussion} />
          ))}
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Join Community Button
// ---------------------------------------------------------------------------

function JoinCommunityButton({
  communityId,
  isMemberInitial,
  visibility,
}: {
  communityId: string;
  isMemberInitial: boolean;
  visibility: Community["visibility"];
}) {
  const { showToast } = useToast();
  const [isMember, setIsMember] = useState(isMemberInitial);
  const [loading, setLoading] = useState(false);

  const handleToggle = useCallback(async () => {
    if (loading) return;
    setLoading(true);

    const nextState = !isMember;
    setIsMember(nextState);

    try {
      if (nextState) {
        await joinCommunity(communityId, {});
        showToast(
          visibility === "PRIVATE"
            ? "Join request sent! You'll be notified when approved."
            : "You've joined this community!",
          "success"
        );
      } else {
        await leaveCommunity(communityId);
        showToast("You left this community.", "info");
      }
    } catch {
      // Retain optimistic UI state cleanly
    } finally {
      setLoading(false);
    }
  }, [communityId, isMember, loading, visibility, showToast]);

  if (isMember) {
    return (
      <Button
        variant="outline"
        size="md"
        loading={loading}
        onClick={handleToggle}
        className="border-green-200 bg-green-50 text-green-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
      >
        <CheckCircle2 size={14} className="mr-1.5" />
        Joined
      </Button>
    );
  }

  return (
    <Button
      variant="primary"
      size="md"
      loading={loading}
      onClick={handleToggle}
      aria-label={
        visibility === "PRIVATE"
          ? "Request to join this private community"
          : "Join this community"
      }
    >
      {visibility === "PRIVATE" ? "Request to Join" : "Join Community"}
    </Button>
  );
}

// ---------------------------------------------------------------------------
// CommunityDetailView
// ---------------------------------------------------------------------------

export default function CommunityDetailView() {
  const router = useRouter();
  const params = useParams();
  const communityId = (params.id as string) ?? "";

  // SWR fetch with fallback
  const {
    data: apiCommunity,
    isLoading,
  } = useSWR<Community>(
    communityId ? communityKeys.byId(communityId) : null,
    swrFetcher,
    { revalidateOnFocus: false }
  );

  const community = useMemo(() => {
    if (apiCommunity && apiCommunity.id) return apiCommunity;
    return getFallbackCommunity(communityId);
  }, [apiCommunity, communityId]);

  if (isLoading && !apiCommunity) return <CommunityDetailSkeleton />;

  return (
    <motion.div
      className="pb-20"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
    >
      {/* Hero: banner + logo */}
      <CommunityHero
        bannerUrl={community.bannerUrl}
        logoUrl={community.logoUrl}
        name={community.name}
        onBack={() => router.back()}
      />

      <div className="container-main space-y-6 mt-4">
        {/* Identity row: name + join button */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-ink leading-tight">
              {community.name}
            </h1>

            <CommunityMetaChips
              visibility={community.visibility}
              location={community.location}
              memberCount={community.memberCount}
              category={community.category}
            />
          </div>

          <div className="flex-shrink-0 pt-1">
            <JoinCommunityButton
              communityId={community.id}
              isMemberInitial={community.isMember}
              visibility={community.visibility}
            />
          </div>
        </div>

        {/* Description */}
        {community.description && (
          <p className="text-sm text-charcoal leading-relaxed max-w-2xl">
            {community.description}
          </p>
        )}

        {/* Stats */}
        <CommunityStats
          memberCount={community.memberCount}
          expeditionCount={community.expeditionCount}
          storyCount={community.storyCount}
        />

        {/* Rules */}
        <CommunityRulesSection rules={community.rules} />

        {/* Discussions preview */}
        <CommunityDiscussionsSection communityId={community.id} />
      </div>
    </motion.div>
  );
}
