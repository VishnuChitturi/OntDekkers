"use client";

/**
 * OntDekker — Application Shell
 *
 * Assembles the persistent application shell:
 *
 *   ┌──────────────────────────────────────────────┐
 *   │                   Navbar                     │ ← sticky, z-40
 *   ├─────────────────┬────────────────────────────┤
 *   │                 │                            │
 *   │    Sidebar      │      Active Workspace      │
 *   │  (collapsible)  │    (view-driven content)   │
 *   │                 │                            │
 *   └─────────────────┴────────────────────────────┘
 *
 * Overlay hierarchy (above the workspace, never replacing it):
 *   ToastProvider  → fixed bottom-right stack   z-[60]
 *   Modal          → fixed centred              z-50
 *   Dialog         → fixed centred              z-50
 *   Drawer         → fixed bottom sheet         z-50
 *
 * The Navbar and Sidebar never unmount. Only the active workspace changes.
 */

import React, { useMemo } from "react";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import { ToastProvider } from "@/components/overlays/Toast";
import { useRouter } from "@/router/Router";
import { useAppState } from "@/contexts/AppStateProvider";
import { PRIMARY_NAV_ITEMS } from "@/state/navigation";
import DiscoverView from "@/views/Discover";
import type { NavigationItem } from "@/types";

// ---------------------------------------------------------------------------
// Workspace placeholder — replaced in future checkpoints with real views
// ---------------------------------------------------------------------------

function WorkspacePlaceholder({ view }: { view: string }) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center space-y-3">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-slate">
          Workspace
        </p>
        <h2 className="text-2xl font-bold tracking-tight text-ink capitalize">
          {view.replace(/-/g, " ")}
        </h2>
        <p className="text-sm text-charcoal max-w-xs">
          This view will be implemented in a future checkpoint.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Active workspace — switches on currentView from virtual router
// ---------------------------------------------------------------------------

function ActiveWorkspace() {
  const { currentView } = useRouter();

  switch (currentView) {
    case "discover":
      return <DiscoverView />;
    case "communities":
      return <WorkspacePlaceholder view="communities" />;
    case "community-detail":
      return <WorkspacePlaceholder view="community detail" />;
    case "my-trips":
      return <WorkspacePlaceholder view="my trips" />;
    case "expedition-workspace":
      return <WorkspacePlaceholder view="expedition workspace" />;
    case "guides":
      return <WorkspacePlaceholder view="guides" />;
    case "guide-portfolio":
      return <WorkspacePlaceholder view="guide portfolio" />;
    case "messages":
      return <WorkspacePlaceholder view="messages" />;
    case "profile":
      return <WorkspacePlaceholder view="profile" />;
    case "settings":
      return <WorkspacePlaceholder view="settings" />;
    default:
      return <WorkspacePlaceholder view="discover" />;
  }
}

// ---------------------------------------------------------------------------
// Application shell
// ---------------------------------------------------------------------------

export default function AppShell() {
  const { state } = useAppState();
  const { unreadMessagesCount } = state;

  // Merge runtime badge counts into the static nav items
  const navItems: NavigationItem[] = useMemo(
    () =>
      PRIMARY_NAV_ITEMS.map((item) => {
        if (item.id === "messages") {
          return { ...item, badgeCount: unreadMessagesCount };
        }
        return item;
      }),
    [unreadMessagesCount],
  );

  return (
    /*
     * ToastProvider wraps the entire shell so any descendant component
     * can call useToast() to trigger notifications.
     */
    <ToastProvider>
      <div className="flex flex-col min-h-screen bg-canvas">
        {/* ── Top navigation bar ──────────────────────────────────────── */}
        <Navbar />

        {/* ── Body row (sidebar + active workspace) ───────────────────── */}
        <div className="flex flex-1 overflow-hidden">
          {/* Primary sidebar */}
          <Sidebar items={navItems} />

          {/* Active workspace — grows to fill remaining width */}
          <main
            id="main-content"
            className="flex-1 overflow-y-auto focus:outline-none"
            tabIndex={-1}
          >
            <ActiveWorkspace />
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
