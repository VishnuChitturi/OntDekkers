"use client";

/**
 * PostCard — Single post card with all interactions
 *
 * Handles:
 *  - Like/unlike (optimistic + rollback)
 *  - Bookmark/unbookmark (optimistic + rollback)
 *  - Edit (owner only)
 *  - Delete (owner only)
 *  - Comment section toggle
 *  - Media carousel (multiple images via ImageCarousel)
 *
 * Media display strategy:
 *  - If post.media is non-empty → render ImageCarousel with all media items
 *  - Else if post.coverImageUrl  → render single cover image (fallback for
 *    summary-only data before full revalidation)
 *
 * NOTE: Field names are camelCase because the axios interceptor
 * auto-converts snake_case API responses.
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import {
  MapPin,
  Users,
  Heart,
  MessageSquare,
  Share2,
  Bookmark,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { likePost, unlikePost, bookmarkPost, unbookmarkPost } from "@/services/feedApi";
import { ImageCarousel } from "@/components/content/ImageCarousel";
import { CommentsSection } from "./CommentsSection";
import { EditStoryModal } from "./EditStoryModal";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import type { RawPost } from "./types";
import type { UpdatePostRequest } from "@/types";

interface PostCardProps {
  post: RawPost;
  currentUserId: string | null;
  onEdit: (postId: string, payload: UpdatePostRequest) => Promise<void>;
  onDelete: (postId: string) => Promise<void>;
  onCopyLink: () => void;
}

export function PostCard({
  post: initialPost,
  currentUserId,
  onEdit,
  onDelete,
  onCopyLink,
}: PostCardProps) {
  const [post, setPost] = useState<RawPost>(initialPost);
  const [liking, setLiking] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const isOwner = currentUserId !== null && post.authorId === currentUserId;

  // ── Like/Unlike ──────────────────────────────────────────────────────────
  async function handleToggleLike() {
    if (liking) return;
    const wasLiked = post.isLiked;
    setPost((p) => ({
      ...p,
      isLiked: !wasLiked,
      likeCount: wasLiked ? p.likeCount - 1 : p.likeCount + 1,
    }));
    setLiking(true);
    try {
      if (wasLiked) {
        const res = await unlikePost(post.id);
        setPost((p) => ({ ...p, isLiked: res.isLiked, likeCount: res.likeCount }));
      } else {
        const res = await likePost(post.id);
        setPost((p) => ({ ...p, isLiked: res.isLiked, likeCount: res.likeCount }));
      }
    } catch {
      setPost((p) => ({
        ...p,
        isLiked: wasLiked,
        likeCount: wasLiked ? p.likeCount + 1 : p.likeCount - 1,
      }));
    } finally {
      setLiking(false);
    }
  }

  // ── Bookmark/Unbookmark ──────────────────────────────────────────────────
  async function handleToggleBookmark() {
    if (bookmarking) return;
    const wasBookmarked = post.isBookmarked;
    setPost((p) => ({ ...p, isBookmarked: !wasBookmarked }));
    setBookmarking(true);
    try {
      if (wasBookmarked) {
        const res = await unbookmarkPost(post.id);
        setPost((p) => ({ ...p, isBookmarked: res.isBookmarked }));
      } else {
        const res = await bookmarkPost(post.id);
        setPost((p) => ({ ...p, isBookmarked: res.isBookmarked }));
      }
    } catch {
      setPost((p) => ({ ...p, isBookmarked: wasBookmarked }));
    } finally {
      setBookmarking(false);
    }
  }

  // ── Edit handler ─────────────────────────────────────────────────────────
  async function handleEdit(payload: UpdatePostRequest) {
    await onEdit(post.id, payload);
    setPost((p) => ({
      ...p,
      title: payload.title ?? p.title,
      location: payload.location !== undefined ? (payload.location ?? null) : p.location,
      visibility: payload.visibility ?? p.visibility,
    }));
  }

  // ── Delete handler ───────────────────────────────────────────────────────
  async function handleDelete() {
    await onDelete(post.id);
  }

  // ── Media rendering ───────────────────────────────────────────────────────
  // Prefer the full media array when available; fall back to coverImageUrl for
  // posts that only have summary data (e.g. before first full revalidation).
  const sortedMedia = [...(post.media ?? [])].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );

  const carouselImages = sortedMedia.map((m) => ({
    id: m.id,
    url: m.mediaUrl,
    alt: post.title,
  }));

  const fallbackImages =
    carouselImages.length === 0 && post.coverImageUrl
      ? [{ id: `cover-${post.id}`, url: post.coverImageUrl, alt: post.title }]
      : [];

  const displayImages = carouselImages.length > 0 ? carouselImages : fallbackImages;

  return (
    <>
      <motion.article
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
            <div className="size-10 rounded-full bg-[#111111] text-white flex items-center justify-center font-bold text-sm shrink-0">
              {post.authorId.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[#111111]">
                  Explorer #{post.authorId.slice(0, 8)}
                </h2>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                {post.location && (
                  <>
                    <span className="flex items-center gap-1 text-gray-400">
                      <MapPin size={12} />
                      {post.location}
                    </span>
                    <span>•</span>
                  </>
                )}
                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {post.communityId && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[#EAE7DF] bg-[#FBF9F4] px-3 py-1 text-[11px] font-semibold text-[#111111]">
                <Users size={12} />
                Community
              </span>
            )}

            {/* Owner actions menu */}
            {isOwner && (
              <div className="relative">
                <button
                  type="button"
                  aria-label="Post actions"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-[#111111] hover:bg-gray-50 transition-colors"
                >
                  <MoreHorizontal size={16} />
                </button>
                {menuOpen && (
                  <div
                    className="absolute right-0 top-8 z-20 min-w-[140px] rounded-xl border border-[#EAE7DF] bg-white shadow-lg py-1"
                    onMouseLeave={() => setMenuOpen(false)}
                  >
                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); setEditOpen(true); }}
                      className="flex items-center gap-2 w-full px-3.5 py-2 text-xs text-[#111111] hover:bg-[#FBF9F4] transition-colors"
                    >
                      <Pencil size={13} />
                      Edit Story
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); setDeleteOpen(true); }}
                      className="flex items-center gap-2 w-full px-3.5 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={13} />
                      Delete Story
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Post title */}
        <div className="space-y-2">
          <h3 className="text-base font-bold text-[#111111] leading-snug">
            {post.title}
          </h3>
        </div>

        {/* Media — carousel for multiple images, single image for one */}
        {displayImages.length > 0 && (
          <ImageCarousel
            images={displayImages}
            aspectRatio="16/9"
            showCaptions={false}
          />
        )}

        {/* Tags */}
        {post.tagList && post.tagList.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {post.tagList.map((tag) => (
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
              onClick={handleToggleLike}
              disabled={liking}
              aria-label={post.isLiked ? "Unlike" : "Like"}
              className={`flex items-center gap-1.5 transition-colors disabled:opacity-60 ${
                post.isLiked ? "text-red-600 font-semibold" : "hover:text-[#111111]"
              }`}
            >
              <Heart
                size={18}
                className={post.isLiked ? "fill-red-600 text-red-600" : ""}
              />
              <span>{post.likeCount}</span>
            </button>

            {/* Comment toggle */}
            <button
              type="button"
              onClick={() => setCommentsOpen((v) => !v)}
              aria-label="Toggle comments"
              className="flex items-center gap-1.5 hover:text-[#111111] transition-colors"
            >
              <MessageSquare size={18} />
              <span>{commentCount}</span>
            </button>

            {/* Share */}
            <button
              type="button"
              onClick={onCopyLink}
              aria-label="Share"
              className="flex items-center gap-1.5 hover:text-[#111111] transition-colors"
            >
              <Share2 size={18} />
              <span>Share</span>
            </button>
          </div>

          {/* Bookmark */}
          <button
            type="button"
            onClick={handleToggleBookmark}
            disabled={bookmarking}
            aria-label={post.isBookmarked ? "Remove bookmark" : "Bookmark"}
            className={`flex items-center gap-1 transition-colors disabled:opacity-60 ${
              post.isBookmarked ? "text-[#111111]" : "hover:text-[#111111]"
            }`}
          >
            <Bookmark
              size={18}
              className={post.isBookmarked ? "fill-[#111111]" : ""}
            />
          </button>
        </div>

        {/* Comments Section */}
        {commentsOpen && (
          <CommentsSection
            postId={post.id}
            currentUserId={currentUserId}
            onCountChange={(delta) =>
              setCommentCount((c) => Math.max(0, c + delta))
            }
          />
        )}
      </motion.article>

      {editOpen && (
        <EditStoryModal
          post={post}
          onSave={handleEdit}
          onClose={() => setEditOpen(false)}
        />
      )}

      {deleteOpen && (
        <DeleteConfirmModal
          postTitle={post.title}
          onConfirm={handleDelete}
          onClose={() => setDeleteOpen(false)}
        />
      )}
    </>
  );
}
