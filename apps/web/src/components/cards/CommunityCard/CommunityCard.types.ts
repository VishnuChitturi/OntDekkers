import type { Community } from "@/types";

export interface CommunityCardProps {
  community: Community;
  isJoined: boolean;
  onJoinToggle: (e: React.MouseEvent) => void;
  onClick: () => void;
  /** Stagger index for view-entry animation */
  index?: number;
}
