import type { Post } from "@/types";

export interface StoryCardProps {
  post: Post;
  onLikeToggle: () => void;
  onSaveToggle: () => void;
  onCommentClick: () => void;
  onClick: () => void;
  /** Stagger index for view-entry animation (0-based) */
  index?: number;
}
