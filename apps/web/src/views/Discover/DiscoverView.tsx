"use client";

/**
 * OntDekker DiscoverView
 *
 * Primary exploration workspace. Entry point on application launch.
 *
 * Layout (03-screen-specs.md § Discover Screen):
 *   Desktop: 12-column grid — Feed (col-span-8) + Right Sidebar (col-span-4)
 *   Mobile:  single column
 *   Max-width: max-w-5xl, px-6, py-8 (design system constraints)
 *
 * Sections:
 *   1. Search header
 *   2. StatusRow (compact dashboard)
 *   3. Feed — all four states: loading / empty / error / success
 *
 * Data flow (no direct Axios — all via service layer):
 *   useSWR(feedKeys.posts(), swrFetcher)  → PaginatedResponse<Post>
 *   AppState.myExpeditions.length         → expeditionsCount for StatusRow
 *   AppState.unreadMessagesCount          → messagesCount for StatusRow
 *   api.likePost / api.unlikePost         → optimistic dispatch POST_LIKE_TOGGLED
 *   api.savePost / api.unsavePost         → optimistic dispatch POST_SAVE_TOGGLED
 *   useToast                              → success toast on like / save
 *
 * Motion (06-motion-design.md):
 *   - StoryCards stagger: opacity 0→1, y 15→0, 50ms delay per card (handled in StoryCard)
 *   - Page entrance: opacity 0→1, y 12→0, 300ms
 *   - Error banner: opacity 0→1
 */

import React, { useState, useCallback } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "motion/react";
import { RefreshCw, BookOpen } from "lucide-react";

import StoryCard from "@/components/cards/StoryCard";
import Button from "@/components/feedback/Button";
import Search from "@/components/navigation/Search";

import { swrFetcher, feedKeys } from "@/services/cache";
import { likePost, unlikePost, savePost, unsavePost } from "@/services/api";

import { useAppState } from "@/contexts/AppStateProvider";
import { useToast } from "@/hooks/useToast";

import StatusRow from "./StatusRow";
import FeedSkeleton from "./FeedSkeleton";

import type { Post, PaginatedResponse } from "@/types";

// ---------------------------------------------------------------------------
// Right sidebar — shown on desktop alongside the feed
// ---------------------------------------------------------------------------

function DiscoverSidebar() {
  return (
    <aside className="hidden md:block space-y-5" aria-label="Discover sidebar">
      <div className="bg-white border border-gray-100 rounded-3xl p-5 space-y-3">
        <h2 className="text-xs font-mono uppercase tracking-wider text-muted-slate">
          About OntDekker
        </h2>
        <p className="text-sm text-charcoal leading-relaxed">
          A premium slow-travel community. Discover stories, join expeditions,
          and connect with verified local guides.
        </p>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl p-5 space-y-2">
        <h2 className="text-xs font-mono uppercase tracking-wider text-muted-slate">
          Quick Links
        </h2>
        <ul className="space-y-1 text-sm text-charcoal">
          {["Communities", "Guides", "My Trips"].map((link) => (
            <li key={link}>
              <span className="text-charcoal hover:text-ink cursor-pointer transition-colors duration-[var(--duration-responsive)]">
                {link}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyFeed() {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-20 text-center space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <BookOpen
        size={40}
        strokeWidth={1}
        className="text-gray-200"
        aria-hidden="true"
      />
      <div className="space-y-1">
        <p className="text-sm font-semibold text-ink">No stories available.</p>
        <p className="text-xs text-muted-slate max-w-xs">
          Check back soon — new stories from explorers around the world are
          added every day.
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
      className="
        flex items-center justify-between gap-4
        bg-red-50 border border-red-100 rounded-2xl
        px-5 py-4
      "
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      role="alert"
    >
      <p className="text-sm text-red-700">
        Feed loading failed. Check your connection and try again.
      </p>
      <Button
        variant="outline"
        size="sm"
        icon={RefreshCw}
        onClick={onRetry}
      >
        Retry
      </Button>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// DiscoverView
// ---------------------------------------------------------------------------

export default function DiscoverView() {
  const { state, dispatch } = useAppState();
  const { showToast } = useToast();

  // ── Search ─────────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");

  // ── SWR data fetching ──────────────────────────────────────────────────────
  const swrKey = feedKeys.posts();
  const { data, error, isLoading, mutate } = useSWR<PaginatedResponse<Post>>(
    swrKey,
    swrFetcher,
    { revalidateOnFocus: false },
  );

  // Merge SWR posts with optimistic AppState updates
  const posts: Post[] = React.useMemo(() => {
    const swrPosts = data?.items ?? [];
    if (!state.feedPosts.length) return swrPosts;
    // Use AppState if it has been populated (optimistic updates applied)
    return state.feedPosts.length >= swrPosts.length
      ? state.feedPosts
      : swrPosts;
  }, [data?.items, state.feedPosts]);

  // Seed AppState when SWR data first arrives
  React.useEffect(() => {
    if (data?.items && !state.feedPosts.length) {
      dispatch({ type: "FEED_LOADED", posts: data.items });
    }
  }, [data?.items, state.feedPosts.length, dispatch]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleLikeToggle = useCallback(
    async (post: Post) => {
      // Optimistic update
      dispatch({
        type: "POST_LIKE_TOGGLED",
        postId: post.id,
        liked: !post.isLiked,
      });
      try {
        if (post.isLiked) {
          await unlikePost(post.id);
        } else {
          await likePost(post.id);
          showToast("Story liked!", "success");
        }
      } catch {
        // Roll back on failure
        dispatch({
          type: "POST_LIKE_TOGGLED",
          postId: post.id,
          liked: post.isLiked,
        });
        showToast("Could not update like. Please try again.", "error");
      }
    },
    [dispatch, showToast],
  );

  const handleSaveToggle = useCallback(
    async (post: Post) => {
      dispatch({
        type: "POST_SAVE_TOGGLED",
        postId: post.id,
        saved: !post.isSaved,
      });
      try {
        if (post.isSaved) {
          await unsavePost(post.id);
        } else {
          await savePost(post.id);
          showToast("Story saved!", "success");
        }
      } catch {
        dispatch({
          type: "POST_SAVE_TOGGLED",
          postId: post.id,
          saved: post.isSaved,
        });
        showToast("Could not update save. Please try again.", "error");
      }
    },
    [dispatch, showToast],
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <motion.div
      className="container-main py-8 space-y-8 pb-20"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
    >
      {/* ── Search header ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <Search
          placeholder="Search stories, guides, communities…"
          value={searchQuery}
          onChange={setSearchQuery}
          className="flex-1 max-w-sm"
          ariaLabel="Search Discover feed"
        />
      </div>

      {/* ── Status row ────────────────────────────────────────────────────── */}
      <StatusRow
        expeditionsCount={state.myExpeditions.length}
        pendingRequestsCount={0}
        unreadMessagesCount={state.unreadMessagesCount}
        communityUpdatesCount={state.joinedCommunities.length}
      />

      {/* ── 12-column grid: Feed (8) + Sidebar (4) ────────────────────────── */}
      <div className="grid grid-cols-12 gap-8">
        {/* Feed column */}
        <section
          className="col-span-12 md:col-span-8 space-y-5"
          aria-label="Stories feed"
        >
          <AnimatePresence mode="wait">
            {isLoading ? (
              <FeedSkeleton key="skeleton" count={6} />
            ) : error ? (
              <ErrorBanner key="error" onRetry={() => mutate()} />
            ) : posts.length === 0 ? (
              <EmptyFeed key="empty" />
            ) : (
              <div
                key="feed"
                className="grid grid-cols-1 sm:grid-cols-2 gap-5"
              >
                {posts.map((post, index) => (
                  <StoryCard
                    key={post.id}
                    post={post}
                    index={index}
                    onLikeToggle={() => handleLikeToggle(post)}
                    onSaveToggle={() => handleSaveToggle(post)}
                    onCommentClick={() => {
                      // Story modal — wired in a future checkpoint
                    }}
                    onClick={() => {
                      // Navigate to story detail — wired in a future checkpoint
                    }}
                  />
                ))}
              </div>
            )}
          </AnimatePresence>
        </section>

        {/* Desktop sidebar */}
        <div className="col-span-12 md:col-span-4">
          <DiscoverSidebar />
        </div>
      </div>
    </motion.div>
  );
}
