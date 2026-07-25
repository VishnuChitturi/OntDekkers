"use client";

/**
 * OntDekker StatusRow
 *
 * Compact dashboard row shown at the top of the Discover feed.
 *
 * Per 03-screen-specs.md § 11 (Final Architectural Adjustments):
 *   "Replaced the oversized welcome banner with a compact status row
 *   displaying: Upcoming Expeditions, Pending Requests, Unread Messages,
 *   Community Updates."
 *
 * Design: 4 stat chips in a single horizontal row.  Each chip shows an
 * icon, a count (JetBrains Mono), and a label.  Chips are clickable and
 * navigate to the relevant view.  Zero counts are shown in muted-slate.
 *
 * No data fetching here — counts are passed as props from DiscoverView
 * which reads them from AppState and SWR.
 */

import React from "react";
import { motion } from "motion/react";
import { Backpack, Inbox, MessageCircle, Users } from "lucide-react";
import { useRouter } from "@/router/Router";

interface StatusChip {
  icon: React.ComponentType<{ size?: number | string; strokeWidth?: number | string; className?: string }>;
  count: number;
  label: string;
  view: "my-trips" | "my-trips" | "messages" | "communities";
  accent: string;    // Tailwind text colour when count > 0
  accentBg: string;  // Tailwind bg when count > 0
}

interface StatusRowProps {
  expeditionsCount: number;
  pendingRequestsCount: number;
  unreadMessagesCount: number;
  communityUpdatesCount: number;
}

export default function StatusRow({
  expeditionsCount,
  pendingRequestsCount,
  unreadMessagesCount,
  communityUpdatesCount,
}: StatusRowProps) {
  const { navigateTo } = useRouter();

  const chips: StatusChip[] = [
    {
      icon: Backpack,
      count: expeditionsCount,
      label: "Expeditions",
      view: "my-trips",
      accent: "text-moss-green",
      accentBg: "bg-emerald-50",
    },
    {
      icon: Inbox,
      count: pendingRequestsCount,
      label: "Requests",
      view: "my-trips",
      accent: "text-amber-ochre",
      accentBg: "bg-amber-50",
    },
    {
      icon: MessageCircle,
      count: unreadMessagesCount,
      label: "Messages",
      view: "messages",
      accent: "text-ozone-blue",
      accentBg: "bg-blue-50",
    },
    {
      icon: Users,
      count: communityUpdatesCount,
      label: "Updates",
      view: "communities",
      accent: "text-charcoal",
      accentBg: "bg-gray-50",
    },
  ];

  return (
    <motion.div
      className="flex items-center gap-2 flex-wrap"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0, 0, 0.2, 1] }}
      role="region"
      aria-label="Activity summary"
    >
      {chips.map(({ icon: Icon, count, label, view, accent, accentBg }) => {
        const hasActivity = count > 0;
        return (
          <button
            key={label}
            type="button"
            onClick={() => navigateTo(view)}
            aria-label={`${label}: ${count}`}
            className={[
              "flex items-center gap-2 px-3 py-2 rounded-xl",
              "border transition-all duration-[var(--duration-responsive)]",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
              hasActivity
                ? `${accentBg} border-transparent hover:brightness-95`
                : "bg-white border-gray-100 hover:bg-gray-50",
            ].join(" ")}
          >
            <Icon
              size={14}
              strokeWidth={2}
              className={hasActivity ? accent : "text-muted-slate"}
              aria-hidden="true"
            />
            <span
              className={[
                "text-xs font-bold font-mono",
                hasActivity ? accent : "text-muted-slate",
              ].join(" ")}
            >
              {count}
            </span>
            <span
              className={[
                "text-[10px] uppercase tracking-wider font-mono",
                hasActivity ? accent : "text-muted-slate",
              ].join(" ")}
            >
              {label}
            </span>
          </button>
        );
      })}
    </motion.div>
  );
}
