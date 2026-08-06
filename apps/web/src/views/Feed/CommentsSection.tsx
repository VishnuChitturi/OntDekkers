"use client";

/**
 * CommentsSection — Load, create, edit own, delete own comments
 *
 * NOTE: Field names are camelCase because the axios interceptor
 * auto-converts snake_case API responses.
 */

import React, { useEffect, useState } from "react";
import { Send, Pencil, Trash2, Check, X } from "lucide-react";
import {
  getComments,
  createComment,
  updateComment,
  deleteComment,
} from "@/services/feedApi";
import type { RawComment } from "./types";

interface CommentsSectionProps {
  postId: string;
  currentUserId: string | null;
  onCountChange: (delta: number) => void;
}

export function CommentsSection({
  postId,
  currentUserId,
  onCountChange,
}: CommentsSectionProps) {
  const [comments, setComments] = useState<RawComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newText, setNewText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getComments(postId)
      .then((res) => {
        if (!cancelled) {
          const raw = res as unknown as { comments?: RawComment[] };
          setComments(raw.comments ?? (res as unknown as RawComment[]) ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) setComments([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [postId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const text = newText.trim();
    if (!text) return;

    setSubmitting(true);
    try {
      const created = await createComment(postId, { content: text });
      const raw = created as unknown as RawComment;
      setComments((prev) => [...prev, raw]);
      setNewText("");
      onCountChange(1);
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveEdit(commentId: string) {
    const text = editText.trim();
    if (!text) return;

    try {
      const updated = await updateComment(commentId, { content: text });
      const raw = updated as unknown as RawComment;
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, content: raw.content } : c))
      );
      setEditingId(null);
    } catch {
      // silently fail
    }
  }

  async function handleDelete(commentId: string) {
    try {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      onCountChange(-1);
    } catch {
      // silently fail
    }
  }

  return (
    <div className="space-y-3 border-t border-[#EAE7DF] pt-3">
      {loading ? (
        <p className="text-xs text-gray-400 py-2">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="text-xs text-gray-400 py-2">
          No comments yet. Be the first to comment!
        </p>
      ) : (
        comments.map((comment) => {
          const isOwn =
            currentUserId !== null && comment.authorId === currentUserId;
          const isEditing = editingId === comment.id;

          return (
            <div
              key={comment.id}
              className="bg-[#FBF9F4] rounded-xl p-3 text-xs space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#111111] truncate max-w-[60%]">
                  {comment.authorId.slice(0, 8)}…
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                  {isOwn && !isEditing && (
                    <>
                      <button
                        type="button"
                        aria-label="Edit comment"
                        onClick={() => {
                          setEditingId(comment.id);
                          setEditText(comment.content);
                        }}
                        className="text-gray-400 hover:text-[#111111] transition-colors"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        type="button"
                        aria-label="Delete comment"
                        onClick={() => handleDelete(comment.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {isEditing ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveEdit(comment.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="flex-1 rounded-lg border border-[#EAE7DF] bg-white px-2.5 py-1 text-xs text-[#111111] outline-none focus:border-[#111111]"
                    autoFocus
                  />
                  <button
                    type="button"
                    aria-label="Save edit"
                    onClick={() => handleSaveEdit(comment.id)}
                    className="text-green-600 hover:text-green-700 transition-colors"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    type="button"
                    aria-label="Cancel edit"
                    onClick={() => setEditingId(null)}
                    className="text-gray-400 hover:text-[#111111] transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <p className="text-gray-700 leading-relaxed">{comment.content}</p>
              )}

              {/* Nested replies (one level) */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-3 mt-2 space-y-1.5 border-l-2 border-[#EAE7DF] pl-3">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="text-xs space-y-0.5">
                      <span className="font-semibold text-[#111111]">
                        {reply.authorId.slice(0, 8)}…
                      </span>
                      <p className="text-gray-600">{reply.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}

      {/* New comment input */}
      {currentUserId && (
        <form onSubmit={handleCreate} className="flex items-center gap-2 pt-1">
          <input
            type="text"
            placeholder="Write a comment..."
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            className="flex-1 rounded-xl border border-[#EAE7DF] bg-white px-3 py-1.5 text-xs text-[#111111] outline-none focus:border-[#111111]"
          />
          <button
            type="submit"
            disabled={submitting || !newText.trim()}
            className="rounded-xl bg-[#111111] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#333333] disabled:opacity-50 transition-colors"
          >
            <Send size={13} />
          </button>
        </form>
      )}
    </div>
  );
}
