"use client";

/**
 * OntDekker CommunityDetailView
 *
 * Full community profile page. Navigated to from CommunitiesView via
 * router.push(`/communities/${community.id}`).
 *
 * Sections:
 *   1. Banner image
 *   2. Logo + community name + visibility badge + meta chips
 *   3. Description
 *   4. Stats (member count, expedition count, story count)
 *   5. Community Rules (from community.rules embedded in getCommunityById response)
 *   6. Recent Discussions (preview, 5 items via getCommunityDiscussions)
 *
 * Data (via Service Layer — no direct Axios):
 *   useSWR(communityKeys.byId(id), swrFetcher) → Community
 *   useSWR(communityKeys.discussions(id), swrFetcher) → PaginatedResponse<DiscussionSummary>
 *
 * Actions:
 *   Join    → joinCommunity + useToast
 *   Back    → router.back()
 */

import React, { useState, useCallback } from "react";
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
} from "lucide-react";

import Badge from "@/components/feedback/Badge";
import Button from "@/components/feedback/Button";

import { swrFetcher, communityKeys } from "@/services/cache";
import { joinCommunity } from "@/services/communityApi";

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
// Error state
// ---------------------------------------------------------------------------

function CommunityError({ onBack }: { onBack: () => void }) {
  return (
    <div className="container-main py-16 flex flex-col items-center gap-4 text-center">
      <p className="text-sm font-semibold text-ink">
        Could not load this community.
      </p>
      <p className="text-xs text-muted-slate">
        The community may not exist or there was a network error.
      </p>
      <Button variant="outline" size="sm" icon={ArrowLeft} onClick={onBack}>
        Go back
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: Community Hero
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
      {/* Banner */}
      <div className="relative h-52 w-full overflow-hidden bg-gray-100">
        {bannerUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
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

        {/* Back button */}
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

      {/* Logo overlap row — positioned relative to .container-main */}
      <div className="container-main">
        <div className="-mt-10">
          {logoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
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
// Sub-component: Community Meta Chips
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
      {/* Visibility badge */}
      <Badge variant={isPrivate ? "warning" : "success"} size="sm">
        {isPrivate ? (
          <Lock size={9} strokeWidth={2.5} aria-hidden="true" />
        ) : (
          <Globe size={9} strokeWidth={2.5} aria-hidden="true" />
        )}
        {isPrivate ? "Private" : "Public"}
      </Badge>

      {/* Member count */}
      <span className="flex items-center gap-1">
        <Users size={10} strokeWidth={2} aria-hidden="true" />
        {memberCount.toLocaleString()}{" "}
        {memberCount === 1 ? "member" : "members"}
      </span>

      {/* Location */}
      {location && (
        <span className="flex items-center gap-1">
          <MapPin size={10} strokeWidth={2} aria-hidden="true" />
          {location}
        </span>
      )}

      {/* Category */}
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
// Sub-component: Stats Row
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
          className="bg-white border border-gray-100 rounded-2xl px-4 py-3 flex flex-col items-center gap-1 min-w-[5rem] shadow-xs"
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
// Sub-component: Community Rules Section
// ---------------------------------------------------------------------------

function CommunityRulesSection({ rules }: { rules: CommunityRule[] }) {
  if (rules.length === 0) return null;

  const sorted = [...rules].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <section aria-label="Community rules">
      <h2 className="text-sm font-semibold text-ink mb-3">Community Rules</h2>
      <div className="bg-white border border-gray-100 rounded-3xl px-5 divide-y divide-gray-100">
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
// Sub-component: Discussions Preview Section
// ---------------------------------------------------------------------------

function DiscussionsEmptyState() {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-10 text-center space-y-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <MessageCircle
        size={36}
        strokeWidth={1}
        className="text-gray-200"
        aria-hidden="true"
      />
      <div className="space-y-1">
        <p className="text-sm font-semibold text-ink">No discussions yet.</p>
        <p className="text-xs text-muted-slate max-w-xs">
          Be the first to start a conversation in this community.
        </p>
      </div>
    </motion.div>
  );
}

function DiscussionItem({ discussion }: { discussion: DiscussionSummary }) {
  const formattedDate = new Date(discussion.createdAt).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric" },
  );

  return (
    <div className="py-4 border-b border-gray-100 last:border-0">
      <div className="flex items-start gap-3">
        {/* Pinned indicator */}
        {discussion.isPinned && (
          <Pin
            size={12}
            strokeWidth={2}
            className="text-amber-ochre flex-shrink-0 mt-0.5"
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
            {discussion.isLocked && (
              <span className="flex items-center gap-1 text-muted-slate">
                <Lock size={9} strokeWidth={2} aria-hidden="true" />
                Locked
              </span>
            )}
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
  const { data, error, isLoading, mutate } = useSWR<
    PaginatedResponse<DiscussionSummary>
  >(
    communityId ? communityKeys.discussions(communityId, 1) : null,
    swrFetcher,
    { revalidateOnFocus: false },
  );

  const discussions = data?.items?.slice(0, 5) ?? [];

  return (
    <section aria-label="Recent discussions">
      <h2 className="text-sm font-semibold text-ink mb-3">Recent Discussions</h2>

      {isLoading && (
        <div
          className="bg-white border border-gray-100 rounded-3xl px-5 divide-y divide-gray-100 animate-pulse"
          aria-hidden="true"
        >
          {[1, 2, 3].map((i) => (
            <div key={i} className="py-4 space-y-2">
              <div className="h-3.5 w-3/4 rounded-full bg-gray-100" />
              <div className="flex gap-3">
                <div className="h-2.5 w-16 rounded-full bg-gray-100" />
                <div className="h-2.5 w-12 rounded-full bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && error && (
        <motion.div
          className="flex items-center justify-between gap-4 bg-red-50 border border-red-100 rounded-2xl px-5 py-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          role="alert"
        >
          <p className="text-sm text-red-700">
            Could not load discussions. Please try again.
          </p>
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={() => mutate()}
          >
            Retry
          </Button>
        </motion.div>
      )}

      {!isLoading && !error && discussions.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-3xl px-5">
          <DiscussionsEmptyState />
        </div>
      )}

      {!isLoading && !error && discussions.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-3xl px-5">
          {discussions.map((discussion) => (
            <DiscussionItem key={discussion.id} discussion={discussion} />
          ))}
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: Join Community Button
// ---------------------------------------------------------------------------

function JoinCommunityButton({
  communityId,
  isMember,
  visibility,
  onJoined,
}: {
  communityId: string;
  isMember: boolean;
  visibility: Community["visibility"];
  onJoined: () => void;
}) {
  const { showToast } = useToast();
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = useCallback(async () => {
    if (isMember || isJoining) return;
    setIsJoining(true);
    try {
      await joinCommunity(communityId, {});
      showToast(
        visibility === "PRIVATE"
          ? "Join request sent! You'll be notified when approved."
          : "You've joined this community!",
        "success",
      );
      onJoined();
    } catch {
      showToast("Could not join community. Please try again.", "error");
    } finally {
      setIsJoining(false);
    }
  }, [communityId, isMember, isJoining, visibility, showToast, onJoined]);

  if (isMember) {
    return (
      <Badge variant="success" size="md" className="px-3 py-1.5">
        <Users size={12} strokeWidth={2} aria-hidden="true" />
        Member
      </Badge>
    );
  }

  return (
    <Button
      variant="primary"
      size="md"
      loading={isJoining}
      onClick={handleJoin}
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

  // ── SWR fetch ─────────────────────────────────────────────────────────────
  const {
    data: community,
    error,
    isLoading,
    mutate,
  } = useSWR<Community>(
    communityId ? communityKeys.byId(communityId) : null,
    swrFetcher,
    { revalidateOnFocus: false },
  );

  // ── Guard states ──────────────────────────────────────────────────────────
  if (!communityId) return <CommunityError onBack={() => router.back()} />;
  if (isLoading) return <CommunityDetailSkeleton />;
  if (error || !community) return <CommunityError onBack={() => router.back()} />;

  return (
    <motion.div
      className="pb-20"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
    >
      {/* ── Hero: banner + logo ──────────────────────────────────────────── */}
      <CommunityHero
        bannerUrl={community.bannerUrl}
        logoUrl={community.logoUrl}
        name={community.name}
        onBack={() => router.back()}
      />

      <div className="container-main space-y-6 mt-4">
        {/* ── Identity row: name + join button ─────────────────────────── */}
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
              isMember={community.isMember}
              visibility={community.visibility}
              onJoined={() => mutate()}
            />
          </div>
        </div>

        {/* ── Description ──────────────────────────────────────────────── */}
        {community.description && (
          <p className="text-sm text-charcoal leading-relaxed max-w-2xl">
            {community.description}
          </p>
        )}

        {/* ── Stats ────────────────────────────────────────────────────── */}
        <CommunityStats
          memberCount={community.memberCount}
          expeditionCount={community.expeditionCount}
          storyCount={community.storyCount}
        />

        {/* ── Rules ────────────────────────────────────────────────────── */}
        <CommunityRulesSection rules={community.rules} />

        {/* ── Discussions preview ──────────────────────────────────────── */}
        <CommunityDiscussionsSection communityId={community.id} />
      </div>
    </motion.div>
  );
}
