"use client";

/**
 * OntDekker ProfileView
 *
 * User profile page. Shows the current user's profile.
 *
 * Structure (02-information-architecture.md § Profile):
 *   ProfileHeader (cover, XL avatar, bio, stats, edit button)
 *   Tabs: Journal | Saved | Settings
 *     Journal  → user's story posts (stub — requires feed integration)
 *     Saved    → saved stories + saved guides
 *     Settings → links to SettingsView
 *
 * Uses ProfileHeader component (CP26), Tabs (CP24), Avatar (CP24).
 * Reads user from AppState.user (set on auth).
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BookOpen, Bookmark, Settings, UserCircle } from "lucide-react";

import ProfileHeader from "@/components/headers/ProfileHeader";
import Tabs from "@/components/navigation/Tabs";

import { useAppState } from "@/contexts/AppStateProvider";
import { useRouter } from "@/router/Router";

import type { TabItem } from "@/components/navigation/Tabs";
import type { UserProfile } from "@/types";

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

const TABS: TabItem[] = [
  { id: "journal", label: "Journal",  icon: BookOpen },
  { id: "saved",   label: "Saved",    icon: Bookmark },
  { id: "settings",label: "Settings", icon: Settings },
];

// ---------------------------------------------------------------------------
// Tab panels
// ---------------------------------------------------------------------------

function JournalTab() {
  return (
    <motion.div
      className="flex flex-col items-center py-16 text-center space-y-3"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <BookOpen size={36} strokeWidth={1} className="text-gray-200" aria-hidden="true" />
      <p className="text-sm text-charcoal">Your travel journal.</p>
      <p className="text-xs text-muted-slate max-w-xs">
        Stories you&apos;ve published will appear here.
      </p>
    </motion.div>
  );
}

function SavedTab() {
  const { state } = useAppState();
  const { navigateTo } = useRouter();

  const hasSavedGuides = state.savedGuides.length > 0;
  const hasSavedPosts = state.feedPosts.filter((p) => p.isSaved).length > 0;

  if (!hasSavedGuides && !hasSavedPosts) {
    return (
      <motion.div
        className="flex flex-col items-center py-16 text-center space-y-3"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <Bookmark size={36} strokeWidth={1} className="text-gray-200" aria-hidden="true" />
        <p className="text-sm text-charcoal">Nothing saved yet.</p>
        <p className="text-xs text-muted-slate max-w-xs">
          Bookmark stories and guides to find them here later.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="py-6 space-y-6"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Saved guides */}
      {hasSavedGuides && (
        <section aria-label="Saved guides">
          <h3 className="text-xs font-mono uppercase tracking-wider text-muted-slate mb-3">
            Saved Guides ({state.savedGuides.length})
          </h3>
          <div className="space-y-2">
            {state.savedGuides.map((guide) => (
              <button
                key={guide.id}
                type="button"
                onClick={() => navigateTo("guide-portfolio", guide.id)}
                className="
                  w-full flex items-center gap-3 p-3
                  bg-white border border-gray-100 rounded-2xl
                  hover:shadow-sm transition-all duration-[var(--duration-responsive)]
                  focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink
                "
              >
                <span className="text-sm font-medium text-ink truncate">{guide.displayName}</span>
              </button>
            ))}
          </div>
        </section>
      )}
    </motion.div>
  );
}

function SettingsLinkTab() {
  const { navigateTo } = useRouter();
  return (
    <motion.div
      className="py-6"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <button
        type="button"
        onClick={() => navigateTo("settings")}
        className="
          w-full flex items-center gap-3 p-4
          bg-white border border-gray-100 rounded-2xl
          hover:shadow-sm transition-all duration-[var(--duration-responsive)]
          focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink
        "
      >
        <Settings size={18} strokeWidth={2} className="text-charcoal" aria-hidden="true" />
        <span className="text-sm font-medium text-ink">Account Settings</span>
        <span className="ml-auto text-muted-slate">→</span>
      </button>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Unauthenticated / loading state
// ---------------------------------------------------------------------------

function NotSignedIn() {
  return (
    <div className="container-main py-16 flex flex-col items-center gap-4 text-center">
      <UserCircle size={48} strokeWidth={1} className="text-gray-200" aria-hidden="true" />
      <p className="text-sm font-semibold text-ink">You are not signed in.</p>
      <p className="text-xs text-muted-slate max-w-xs">
        Sign in to view your profile, journal, and saved content.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ProfileView
// ---------------------------------------------------------------------------

export default function ProfileView() {
  const { state, dispatch } = useAppState();
  const [activeTab, setActiveTab] = useState("journal");

  const { user } = state;

  if (!state.isAuthReady || !user) {
    return <NotSignedIn />;
  }

  // Construct a UserProfile from AuthUser for the ProfileHeader
  const profile: UserProfile = {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    bio: null,
    avatarUrl: user.avatarUrl,
    coverImageUrl: null,
    countriesVisited: 0,
    expeditionsCount: state.myExpeditions.length,
    followersCount: 0,
    followingCount: 0,
    isFollowing: false,
    createdAt: new Date().toISOString(),
  };

  return (
    <motion.div
      className="pb-20"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
    >
      {/* Profile header */}
      <div className="container-main pt-6">
        <ProfileHeader
          user={profile}
          isOwner={true}
          onEditToggle={() => dispatch({ type: "SIDEBAR_TOGGLE" })}
        />
      </div>

      {/* Tabs */}
      <div className="container-main mt-6">
        <Tabs tabs={TABS} activeTabId={activeTab} onChange={setActiveTab} />
      </div>

      {/* Tab content */}
      <div className="container-main mt-5">
        <AnimatePresence mode="wait">
          {activeTab === "journal"  && <JournalTab key="journal" />}
          {activeTab === "saved"    && <SavedTab key="saved" />}
          {activeTab === "settings" && <SettingsLinkTab key="settings" />}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
