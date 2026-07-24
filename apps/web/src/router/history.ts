/**
 * OntDekker Virtual Router — History Stack
 *
 * Provides a lightweight history manager that drives the state-based
 * virtual router.  No browser History API is used — navigation is
 * entirely in-memory so the persistent application shell never
 * unmounts or triggers a full page reload.
 */

import type { ViewName, NavigationHistory } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HistoryStack {
  entries: NavigationHistory[];
  index: number;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Creates an empty history stack pointing at the Discover view.
 */
export function createHistoryStack(initialView: ViewName = "discover"): HistoryStack {
  return {
    entries: [{ view: initialView }],
    index: 0,
  };
}

// ---------------------------------------------------------------------------
// Pure operations (return new stack — no mutation)
// ---------------------------------------------------------------------------

/**
 * Push a new entry onto the stack.
 * Any forward-history entries beyond the current index are discarded,
 * matching standard browser behaviour.
 */
export function pushEntry(
  stack: HistoryStack,
  entry: NavigationHistory,
): HistoryStack {
  const truncated = stack.entries.slice(0, stack.index + 1);
  return {
    entries: [...truncated, entry],
    index: truncated.length,
  };
}

/**
 * Move back one step.  Returns the same stack unchanged if already at index 0.
 */
export function goBackInStack(stack: HistoryStack): HistoryStack {
  if (stack.index <= 0) return stack;
  return { ...stack, index: stack.index - 1 };
}

/**
 * Returns the current history entry.
 */
export function currentEntry(stack: HistoryStack): NavigationHistory {
  return stack.entries[stack.index];
}

/**
 * Returns true when there is at least one prior entry to go back to.
 */
export function canGoBack(stack: HistoryStack): boolean {
  return stack.index > 0;
}
