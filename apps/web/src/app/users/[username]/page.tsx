"use client";

/**
 * /users/[username] — Public User Profile Page
 *
 * Fetches and displays a user's public profile via GET /users/{username}.
 * Uses getPublicProfile() from the service layer only — no direct Axios calls.
 *
 * Fields displayed are strictly limited to PublicProfileResponse:
 *   id, username, display_name, bio, avatar_url, cover_url,
 *   city, country, follower_count, following_count,
 *   badges, reputation, created_at
 *
 * No private-profile-only data (auth_user_id, interests, preferences,
 * saved_items) is accessible or rendered.
 *
 * Follow/unfollow is NOT implemented because:
 *   1. PublicProfileResponse does not expose `is_following`, so the current
 *      follow state cannot be determined without an additional endpoint.
 *   2. PublicProfileResponse does not expose `auth_user_id`, so it is
 *      impossible to reliably compare against the authenticated user's
 *      auth identity (AuthUser.id) to prevent self-follow.
 *   Deferred until the backend contract exposes both fields.
 *
 * Navigation:
 *   - /users/{username}/followers
 *   - /users/{username}/following
 */

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  MapPin,
  Award,
  Star,
  Users,
  UserRound,
} from "lucide-react";
import { getPublicProfile, type PublicProfileResponse } from "@/services/users";
import { ApiError } from "@/services/api";

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const publicProfileKey = (username: string) =>
  ["users", "public", username] as const;

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function ProfileSkeleton() {
  return (
    <div aria-label="Loading profile" aria-live="polite">
      {/* Cover */}
      <div className="h-36 animate-pulse rounded-xl bg-[#EAE7DF]" />
      {/* Avatar */}
      <div className="mt-[-2.5rem] ml-4 size-20 animate-pulse rounded-full border-4 border-white bg-[#EAE7DF]" />
      {/* Text lines */}
      <div className="mt-4 space-y-2 px-1">
        <div className="h-5 w-40 animate-pulse rounded bg-[#EAE7DF]" />
        <div className="h-4 w-28 animate-pulse rounded bg-[#EAE7DF]" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

function ProfileError({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <AlertTriangle className="size-8 text-[#F59E0B]" aria-hidden />
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Not-found state
// ---------------------------------------------------------------------------

function ProfileNotFound({ username }: { username: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <UserRound className="size-10 text-[#EAE7DF]" aria-hidden />
      <p className="text-sm font-medium text-[#111111]">User not found</p>
      <p className="text-xs text-gray-400">
        No account exists for &ldquo;@{username}&rdquo;.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main profile view
// ---------------------------------------------------------------------------

function PublicProfileView({ profile }: { profile: PublicProfileResponse }) {
  return (
    <div className="space-y-6">
      {/* Cover + avatar header */}
      <div className="relative">
        {/* Cover image */}
        <div className="h-36 overflow-hidden rounded-xl bg-[#EAE7DF]">
          {profile.cover_url ? (
            <Image
              src={profile.cover_url}
              alt={`${profile.display_name} cover`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-[#EAE7DF] to-[#d5d0c8]" />
          )}
        </div>

        {/* Avatar */}
        <div className="absolute -bottom-10 left-4">
          <div className="relative size-20 overflow-hidden rounded-full border-4 border-white bg-[#EAE7DF]">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={`${profile.display_name} avatar`}
                fill
                className="object-cover"
                sizes="80px"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-2xl font-bold text-gray-400">
                {profile.display_name?.charAt(0)?.toUpperCase() ?? "?"}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Identity */}
      <div className="pt-10">
        <h1 className="text-xl font-bold text-[#111111]">
          {profile.display_name}
        </h1>
        <p className="text-sm text-gray-500">@{profile.username}</p>
        {(profile.city || profile.country) && (
          <p className="mt-1 flex items-center gap-1 text-sm text-gray-400">
            <MapPin className="size-3.5" aria-hidden />
            {[profile.city, profile.country].filter(Boolean).join(", ")}
          </p>
        )}
      </div>

      {/* Bio */}
      {profile.bio && (
        <p className="text-sm leading-relaxed text-gray-600">{profile.bio}</p>
      )}

      {/* Followers / Following counts */}
      <div className="flex items-center gap-6">
        <Link
          href={`/users/${profile.username}/followers`}
          className="flex items-center gap-1.5 text-sm text-[#111111] hover:underline underline-offset-4"
          aria-label={`${profile.follower_count} followers`}
        >
          <Users className="size-4 text-gray-400" aria-hidden />
          <span className="font-semibold">{profile.follower_count}</span>
          <span className="text-gray-400">followers</span>
        </Link>
        <Link
          href={`/users/${profile.username}/following`}
          className="flex items-center gap-1.5 text-sm text-[#111111] hover:underline underline-offset-4"
          aria-label={`${profile.following_count} following`}
        >
          <span className="font-semibold">{profile.following_count}</span>
          <span className="text-gray-400">following</span>
        </Link>
      </div>

      {/* Reputation — only if present in the response */}
      {profile.reputation && (
        <>
          <hr className="border-[#EAE7DF]" />
          <section aria-labelledby="rep-heading">
            <h2
              id="rep-heading"
              className="mb-3 text-sm font-semibold text-[#111111]"
            >
              Reputation
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {(
                [
                  { label: "Explorer", value: profile.reputation.explorer_score },
                  { label: "Community", value: profile.reputation.community_score },
                  { label: "Review", value: profile.reputation.review_score },
                ] as const
              ).map(({ label, value }) => (
                <div
                  key={label}
                  className="flex flex-col items-center rounded-lg border border-[#EAE7DF] bg-white p-3 text-center"
                >
                  <Star className="size-4 text-[#F59E0B]" aria-hidden />
                  <span className="mt-1 text-base font-bold text-[#111111]">
                    {value}
                  </span>
                  <span className="text-xs text-gray-400">{label}</span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {/* Badges — only if earned */}
      {profile.badges.length > 0 && (
        <>
          <hr className="border-[#EAE7DF]" />
          <section aria-labelledby="badges-heading">
            <h2
              id="badges-heading"
              className="mb-3 text-sm font-semibold text-[#111111]"
            >
              Badges
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.badges.map((badge) => (
                <span
                  key={badge.id}
                  title={badge.badge_name}
                  className="flex items-center gap-1.5 rounded-full border border-[#EAE7DF] bg-white px-3 py-1 text-xs text-[#111111]"
                >
                  <Award className="size-3.5 text-[#F59E0B]" aria-hidden />
                  {badge.badge_name}
                </span>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page export
// ---------------------------------------------------------------------------

export default function PublicProfilePage() {
  const params = useParams();
  const username = typeof params.username === "string" ? params.username : "";

  const {
    data: profile,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: publicProfileKey(username),
    queryFn: () => getPublicProfile(username),
    enabled: username.length > 0,
    staleTime: 60_000,
    retry: (failureCount, err) => {
      // Do not retry 404s — the user simply does not exist
      if (err instanceof ApiError && err.status === 404) return false;
      return failureCount < 2;
    },
  });

  if (isLoading) return <ProfileSkeleton />;

  if (isError) {
    // 404 → dedicated not-found state
    if (error instanceof ApiError && error.status === 404) {
      return <ProfileNotFound username={username} />;
    }
    const msg =
      error instanceof ApiError
        ? error.message
        : "Could not load this profile. Please try again.";
    return <ProfileError message={msg} />;
  }

  if (!profile) return <ProfileSkeleton />;

  return <PublicProfileView profile={profile} />;
}
