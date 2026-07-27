"use client";

/**
 * OntDekker MessagesView
 *
 * Unified communication center.
 *
 * Layout (03-screen-specs.md § Messaging Module):
 *   Desktop: Conversation list (left, w-72) + Chat window (right, flex-1)
 *   Mobile:  Conversation list OR Chat screen (stacked, navigate between)
 *
 * Conversation types: Private | Guide | Community | Expedition
 *
 * States:
 *   No conversation selected → "Select a conversation." empty panel
 *   Conversation selected    → Chat window with message history
 *   Loading                  → Skeleton list
 *
 * Data: reads from AppState.conversations (populated by SWR in a real app).
 * For now renders gracefully with empty state until backend chat service
 * is integrated.
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageCircle, Search, ChevronLeft } from "lucide-react";

import Avatar from "@/components/feedback/Avatar";
import Badge from "@/components/feedback/Badge";
import SearchInput from "@/components/navigation/Search";

import { useAppState } from "@/contexts/AppStateProvider";
import type { Conversation, ConversationType } from "@/types";

// ---------------------------------------------------------------------------
// Type badge colours
// ---------------------------------------------------------------------------

const TYPE_VARIANT: Record<ConversationType, "default" | "info" | "success" | "warning"> = {
  PRIVATE: "default",
  COMMUNITY: "info",
  EXPEDITION: "warning",
};

const TYPE_LABEL: Record<ConversationType, string> = {
  PRIVATE: "Private",
  COMMUNITY: "Community",
  EXPEDITION: "Expedition",
};

// ---------------------------------------------------------------------------
// Conversation list item
// ---------------------------------------------------------------------------

function ConversationItem({
  conversation,
  isActive,
  onClick,
}: {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}) {
  const name =
    conversation.otherParticipant?.displayName ??
    conversation.groupName ??
    "Unknown";
  const avatar = conversation.otherParticipant?.avatarUrl ?? null;
  const lastMsg = conversation.lastMessage?.body ?? "No messages yet.";
  const hasUnread = conversation.unreadCount > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={isActive ? "true" : undefined}
      className={[
        "w-full flex items-start gap-3 px-4 py-3 text-left",
        "transition-colors duration-[var(--duration-responsive)]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink",
        isActive
          ? "bg-gray-100"
          : "hover:bg-gray-50",
      ].join(" ")}
    >
      <Avatar src={avatar} alt={name} size="sm" className="mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-sm truncate ${hasUnread ? "font-semibold text-ink" : "font-medium text-charcoal"}`}>
            {name}
          </span>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Badge variant={TYPE_VARIANT[conversation.type]} size="sm">
              {TYPE_LABEL[conversation.type]}
            </Badge>
            {hasUnread && (
              <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-ink text-white text-[10px] font-bold font-mono">
                {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
              </span>
            )}
          </div>
        </div>
        <p className={`text-xs truncate ${hasUnread ? "text-charcoal" : "text-muted-slate"}`}>
          {lastMsg}
        </p>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Skeleton list
// ---------------------------------------------------------------------------

function ConversationSkeleton() {
  return (
    <div aria-hidden="true">
      {Array.from({ length: 6 }, (_, i) => (
        <motion.div
          key={i}
          className="flex items-start gap-3 px-4 py-3"
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.1 }}
        >
          <div className="w-8 h-8 rounded-full bg-gray-100 flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-24 rounded-full bg-gray-100" />
            <div className="h-2.5 w-40 rounded-full bg-gray-100" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chat window
// ---------------------------------------------------------------------------

function ChatWindow({ conversation }: { conversation: Conversation }) {
  const name =
    conversation.otherParticipant?.displayName ??
    conversation.groupName ??
    "Chat";

  return (
    <motion.div
      className="flex flex-col h-full"
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, ease: [0, 0, 0.2, 1] }}
      key={conversation.id}
    >
      {/* Chat header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 shrink-0">
        <Avatar
          src={conversation.otherParticipant?.avatarUrl ?? null}
          alt={name}
          size="sm"
        />
        <div>
          <p className="text-sm font-semibold text-ink">{name}</p>
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-slate">
            {TYPE_LABEL[conversation.type]}
          </p>
        </div>
      </div>

      {/* Message area */}
      <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col justify-end">
        {conversation.lastMessage ? (
          <div className="space-y-3">
            <div className="flex items-end gap-2 justify-end">
              <div className="max-w-xs bg-ink text-white text-sm px-4 py-2.5 rounded-2xl rounded-br-sm">
                {conversation.lastMessage.body}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center space-y-2 py-12">
            <MessageCircle size={32} strokeWidth={1} className="text-gray-200" aria-hidden="true" />
            <p className="text-sm text-charcoal">Start your conversation with {name}.</p>
          </div>
        )}
      </div>

      {/* Message input */}
      <div className="px-5 py-4 border-t border-gray-100 shrink-0">
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Type a message…"
            aria-label="Message input"
            className="
              flex-1 bg-gray-50 border border-gray-200 rounded-xl
              px-4 py-2.5 text-sm text-ink
              focus:outline-none focus:bg-white focus:border-ink focus:ring-1 focus:ring-ink
              transition-all duration-[var(--duration-responsive)]
              placeholder:text-muted-slate
            "
          />
          <button
            type="button"
            aria-label="Send message"
            className="
              flex items-center justify-center
              w-9 h-9 rounded-xl bg-ink text-white
              hover:bg-neutral-800 transition-colors duration-[var(--duration-responsive)]
              focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink
            "
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Empty panel
// ---------------------------------------------------------------------------

function EmptyPanel() {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-3 text-center p-8">
      <MessageCircle size={40} strokeWidth={1} className="text-gray-200" aria-hidden="true" />
      <p className="text-sm font-semibold text-ink">Select a conversation.</p>
      <p className="text-xs text-muted-slate max-w-xs">
        Choose a conversation from the list to start messaging.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MessagesView
// ---------------------------------------------------------------------------

export default function MessagesView() {
  const { state } = useAppState();
  const { conversations } = state;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileShowChat, setMobileShowChat] = useState(false);

  const isLoading = !state.isAuthReady;

  const filteredConversations = searchQuery.trim()
    ? conversations.filter((c) => {
        const name = c.otherParticipant?.displayName ?? c.groupName ?? "";
        return name.toLowerCase().includes(searchQuery.toLowerCase());
      })
    : conversations;

  const selectedConversation = conversations.find((c) => c.id === selectedId) ?? null;

  function handleSelect(conversation: Conversation) {
    setSelectedId(conversation.id);
    setMobileShowChat(true);
  }

  return (
    <motion.div
      className="flex h-[calc(100vh-3.5rem)] bg-canvas"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      {/* ── Conversation list panel ─────────────────────────────────────── */}
      <div
        className={[
          "flex flex-col border-r border-gray-100 bg-white",
          "w-full md:w-72 shrink-0",
          mobileShowChat ? "hidden md:flex" : "flex",
        ].join(" ")}
      >
        {/* Panel header */}
        <div className="px-4 py-4 border-b border-gray-100 space-y-3 shrink-0">
          <h1 className="text-base font-bold tracking-tight text-ink">Messages</h1>
          <SearchInput
            placeholder="Search conversations…"
            value={searchQuery}
            onChange={setSearchQuery}
            ariaLabel="Search conversations"
          />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <ConversationSkeleton />
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center space-y-2 px-4">
              <MessageCircle size={32} strokeWidth={1} className="text-gray-200" aria-hidden="true" />
              <p className="text-sm text-charcoal">
                {searchQuery ? "No conversations match your search." : "No conversations yet."}
              </p>
            </div>
          ) : (
            <div role="list" aria-label="Conversations">
              {filteredConversations.map((c) => (
                <div key={c.id} role="listitem">
                  <ConversationItem
                    conversation={c}
                    isActive={c.id === selectedId}
                    onClick={() => handleSelect(c)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Chat window ─────────────────────────────────────────────────── */}
      <div
        className={[
          "flex-1 flex flex-col",
          mobileShowChat ? "flex" : "hidden md:flex",
        ].join(" ")}
      >
        {/* Mobile back button */}
        {mobileShowChat && (
          <button
            type="button"
            aria-label="Back to conversations"
            onClick={() => setMobileShowChat(false)}
            className="
              md:hidden flex items-center gap-1.5 px-4 py-3
              text-xs text-muted-slate hover:text-ink
              border-b border-gray-100
              transition-colors duration-[var(--duration-responsive)]
            "
          >
            <ChevronLeft size={14} strokeWidth={2} aria-hidden="true" />
            Back
          </button>
        )}

        <AnimatePresence mode="wait">
          {selectedConversation ? (
            <ChatWindow key={selectedConversation.id} conversation={selectedConversation} />
          ) : (
            <EmptyPanel key="empty" />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
