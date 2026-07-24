"use client";

/**
 * OntDekker Sidebar
 *
 * Primary application navigation panel.  Renders a vertical list of
 * NavigationItems; highlights the active view with a left indicator bar and
 * a subtle background fill.
 *
 * Responds to the isSidebarOpen flag from AppState — collapses to icon-only
 * mode on narrow viewports or when manually toggled.
 *
 * Accessibility:
 *   - role="navigation" with aria-label="Primary navigation"
 *   - aria-current="page" on the active item
 *   - aria-label on each button includes badge count when non-zero
 *   - 44 px minimum touch target on each nav item
 */

import React from "react";
import { useRouter } from "@/router/Router";
import { useAppState } from "@/contexts/AppStateProvider";
import type { SidebarProps } from "./Sidebar.types";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Sidebar({ items, className = "" }: SidebarProps) {
  const { currentView, navigateTo } = useRouter();
  const { state } = useAppState();
  const { isSidebarOpen } = state;

  return (
    <nav
      role="navigation"
      aria-label="Primary navigation"
      className={[
        "flex flex-col",
        "bg-card border-r border-[var(--color-border)]",
        "transition-[width] duration-[var(--duration-medium)] ease-[var(--ease-standard)]",
        isSidebarOpen ? "w-52" : "w-14",
        "shrink-0 overflow-hidden",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Spacer so items start below the Navbar height */}
      <div className="h-2" aria-hidden="true" />

      <ul role="list" className="flex flex-col gap-0.5 px-2">
        {items.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;
          const badge = item.badgeCount ?? 0;

          const ariaLabel =
            badge > 0 ? `${item.label} — ${badge} unread` : item.label;

          return (
            <li key={item.id}>
              <button
                type="button"
                role="menuitem"
                aria-label={ariaLabel}
                aria-current={isActive ? "page" : undefined}
                onClick={() => navigateTo(item.id)}
                className={[
                  "relative w-full flex items-center gap-3",
                  "min-h-[44px] px-3 rounded-xl",
                  "text-sm font-medium",
                  "transition-all duration-[var(--duration-responsive)]",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
                  isActive
                    ? "bg-gray-100 text-ink"
                    : "text-charcoal hover:bg-gray-50 hover:text-ink",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {/* Active left indicator */}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="
                      absolute left-0 top-1/2 -translate-y-1/2
                      w-0.5 h-5 rounded-full bg-ink
                    "
                  />
                )}

                {/* Icon */}
                <span className="relative flex-shrink-0">
                  <Icon
                    className={[
                      "w-[18px] h-[18px]",
                      isActive ? "text-ink" : "text-charcoal",
                    ].join(" ")}
                    aria-hidden="true"
                  />
                  {/* Badge dot on icon when sidebar is collapsed */}
                  {!isSidebarOpen && badge > 0 && (
                    <span
                      aria-hidden="true"
                      className="
                        absolute -top-0.5 -right-0.5
                        w-2 h-2 rounded-full bg-amber-ochre
                        ring-2 ring-card
                      "
                    />
                  )}
                </span>

                {/* Label + badge count — hidden when collapsed */}
                {isSidebarOpen && (
                  <>
                    <span className="flex-1 text-left whitespace-nowrap overflow-hidden text-ellipsis">
                      {item.label}
                    </span>
                    {badge > 0 && (
                      <span
                        aria-hidden="true"
                        className="
                          flex-shrink-0
                          min-w-[18px] h-[18px] px-1
                          flex items-center justify-center
                          rounded-full bg-amber-ochre/15 text-amber-ochre
                          text-[10px] font-bold font-mono leading-none
                        "
                      >
                        {badge > 99 ? "99+" : badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
