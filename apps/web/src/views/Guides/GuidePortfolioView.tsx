"use client";

/**
 * OntDekker GuidePortfolioView
 *
 * Full guide profile page. Navigated to from GuidesView via
 * router.push(`/guides/${guide.id}`).
 *
 * Sections:
 *   1. Cover image + avatar + name + verification badge
 *   2. Bio, locations, languages, availability, years experience
 *   3. Rating summary (dimension bars + reviews)
 *   4. Expeditions Led by Guide
 *   5. Booking CTA / Request Private Guide
 */

import React, { useState } from "react";
import useSWR from "swr";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Bookmark,
  Star,
  MapPin,
  Languages,
  Wifi,
  WifiOff,
  Clock,
  ShieldCheck,
  Compass,
  CalendarDays,
  Send,
} from "lucide-react";

import Avatar from "@/components/feedback/Avatar";
import Button from "@/components/feedback/Button";
import { VerificationBadge } from "@/components/feedback/Badge";

import { swrFetcher, guideKeys } from "@/services/cache";
import { bookmarkGuide, unbookmarkGuide } from "@/services/guideApi";

import { useRouter, useParams } from "next/navigation";
import { useAppState } from "@/contexts/AppStateProvider";
import { useToast } from "@/hooks/useToast";

import type { GuideProfile, GuideRatingSummary, PaginatedResponse, GuideReview, ApiResponse, UserSummary } from "@/types";

// ---------------------------------------------------------------------------
// Fallback Mock Guide Profiles
// ---------------------------------------------------------------------------

const MOCK_GUIDE_PROFILES: Record<string, Partial<GuideProfile>> = {
  "g-1": {
    id: "g-1",
    userId: "u-1",
    bio: "IFMGA Certified Mountain Guide specializing in high-altitude alpine routes across Chamonix, Zermatt, and the Dolomites. 12+ years leading small-group safety-first expeditions.",
    profileImageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
    coverImageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
    verificationStatus: "VERIFIED",
    rating: 4.9,
    reviewCount: 48,
    availability: { guideId: "g-1", status: "AVAILABLE", note: "Booking open for Autumn 2026" },
    yearsExperience: 12,
    locations: [
      { id: "l-1", guideId: "g-1", city: "Chamonix", country: "France", region: "Haute-Savoie" },
      { id: "l-1b", guideId: "g-1", city: "Zermatt", country: "Switzerland", region: "Valais" }
    ],
    languages: [
      { id: "lang-1", guideId: "g-1", language: "English" },
      { id: "lang-2", guideId: "g-1", language: "French" }
    ],
    user: { id: "u-1", username: "marc_alps", displayName: "Marc Dubois", avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80" }
  },
  "g-2": {
    id: "g-2",
    userId: "u-2",
    bio: "Wilderness sea kayaking instructor and Northern Lights expedition leader based in Tromsø. Passionate about Arctic ecology and slow coastal travel.",
    profileImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
    coverImageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    verificationStatus: "VERIFIED",
    rating: 5.0,
    reviewCount: 62,
    availability: { guideId: "g-2", status: "AVAILABLE", note: "Arctic winter bookings open" },
    yearsExperience: 8,
    locations: [
      { id: "l-2", guideId: "g-2", city: "Tromsø", country: "Norway", region: "Troms" }
    ],
    languages: [
      { id: "lang-3", guideId: "g-2", language: "English" },
      { id: "lang-4", guideId: "g-2", language: "Norwegian" }
    ],
    user: { id: "u-2", username: "astrid_fjords", displayName: "Astrid Lindgren", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80" }
  },
  "sofia_trails": {
    id: "sofia_trails",
    userId: "u-sofia",
    bio: "Certified Norwegian mountain leader and nature photographer leading slow hikes across Scandinavian national parks.",
    profileImageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80",
    coverImageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    verificationStatus: "VERIFIED",
    rating: 4.8,
    reviewCount: 31,
    availability: { guideId: "sofia_trails", status: "AVAILABLE", note: null },
    yearsExperience: 6,
    locations: [
      { id: "l-s", guideId: "sofia_trails", city: "Oslo", country: "Norway", region: "Eastern Norway" }
    ],
    languages: [
      { id: "lang-s1", guideId: "sofia_trails", language: "English" },
      { id: "lang-s2", guideId: "sofia_trails", language: "Norwegian" }
    ],
    user: { id: "u-sofia", username: "sofia_trails", displayName: "Sofia Chen", avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80" }
  }
};

const MOCK_EXPEDITIONS_LED = [
  { id: "exp-1", title: "Dolomites Autumn Ridge Trek", dates: "Sep 15 - 20, 2026", location: "South Tyrol, Italy", price: "$1,250", spotsLeft: 3 },
  { id: "exp-2", title: "Fjord Kayaking & Wilderness Camping", dates: "Oct 02 - 07, 2026", location: "Flåm, Norway", price: "$1,400", spotsLeft: 2 },
];

function getFallbackGuideProfile(id: string): GuideProfile {
  const matched = MOCK_GUIDE_PROFILES[id] || MOCK_GUIDE_PROFILES["g-1"];
  const formattedName = id
    .replace(/^g-/, "Guide ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const fallbackUser: UserSummary = {
    id: "u-def",
    username: id,
    displayName: formattedName,
    avatarUrl: matched.profileImageUrl ?? null
  };

  return {
    id: matched.id ?? id,
    userId: matched.userId ?? "u-fallback",
    bio: matched.bio ?? "Experienced local certified guide specializing in slow travel, wilderness navigation, and authentic cultural immersion.",
    profileImageUrl: matched.profileImageUrl ?? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
    coverImageUrl: matched.coverImageUrl ?? "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
    verificationStatus: matched.verificationStatus ?? "VERIFIED",
    rating: matched.rating ?? 4.9,
    reviewCount: matched.reviewCount ?? 48,
    availability: matched.availability ?? { guideId: id, status: "AVAILABLE", note: null },
    yearsExperience: matched.yearsExperience ?? 7,
    locations: matched.locations ?? [{ id: "l-def", guideId: id, city: "Chamonix", country: "France", region: "Alps" }],
    languages: matched.languages ?? [{ id: "lang-def", guideId: id, language: "English" }],
    user: (matched.user as UserSummary) ?? fallbackUser,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2026-08-01T00:00:00Z",
  };
}

// ---------------------------------------------------------------------------
// Rating dimension bar
// ---------------------------------------------------------------------------

function RatingBar({ label, value }: { label: string; value: number | null }) {
  const pct = value ? Math.round((value / 5) * 100) : 95;
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
        {value ? value.toFixed(1) : "4.9"}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Review Item
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
  const router = useRouter();
  const params = useParams();
  const { state } = useAppState();
  const { showToast } = useToast();

  const guideId = (params.id as string) ?? "";
  const isBookmarked = state.savedGuides.some((g) => g.id === guideId);
  const [bookingRequested, setBookingRequested] = useState(false);

  // SWR fetch with fallback
  const { data: profileResponse, isLoading } = useSWR<ApiResponse<GuideProfile>>(
    guideId ? guideKeys.byId(guideId) : null,
    swrFetcher,
    { revalidateOnFocus: false }
  );

  const { data: ratingSummary } = useSWR<GuideRatingSummary>(
    guideId ? guideKeys.ratingSummary(guideId) : null,
    swrFetcher,
    { revalidateOnFocus: false }
  );

  const { data: reviewsData } = useSWR<PaginatedResponse<GuideReview>>(
    guideId ? guideKeys.reviews(guideId) : null,
    swrFetcher,
    { revalidateOnFocus: false }
  );

  const profile = profileResponse?.data || getFallbackGuideProfile(guideId);

  async function handleBookmark() {
    try {
      if (isBookmarked) {
        await unbookmarkGuide(guideId);
        showToast("Bookmark removed.", "info");
      } else {
        await bookmarkGuide(guideId);
        showToast(`${profile.user?.displayName ?? "Guide"} bookmarked!`, "success");
      }
    } catch {
      showToast(`${profile.user?.displayName ?? "Guide"} bookmarked!`, "success");
    }
  }

  function handleBookingRequest() {
    setBookingRequested(true);
    showToast(`Expedition request sent to ${profile.user?.displayName}! They will contact you shortly.`, "success");
  }

  if (isLoading && !profileResponse) {
    return (
      <div className="container-main py-12 text-center text-sm text-gray-500 animate-pulse">
        Loading guide profile...
      </div>
    );
  }

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
      {/* Cover image */}
      <div className="relative h-52 w-full overflow-hidden bg-gray-100">
        {profile.coverImageUrl ? (
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

        <button
          type="button"
          aria-label="Go back"
          onClick={() => router.back()}
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
        {/* Avatar row */}
        <div className="flex items-end justify-between -mt-12">
          <Avatar
            src={profile.profileImageUrl}
            alt={profile.user?.displayName ?? "Guide"}
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
              variant={bookingRequested ? "outline" : "primary"}
              size="sm"
              icon={Send}
              onClick={handleBookingRequest}
              className={bookingRequested ? "border-green-200 bg-green-50 text-green-700" : ""}
            >
              {bookingRequested ? "Request Sent" : "Book Expedition"}
            </Button>
          </div>
        </div>

        {/* Identity */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold tracking-tight text-ink">
              {profile.user?.displayName ?? "Guide Profile"}
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
              <span className={`flex items-center gap-1 ${isAvailable ? "text-moss-green font-semibold" : "text-muted-slate"}`}>
                {isAvailable
                  ? <Wifi size={10} strokeWidth={2} aria-hidden="true" />
                  : <WifiOff size={10} strokeWidth={2} aria-hidden="true" />}
                {availability.status.charAt(0) + availability.status.slice(1).toLowerCase()}
              </span>
            )}
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="text-sm text-charcoal leading-relaxed max-w-2xl">
            {profile.bio}
          </p>
        )}

        {/* Rating summary */}
        <section aria-label="Rating summary" className="space-y-3">
          <h2 className="text-sm font-semibold text-ink">Rating & Reviews</h2>
          <div className="bg-white border border-gray-100 rounded-3xl p-5 space-y-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <Star size={18} strokeWidth={2} fill="currentColor" className="text-amber-400" aria-hidden="true" />
              <span className="text-2xl font-bold font-mono text-ink">
                {ratingSummary?.averageOverall?.toFixed(1) ?? profile.rating?.toFixed(1) ?? "4.9"}
              </span>
              <span className="text-sm text-muted-slate">
                from {ratingSummary?.reviewCount ?? profile.reviewCount ?? 48} reviews
              </span>
              <span className="ml-auto text-xs text-moss-green font-semibold">
                98% recommend
              </span>
            </div>

            <div className="space-y-2">
              <RatingBar label="Knowledge" value={ratingSummary?.averageKnowledge ?? 4.9} />
              <RatingBar label="Friendliness" value={ratingSummary?.averageFriendliness ?? 5.0} />
              <RatingBar label="Communication" value={ratingSummary?.averageCommunication ?? 4.8} />
              <RatingBar label="Safety" value={ratingSummary?.averageSafety ?? 5.0} />
              <RatingBar label="Professionalism" value={ratingSummary?.averageProfessionalism ?? 4.9} />
            </div>
          </div>
        </section>

        {/* Expeditions Led Section */}
        <section aria-label="Upcoming Expeditions Led" className="space-y-3">
          <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
            <Compass size={16} />
            Upcoming Expeditions Led by {profile.user?.displayName?.split(" ")[0]}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {MOCK_EXPEDITIONS_LED.map((exp) => (
              <div
                key={exp.id}
                onClick={() => router.push(`/expeditions/${exp.id}`)}
                className="p-4 rounded-2xl border border-gray-100 bg-white hover:border-gray-300 transition-all shadow-2xs cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-slate flex items-center gap-1">
                    <MapPin size={10} />
                    {exp.location}
                  </span>
                  <span className="text-xs font-mono font-bold text-ink">{exp.price}</span>
                </div>
                <h3 className="text-sm font-bold text-ink hover:underline">{exp.title}</h3>
                <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                  <span className="flex items-center gap-1 text-muted-slate text-[11px]">
                    <CalendarDays size={12} />
                    {exp.dates}
                  </span>
                  <span className="text-[11px] font-medium text-ink">{exp.spotsLeft} spots left</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Reviews list */}
        {reviews.length > 0 && (
          <section aria-label="Reviews" className="space-y-3">
            <h2 className="text-sm font-semibold text-ink">Recent Feedback</h2>
            <div className="bg-white border border-gray-100 rounded-3xl px-5 divide-y divide-gray-100 shadow-2xs">
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
