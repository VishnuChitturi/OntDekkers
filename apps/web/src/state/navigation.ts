/**
 * OntDekker — Primary navigation items definition.
 *
 * This module exports the static list of sidebar navigation items.
 * Badge counts are injected at runtime from AppState in the shell component.
 */

import {
  Compass,
  Users,
  Backpack,
  Map,
  MessageCircle,
  User,
  Settings,
} from "lucide-react";
import type { NavigationItem } from "@/types";

/**
 * Static navigation items (no badge counts — those are merged in at runtime).
 * Order matches the sidebar layout in the UX architecture document.
 */
export const PRIMARY_NAV_ITEMS: Omit<NavigationItem, "badgeCount">[] = [
  {
    id: "discover",
    label: "Discover",
    icon: Compass,
  },
  {
    id: "communities",
    label: "Communities",
    icon: Users,
  },
  {
    id: "my-trips",
    label: "My Trips",
    icon: Backpack,
  },
  {
    id: "guides",
    label: "Guides",
    icon: Map,
  },
  {
    id: "messages",
    label: "Messages",
    icon: MessageCircle,
  },
  {
    id: "profile",
    label: "Profile",
    icon: User,
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
  },
] as const;
