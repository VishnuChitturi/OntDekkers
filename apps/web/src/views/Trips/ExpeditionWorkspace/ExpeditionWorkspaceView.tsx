"use client";

/**
 * OntDekker ExpeditionWorkspaceView
 *
 * Expedition planning workspace. Navigated to from MyTripsView or
 * CommunityDetailView → Expeditions tab.
 *
 * Tabs (per 03-screen-specs.md § Expedition Workspace):
 *   Overview    — budget, organiser, meeting point, description
 *   Discussion  — stub (messaging in a later checkpoint)
 *   Packing     — gear list with weight summary + WeightBadge
 *   Gallery     — photo grid (stub)
 *   Members     — participant roster
 *
 * Data (Service Layer):
 *   useSWR(expeditionKeys.byId(id))     → Expedition
 *   useSWR(expeditionKeys.gear(id))     → { items, weight_summary }
 *   useSWR(expeditionKeys.gallery(id))  → GalleryPhoto[]
 *   useSWR(expeditionKeys.participants(id)) → participants
 *
 * Journey B (02-information-architecture.md):
 *   My Trips → Expedition → Packing → Add Item → Weight Updated
 */

import React, { useState } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  LayoutDashboard,
  MessageSquare,
  Backpack,
  ImageIcon,
  Users,
  CheckCircle,
  Circle,
  Scale,
} from "lucide-react";

import ExpeditionHeader from "@/components/headers/ExpeditionHeader";
import Tabs from "@/components/navigation/Tabs";
import Avatar from "@/components/feedback/Avatar";
import Button from "@/components/feedback/Button";
import { WeightBadge } from "@/components/feedback/Badge";

import { swrFetcher, expeditionKeys } from "@/services/cache";
import { useRouter, useParams } from "next/navigation";

import type {
  ApiResponse,
  Expedition,
  GearItem,
  PackWeightSummary,
  GalleryPhoto,
  GearCategory,
} from "@/types";
import type { TabItem } from "@/components/navigation/Tabs";

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

const TABS: TabItem[] = [
  { id: "overview",    label: "Overview",    icon: LayoutDashboard },
  { id: "discussion",  label: "Discussion",  icon: MessageSquare },
  { id: "packing",     label: "Packing",     icon: Backpack },
  { id: "gallery",     label: "Gallery",     icon: ImageIcon },
  { id: "members",     label: "Members",     icon: Users },
];

// ---------------------------------------------------------------------------
// Tab: Overview
// ---------------------------------------------------------------------------

function OverviewTab({ expedition }: { expedition: Expedition }) {
  return (
    <motion.div
      className="py-6 space-y-5"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="bg-white border border-gray-100 rounded-3xl p-5 space-y-3">
        <h3 className="text-xs font-mono uppercase tracking-wider text-muted-slate">Details</h3>
        <dl className="space-y-2 text-sm">
          {expedition.startDate && (
            <div className="flex justify-between">
              <dt className="text-muted-slate">Start</dt>
              <dd className="font-mono font-medium text-ink">
                {new Date(expedition.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </dd>
            </div>
          )}
          {expedition.endDate && (
            <div className="flex justify-between">
              <dt className="text-muted-slate">End</dt>
              <dd className="font-mono font-medium text-ink">
                {new Date(expedition.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </dd>
            </div>
          )}
          {expedition.budget !== null && (
            <div className="flex justify-between">
              <dt className="text-muted-slate">Budget</dt>
              <dd className="font-mono font-medium text-ink">${expedition.budget.toLocaleString()}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted-slate">Capacity</dt>
            <dd className="font-mono font-medium text-ink">
              {expedition.currentParticipantsCount ?? "—"} / {expedition.maxParticipants}
            </dd>
          </div>
          {expedition.meetingPoint && (
            <div className="flex justify-between">
              <dt className="text-muted-slate">Meeting point</dt>
              <dd className="font-medium text-ink text-right max-w-[60%]">{expedition.meetingPoint}</dd>
            </div>
          )}
        </dl>
      </div>

      {expedition.description && (
        <div className="space-y-2">
          <h3 className="text-xs font-mono uppercase tracking-wider text-muted-slate">About</h3>
          <p className="text-sm text-charcoal leading-relaxed">{expedition.description}</p>
        </div>
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Packing (weight optimizer)
// ---------------------------------------------------------------------------

const CATEGORY_LABELS: Record<GearCategory, string> = {
  BASE_PACK: "Base Pack",
  CONSUMABLES: "Consumables",
  WORN_GEAR: "Worn Gear",
};

function PackingTab({ expeditionId }: { expeditionId: string }) {
  const { data } = useSWR<{ items: GearItem[]; summary: PackWeightSummary }>(
    expeditionKeys.gear(expeditionId),
    swrFetcher,
    { revalidateOnFocus: false },
  );

  const items = data?.items ?? [];
  const summary = data?.summary;

  // Group items by category
  const byCategory = items.reduce<Record<GearCategory, GearItem[]>>(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<GearCategory, GearItem[]>,
  );

  return (
    <motion.div
      className="py-6 space-y-5"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Weight summary */}
      {summary && (
        <div className="bg-white border border-gray-100 rounded-3xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale size={16} strokeWidth={2} className="text-muted-slate" aria-hidden="true" />
              <h3 className="text-xs font-mono uppercase tracking-wider text-muted-slate">
                Total Weight
              </h3>
            </div>
            <WeightBadge
              classification={summary.classification}
              weightGrams={summary.totalWeightGrams}
              size="md"
            />
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={[
                "h-full rounded-full transition-all duration-500",
                summary.classification === "ULTRALIGHT" ? "bg-teal-400" :
                summary.classification === "LIGHTWEIGHT" ? "bg-emerald-400" :
                summary.classification === "STANDARD" ? "bg-amber-400" : "bg-rose-400",
              ].join(" ")}
              style={{ width: `${Math.min(100, (summary.totalWeightGrams / 18000) * 100)}%` }}
              aria-hidden="true"
            />
          </div>
        </div>
      )}

      {/* Items by category */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center space-y-3">
          <Backpack size={36} strokeWidth={1} className="text-gray-200" aria-hidden="true" />
          <p className="text-sm text-charcoal">No gear items yet.</p>
          <p className="text-xs text-muted-slate">Add items to start planning your pack.</p>
        </div>
      ) : (
        (Object.entries(byCategory) as [GearCategory, GearItem[]][]).map(([category, categoryItems]) => (
          <div key={category} className="space-y-2">
            <h4 className="text-xs font-mono uppercase tracking-wider text-muted-slate">
              {CATEGORY_LABELS[category]}
            </h4>
            <div className="bg-white border border-gray-100 rounded-2xl divide-y divide-gray-100">
              {categoryItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                  {item.isPacked ? (
                    <CheckCircle size={16} strokeWidth={2} className="text-moss-green flex-shrink-0" aria-label="Packed" />
                  ) : (
                    <Circle size={16} strokeWidth={2} className="text-gray-300 flex-shrink-0" aria-label="Not packed" />
                  )}
                  <span className={[
                    "flex-1 text-sm",
                    item.isPacked ? "text-emerald-900 line-through opacity-80" : "text-ink",
                  ].join(" ")}>
                    {item.name}
                    {item.quantity > 1 && (
                      <span className="text-muted-slate ml-1 font-mono text-[10px]">×{item.quantity}</span>
                    )}
                  </span>
                  <span className="text-[10px] font-mono text-muted-slate flex-shrink-0">
                    {item.weightGrams >= 1000
                      ? `${(item.weightGrams / 1000).toFixed(1)} kg`
                      : `${item.weightGrams} g`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Gallery
// ---------------------------------------------------------------------------

function GalleryTab({ expeditionId }: { expeditionId: string }) {
  const { data: galleryResponse } = useSWR<{ expeditionId: string; photos: GalleryPhoto[]; totalPhotos: number }>(
    expeditionKeys.gallery(expeditionId),
    swrFetcher,
    { revalidateOnFocus: false },
  );

  const items = galleryResponse?.photos ?? [];

  if (items.length === 0) {
    return (
      <motion.div
        className="flex flex-col items-center py-12 text-center space-y-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <ImageIcon size={36} strokeWidth={1} className="text-gray-200" aria-hidden="true" />
        <p className="text-sm text-charcoal">No photos yet.</p>
        <p className="text-xs text-muted-slate">Photos shared by participants will appear here.</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="py-6 grid grid-cols-2 sm:grid-cols-3 gap-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {items.map((photo) => (
        <div key={photo.id} className="aspect-square rounded-2xl overflow-hidden bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.imageUrl}
            alt={photo.caption ?? "Gallery photo"}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      ))}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Members (placeholder uses avatar skeletons)
// ---------------------------------------------------------------------------

function MembersTab({ expedition }: { expedition: Expedition }) {
  return (
    <motion.div
      className="py-6 space-y-3"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <p className="text-xs font-mono uppercase tracking-wider text-muted-slate">
        {expedition.currentParticipantsCount ?? "—"} / {expedition.maxParticipants} participants
      </p>
      {/* Organiser row */}
      {expedition.organizer && (
        <div className="flex items-center gap-3 py-2 border-b border-gray-100">
          <Avatar
            src={expedition.organizer.avatarUrl}
            alt={expedition.organizer.displayName}
            size="sm"
          />
          <div>
            <p className="text-sm font-medium text-ink">{expedition.organizer.displayName}</p>
            <p className="text-[10px] font-mono uppercase tracking-wider text-moss-green">Organizer</p>
          </div>
        </div>
      )}
      {/* Remaining placeholder member rows */}
      {Array.from({ length: Math.max(0, (expedition.currentParticipantsCount ?? 0) - 1) }, (_, i) => (
        <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
          <Avatar src={null} alt={`Participant ${i + 2}`} size="sm" />
          <div className="space-y-1">
            <div className="h-3 w-24 rounded-full bg-gray-100" />
            <div className="h-2.5 w-14 rounded-full bg-gray-100" />
          </div>
        </div>
      ))}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Discussion stub
// ---------------------------------------------------------------------------

function DiscussionTab() {
  return (
    <motion.div
      className="flex flex-col items-center py-16 text-center space-y-3"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <MessageSquare size={36} strokeWidth={1} className="text-gray-200" aria-hidden="true" />
      <p className="text-sm text-charcoal">Expedition discussion.</p>
      <p className="text-xs text-muted-slate max-w-xs">
        Messaging functionality will be available in a future update.
      </p>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function WorkspaceSkeleton() {
  return (
    <motion.div
      className="pb-20"
      animate={{ opacity: [0.4, 0.8, 0.4] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      aria-hidden="true"
    >
      <div className="h-52 w-full bg-gray-100" />
      <div className="container-main pt-5 space-y-3">
        <div className="h-2.5 w-24 rounded-full bg-gray-100" />
        <div className="h-6 w-64 rounded-full bg-gray-100" />
        <div className="h-3 w-40 rounded-full bg-gray-100" />
      </div>
    </motion.div>
  );
}

function WorkspaceError({ onBack }: { onBack: () => void }) {
  return (
    <div className="container-main py-16 flex flex-col items-center gap-4 text-center">
      <p className="text-sm font-semibold text-ink">Could not load expedition.</p>
      <Button variant="outline" size="sm" icon={ArrowLeft} onClick={onBack}>Go back</Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ExpeditionWorkspaceView
// ---------------------------------------------------------------------------

export default function ExpeditionWorkspaceView() {
  const router = useRouter();
  const params = useParams();
  const [activeTab, setActiveTab] = useState("overview");

  const expeditionId = (params.id as string) ?? "";

  const { data: expeditionResponse, error, isLoading } = useSWR<ApiResponse<Expedition>>(
    expeditionId ? expeditionKeys.byId(expeditionId) : null,
    swrFetcher,
    { revalidateOnFocus: false },
  );

  // Unwrap the ApiResponse envelope — backend returns { success, message, data }
  const expedition = expeditionResponse?.data;

  if (!expeditionId) return <WorkspaceError onBack={() => router.back()} />;
  if (isLoading) return <WorkspaceSkeleton />;
  if (error || !expedition) return <WorkspaceError onBack={() => router.back()} />;

  return (
    <motion.div
      className="pb-20"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
    >
      {/* Expedition header (cover, title, back button, status badge) */}
      <div className="container-main pt-6">
        <ExpeditionHeader expedition={expedition} onBack={() => router.back()} />
      </div>

      {/* Tabs */}
      <div className="container-main mt-6">
        <Tabs
          tabs={TABS}
          activeTabId={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* Tab content */}
      <div className="container-main mt-5">
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <OverviewTab key="overview" expedition={expedition} />
          )}
          {activeTab === "discussion" && (
            <DiscussionTab key="discussion" />
          )}
          {activeTab === "packing" && (
            <PackingTab key="packing" expeditionId={expeditionId} />
          )}
          {activeTab === "gallery" && (
            <GalleryTab key="gallery" expeditionId={expeditionId} />
          )}
          {activeTab === "members" && (
            <MembersTab key="members" expedition={expedition} />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
