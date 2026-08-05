"use client";

/**
 * OntDekker FeedView — Travel Social Media Feed
 *
 * Full-featured modern travel feed featuring:
 *   - Create Post Composer with media, tags, and community assignment
 *   - Post Timeline with author avatars, community badges, images, tags,
 *     like toggles, comment previews, sharing, and bookmarking
 *   - Right Sidebar Column: Trending Communities, Suggested Travelers, Upcoming Expeditions
 *   - Fallback mock data ensuring the feed is vibrant and demonstrable
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
  Image as ImageIcon,
  Send,
  PlusCircle,
  Sparkles,
  Calendar,
  CheckCircle2,
} from "lucide-react";

import Search from "@/components/navigation/Search";
import { swrFetcherWithParams, feedKeys } from "@/services/cache";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/contexts/AuthContext";
import type { PostSummary, PaginatedResponse } from "@/types";

// ---------------------------------------------------------------------------
// Realistic Mock Fallback Feed Items
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

const INITIAL_MOCK_POSTS: ExtendedPost[] = [
  {
    id: "mock-1",
    authorName: "Elena Rostova",
    authorHandle: "elena_explores",
    authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    communityName: "Alpine Explorers",
    title: "Sunrise at Lauterbrunnen Valley",
    content: "Woke up at 4:30 AM to catch the morning fog lifting over the cliffs. Slow travel really teaches you to appreciate stillness. Watching the waterfalls catch the first golden rays was pure magic.",
    imageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
    location: "Lauterbrunnen, Switzerland",
    tags: ["SwissAlps", "SlowTravel", "SunriseHike"],
    likeCount: 42,
    commentCount: 8,
    isLiked: false,
    isBookmarked: true,
    createdAt: "2 hours ago",
    comments: [
      { id: "c1", author: "Marco Silva", text: "Stunning shot! Did you take the train up to Mürren afterwards?", time: "1 hour ago" },
      { id: "c2", author: "Elena Rostova", text: "Yes! Hiked down through Gimmelwald right after.", time: "45 mins ago" },
    ],
  },
  {
    id: "mock-2",
    authorName: "Kenji Sato",
    authorHandle: "kenji_kyoto",
    authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    communityName: "Nordic & Asian Trails",
    title: "Off-the-beaten-path tea house in Uji",
    content: "Skipped the crowded spots in Kyoto and headed south to Uji. Found a 200-year-old family-run tea farm where the master spent two hours explaining shaded matcha cultivation.",
    imageUrl: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80",
    location: "Uji, Kyoto, Japan",
    tags: ["JapanTravel", "MatchaCulture", "LocalHosts"],
    likeCount: 67,
    commentCount: 12,
    isLiked: true,
    isBookmarked: false,
    createdAt: "5 hours ago",
    comments: [
      { id: "c3", author: "Sarah Jenkins", text: "Saving this for my trip in October!", time: "3 hours ago" },
    ],
  },
  {
    id: "mock-3",
    authorName: "Amara Diallo",
    authorHandle: "amara_treks",
    authorAvatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=150&q=80",
    communityName: "Desert & Oasis Society",
    title: "Camping under the Sahara starlight",
    content: "No cell service for three days in Erg Chebbi. Cooking tagine over open coals with our Berber guide Brahim. This is what true expedition culture is all about.",
    imageUrl: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80",
    location: "Erg Chebbi, Morocco",
    tags: ["SaharaExpedition", "Stargazing", "CulturalImmersion"],
    likeCount: 89,
    commentCount: 15,
    isLiked: false,
    isBookmarked: false,
    createdAt: "1 day ago",
    comments: [],
  },
];

const TRENDING_COMMUNITIES = [
  { id: "1", name: "Alpine Explorers", members: 1420, category: "Mountain Treks", icon: "🏔️" },
  { id: "2", name: "Nordic Trail Seekers", members: 980, category: "Slow Travel", icon: "🌲" },
  { id: "3", name: "Mediterranean Coast", members: 2150, category: "Coastal & Sailing", icon: "🌊" },
];

const SUGGESTED_TRAVELERS = [
  { name: "Sofia Chen", handle: "@sofia_trails", location: "Oslo, Norway", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80", isGuide: true },
  { name: "Lukas Weber", handle: "@lukas_alps", location: "Innsbruck, Austria", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80", isGuide: true },
];

const UPCOMING_EXPEDITIONS = [
  { title: "Dolomites Autumn Ridge Trek", date: "Sep 15 - 20", location: "South Tyrol, Italy", spotsLeft: 3 },
  { title: "Fjord Kayaking & Camping", date: "Oct 02 - 07", location: "Flam, Norway", spotsLeft: 2 },
];

// ---------------------------------------------------------------------------
// FeedView Component
// ---------------------------------------------------------------------------

export default function FeedView() {
  const { user } = useAuth();
  const { showToast } = useToast();

  // Search & Tab state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "community" | "public">("all");

  // Local post feed state (initialised with mock posts)
  const [posts, setPosts] = useState<ExtendedPost[]>(INITIAL_MOCK_POSTS);

  // Composer state
  const [composerOpen, setComposerOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [selectedCommunity, setSelectedCommunity] = useState("Alpine Explorers");

  // Fetch API feed if available
  const { data } = useSWR<PaginatedResponse<PostSummary>>(
    feedKeys.list({ page_size: 18 }),
    ([url, params]: [string, Record<string, unknown>]) =>
      swrFetcherWithParams(url, params),
    { revalidateOnFocus: false }
  );

  // Combine API items with local mock posts when available
  const displayPosts = useMemo(() => {
    let combined = [...posts];

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
        tags: item.tags ?? ["SlowTravel"],
        likeCount: item.likeCount ?? 0,
        commentCount: item.commentCount ?? 0,
        isLiked: item.isLiked ?? false,
        isBookmarked: item.isBookmarked ?? false,
        createdAt: "Recently",
        comments: [],
      }));
      // Merge unique
      const existingIds = new Set(combined.map((p) => p.id));
      apiItems.forEach((item) => {
        if (!existingIds.has(item.id)) combined.push(item);
      });
    }

    // Apply Filter & Search
    if (activeFilter === "community") {
      combined = combined.filter((p) => p.communityName !== null);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      combined = combined.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return combined;
  }, [posts, data?.items, activeFilter, searchQuery]);

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
      communityName: selectedCommunity || null,
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

    setPosts([created, ...posts]);
    setNewTitle("");
    setNewContent("");
    setNewLocation("");
    setNewImageUrl("");
    setComposerOpen(false);
    showToast("Story published to community feed!", "success");
  }

  // Toggle Like
  function handleToggleLike(postId: string) {
    setPosts((prev) =>
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
    setPosts((prev) =>
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
  function handleShare(post: ExtendedPost) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast("Story link copied to clipboard!", "success");
    }
  }

  // Inline comment handler
  const [commentInput, setCommentInput] = useState<{ [postId: string]: string }>({});
  const [openComments, setOpenComments] = useState<{ [postId: string]: boolean }>({});

  function handleAddComment(postId: string) {
    const text = commentInput[postId]?.trim();
    if (!text) return;

    setPosts((prev) =>
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
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111111]">
            Feed
          </h1>
          <p className="text-sm text-gray-500">
            Real stories, expedition notes, and updates from travelers worldwide.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeFilter === "all"
                ? "bg-[#111111] text-white"
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
                ? "bg-[#111111] text-white"
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
          placeholder="Search stories, locations, or tags…"
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
                    <option value="Alpine Explorers">Alpine Explorers</option>
                    <option value="Nordic Trail Seekers">Nordic Trail Seekers</option>
                    <option value="Desert & Oasis Society">Desert & Oasis Society</option>
                    <option value="Public Feed">Public Feed (No Community)</option>
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

          {/* ── Timeline Post Cards ──────────────────────────────────────── */}
          <div className="space-y-6">
            {displayPosts.map((post) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
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
            ))}
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
              {TRENDING_COMMUNITIES.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#FBF9F4] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{c.icon}</span>
                    <div>
                      <h4 className="text-xs font-bold text-[#111111]">{c.name}</h4>
                      <p className="text-[11px] text-gray-500">
                        {c.members.toLocaleString()} members
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => showToast(`Joined ${c.name}!`, "success")}
                    className="rounded-lg border border-[#EAE7DF] bg-white px-3 py-1 text-xs font-semibold text-[#111111] hover:bg-gray-100"
                  >
                    Join
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Suggested Travelers & Guides */}
          <div className="rounded-2xl border border-[#EAE7DF] bg-white p-5 space-y-4 shadow-2xs">
            <h3 className="font-bold text-sm text-[#111111] flex items-center gap-2">
              <Users size={16} />
              Suggested Travelers
            </h3>

            <div className="space-y-3">
              {SUGGESTED_TRAVELERS.map((t) => (
                <div
                  key={t.handle}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-[#FBF9F4] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={t.avatar}
                      alt={t.name}
                      className="size-9 rounded-full object-cover border border-[#EAE7DF]"
                    />
                    <div>
                      <div className="flex items-center gap-1">
                        <h4 className="text-xs font-bold text-[#111111]">{t.name}</h4>
                        {t.isGuide && (
                          <CheckCircle2 size={12} className="text-blue-600 fill-blue-100" />
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400">{t.location}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => showToast(`Following ${t.name}!`, "info")}
                    className="rounded-lg bg-[#111111] px-3 py-1 text-xs font-semibold text-white hover:bg-[#333333]"
                  >
                    Follow
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Expeditions */}
          <div className="rounded-2xl border border-[#EAE7DF] bg-white p-5 space-y-4 shadow-2xs">
            <h3 className="font-bold text-sm text-[#111111] flex items-center gap-2">
              <Compass size={16} />
              Upcoming Expeditions
            </h3>

            <div className="space-y-3">
              {UPCOMING_EXPEDITIONS.map((exp) => (
                <div
                  key={exp.title}
                  className="p-3 rounded-xl border border-[#EAE7DF] bg-[#FBF9F4] space-y-1.5"
                >
                  <h4 className="text-xs font-bold text-[#111111]">{exp.title}</h4>
                  <div className="flex items-center justify-between text-[11px] text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {exp.date}
                    </span>
                    <span className="font-medium text-[#111111]">
                      {exp.spotsLeft} spots left
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
