import type { UserProfile } from "@/types";

export interface ProfileHeaderProps {
  user: UserProfile;
  /** Whether the current viewer is the profile owner */
  isOwner: boolean;
  onEditToggle: () => void;
}
