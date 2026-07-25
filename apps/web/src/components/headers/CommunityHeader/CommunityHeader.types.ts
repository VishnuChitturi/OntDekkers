import type { Community } from "@/types";

export interface CommunityHeaderProps {
  community: Community;
  isJoined: boolean;
  onJoinToggle: () => void;
}
