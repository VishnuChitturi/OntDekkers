"use client";

/**
 * OntDekker ChatBubble
 *
 * Renders a single chat message bubble.
 * Variants:
 *   outgoing — right-aligned, ink background, status icon
 *   incoming — left-aligned, white bg with avatar and sender name
 *   system   — centered, italic muted text, no bubble
 */

import React from "react";
import { motion } from "motion/react";
import { Check, CheckCheck, Clock, AlertCircle } from "lucide-react";
import Avatar from "@/components/feedback/Avatar";
import type { ChatBubbleProps } from "./ChatBubble.types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusIcon({ status }: { status: NonNullable<ChatBubbleProps["status"]> }) {
  const cls = "text-white/60";
  switch (status) {
    case "SENDING":
      return <Clock size={12} strokeWidth={2} className={cls} aria-hidden="true" />;
    case "SENT":
      return <Check size={12} strokeWidth={2} className={cls} aria-hidden="true" />;
    case "DELIVERED":
      return <CheckCheck size={12} strokeWidth={2} className={cls} aria-hidden="true" />;
    case "READ":
      return <CheckCheck size={12} strokeWidth={2} className="text-sky-300" aria-hidden="true" />;
    case "FAILED":
      return <AlertCircle size={12} strokeWidth={2} className="text-red-400" aria-hidden="true" />;
  }
}

// ---------------------------------------------------------------------------
// ChatBubble
// ---------------------------------------------------------------------------

export default function ChatBubble({
  body,
  sentAt,
  variant,
  senderName,
  senderAvatarUrl,
  imageUrl,
  status,
}: ChatBubbleProps) {
  // System message
  if (variant === "system") {
    return (
      <motion.div
        className="flex justify-center my-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <p className="text-xs italic text-muted-slate px-4 py-1 bg-gray-50 rounded-full">
          {body}
        </p>
      </motion.div>
    );
  }

  const isOutgoing = variant === "outgoing";

  return (
    <motion.div
      className={`flex items-end gap-2 ${isOutgoing ? "flex-row-reverse" : "flex-row"} my-1`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Avatar — incoming only */}
      {!isOutgoing && (
        <Avatar
          src={senderAvatarUrl ?? null}
          alt={senderName ?? "User"}
          size="xs"
          className="flex-shrink-0 mb-1"
        />
      )}

      <div className={`flex flex-col gap-0.5 max-w-xs ${isOutgoing ? "items-end" : "items-start"}`}>
        {/* Sender name — incoming only */}
        {!isOutgoing && senderName && (
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-slate px-1">
            {senderName}
          </p>
        )}

        {/* Bubble */}
        <div
          className={[
            "px-4 py-2.5 text-sm leading-relaxed",
            isOutgoing
              ? "bg-ink text-white rounded-2xl rounded-br-sm"
              : "bg-white border border-gray-100 text-ink rounded-2xl rounded-bl-sm shadow-xs",
            status === "FAILED" ? "border-2 border-red-200" : "",
          ].join(" ")}
        >
          {body}
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt="Attachment"
              className="mt-2 rounded-xl max-w-[200px] object-cover"
            />
          )}
        </div>

        {/* Failed error */}
        {status === "FAILED" && (
          <p className="text-[10px] text-red-500 px-1">Failed to send</p>
        )}

        {/* Time + status */}
        <div className={`flex items-center gap-1 px-1 ${isOutgoing ? "flex-row-reverse" : ""}`}>
          <span className="text-[10px] font-mono text-muted-slate">
            {formatTime(sentAt)}
          </span>
          {isOutgoing && status && <StatusIcon status={status} />}
        </div>
      </div>
    </motion.div>
  );
}
