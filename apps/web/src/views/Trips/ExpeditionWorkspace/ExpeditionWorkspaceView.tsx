"use client";

/**
 * OntDekker ExpeditionWorkspaceView
 *
 * Expedition workspace page. Navigated to from Feed, MyTripsView, or CommunityDetailView.
 *
 * Tabs:
 *   Overview    — details, dates, budget, capacity, registration CTA
 *   Discussion  — expedition discussion thread
 *   Packing     — gear list with weight summary + WeightBadge
 *   Gallery     — photo gallery
 *   Members     — participant roster
 */

import React, { useState } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
  MessageSquare,
  Backpack,
  ImageIcon,
  Users,
  CheckCircle,
  Circle,
  Scale,
  CheckCircle2,
  UserPlus,
} from "lucide-react";

import ExpeditionHeader from "@/components/headers/ExpeditionHeader";
import Tabs from "@/components/navigation/Tabs";
import Avatar from "@/components/feedback/Avatar";
import Button from "@/components/feedback/Button";
import { WeightBadge } from "@/components/feedback/Badge";

import { swrFetcher, expeditionKeys } from "@/services/cache";
import { useRouter, useParams } from "next/navigation";
import { useToast } from "@/hooks/useToast";

import type {
  ApiResponse,
  Expedition,
  GearItem,
  PackWeightSummary,
  GalleryPhoto,
  GearCategory,
  UserSummary,
} from "@/types";
import type { TabItem } from "@/components/navigation/Tabs";

// ---------------------------------------------------------------------------
// Fallback Mock Expeditions
// ---------------------------------------------------------------------------

const MOCK_EXPEDITIONS: Record<string, Expedition> = {
  "exp-1": {
    id: "exp-1",
    communityId: "comm-1",
    organizerId: "u-1",
    title: "Dolomites Autumn Ridge Trek",
    destination: "South Tyrol, Italy",
    description: "6-day hut-to-hut alpine trek across the iconic jagged peaks of Alta Via 1. Experiencing peak autumn colors, traditional South Tyrolean cuisine, and high-altitude solitude.",
    coverImageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
    startDate: "2026-09-15T00:00:00Z",
    endDate: "2026-09-20T00:00:00Z",
    budget: 1250,
    maxParticipants: 8,
    currentParticipantsCount: 5,
    visibility: "PUBLIC",
    status: "PUBLISHED",
    meetingPoint: "Cortina d'Ampezzo Bus Terminal",
    organizer: {
      id: "u-1",
      username: "marc_alps",
      displayName: "Marc Dubois",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    },
    createdAt: "2026-06-01T00:00:00Z",
    updatedAt: "2026-08-01T00:00:00Z",
  },
  "exp-2": {
    id: "exp-2",
    communityId: "comm-2",
    organizerId: "u-2",
    title: "Fjord Kayaking & Wilderness Camping",
    destination: "Flåm, Norway",
    description: "Paddling deep into Nærøyfjord UNESCO biosphere. Night camping on secluded pebble beaches, campfire tagines, and morning fjord dips.",
    coverImageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    startDate: "2026-10-02T00:00:00Z",
    endDate: "2026-10-07T00:00:00Z",
    budget: 1400,
    maxParticipants: 6,
    currentParticipantsCount: 4,
    visibility: "PUBLIC",
    status: "PUBLISHED",
    meetingPoint: "Flåm Harbor Railway Station",
    organizer: {
      id: "u-2",
      username: "astrid_fjords",
      displayName: "Astrid Lindgren",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    },
    createdAt: "2026-06-15T00:00:00Z",
    updatedAt: "2026-08-01T00:00:00Z",
  },
};

function getFallbackExpedition(id: string): Expedition {
  const matched = MOCK_EXPEDITIONS[id] || MOCK_EXPEDITIONS["exp-1"];
  const formattedTitle = id
    .replace(/^exp-/, "Expedition ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    ...matched,
    id: id,
    title: matched.title ?? formattedTitle,
  };
}

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
  const { showToast } = useToast();
  const [registered, setRegistered] = useState(false);
  const [count, setCount] = useState(expedition.currentParticipantsCount ?? 5);

  function handleRegister() {
    if (registered) {
      setRegistered(false);
      setCount((c) => Math.max(0, c - 1));
      showToast("Unregistered from expedition.", "info");
    } else {
      setRegistered(true);
      setCount((c) => c + 1);
      showToast("Registered successfully for expedition! Check your packing list.", "success");
    }
  }

  return (
    <motion.div
      className="py-6 space-y-5"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Registration Callout */}
      <div className="bg-white border border-[#EAE7DF] rounded-3xl p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-ink">Expedition Registration</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {count} / {expedition.maxParticipants} spots filled ({expedition.maxParticipants - count} spots left)
          </p>
        </div>
        <Button
          variant={registered ? "outline" : "primary"}
          size="md"
          onClick={handleRegister}
          className={registered ? "border-green-200 bg-green-50 text-green-700" : ""}
        >
          {registered ? (
            <>
              <CheckCircle2 size={16} className="mr-1.5" />
              Registered
            </>
          ) : (
            <>
              <UserPlus size={16} className="mr-1.5" />
              Register for Expedition
            </>
          )}
        </Button>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl p-5 space-y-3 shadow-2xs">
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
              {count} / {expedition.maxParticipants}
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
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Packing
// ---------------------------------------------------------------------------

function PackingTab({ expeditionId }: { expeditionId: string }) {
  const { data } = useSWR<{ items: GearItem[]; weight_summary: PackWeightSummary }>(
    expeditionKeys.gear(expeditionId),
    swrFetcher,
    { revalidateOnFocus: false }
  );

  const mockGear: GearItem[] = [
    { id: "g1", expeditionId, name: "Ultralight 2-Person Alpine Tent", weightGrams: 1450, quantity: 1, category: "BASE_PACK", isPacked: true, addedBy: "u-1" },
    { id: "g2", expeditionId, name: "3-Season Sleeping Bag (-5°C)", weightGrams: 980, quantity: 1, category: "BASE_PACK", isPacked: true, addedBy: "u-1" },
    { id: "g3", expeditionId, name: "Compact Isobutane Stove + Pot", weightGrams: 320, quantity: 1, category: "CONSUMABLES", isPacked: false, addedBy: "u-1" },
    { id: "g4", expeditionId, name: "First Aid & Emergency Shelter Kit", weightGrams: 450, quantity: 1, category: "WORN_GEAR", isPacked: true, addedBy: "u-1" },
  ];

  const gearList = data?.items ?? mockGear;
  const totalWeightGrams = gearList.reduce((acc, item) => acc + item.weightGrams, 0);

  return (
    <motion.div
      className="py-6 space-y-4"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl p-4 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-slate">
          <Scale size={14} />
          Total Pack Weight
        </div>
        <WeightBadge classification="LIGHTWEIGHT" weightGrams={totalWeightGrams} />
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl p-5 space-y-3 shadow-2xs">
        <h4 className="text-xs font-semibold text-ink uppercase tracking-wider font-mono">Gear List</h4>
        <div className="divide-y divide-gray-100">
          {gearList.map((item) => (
            <div key={item.id} className="py-3 flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                {item.isPacked ? <CheckCircle size={16} className="text-green-600" /> : <Circle size={16} className="text-gray-300" />}
                <span className={item.isPacked ? "text-ink font-medium" : "text-gray-500"}>{item.name}</span>
              </div>
              <span className="text-xs font-mono text-muted-slate">{(item.weightGrams / 1000).toFixed(2)} kg</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Discussion
// ---------------------------------------------------------------------------

function DiscussionTab() {
  return (
    <motion.div
      className="py-12 text-center space-y-2 bg-white border border-gray-100 rounded-3xl p-8 shadow-2xs"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <MessageSquare size={36} strokeWidth={1} className="text-gray-300 mx-auto" aria-hidden="true" />
      <p className="text-sm font-semibold text-ink">Expedition Discussion</p>
      <p className="text-xs text-muted-slate max-w-xs mx-auto">
        Communicate with your expedition leader and crew prior to departure.
      </p>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Gallery
// ---------------------------------------------------------------------------

function GalleryTab({ expeditionId }: { expeditionId: string }) {
  const { data } = useSWR<GalleryPhoto[]>(
    expeditionKeys.gallery(expeditionId),
    swrFetcher,
    { revalidateOnFocus: false }
  );

  const photos: GalleryPhoto[] = data && data.length > 0 ? data : [
    { id: "p1", expeditionId, imageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80", caption: "Summit Pass", displayOrder: 0, uploadedBy: "u-1", createdAt: "2026-08-01T00:00:00Z", updatedAt: "2026-08-01T00:00:00Z" },
    { id: "p2", expeditionId, imageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80", caption: "High Valley Lake", displayOrder: 1, uploadedBy: "u-1", createdAt: "2026-08-01T00:00:00Z", updatedAt: "2026-08-01T00:00:00Z" },
  ];

  return (
    <motion.div
      className="py-6 grid grid-cols-1 sm:grid-cols-2 gap-4"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {photos.map((photo) => (
        <div key={photo.id} className="relative overflow-hidden rounded-2xl bg-gray-100 aspect-video group">
          <img src={photo.imageUrl} alt={photo.caption ?? ""} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
      ))}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Members
// ---------------------------------------------------------------------------

function MembersTab({ expedition }: { expedition: Expedition }) {
  const members = [
    { name: expedition.organizer?.displayName ?? "Marc Dubois", role: "Organiser", avatar: expedition.organizer?.avatarUrl },
    { name: "Elena Rostova", role: "Participant", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" },
    { name: "Kenji Sato", role: "Participant", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80" },
  ];

  return (
    <motion.div
      className="py-6 bg-white border border-gray-100 rounded-3xl p-5 space-y-3 shadow-2xs"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <h4 className="text-xs font-semibold text-ink uppercase tracking-wider font-mono">Expedition Roster</h4>
      <div className="divide-y divide-gray-100">
        {members.map((m) => (
          <div key={m.name} className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar src={m.avatar ?? null} alt={m.name} size="sm" />
              <span className="text-sm font-medium text-ink">{m.name}</span>
            </div>
            <span className="text-xs font-mono text-muted-slate">{m.role}</span>
          </div>
        ))}
      </div>
    </motion.div>
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

  const { data: expeditionResponse } = useSWR<ApiResponse<Expedition>>(
    expeditionId ? expeditionKeys.byId(expeditionId) : null,
    swrFetcher,
    { revalidateOnFocus: false }
  );

  const expedition = expeditionResponse?.data || getFallbackExpedition(expeditionId);

  return (
    <motion.div
      className="pb-20"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
    >
      {/* Expedition header */}
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
