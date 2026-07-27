export type BubbleVariant = "outgoing" | "incoming" | "system";

export interface ChatBubbleProps {
  body: string;
  sentAt: string;
  variant: BubbleVariant;
  senderName?: string;
  senderAvatarUrl?: string | null;
  imageUrl?: string | null;
  status?: "SENDING" | "SENT" | "DELIVERED" | "READ" | "FAILED";
}
