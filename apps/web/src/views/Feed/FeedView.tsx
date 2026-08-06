"use client";

/**
 * OntDekker FeedView — Travel Social Media Feed
 *
 * Full-featured modern travel feed featuring:
 *   - Feed Toggle (All Stories vs Communities) with animated transitions
 *   - Live search across title, content, location, tags, author, and community
 *   - Create Post Composer with media, tags, and community assignment
 *   - Timeline cards with like, bookmark, comment, and share interactions
 *   - Right Sidebar: Trending Communities (from backend), Feature coming soon
 *     (Suggested Travelers), Upcoming Expeditions (from backend)
 */

import React, { useState, useMemo } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "motion/react";
import {
  Compass,
  Users,
  MapPin,
  Heart,
  MessageSquare,
  Share2,
  Bookmark,
  Send,
  Sparkles,
  Calendar,
  Clock,
} from "lucide-react";
import { useRouter } from "next/navigation";

import Search from "@/components/navigation/Search";
import { swrFetcherWithParams, feedKeys, communityKeys, expeditionKeys } from "@/services/cache";
import { joinCommunity } from "@/services/communityApi";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/contexts/AuthContext";
import type { PostSummary, PaginatedResponse, CommunitySummary, ExpeditionSummary } from "@/types";

// ---------------------------------------------------------------------------
// Extended Post Interface (client-side UI model with local state)
// ---------------------------------------------------------------------------

interface ExtendedPost {
  id: string;
  authorName: string;
  authorHandle: string;
  authorAvatar: string | null;
  communityName: string | null;
  title: string;
  content: string;
  imageUrl: string | null;
  location: string;
  tags: string[];
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  createdAt: string;
  comments: { id: string; author: string; text: string; time: string }[];
}

// Sidebar data now loaded from backend — see sidebar section below

// ---------------------------------------------------------------------------
// FeedView Component
// ---------------------------------------------------------------------------

export default function FeedView() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  // Search & Tab state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "community">("all");

  // Local post feed state (user-created posts that are not yet persisted)
  const [localPosts, setLocalPosts] = useState<ExtendedPost[]>([]);

  // Interactive sidebar state
  const [joinedCommunities, setJoinedCommunities] = useState<Set<string>>(new Set());

  // Composer state
  const [composerOpen, setComposerOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [selectedCommunity, setSelectedCommunity] = useState("");

  // Fetch API feed if available
  const { data } = useSWR<PaginatedResponse<PostSummary>>(
    feedKeys.list({ page_size: 18 }),
    ([url, params]: [string, Record<string, unknown>]) =>
      swrFetcherWithParams(url, params),
    { revalidateOnFocus: false }
  );

  // Fetch trending communities (sorted by member count on backend, top 3)
  const { data: communitiesData } = useSWR<PaginatedResponse<CommunitySummary>>(
    communityKeys.list({ page_size: 3 }),
    ([url, params]: [string, Record<string, unknown>]) =>
      swrFetcherWithParams(url, params),
    { revalidateOnFocus: false }
  );

  // Fetch upcoming expeditions (recent, public, top 2)
  const { data: expeditionsData } = useSWR<PaginatedResponse<ExpeditionSummary>>(
    expeditionKeys.mine({ page_size: 2, visibility: "PUBLIC" }),
    ([url, params]: [string, Record<string, unknown>]) =>
      swrFetcherWithParams(url, params),
    { revalidateOnFocus: false }
  );

  const trendingCommunities = communitiesData?.items ?? [];
  const upcomingExpeditions = expeditionsData?.items ?? [];

  // Combine API items with local user-created posts
  const displayPosts = useMemo(() => {
    let combined: ExtendedPost[] = [];

    // Map backend posts to ExtendedPost format
    if (data?.items && data.items.length > 0) {
      const apiItems: ExtendedPost[] = data.items.map((item) => ({
        id: item.id,
        authorName: item.author?.displayName ?? "OntDekker Explorer",
        authorHandle: item.author?.username ?? "explorer",
        authorAvatar: item.author?.avatarUrl ?? null,
        communityName: item.communityId ? "Community Story" : null,
        title: item.title,
        content: item.title,
        imageUrl: item.coverImageUrl ?? null,
        location: item.location ?? "Global Journey",
        tags: item.tags ?? [],
        likeCount: item.likeCount ?? 0,
        commentCount: item.commentCount ?? 0,
        isLiked: item.isLiked ?? false,
        isBookmarked: item.isBookmarked ?? false,
        createdAt: new Date(item.createdAt).toLocaleDateString(),
        comments: [],
      }));
      combined = apiItems;
    }

    // Prepend local posts (newly created by user)
    combined = [...localPosts, ...combined];

    // Apply Segmented Control Filter ("All Stories" vs "Communities")
    if (activeFilter === "community") {
      combined = combined.filter((p) => p.communityName !== null);
    }

    // Live Search Filter (title, tags, location, author, community name)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      combined = combined.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q) ||
          p.authorName.toLowerCase().includes(q) ||
          p.authorHandle.toLowerCase().includes(q) ||
          (p.communityName?.toLowerCase().includes(q) ?? false) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return combined;
  }, [localPosts, data?.items, activeFilter, searchQuery]);

  // Handle Post Creation
  function handleCreatePost(e: React.FormEvent) {
    e.preventDefault();
    if (!newContent.trim() && !newTitle.trim()) {
      showToast("Please enter a story title or message.", "error");
      return;
    }

    const created: ExtendedPost = {
      id: `user-post-${Date.now()}`,
      authorName: user?.email.split("@")[0] ?? "You",
      authorHandle: user?.email.split("@")[0] ?? "you",
      authorAvatar: null,
      communityName: selectedCommunity
        ? (trendingCommunities.find((c) => c.id === selectedCommunity)?.name ?? null)
        : null,
      title: newTitle.trim() || "Travel Note",
      content: newContent.trim(),
      imageUrl: newImageUrl.trim() || null,
      location: newLocation.trim() || "On Expedition",
      tags: ["SlowTravel", "OntDekker"],
      likeCount: 0,
      commentCount: 0,
      isLiked: false,
      isBookmarked: false,
      createdAt: "Just now",
      comments: [],
    };

    setLocalPosts([created, ...localPosts]);
    setNewTitle("");
    setNewContent("");
    setNewLocation("");
    setNewImageUrl("");
    setComposerOpen(false);
    showToast("Story published to feed!", "success");
  }

  // Toggle Like
  function handleToggleLike(postId: string) {
    setLocalPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const isLiked = !p.isLiked;
          return {
            ...p,
            isLiked,
            likeCount: isLiked ? p.likeCount + 1 : p.likeCount - 1,
          };
        }
        return p;
      })
    );
  }

  // Toggle Bookmark
  function handleToggleBookmark(postId: string) {
    setLocalPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const isBookmarked = !p.isBookmarked;
          showToast(
            isBookmarked ? "Story saved to bookmarks." : "Bookmark removed.",
            "info"
          );
          return { ...p, isBookmarked };
        }
        return p;
      })
    );
  }

  // Share action
  function handleShare(_post: ExtendedPost) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast("Story link copied to clipboard!", "success");
    }
  }

  // Join community toggle
  async function handleToggleJoin(community: CommunitySummary) {
    const isJoined = joinedCommunities.has(community.id);
    
    // Optimistic UI update
    setJoinedCommunities((prev) => {
      const next = new Set(prev);
      if (isJoined) {
        next.delete(community.id);
      } else {
        next.add(community.id);
      }
      return next;
    });

    if (isJoined) {
      showToast(`Left ${community.name}`, "info");
    } else {
      showToast(`Joined ${community.name}!`, "success");
      try {
        await joinCommunity(community.id, {});
      } catch {
        // Fallback state retained
      }
    }
  }

  // Inline comment handler
  const [commentInput, setCommentInput] = useState<{ [postId: string]: string }>({});
  const [openComments, setOpenComments] = useState<{ [postId: string]: boolean }>({});

  function handleAddComment(postId: string) {
    const text = commentInput[postId]?.trim();
    if (!text) return;

    setLocalPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const newComment = {
            id: `c-${Date.now()}`,
            author: user?.email.split("@")[0] ?? "You",
            text,
            time: "Just now",
          };
          return {
            ...p,
            commentCount: p.commentCount + 1,
            comments: [...p.comments, newComment],
          };
        }
        return p;
      })
    );

    setCommentInput({ ...commentInput, [postId]: "" });
    showToast("Comment posted.", "success");
  }

  return (
    <div className="space-y-6">
      {/* ── Filter Controls + Search ───────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeFilter === "all"
                ? "bg-[#111111] text-white shadow-xs"
                : "bg-white text-gray-600 border border-[#EAE7DF] hover:bg-gray-50"
            }`}
          >
            All Stories
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("community")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeFilter === "community"
                ? "bg-[#111111] text-white shadow-xs"
                : "bg-white text-gray-600 border border-[#EAE7DF] hover:bg-gray-50"
            }`}
          >
            Communities
          </button>
        </div>
      </div>

      {/* ── Search Bar ─────────────────────────────────────────────────── */}
      <div className="w-full max-w-xl">
        <Search
          placeholder="Search stories, locations, tags, or travelers…"
          value={searchQuery}
          onChange={setSearchQuery}
          ariaLabel="Search feed"
        />
      </div>

      {/* ── 2-Column Main Feed Grid ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left / Center Timeline Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* ── Create Post Composer ────────────────────────────────────── */}
          <div className="rounded-2xl border border-[#EAE7DF] bg-white p-5 space-y-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-[#111111] text-white flex items-center justify-center font-bold text-sm shrink-0">
                {user?.email.charAt(0).toUpperCase() ?? "U"}
              </div>
              <button
                type="button"
                onClick={() => setComposerOpen((v) => !v)}
                className="w-full text-left rounded-xl border border-[#EAE7DF] bg-[#FBF9F4] px-4 py-2.5 text-sm text-gray-500 hover:border-gray-300 transition-colors"
              >
                Share your story, expedition note, or travel recommendation…
              </button>
            </div>

            {/* Expanded Composer Form */}
            {composerOpen && (
              <form onSubmit={handleCreatePost} className="space-y-4 pt-2 border-t border-[#EAE7DF]">
                <input
                  type="text"
                  placeholder="Story Title (e.g. Hidden Trails of the Pyrenees)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-xl border border-[#EAE7DF] px-3.5 py-2 text-sm text-[#111111] placeholder:text-gray-400 outline-none focus:border-[#111111]"
                />

                <textarea
                  rows={3}
                  placeholder="Tell your travel story or ask a question to the community..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full rounded-xl border border-[#EAE7DF] p-3.5 text-sm text-[#111111] placeholder:text-gray-400 outline-none focus:border-[#111111] resize-none"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Location (e.g. Chamonix, France)"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full rounded-xl border border-[#EAE7DF] px-3.5 py-2 text-xs text-[#111111] placeholder:text-gray-400 outline-none focus:border-[#111111]"
                  />
                  <input
                    type="url"
                    placeholder="Image URL (optional)"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    className="w-full rounded-xl border border-[#EAE7DF] px-3.5 py-2 text-xs text-[#111111] placeholder:text-gray-400 outline-none focus:border-[#111111]"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <select
                    value={selectedCommunity}
                    onChange={(e) => setSelectedCommunity(e.target.value)}
                    className="rounded-xl border border-[#EAE7DF] bg-white px-3 py-1.5 text-xs text-gray-700 outline-none"
                  >
                    <option value="">Public Feed (No Community)</option>
                    {trendingCommunities.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setComposerOpen(false)}
                      className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-[#111111]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#111111] px-4 py-2 text-xs font-semibold text-white hover:bg-[#333333] transition-colors"
                    >
                      <Send size={13} />
                      Publish Post
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* ── Timeline Post Cards with Motion Transition ───────────────── */}
          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {displayPosts.length === 0 ? (
                <motion.div
                  key="empty-feed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="rounded-2xl border border-[#EAE7DF] bg-white p-12 text-center space-y-3"
                >
                  <Compass size={36} className="mx-auto text-gray-300" />
                  <p className="text-sm font-semibold text-[#111111]">No stories match your filter.</p>
                  <p className="text-xs text-gray-500">Try adjusting your search query or switching to "All Stories".</p>
                </motion.div>
              ) : (
                displayPosts.map((post) => (
                  <motion.article
                    key={post.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.25, ease: [0, 0, 0.2, 1] }}
                    className="rounded-2xl border border-[#EAE7DF] bg-white p-6 space-y-4 shadow-2xs hover:border-gray-300 transition-all"
                  >
                    {/* Author Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {post.authorAvatar ? (
                          <img
                            src={post.authorAvatar}
                            alt={post.authorName}
                            className="size-10 rounded-full object-cover border border-[#EAE7DF]"
                          />
                        ) : (
                          <div className="size-10 rounded-full bg-[#111111] text-white flex items-center justify-center font-bold text-sm">
                            {post.authorName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-sm font-bold text-[#111111]">
                              {post.authorName}
                            </h2>
                            <span className="text-xs text-gray-400">
                              @{post.authorHandle}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                            <span className="flex items-center gap-1 text-gray-400">
                              <MapPin size={12} />
                              {post.location}
                            </span>
                            <span>•</span>
                            <span>{post.createdAt}</span>
                          </div>
                        </div>
                      </div>

                      {/* Community Badge */}
                      {post.communityName && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-[#EAE7DF] bg-[#FBF9F4] px-3 py-1 text-[11px] font-semibold text-[#111111]">
                          <Users size={12} />
                          {post.communityName}
                        </span>
                      )}
                    </div>

                    {/* Content Body */}
                    <div className="space-y-2">
                      <h3 className="text-base font-bold text-[#111111] leading-snug">
                        {post.title}
                      </h3>
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                        {post.content}
                      </p>
                    </div>

                    {/* Cover Image */}
                    {post.imageUrl && (
                      <div className="relative overflow-hidden rounded-xl bg-gray-100 max-h-96">
                        <img
                          src={post.imageUrl}
                          alt={post.title}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-[1.01]"
                        />
                      </div>
                    )}

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {post.tags.map((tag) => (
                          <span
                            key={tag}
                            onClick={() => setSearchQuery(tag)}
                            className="text-xs font-medium text-gray-500 hover:text-[#111111] cursor-pointer"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="flex items-center justify-between border-t border-[#EAE7DF] pt-4 text-xs font-medium text-gray-600">
                      <div className="flex items-center gap-6">
                        {/* Like */}
                        <button
                          type="button"
                          onClick={() => handleToggleLike(post.id)}
                          className={`flex items-center gap-1.5 transition-colors ${
                            post.isLiked
                              ? "text-red-600 font-semibold"
                              : "hover:text-[#111111]"
                          }`}
                        >
                          <Heart
                            size={18}
                            className={post.isLiked ? "fill-red-600 text-red-600" : ""}
                          />
                          <span>{post.likeCount}</span>
                        </button>

                        {/* Comment */}
                        <button
                          type="button"
                          onClick={() =>
                            setOpenComments((prev) => ({
                              ...prev,
                              [post.id]: !prev[post.id],
                            }))
                          }
                          className="flex items-center gap-1.5 hover:text-[#111111] transition-colors"
                        >
                          <MessageSquare size={18} />
                          <span>{post.commentCount}</span>
                        </button>

                        {/* Share */}
                        <button
                          type="button"
                          onClick={() => handleShare(post)}
                          className="flex items-center gap-1.5 hover:text-[#111111] transition-colors"
                        >
                          <Share2 size={18} />
                          <span>Share</span>
                        </button>
                      </div>

                      {/* Bookmark */}
                      <button
                        type="button"
                        onClick={() => handleToggleBookmark(post.id)}
                        className={`flex items-center gap-1 transition-colors ${
                          post.isBookmarked ? "text-[#111111]" : "hover:text-[#111111]"
                        }`}
                      >
                        <Bookmark
                          size={18}
                          className={post.isBookmarked ? "fill-[#111111]" : ""}
                        />
                      </button>
                    </div>

                    {/* Expanded Comment Thread */}
                    {openComments[post.id] && (
                      <div className="space-y-3 border-t border-[#EAE7DF] pt-3 mt-2">
                        {post.comments.map((c) => (
                          <div key={c.id} className="bg-[#FBF9F4] rounded-xl p-3 text-xs space-y-1">
                            <div className="flex items-center justify-between font-semibold text-[#111111]">
                              <span>{c.author}</span>
                              <span className="text-[10px] text-gray-400 font-normal">{c.time}</span>
                            </div>
                            <p className="text-gray-700">{c.text}</p>
                          </div>
                        ))}

                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="text"
                            placeholder="Write a comment..."
                            value={commentInput[post.id] ?? ""}
                            onChange={(e) =>
                              setCommentInput({ ...commentInput, [post.id]: e.target.value })
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleAddComment(post.id);
                            }}
                            className="flex-1 rounded-xl border border-[#EAE7DF] bg-white px-3 py-1.5 text-xs text-[#111111] outline-none focus:border-[#111111]"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddComment(post.id)}
                            className="rounded-xl bg-[#111111] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#333333]"
                          >
                            Reply
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.article>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Sidebar Column (4 cols — Trending, Travelers, Expeditions) */}
        <aside className="hidden lg:block lg:col-span-4 space-y-6">
          {/* Trending Communities */}
          <div className="rounded-2xl border border-[#EAE7DF] bg-white p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#111111] flex items-center gap-2">
                <Sparkles size={16} className="text-[#111111]" />
                Trending Communities
              </h3>
            </div>

            <div className="space-y-3">
              {trendingCommunities.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">
                  No communities yet
                </p>
              ) : (
                trendingCommunities.map((c) => {
                  const isJoined = joinedCommunities.has(c.id);
                  return (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#FBF9F4] transition-colors cursor-pointer"
                      onClick={() => router.push(`/communities/${c.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-gradient-to-br from-[#111111] to-gray-600 flex items-center justify-center text-white text-xs font-bold">
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-[#111111]">{c.name}</h4>
                          <p className="text-[11px] text-gray-500">
                            {c.memberCount.toLocaleString()} members
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleJoin(c);
                        }}
                        className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                          isJoined
                            ? "bg-gray-100 text-gray-600 border border-gray-200"
                            : "border border-[#EAE7DF] bg-white text-[#111111] hover:bg-gray-100"
                        }`}
                      >
                        {isJoined ? "Joined" : "Join"}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Suggested Travelers — Feature coming soon */}
          <div className="rounded-2xl border border-[#EAE7DF] bg-white p-5 space-y-4 shadow-2xs">
            <h3 className="font-bold text-sm text-[#111111] flex items-center gap-2">
              <Users size={16} />
              Suggested Travelers
            </h3>
            <div className="flex flex-col items-center justify-center py-5 space-y-2 text-center">
              <Clock size={24} className="text-gray-300" />
              <p className="text-xs font-semibold text-gray-500">Feature coming soon</p>
              <p className="text-[11px] text-gray-400">
                Traveler recommendations will appear here.
              </p>
            </div>
          </div>

          {/* Upcoming Expeditions */}
          <div className="rounded-2xl border border-[#EAE7DF] bg-white p-5 space-y-4 shadow-2xs">
            <h3 className="font-bold text-sm text-[#111111] flex items-center gap-2">
              <Compass size={16} />
              Upcoming Expeditions
            </h3>

            <div className="space-y-3">
              {upcomingExpeditions.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">
                  No upcoming expeditions yet
                </p>
              ) : (
                upcomingExpeditions.map((exp) => (
                  <div
                    key={exp.id}
                    onClick={() => router.push(`/expeditions/${exp.id}`)}
                    className="p-3 rounded-xl border border-[#EAE7DF] bg-[#FBF9F4] space-y-1.5 cursor-pointer hover:border-gray-400 hover:bg-white transition-all shadow-2xs"
                  >
                    <h4 className="text-xs font-bold text-[#111111] hover:underline">{exp.title}</h4>
                    <div className="flex items-center justify-between text-[11px] text-gray-500">
                      {exp.startDate ? (
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(exp.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          {exp.endDate && ` - ${new Date(exp.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} />
                          {exp.destination}
                        </span>
                      )}
                      <span className="font-medium text-[#111111]">
                        {exp.maxParticipants} spots
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
