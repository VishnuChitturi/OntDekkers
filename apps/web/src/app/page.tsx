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
 *   ToastProvider           → fixed bottom-right stack   z-[60]
 *   GlobalSearch            → fixed full-screen          z-[55]
 *   FloatingCreateButton    → fixed bottom-right         z-[46]
 *   NotificationsDrawer     → fixed bottom sheet         z-50
 *   Modal                   → fixed centred              z-50
 *   Dialog                  → fixed centred              z-50
 *   Drawer                  → fixed bottom sheet         z-50
 *
 * The Navbar and Sidebar never unmount. Only the active workspace changes.
 */

import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import { ToastProvider } from "@/components/overlays/Toast";
import { NotificationsDrawer } from "@/components/overlays/NotificationsDrawer";
import { GlobalSearch } from "@/components/overlays/GlobalSearch";
import { FloatingCreateButton } from "@/components/overlays/FloatingCreateButton";
import { useRouter } from "@/router/Router";
import { useAppState } from "@/contexts/AppStateProvider";
import { PRIMARY_NAV_ITEMS } from "@/state/navigation";
import DiscoverView from "@/views/Discover";
import { GuidesView, GuidePortfolioView, MyGuidesView } from "@/views/Guides";
import { CommunitiesView, CommunityDetailView } from "@/views/Communities";
import { MyTripsView, ExpeditionWorkspaceView } from "@/views/Trips";
import { MessagesView } from "@/views/Messages";
import { ProfileView } from "@/views/Profile";
import { SettingsView } from "@/views/Settings";
import type { NavigationItem } from "@/types";

// ---------------------------------------------------------------------------
// Active workspace — view-driven, wrapped in AnimatePresence for transitions
// ---------------------------------------------------------------------------

function ActiveWorkspace() {
  const { currentView } = useRouter();

  function renderView() {
    switch (currentView) {
      case "discover":
        return <DiscoverView />;
      case "communities":
        return <CommunitiesView />;
      case "community-detail":
        return <CommunityDetailView />;
      case "my-trips":
        return <MyTripsView />;
      case "expedition-workspace":
        return <ExpeditionWorkspaceView />;
      case "guides":
        return <GuidesView />;
      case "guide-portfolio":
        return <GuidePortfolioView />;
      case "my-guides":
        return <MyGuidesView />;
      case "messages":
        return <MessagesView />;
      case "profile":
        return <ProfileView />;
      case "settings":
        return <SettingsView />;
      default:
        return <DiscoverView />;
    }
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentView}
        className="flex-1 min-h-full"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
      >
        {renderView()}
      </motion.div>
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Application shell
// ---------------------------------------------------------------------------

export default function AppShell() {
  const { state } = useAppState();
  const { unreadMessagesCount } = state;
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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
        <Navbar onSearchOpen={() => setIsSearchOpen(true)} />

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

      {/* ── Overlays (rendered outside main layout flow) ─────────────── */}
      <NotificationsDrawer />
      <GlobalSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
      <FloatingCreateButton />
    </ToastProvider>
  );
}
