import type { GuideProfileSummary } from "@/types";

export interface GuideCardProps {
  guide: GuideProfileSummary;
  onBookmarkToggle: (e: React.MouseEvent) => void;
  onMessage: (e: React.MouseEvent) => void;
  onClick: () => void;
  /** Stagger index for view-entry animation */
  index?: number;
}
