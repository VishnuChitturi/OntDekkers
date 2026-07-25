"use client";

/**
 * OntDekker GuidePortfolioView
 *
 * Full guide profile page. Navigated to from GuidesView via
 * navigateTo("guide-portfolio", guide.id).
 *
 * Sections (per 03-screen-specs.md § Guide Portfolio):
 *   1. Back button + primary actions (Message, Bookmark)
 *   2. Cover image + avatar + name + verification badge
 *   3. Rating summary (6 dimensions + would-recommend %)
 *   4. Bio, locations, languages, availability, experience
 *   5. Reviews list (paginated via SWR)
 *
 * Data (via Service Layer — no direct Axios):
 *   useSWR(guideKeys.byId(id), swrFetcher)       → GuideProfile
 *   useSWR(guideKeys.ratingSummary(id), swrFetcher) → GuideRatingSummary
 *   useSWR(guideKeys.reviews(id), swrFetcher)     → PaginatedResponse<GuideReview>
 *
 * Actions:
 *   Bookmark → bookmarkGuide / unbookmarkGuide + useToast
 *   Message  → navigateTo("messages")
 *   Back     → goBack()
 */

import React from "react";
import useSWR from "swr";
import { motion } from "motion/react";
import {
  ArrowLeft,
  MessageCircle,
  Bookmark,
  Star,
  MapPin,
  Languages,
  Wifi,
  WifiOff,
  Clock,
  ShieldCheck,
} from "lucide-react";

import Avatar from "@/components/feedback/Avatar";
import Button from "@/components/feedback/Button";
import { VerificationBadge } from "@/components/feedback/Badge";

import { swrFetcher } from "@/services/cache";
import { guideKeys } from "@/services/cache";
import { bookmarkGuide, unbookmarkGuide } from "@/services/api";

import { useRouter } from "@/router/Router";
import { useAppState } from "@/contexts/AppStateProvider";
import { useToast } from "@/hooks/useToast";

import type { GuideProfile, GuideRatingSummary, PaginatedResponse, GuideReview } from "@/types";

// ---------------------------------------------------------------------------
// Loading skeleton for the portfolio
// ---------------------------------------------------------------------------

function PortfolioSkeleton() {
  return (
    <motion.div
      className="container-main py-8 space-y-6"
      animate={{ opacity: [0.4, 0.8, 0.4] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      aria-hidden="true"
    >
      <div className="h-52 w-full rounded-3xl bg-gray-100" />
      <div className="flex items-end gap-4 -mt-10 px-2">
        <div className="w-24 h-24 rounded-full bg-gray-200 ring-4 ring-white" />
        <div className="space-y-2 pb-2">
          <div className="h-5 w-36 rounded-full bg-gray-100" />
          <div className="h-4 w-20 rounded-full bg-gray-100" />
        </div>
      </div>
      <div className="space-y-3 px-2">
        <div className="h-3 w-full rounded-full bg-gray-100" />
        <div className="h-3 w-4/5 rounded-full bg-gray-100" />
        <div className="h-3 w-3/5 rounded-full bg-gray-100" />
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

function ProfileError({ onBack }: { onBack: () => void }) {
  return (
    <div className="container-main py-16 flex flex-col items-center gap-4 text-center">
      <p className="text-sm font-semibold text-ink">Could not load guide profile.</p>
      <p className="text-xs text-muted-slate">The guide may not exist or there was a network error.</p>
      <Button variant="outline" size="sm" icon={ArrowLeft} onClick={onBack}>Go back</Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Rating dimension row
// ---------------------------------------------------------------------------

function RatingBar({ label, value }: { label: string; value: number | null }) {
  const pct = value ? Math.round((value / 5) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-charcoal w-28 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-amber-400 transition-all duration-500"
          style={{ width: `${pct}%` }}
          aria-hidden="true"
        />
      </div>
      <span className="text-xs font-mono text-muted-slate w-6 text-right">
        {value ? value.toFixed(1) : "—"}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single review item
// ---------------------------------------------------------------------------

function ReviewItem({ review }: { review: GuideReview }) {
  return (
    <div className="space-y-2 py-4 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-2">
        <Avatar
          src={review.reviewer.avatarUrl}
          alt={review.reviewer.displayName}
          size="xs"
        />
        <span className="text-xs font-medium text-ink">{review.reviewer.displayName}</span>
        <div className="flex items-center gap-0.5 ml-auto">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              size={10}
              strokeWidth={2}
              fill={s <= review.ratingOverall ? "currentColor" : "none"}
              className={s <= review.ratingOverall ? "text-amber-400" : "text-gray-200"}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>
      {review.comment && (
        <p className="text-xs text-charcoal leading-relaxed">{review.comment}</p>
      )}
      {review.wouldRecommend && (
        <p className="text-[10px] font-mono uppercase tracking-wider text-moss-green flex items-center gap-1">
          <ShieldCheck size={10} strokeWidth={2} aria-hidden="true" /> Would recommend
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// GuidePortfolioView
// ---------------------------------------------------------------------------

export default function GuidePortfolioView() {
  const { currentId, goBack, navigateTo } = useRouter();
  const { state } = useAppState();
  const { showToast } = useToast();

  const guideId = currentId ?? "";
  const isBookmarked = state.savedGuides.some((g) => g.id === guideId);

  // ── SWR fetches ────────────────────────────────────────────────────────────
  const { data: profile, error: profileError, isLoading } = useSWR<GuideProfile>(
    guideId ? guideKeys.byId(guideId) : null,
    swrFetcher,
    { revalidateOnFocus: false },
  );

  const { data: ratingSummary } = useSWR<GuideRatingSummary>(
    guideId ? guideKeys.ratingSummary(guideId) : null,
    swrFetcher,
    { revalidateOnFocus: false },
  );

  const { data: reviewsData } = useSWR<PaginatedResponse<GuideReview>>(
    guideId ? guideKeys.reviews(guideId) : null,
    swrFetcher,
    { revalidateOnFocus: false },
  );

  // ── Bookmark action ────────────────────────────────────────────────────────
  async function handleBookmark() {
    if (!profile) return;
    try {
      if (isBookmarked) {
        await unbookmarkGuide(guideId);
        showToast("Bookmark removed.", "info");
      } else {
        await bookmarkGuide(guideId);
        showToast(`${profile.user.displayName} bookmarked!`, "success");
      }
    } catch {
      showToast("Could not update bookmark. Please try again.", "error");
    }
  }

  // ── States ─────────────────────────────────────────────────────────────────
  if (!guideId) return <ProfileError onBack={goBack} />;
  if (isLoading) return <PortfolioSkeleton />;
  if (profileError || !profile) return <ProfileError onBack={goBack} />;

  const isVerified = profile.verificationStatus === "VERIFIED";
  const availability = profile.availability;
  const isAvailable = availability?.status === "AVAILABLE";

  const reviews = reviewsData?.items ?? [];

  return (
    <motion.div
      className="pb-20"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
    >
      {/* ── Cover image ──────────────────────────────────────────────────── */}
      <div className="relative h-52 w-full overflow-hidden bg-gray-100">
        {profile.coverImageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={profile.coverImageUrl}
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />
        )}

        {/* Back button */}
        <button
          type="button"
          aria-label="Go back"
          onClick={goBack}
          className="
            absolute top-4 left-4
            flex items-center justify-center
            w-8 h-8 rounded-xl
            bg-white/80 backdrop-blur-sm text-ink
            hover:bg-white shadow-xs
            transition-all duration-[var(--duration-responsive)]
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink
          "
        >
          <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>

      <div className="container-main space-y-6 pt-0">
        {/* ── Avatar row ─────────────────────────────────────────────────── */}
        <div className="flex items-end justify-between -mt-12">
          <Avatar
            src={profile.profileImageUrl}
            alt={profile.user.displayName}
            size="xl"
            className="ring-4 ring-white shadow-sm"
          />
          <div className="flex items-center gap-2 pb-2">
            <Button
              variant="outline"
              size="sm"
              icon={Bookmark}
              iconOnly
              onClick={handleBookmark}
              aria-label={isBookmarked ? "Remove bookmark" : "Bookmark guide"}
              className={isBookmarked ? "text-amber-600 border-amber-200 bg-amber-50" : ""}
            />
            <Button
              variant="primary"
              size="sm"
              icon={MessageCircle}
              onClick={() => navigateTo("messages")}
            >
              Message
            </Button>
          </div>
        </div>

        {/* ── Identity ───────────────────────────────────────────────────── */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold tracking-tight text-ink">
              {profile.user.displayName}
            </h1>
            {isVerified && <VerificationBadge size="sm" />}
          </div>

          {/* Meta chips */}
          <div className="flex items-center gap-3 flex-wrap text-[10px] font-mono uppercase tracking-wider text-muted-slate">
            {profile.locations.slice(0, 2).map((loc) => (
              <span key={loc.id} className="flex items-center gap-1">
                <MapPin size={10} strokeWidth={2} aria-hidden="true" />
                {[loc.city, loc.country].filter(Boolean).join(", ")}
              </span>
            ))}
            {profile.languages.slice(0, 2).map((lang) => (
              <span key={lang.id} className="flex items-center gap-1">
                <Languages size={10} strokeWidth={2} aria-hidden="true" />
                {lang.language}
              </span>
            ))}
            {profile.yearsExperience !== null && (
              <span className="flex items-center gap-1">
                <Clock size={10} strokeWidth={2} aria-hidden="true" />
                {profile.yearsExperience} yrs exp
              </span>
            )}
            {availability && (
              <span className={`flex items-center gap-1 ${isAvailable ? "text-moss-green" : "text-muted-slate"}`}>
                {isAvailable
                  ? <Wifi size={10} strokeWidth={2} aria-hidden="true" />
                  : <WifiOff size={10} strokeWidth={2} aria-hidden="true" />}
                {availability.status.charAt(0) + availability.status.slice(1).toLowerCase()}
              </span>
            )}
          </div>
        </div>

        {/* ── Bio ────────────────────────────────────────────────────────── */}
        {profile.bio && (
          <p className="text-sm text-charcoal leading-relaxed max-w-2xl">
            {profile.bio}
          </p>
        )}

        {/* ── Rating summary ─────────────────────────────────────────────── */}
        {ratingSummary && ratingSummary.totalReviews > 0 && (
          <section aria-label="Rating summary">
            <div className="bg-white border border-gray-100 rounded-3xl p-5 space-y-4">
              {/* Overall score */}
              <div className="flex items-center gap-3">
                <Star size={18} strokeWidth={2} fill="currentColor" className="text-amber-400" aria-hidden="true" />
                <span className="text-2xl font-bold font-mono text-ink">
                  {ratingSummary.averageOverall?.toFixed(1) ?? "—"}
                </span>
                <span className="text-sm text-muted-slate">
                  from {ratingSummary.totalReviews} review{ratingSummary.totalReviews !== 1 ? "s" : ""}
                </span>
                {ratingSummary.wouldRecommendPercentage !== null && (
                  <span className="ml-auto text-xs text-moss-green font-medium">
                    {Math.round(ratingSummary.wouldRecommendPercentage)}% recommend
                  </span>
                )}
              </div>

              {/* Dimension bars */}
              <div className="space-y-2">
                <RatingBar label="Knowledge" value={ratingSummary.averageKnowledge} />
                <RatingBar label="Friendliness" value={ratingSummary.averageFriendliness} />
                <RatingBar label="Communication" value={ratingSummary.averageCommunication} />
                <RatingBar label="Safety" value={ratingSummary.averageSafety} />
                <RatingBar label="Professionalism" value={ratingSummary.averageProfessionalism} />
              </div>
            </div>
          </section>
        )}

        {/* ── Reviews list ───────────────────────────────────────────────── */}
        {reviews.length > 0 && (
          <section aria-label="Reviews">
            <h2 className="text-sm font-semibold text-ink mb-3">Reviews</h2>
            <div className="bg-white border border-gray-100 rounded-3xl px-5 divide-y divide-gray-100">
              {reviews.map((review) => (
                <ReviewItem key={review.id} review={review} />
              ))}
            </div>
          </section>
        )}
      </div>
    </motion.div>
  );
}
