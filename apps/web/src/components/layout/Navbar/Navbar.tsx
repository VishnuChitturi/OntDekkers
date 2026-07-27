"use client";

/**
 * OntDekker Navbar
 *
 * Global application header — always visible at the top of the shell.
 * Contains branding, global search trigger, notifications bell, messages
 * shortcut, and user profile access.
 *
 * Accessibility:
 *   - role="banner" (implicit on <header>)
 *   - aria-label on interactive icon buttons
 *   - aria-current="page" forwarded from currentView
 *   - Keyboard navigable — all interactive elements are native <button> or <a>
 */

import React from "react";
import { Bell, MessageCircle, Search, Menu, Compass } from "lucide-react";
import { useRouter } from "@/router/Router";
import { useAppState } from "@/contexts/AppStateProvider";
import type { NavbarProps } from "./Navbar.types";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Navbar({ className = "", onSearchOpen }: NavbarProps) {
  const { navigateTo } = useRouter();
  const { state, dispatch } = useAppState();

  const { user, unreadNotificationsCount, unreadMessagesCount } = state;

  function handleNotificationsClick() {
    dispatch({ type: "NOTIFICATIONS_DRAWER_TOGGLE" });
  }

  function handleMessagesClick() {
    navigateTo("messages");
  }

  function handleProfileClick() {
    navigateTo("profile");
  }

  function handleSidebarToggle() {
    dispatch({ type: "SIDEBAR_TOGGLE" });
  }

  return (
    <header
      className={[
        "glass",
        "sticky top-0 z-40",
        "h-14 px-4",
        "flex items-center justify-between gap-4",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* ── Left — hamburger + wordmark ──────────────────────────────────── */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Sidebar toggle (visible on all breakpoints) */}
        <button
          type="button"
          aria-label="Toggle sidebar"
          onClick={handleSidebarToggle}
          className="
            flex items-center justify-center
            w-8 h-8 rounded-lg
            text-charcoal hover:bg-gray-100
            transition-colors duration-[var(--duration-responsive)]
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink
          "
        >
          <Menu size={18} strokeWidth={1.75} aria-hidden="true" />
        </button>

        {/* Wordmark */}
        <button
          type="button"
          aria-label="Go to Discover"
          onClick={() => navigateTo("discover")}
          className="
            flex items-center gap-1.5
            font-bold text-sm tracking-tight text-ink
            hover:opacity-75
            transition-opacity duration-[var(--duration-responsive)]
          "
        >
          <Compass
            size={16}
            strokeWidth={2}
            aria-hidden="true"
            className="text-ink"
          />
          <span>OntDekker</span>
        </button>
      </div>

      {/* ── Right — actions ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-1">
        {/* Global search trigger */}
        <button
          type="button"
          aria-label="Open global search"
          onClick={onSearchOpen}
          className="
            flex items-center justify-center
            w-8 h-8 rounded-lg
            text-charcoal hover:bg-gray-100
            transition-colors duration-[var(--duration-responsive)]
          "
        >
          <Search size={17} strokeWidth={1.75} aria-hidden="true" />
        </button>

        {/* Messages */}
        <button
          type="button"
          aria-label={
            unreadMessagesCount > 0
              ? `Messages — ${unreadMessagesCount} unread`
              : "Messages"
          }
          onClick={handleMessagesClick}
          className="
            relative
            flex items-center justify-center
            w-8 h-8 rounded-lg
            text-charcoal hover:bg-gray-100
            transition-colors duration-[var(--duration-responsive)]
          "
        >
          <MessageCircle size={17} strokeWidth={1.75} aria-hidden="true" />
          {unreadMessagesCount > 0 && (
            <span
              aria-hidden="true"
              className="
                absolute top-1 right-1
                w-2 h-2 rounded-full bg-moss-green
                ring-2 ring-white
              "
            />
          )}
        </button>

        {/* Notifications */}
        <button
          type="button"
          aria-label={
            unreadNotificationsCount > 0
              ? `Notifications — ${unreadNotificationsCount} unread`
              : "Notifications"
          }
          onClick={handleNotificationsClick}
          className="
            relative
            flex items-center justify-center
            w-8 h-8 rounded-lg
            text-charcoal hover:bg-gray-100
            transition-colors duration-[var(--duration-responsive)]
          "
        >
          <Bell size={17} strokeWidth={1.75} aria-hidden="true" />
          {unreadNotificationsCount > 0 && (
            <span
              aria-hidden="true"
              className="
                absolute top-1 right-1
                min-w-[14px] h-[14px] px-0.5
                flex items-center justify-center
                rounded-full bg-amber-ochre text-white
                text-[9px] font-bold font-mono leading-none
                ring-2 ring-white
              "
            >
              {unreadNotificationsCount > 99 ? "99+" : unreadNotificationsCount}
            </span>
          )}
        </button>

        {/* Avatar / profile */}
        <button
          type="button"
          aria-label="Your profile"
          onClick={handleProfileClick}
          className="
            ml-1
            w-7 h-7 rounded-full
            bg-gray-200 overflow-hidden
            ring-2 ring-transparent hover:ring-gray-300
            transition-all duration-[var(--duration-responsive)]
            flex-shrink-0
          "
        >
          {user?.avatarUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={user.avatarUrl}
              alt={user.displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex items-center justify-center w-full h-full text-[10px] font-bold text-charcoal uppercase"
            >
              {user?.displayName?.charAt(0) ?? "?"}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
