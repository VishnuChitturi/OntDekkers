"use client";

/**
 * OntDekker Virtual Router
 *
 * A lightweight React context that exposes navigation primitives to the
 * entire application.  Views render conditionally based on `currentView`;
 * the persistent shell (Navbar + Sidebar) never unmounts between navigations.
 *
 * Usage:
 *   const { currentView, currentId, navigateTo, goBack, canGoBack } = useRouter();
 */

import React, { createContext, useCallback, useContext, useReducer } from "react";
import type { ViewName, UUID } from "@/types";
import {
  createHistoryStack,
  pushEntry,
  goBackInStack,
  currentEntry,
  canGoBack,
  type HistoryStack,
} from "./history";

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

interface RouterContextValue {
  currentView: ViewName;
  currentId: UUID | undefined;
  canGoBack: boolean;
  navigateTo: (view: ViewName, id?: UUID) => void;
  goBack: () => void;
}

const RouterContext = createContext<RouterContextValue | null>(null);

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

type RouterAction =
  | { type: "NAVIGATE"; view: ViewName; id?: UUID }
  | { type: "GO_BACK" };

function routerReducer(state: HistoryStack, action: RouterAction): HistoryStack {
  switch (action.type) {
    case "NAVIGATE":
      return pushEntry(state, { view: action.view, id: action.id });
    case "GO_BACK":
      return goBackInStack(state);
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface RouterProviderProps {
  children: React.ReactNode;
  initialView?: ViewName;
}

export function RouterProvider({
  children,
  initialView = "discover",
}: RouterProviderProps) {
  const [stack, dispatch] = useReducer(
    routerReducer,
    initialView,
    createHistoryStack,
  );

  const navigateTo = useCallback((view: ViewName, id?: UUID) => {
    dispatch({ type: "NAVIGATE", view, id });
  }, []);

  const goBack = useCallback(() => {
    dispatch({ type: "GO_BACK" });
  }, []);

  const entry = currentEntry(stack);

  const value: RouterContextValue = {
    currentView: entry.view,
    currentId: entry.id,
    canGoBack: canGoBack(stack),
    navigateTo,
    goBack,
  };

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useRouter(): RouterContextValue {
  const ctx = useContext(RouterContext);
  if (!ctx) {
    throw new Error("useRouter must be used inside <RouterProvider>");
  }
  return ctx;
}
