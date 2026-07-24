"use client";

/**
 * OntDekker AppStateProvider
 *
 * Centralized state container for the entire frontend application.
 * Every domain collection (user, notifications, conversations, etc.) lives
 * here so that components can consume data without prop-drilling.
 *
 * Architecture principles followed:
 *  - Immutable state updates via useReducer
 *  - Actions are typed discriminated unions
 *  - Selectors are exposed as plain values (no memoised selectors needed yet)
 *  - Business logic stays in services; the provider only manages state
 *
 * Usage:
 *   const { user, unreadNotificationsCount, dispatch } = useAppState();
 */

import React, { createContext, useContext, useReducer } from "react";
import type {
  AuthUser,
  Notification,
  Conversation,
  Community,
  ExpeditionSummary,
  GuideProfileSummary,
  Post,
} from "@/types";

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

export interface AppState {
  /** Authenticated user — null while unauthenticated */
  user: AuthUser | null;
  /** Whether the initial auth check has completed */
  isAuthReady: boolean;

  // ── Feed ──────────────────────────────────────────────────────────────────
  feedPosts: Post[];
  isFeedLoading: boolean;

  // ── Communities ───────────────────────────────────────────────────────────
  joinedCommunities: Community[];
  suggestedCommunities: Community[];

  // ── Expeditions ───────────────────────────────────────────────────────────
  myExpeditions: ExpeditionSummary[];

  // ── Guides ────────────────────────────────────────────────────────────────
  savedGuides: GuideProfileSummary[];

  // ── Messaging ─────────────────────────────────────────────────────────────
  conversations: Conversation[];
  unreadMessagesCount: number;

  // ── Notifications ─────────────────────────────────────────────────────────
  notifications: Notification[];
  unreadNotificationsCount: number;

  // ── UI flags ──────────────────────────────────────────────────────────────
  isSidebarOpen: boolean;
  isNotificationsDrawerOpen: boolean;
  isCreateMenuOpen: boolean;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export type AppAction =
  // Auth
  | { type: "AUTH_READY"; user: AuthUser | null }
  | { type: "SIGN_OUT" }

  // Feed
  | { type: "FEED_LOADING" }
  | { type: "FEED_LOADED"; posts: Post[] }
  | { type: "POST_LIKE_TOGGLED"; postId: string; liked: boolean }
  | { type: "POST_SAVE_TOGGLED"; postId: string; saved: boolean }

  // Communities
  | { type: "JOINED_COMMUNITIES_LOADED"; communities: Community[] }
  | { type: "SUGGESTED_COMMUNITIES_LOADED"; communities: Community[] }
  | { type: "COMMUNITY_JOIN_TOGGLED"; communityId: string; joined: boolean }

  // Expeditions
  | { type: "MY_EXPEDITIONS_LOADED"; expeditions: ExpeditionSummary[] }

  // Guides
  | { type: "SAVED_GUIDES_LOADED"; guides: GuideProfileSummary[] }
  | { type: "GUIDE_BOOKMARK_TOGGLED"; guideId: string; bookmarked: boolean }

  // Messaging
  | { type: "CONVERSATIONS_LOADED"; conversations: Conversation[]; unreadCount: number }
  | { type: "UNREAD_MESSAGES_UPDATED"; count: number }

  // Notifications
  | { type: "NOTIFICATIONS_LOADED"; notifications: Notification[]; unreadCount: number }
  | { type: "NOTIFICATION_READ"; notificationId: string }
  | { type: "ALL_NOTIFICATIONS_READ" }

  // UI
  | { type: "SIDEBAR_TOGGLE"; open?: boolean }
  | { type: "NOTIFICATIONS_DRAWER_TOGGLE"; open?: boolean }
  | { type: "CREATE_MENU_TOGGLE"; open?: boolean };

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const initialState: AppState = {
  user: null,
  isAuthReady: false,

  feedPosts: [],
  isFeedLoading: false,

  joinedCommunities: [],
  suggestedCommunities: [],

  myExpeditions: [],

  savedGuides: [],

  conversations: [],
  unreadMessagesCount: 0,

  notifications: [],
  unreadNotificationsCount: 0,

  isSidebarOpen: true,
  isNotificationsDrawerOpen: false,
  isCreateMenuOpen: false,
};

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    // ── Auth ────────────────────────────────────────────────────────────────
    case "AUTH_READY":
      return { ...state, isAuthReady: true, user: action.user };

    case "SIGN_OUT":
      return {
        ...initialState,
        isAuthReady: true,
        isSidebarOpen: state.isSidebarOpen,
      };

    // ── Feed ────────────────────────────────────────────────────────────────
    case "FEED_LOADING":
      return { ...state, isFeedLoading: true };

    case "FEED_LOADED":
      return { ...state, isFeedLoading: false, feedPosts: action.posts };

    case "POST_LIKE_TOGGLED":
      return {
        ...state,
        feedPosts: state.feedPosts.map((p) =>
          p.id === action.postId
            ? {
                ...p,
                isLiked: action.liked,
                likesCount: p.likesCount + (action.liked ? 1 : -1),
              }
            : p,
        ),
      };

    case "POST_SAVE_TOGGLED":
      return {
        ...state,
        feedPosts: state.feedPosts.map((p) =>
          p.id === action.postId ? { ...p, isSaved: action.saved } : p,
        ),
      };

    // ── Communities ─────────────────────────────────────────────────────────
    case "JOINED_COMMUNITIES_LOADED":
      return { ...state, joinedCommunities: action.communities };

    case "SUGGESTED_COMMUNITIES_LOADED":
      return { ...state, suggestedCommunities: action.communities };

    case "COMMUNITY_JOIN_TOGGLED":
      return {
        ...state,
        joinedCommunities: action.joined
          ? state.joinedCommunities
          : state.joinedCommunities.filter((c) => c.id !== action.communityId),
        suggestedCommunities: state.suggestedCommunities.map((c) =>
          c.id === action.communityId ? { ...c, isMember: action.joined } : c,
        ),
      };

    // ── Expeditions ─────────────────────────────────────────────────────────
    case "MY_EXPEDITIONS_LOADED":
      return { ...state, myExpeditions: action.expeditions };

    // ── Guides ──────────────────────────────────────────────────────────────
    case "SAVED_GUIDES_LOADED":
      return { ...state, savedGuides: action.guides };

    case "GUIDE_BOOKMARK_TOGGLED":
      return {
        ...state,
        savedGuides: action.bookmarked
          ? state.savedGuides
          : state.savedGuides.filter((g) => g.id !== action.guideId),
      };

    // ── Messaging ───────────────────────────────────────────────────────────
    case "CONVERSATIONS_LOADED":
      return {
        ...state,
        conversations: action.conversations,
        unreadMessagesCount: action.unreadCount,
      };

    case "UNREAD_MESSAGES_UPDATED":
      return { ...state, unreadMessagesCount: action.count };

    // ── Notifications ───────────────────────────────────────────────────────
    case "NOTIFICATIONS_LOADED":
      return {
        ...state,
        notifications: action.notifications,
        unreadNotificationsCount: action.unreadCount,
      };

    case "NOTIFICATION_READ":
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.notificationId ? { ...n, isRead: true } : n,
        ),
        unreadNotificationsCount: Math.max(0, state.unreadNotificationsCount - 1),
      };

    case "ALL_NOTIFICATIONS_READ":
      return {
        ...state,
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadNotificationsCount: 0,
      };

    // ── UI ──────────────────────────────────────────────────────────────────
    case "SIDEBAR_TOGGLE":
      return {
        ...state,
        isSidebarOpen: action.open !== undefined ? action.open : !state.isSidebarOpen,
      };

    case "NOTIFICATIONS_DRAWER_TOGGLE":
      return {
        ...state,
        isNotificationsDrawerOpen:
          action.open !== undefined ? action.open : !state.isNotificationsDrawerOpen,
      };

    case "CREATE_MENU_TOGGLE":
      return {
        ...state,
        isCreateMenuOpen:
          action.open !== undefined ? action.open : !state.isCreateMenuOpen,
      };

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface AppStateContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppStateContext.Provider value={{ state, dispatch }}>
      {children}
    </AppStateContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAppState(): AppStateContextValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error("useAppState must be used inside <AppStateProvider>");
  }
  return ctx;
}
