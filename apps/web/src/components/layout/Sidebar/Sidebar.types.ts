import type { NavigationItem } from "@/types";

export interface SidebarProps {
  /** Navigation items to render */
  items: NavigationItem[];
  /** Additional Tailwind classes for the outer <nav> element */
  className?: string;
}

export type { NavigationItem };
