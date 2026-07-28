import type { ExpeditionSummary } from "@/types";

export interface TripCardProps {
  trip: ExpeditionSummary;
  onClick: () => void;
  /** Stagger index for view-entry animation */
  index?: number;
}
