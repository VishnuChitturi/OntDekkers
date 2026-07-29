"use client";

/**
 * /profile — My Profile Page
 *
 * Fetches the authenticated user's private profile via GET /users/me.
 * Displays all fields from PrivateProfileResponse.
 * Handles lazy profile creation (first-time users get a profile auto-created).
 *
 * Sections:
 *   - Cover image + avatar (with upload triggers)
 *   - Display name, username, bio, location
 *   - Interests list
 *   - Travel preferences summary
 *   - Reputation/badge summary
 *
 * Uses TanStack Query for data fetching and cache invalidation.
 * Avatar and Cover uploads update the profile cache on success.
 */

import Link from "next/link";
import Image from "next/image";
import { useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Camera,
  MapPin,
  Pencil,
  Star,
  Award,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getMyProfile,
  uploadAvatar,
  uploadCover,
  UPLOAD_ACCEPTED_MIME_TYPES,
  UPLOAD_MAX_BYTES,
  type PrivateProfileResponse,
} from "@/services/users";
import { ApiError } from "@/services/api";
import { cn } from "@/lib/utils";

/** Stable TanStack Query key for the current user's private profile. */
export const MY_PROFILE_KEY = ["profile", "me"] as const;

const ACCEPTED_TYPES = UPLOAD_ACCEPTED_MIME_TYPES.join(",");

// ---------------------------------------------------------------------------
// Upload image button — reusable for avatar and cover
// ---------------------------------------------------------------------------

interface ImageUploadTriggerProps {
  label: string;
  accept: string;
  loading: boolean;
  onFile: (file: File) => void;
  className?: string;
  children: React.ReactNode;
}

function ImageUploadTrigger({
  label,
  accept,
  loading,
  onFile,
  className,
  children,
}: ImageUploadTriggerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFile(file);
    // Reset input so re-selecting the same file triggers onChange
    e.target.value = "";
  }

  return (
    <button
      type="button"
      aria-label={label}
      disabled={loading}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "flex items-center justify-center transition disabled:opacity-50",
        className
      )}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" aria-hidden />
      ) : (
        children
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        aria-hidden
        tabIndex={-1}
        onChange={handleChange}
      />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function ProfileSkeleton() {
  return (
    <div aria-label="Loading profile" aria-live="polite">
      <div className="h-36 animate-pulse rounded-xl bg-[#EAE7DF]" />
      <div className="mt-[-2.5rem] ml-4 size-20 animate-pulse rounded-full border-4 border-white bg-[#EAE7DF]" />
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
// Main profile view
// ---------------------------------------------------------------------------

function ProfileView({ profile }: { profile: PrivateProfileResponse }) {
  const queryClient = useQueryClient();

  // ----- Avatar upload mutation -----
  const avatarMutation = useMutation({
    mutationFn: (file: File) => uploadAvatar(file),
    onSuccess: (data) => {
      // Optimistically update avatar_url in cache with the presigned URL
      queryClient.setQueryData<PrivateProfileResponse>(MY_PROFILE_KEY, (old) =>
        old ? { ...old, avatar_url: data.presigned_url } : old
      );
    },
  });

  // ----- Cover upload mutation -----
  const coverMutation = useMutation({
    mutationFn: (file: File) => uploadCover(file),
    onSuccess: (data) => {
      queryClient.setQueryData<PrivateProfileResponse>(MY_PROFILE_KEY, (old) =>
        old ? { ...old, cover_url: data.presigned_url } : old
      );
    },
  });

  function handleAvatarFile(file: File) {
    if (file.size > UPLOAD_MAX_BYTES) {
      alert("Image must be under 5 MB.");
      return;
    }
    if (!UPLOAD_ACCEPTED_MIME_TYPES.includes(file.type as typeof UPLOAD_ACCEPTED_MIME_TYPES[number])) {
      alert("Accepted formats: JPEG, PNG, WebP.");
      return;
    }
    avatarMutation.mutate(file);
  }

  function handleCoverFile(file: File) {
    if (file.size > UPLOAD_MAX_BYTES) {
      alert("Image must be under 5 MB.");
      return;
    }
    if (!UPLOAD_ACCEPTED_MIME_TYPES.includes(file.type as typeof UPLOAD_ACCEPTED_MIME_TYPES[number])) {
      alert("Accepted formats: JPEG, PNG, WebP.");
      return;
    }
    coverMutation.mutate(file);
  }

  const uploadError =
    (avatarMutation.error instanceof ApiError
      ? avatarMutation.error.message
      : avatarMutation.error
        ? "Avatar upload failed."
        : null) ??
    (coverMutation.error instanceof ApiError
      ? coverMutation.error.message
      : coverMutation.error
        ? "Cover upload failed."
        : null);

  return (
    <div className="space-y-6">
      {/* Upload error */}
      {uploadError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {uploadError}
        </div>
      )}

      {/* Cover + avatar header */}
      <div className="relative">
        {/* Cover image */}
        <div className="group relative h-36 overflow-hidden rounded-xl bg-[#EAE7DF]">
          {profile.cover_url ? (
            <Image
              src={profile.cover_url}
              alt="Cover image"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-[#EAE7DF] to-[#d5d0c8]" />
          )}
          {/* Cover upload overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/20 group-hover:opacity-100">
            <ImageUploadTrigger
              label="Change cover image"
              accept={ACCEPTED_TYPES}
              loading={coverMutation.isPending}
              onFile={handleCoverFile}
              className="rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
            >
              <Camera className="size-5" aria-hidden />
            </ImageUploadTrigger>
          </div>
        </div>

        {/* Avatar */}
        <div className="absolute -bottom-10 left-4">
          <div className="group relative size-20 overflow-hidden rounded-full border-4 border-white bg-[#EAE7DF]">
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
            {/* Avatar upload overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
              <ImageUploadTrigger
                label="Change avatar"
                accept={ACCEPTED_TYPES}
                loading={avatarMutation.isPending}
                onFile={handleAvatarFile}
                className="rounded-full p-1.5 text-white"
              >
                <Camera className="size-4" aria-hidden />
              </ImageUploadTrigger>
            </div>
          </div>
        </div>
      </div>

      {/* Identity row */}
      <div className="flex items-start justify-between pt-10">
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold text-[#111111]">
            {profile.display_name}
          </h1>
          <p className="text-sm text-gray-500">@{profile.username}</p>
          {(profile.city || profile.country) && (
            <p className="flex items-center gap-1 text-sm text-gray-400">
              <MapPin className="size-3.5" aria-hidden />
              {[profile.city, profile.country].filter(Boolean).join(", ")}
            </p>
          )}
        </div>
        <Link href="/profile/edit">
          <Button variant="outline" size="sm">
            <Pencil className="size-3.5" aria-hidden />
            <span className="ml-1.5">Edit</span>
          </Button>
        </Link>
      </div>

      {/* Bio */}
      {profile.bio && (
        <p className="text-sm leading-relaxed text-gray-600">{profile.bio}</p>
      )}

      {/* Divider */}
      <hr className="border-[#EAE7DF]" />

      {/* Interests */}
      <section aria-labelledby="interests-heading">
        <div className="mb-3 flex items-center justify-between">
          <h2
            id="interests-heading"
            className="text-sm font-semibold text-[#111111]"
          >
            Interests
          </h2>
          <Link
            href="/profile/interests"
            className="text-xs text-gray-400 underline-offset-4 hover:underline"
          >
            Edit
          </Link>
        </div>
        {profile.interests.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {profile.interests.map(({ interest }) => (
              <span
                key={interest}
                className="rounded-full border border-[#EAE7DF] bg-white px-3 py-1 text-xs text-[#111111]"
              >
                {interest}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">
            No interests added yet.{" "}
            <Link
              href="/profile/interests"
              className="underline-offset-4 hover:underline"
            >
              Add some
            </Link>
          </p>
        )}
      </section>

      {/* Travel preferences */}
      <section aria-labelledby="prefs-heading">
        <div className="mb-3 flex items-center justify-between">
          <h2
            id="prefs-heading"
            className="text-sm font-semibold text-[#111111]"
          >
            Travel preferences
          </h2>
          <Link
            href="/profile/preferences"
            className="text-xs text-gray-400 underline-offset-4 hover:underline"
          >
            Edit
          </Link>
        </div>
        {profile.preferences ? (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {profile.preferences.travel_style && (
              <>
                <dt className="text-gray-400">Style</dt>
                <dd className="text-[#111111]">
                  {profile.preferences.travel_style}
                </dd>
              </>
            )}
            {profile.preferences.budget && (
              <>
                <dt className="text-gray-400">Budget</dt>
                <dd className="text-[#111111]">{profile.preferences.budget}</dd>
              </>
            )}
            {profile.preferences.adventure_level && (
              <>
                <dt className="text-gray-400">Adventure</dt>
                <dd className="text-[#111111]">
                  {profile.preferences.adventure_level}
                </dd>
              </>
            )}
            {profile.preferences.languages &&
              profile.preferences.languages.length > 0 && (
                <>
                  <dt className="text-gray-400">Languages</dt>
                  <dd className="text-[#111111]">
                    {profile.preferences.languages.join(", ")}
                  </dd>
                </>
              )}
          </dl>
        ) : (
          <p className="text-sm text-gray-400">
            No preferences set yet.{" "}
            <Link
              href="/profile/preferences"
              className="underline-offset-4 hover:underline"
            >
              Set preferences
            </Link>
          </p>
        )}
      </section>

      {/* Reputation summary — only if data exists */}
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
              {[
                {
                  label: "Explorer",
                  value: profile.reputation.explorer_score,
                  icon: <Star className="size-4 text-[#F59E0B]" />,
                },
                {
                  label: "Community",
                  value: profile.reputation.community_score,
                  icon: <Star className="size-4 text-[#F59E0B]" />,
                },
                {
                  label: "Review",
                  value: profile.reputation.review_score,
                  icon: <Star className="size-4 text-[#F59E0B]" />,
                },
              ].map(({ label, value, icon }) => (
                <div
                  key={label}
                  className="flex flex-col items-center rounded-lg border border-[#EAE7DF] bg-white p-3 text-center"
                >
                  {icon}
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

export default function ProfilePage() {
  const {
    data: profile,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: MY_PROFILE_KEY,
    queryFn: getMyProfile,
    staleTime: 60_000,
  });

  if (isLoading) return <ProfileSkeleton />;

  if (isError) {
    const msg =
      error instanceof ApiError
        ? error.message
        : "Could not load your profile. Please try again.";
    return <ProfileError message={msg} />;
  }

  if (!profile) return <ProfileSkeleton />;

  return <ProfileView profile={profile} />;
}
