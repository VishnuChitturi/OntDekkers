"""
User Service — Service Layer

All User Service business logic lives here.
Repositories are called for persistence; no SQL in this file.
No HTTP concerns — this layer returns domain objects and raises shared exceptions.

Phase 1 scope:
  - Lazy profile get-or-create
  - Profile read (private/public)
  - Profile update
  - Interests replace
  - Preferences upsert
  - Follow / Unfollow
  - Followers / Following lists
  - Badges read
  - Reputation read
  - Saved items (save/unsave/list)
  - Avatar upload (MinIO)
  - Cover upload (MinIO)

Phase 2 (not here):
  - Kafka event publishing (PROFILE_UPDATED, USER_FOLLOWED, BADGE_EARNED)
  - Redis profile caching
  - Badge award logic driven by events
  - Reputation scoring driven by events
"""

import hashlib
import logging
import uuid
from typing import Any, Dict, List, Optional

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.minio_client import (
    delete_object,
    make_avatar_object_name,
    make_cover_object_name,
    presigned_url,
    upload_object,
)
from app.repositories.user import (
    BadgeRepository,
    FollowerRepository,
    InterestRepository,
    PreferenceRepository,
    ProfileRepository,
    ReputationRepository,
    SavedItemRepository,
)
from app.schemas.user import (
    BadgeResponse,
    FollowerSummary,
    InterestResponse,
    MediaUploadResponse,
    MessageResponse,
    PaginatedFollowersResponse,
    PreferenceResponse,
    PrivateProfileResponse,
    PublicProfileResponse,
    ReputationResponse,
    SavedItemResponse,
)
from shared.exceptions import ConflictException, ForbiddenException, NotFoundException, UnauthorizedException

logger = logging.getLogger(__name__)

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MIME_TO_EXT = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}

MAX_UPLOAD_BYTES = 5 * 1024 * 1024  # 5 MB — matches settings default


def _extract_auth_user_id(jwt_payload: Dict[str, Any]) -> uuid.UUID:
    """
    Safely extract the auth_user_id (UUID) from a validated JWT payload.

    Raises UnauthorizedException for:
      - missing 'sub' claim
      - null/empty 'sub' value
      - non-UUID 'sub' value (malformed token)

    Never exposes JWT contents in the error message.
    """
    raw = jwt_payload.get("sub")
    if not raw:
        raise UnauthorizedException(
            message="Invalid token claims.",
            error_code="INVALID_TOKEN_CLAIMS",
        )
    try:
        return uuid.UUID(str(raw))
    except (ValueError, AttributeError):
        raise UnauthorizedException(
            message="Invalid token claims.",
            error_code="INVALID_TOKEN_CLAIMS",
        )


def _auto_username(auth_user_id: uuid.UUID) -> str:
    """
    Generate a safe, deterministic, unique username for lazy profile creation.
    Format: user_{first 8 hex chars of auth_user_id}
    The user can change this later via PUT /users/me.
    """
    return f"user_{str(auth_user_id).replace('-', '')[:8]}"


def _auto_display_name(auth_user_id: uuid.UUID) -> str:
    return f"User {str(auth_user_id)[:6].upper()}"


class UserService:

    def __init__(self, session: AsyncSession) -> None:
        self._s = session
        self._profiles = ProfileRepository(session)
        self._interests = InterestRepository(session)
        self._preferences = PreferenceRepository(session)
        self._followers = FollowerRepository(session)
        self._badges = BadgeRepository(session)
        self._reputation = ReputationRepository(session)
        self._saved = SavedItemRepository(session)

    # ------------------------------------------------------------------
    # Lazy get-or-create profile
    # ------------------------------------------------------------------

    async def _get_or_create_profile(self, auth_user_id: uuid.UUID):
        """
        Idempotent profile initialisation.

        If a profile exists for auth_user_id — return it.
        If not — create one with an auto-generated username, default display name,
        and a zeroed reputation record, all in the same transaction flush.

        The UNIQUE constraint on user_profiles.auth_user_id is the final
        database-level guard against concurrent duplicate creations.
        IntegrityError is caught and the existing profile is returned instead.
        """
        profile = await self._profiles.get_by_auth_user_id(auth_user_id)
        if profile is not None:
            return profile

        username = _auto_username(auth_user_id)
        display_name = _auto_display_name(auth_user_id)

        # Handle the rare case where the auto-generated username collides
        # with an existing username from another user (hash-space collision).
        suffix = 0
        while True:
            candidate = username if suffix == 0 else f"{username}{suffix}"
            try:
                profile = await self._profiles.create(
                    auth_user_id=auth_user_id,
                    username=candidate,
                    display_name=display_name,
                )
                # Also create a default reputation row atomically
                await self._reputation.create_default(profile.id)
                break
            except IntegrityError:
                await self._s.rollback()
                # Check if auth_user_id already exists (concurrent race)
                profile = await self._profiles.get_by_auth_user_id(auth_user_id)
                if profile is not None:
                    return profile
                # Otherwise username collision — try next suffix
                suffix += 1
                if suffix > 100:
                    raise RuntimeError("Could not generate a unique username after 100 attempts")

        logger.info(
            "Profile lazily created",
            extra={"extra_data": {"auth_user_id": str(auth_user_id), "username": profile.username}},
        )
        # NOTE (Phase 2): publish PROFILE_CREATED Kafka event here.
        return profile

    # ------------------------------------------------------------------
    # Private profile (GET /users/me)
    # ------------------------------------------------------------------

    async def get_my_profile(self, jwt_payload: Dict[str, Any]) -> PrivateProfileResponse:
        auth_user_id = _extract_auth_user_id(jwt_payload)
        profile = await self._get_or_create_profile(auth_user_id)

        interests = await self._interests.get_by_user(profile.id)
        preferences = await self._preferences.get_by_user(profile.id)
        badges = await self._badges.get_by_user(profile.id)
        reputation = await self._reputation.get_by_user(profile.id)
        saved = await self._saved.get_by_user(profile.id)
        fc = await self._followers.follower_count(profile.id)
        fic = await self._followers.following_count(profile.id)

        return PrivateProfileResponse(
            id=profile.id,
            auth_user_id=profile.auth_user_id,
            username=profile.username,
            display_name=profile.display_name,
            bio=profile.bio,
            avatar_url=profile.avatar_url,
            cover_url=profile.cover_url,
            city=profile.city,
            country=profile.country,
            follower_count=fc,
            following_count=fic,
            interests=[InterestResponse.model_validate(i) for i in interests],
            preferences=PreferenceResponse.model_validate(preferences) if preferences else None,
            badges=[BadgeResponse.model_validate(b) for b in badges],
            reputation=ReputationResponse.model_validate(reputation) if reputation else None,
            saved_items=[SavedItemResponse.model_validate(s) for s in saved],
            created_at=profile.created_at,
        )

    # ------------------------------------------------------------------
    # Public profile (GET /users/{username})
    # ------------------------------------------------------------------

    async def get_public_profile(self, username: str) -> PublicProfileResponse:
        profile = await self._profiles.get_by_username(username)
        if profile is None:
            raise NotFoundException(
                message=f"User '{username}' not found.",
                error_code="USER_NOT_FOUND",
            )
        badges = await self._badges.get_by_user(profile.id)
        reputation = await self._reputation.get_by_user(profile.id)
        fc = await self._followers.follower_count(profile.id)
        fic = await self._followers.following_count(profile.id)

        return PublicProfileResponse(
            id=profile.id,
            username=profile.username,
            display_name=profile.display_name,
            bio=profile.bio,
            avatar_url=profile.avatar_url,
            cover_url=profile.cover_url,
            city=profile.city,
            country=profile.country,
            follower_count=fc,
            following_count=fic,
            badges=[BadgeResponse.model_validate(b) for b in badges],
            reputation=ReputationResponse.model_validate(reputation) if reputation else None,
            created_at=profile.created_at,
        )

    async def get_public_profile_by_id(self, profile_id: uuid.UUID) -> PublicProfileResponse:
        profile = await self._profiles.get_by_id(profile_id)
        if profile is None:
            raise NotFoundException(
                message="User not found.",
                error_code="USER_NOT_FOUND",
            )
        return await self.get_public_profile(profile.username)

    # ------------------------------------------------------------------
    # Update profile (PUT /users/me)
    # ------------------------------------------------------------------

    async def update_my_profile(
        self,
        jwt_payload: Dict[str, Any],
        username: Optional[str],
        display_name: Optional[str],
        bio: Optional[str],
        city: Optional[str],
        country: Optional[str],
    ) -> PrivateProfileResponse:
        auth_user_id = _extract_auth_user_id(jwt_payload)
        profile = await self._get_or_create_profile(auth_user_id)

        updates: dict = {}
        if username is not None and username != profile.username:
            # Check username uniqueness
            existing = await self._profiles.get_by_username(username)
            if existing is not None and existing.id != profile.id:
                raise ConflictException(
                    message="Username is already taken.",
                    error_code="USERNAME_TAKEN",
                )
            updates["username"] = username
        if display_name is not None:
            updates["display_name"] = display_name
        if bio is not None:
            updates["bio"] = bio
        if city is not None:
            updates["city"] = city
        if country is not None:
            updates["country"] = country

        if updates:
            await self._profiles.update(profile.id, **updates)

        logger.info("Profile updated", extra={"extra_data": {"profile_id": str(profile.id)}})
        # NOTE (Phase 2): publish PROFILE_UPDATED Kafka event here.
        return await self.get_my_profile(jwt_payload)

    # ------------------------------------------------------------------
    # Interests (part of PUT /users/me or PATCH /users/me/interests)
    # ------------------------------------------------------------------

    async def update_interests(
        self,
        jwt_payload: Dict[str, Any],
        interests: List[str],
    ) -> PrivateProfileResponse:
        auth_user_id = _extract_auth_user_id(jwt_payload)
        profile = await self._get_or_create_profile(auth_user_id)
        await self._interests.replace_all(profile.id, interests)
        return await self.get_my_profile(jwt_payload)

    # ------------------------------------------------------------------
    # Preferences (PATCH /users/me/preferences)
    # ------------------------------------------------------------------

    async def update_preferences(
        self,
        jwt_payload: Dict[str, Any],
        **fields,
    ) -> PrivateProfileResponse:
        auth_user_id = _extract_auth_user_id(jwt_payload)
        profile = await self._get_or_create_profile(auth_user_id)
        non_null = {k: v for k, v in fields.items() if v is not None}
        if non_null:
            await self._preferences.upsert(profile.id, **non_null)
        return await self.get_my_profile(jwt_payload)

    # ------------------------------------------------------------------
    # Follow / Unfollow
    # ------------------------------------------------------------------

    async def follow_user(
        self,
        jwt_payload: Dict[str, Any],
        target_profile_id: uuid.UUID,
    ) -> MessageResponse:
        auth_user_id = _extract_auth_user_id(jwt_payload)
        follower_profile = await self._get_or_create_profile(auth_user_id)

        if follower_profile.id == target_profile_id:
            raise ForbiddenException(
                message="You cannot follow yourself.",
                error_code="SELF_FOLLOW_NOT_ALLOWED",
            )

        target = await self._profiles.get_by_id(target_profile_id)
        if target is None:
            raise NotFoundException(
                message="Target user not found.",
                error_code="USER_NOT_FOUND",
            )

        await self._followers.follow(follower_profile.id, target_profile_id)
        logger.info(
            "User followed",
            extra={"extra_data": {"follower": str(follower_profile.id), "following": str(target_profile_id)}},
        )
        # NOTE (Phase 2): publish USER_FOLLOWED Kafka event here.
        return MessageResponse(message="Followed successfully.")

    async def unfollow_user(
        self,
        jwt_payload: Dict[str, Any],
        target_profile_id: uuid.UUID,
    ) -> MessageResponse:
        auth_user_id = _extract_auth_user_id(jwt_payload)
        follower_profile = await self._get_or_create_profile(auth_user_id)

        await self._followers.unfollow(follower_profile.id, target_profile_id)
        # NOTE (Phase 2): publish USER_UNFOLLOWED Kafka event here.
        return MessageResponse(message="Unfollowed successfully.")

    # ------------------------------------------------------------------
    # Followers / Following lists
    # ------------------------------------------------------------------

    async def get_followers(
        self, profile_id: uuid.UUID, page: int, size: int
    ) -> PaginatedFollowersResponse:
        profile = await self._profiles.get_by_id(profile_id)
        if profile is None:
            raise NotFoundException(message="User not found.", error_code="USER_NOT_FOUND")
        total = await self._followers.follower_count(profile_id)
        offset = (page - 1) * size
        ids = await self._followers.get_followers(profile_id, offset=offset, limit=size)
        summaries = []
        for fid in ids:
            p = await self._profiles.get_by_id(fid)
            if p:
                summaries.append(FollowerSummary(
                    id=p.id, username=p.username,
                    display_name=p.display_name, avatar_url=p.avatar_url,
                ))
        return PaginatedFollowersResponse(items=summaries, total=total, page=page, size=size)

    async def get_following(
        self, profile_id: uuid.UUID, page: int, size: int
    ) -> PaginatedFollowersResponse:
        profile = await self._profiles.get_by_id(profile_id)
        if profile is None:
            raise NotFoundException(message="User not found.", error_code="USER_NOT_FOUND")
        total = await self._followers.following_count(profile_id)
        offset = (page - 1) * size
        ids = await self._followers.get_following(profile_id, offset=offset, limit=size)
        summaries = []
        for fid in ids:
            p = await self._profiles.get_by_id(fid)
            if p:
                summaries.append(FollowerSummary(
                    id=p.id, username=p.username,
                    display_name=p.display_name, avatar_url=p.avatar_url,
                ))
        return PaginatedFollowersResponse(items=summaries, total=total, page=page, size=size)

    # ------------------------------------------------------------------
    # Badges (read-only in Phase 1 — awarded by Kafka events in Phase 2)
    # ------------------------------------------------------------------

    async def get_badges(self, profile_id: uuid.UUID) -> List[BadgeResponse]:
        profile = await self._profiles.get_by_id(profile_id)
        if profile is None:
            raise NotFoundException(message="User not found.", error_code="USER_NOT_FOUND")
        badges = await self._badges.get_by_user(profile.id)
        return [BadgeResponse.model_validate(b) for b in badges]

    # ------------------------------------------------------------------
    # Reputation (read-only in Phase 1 — updated by Kafka events in Phase 2)
    # ------------------------------------------------------------------

    async def get_reputation(self, profile_id: uuid.UUID) -> ReputationResponse:
        profile = await self._profiles.get_by_id(profile_id)
        if profile is None:
            raise NotFoundException(message="User not found.", error_code="USER_NOT_FOUND")
        rep = await self._reputation.get_by_user(profile.id)
        if rep is None:
            return ReputationResponse()
        return ReputationResponse.model_validate(rep)

    # ------------------------------------------------------------------
    # Saved items
    # ------------------------------------------------------------------

    async def list_saved(
        self,
        jwt_payload: Dict[str, Any],
        entity_type: Optional[str] = None,
    ) -> List[SavedItemResponse]:
        auth_user_id = _extract_auth_user_id(jwt_payload)
        profile = await self._get_or_create_profile(auth_user_id)
        items = await self._saved.get_by_user(profile.id, entity_type)
        return [SavedItemResponse.model_validate(i) for i in items]

    async def save_item(
        self,
        jwt_payload: Dict[str, Any],
        entity_type: str,
        entity_id: uuid.UUID,
    ) -> SavedItemResponse:
        auth_user_id = _extract_auth_user_id(jwt_payload)
        profile = await self._get_or_create_profile(auth_user_id)
        item = await self._saved.save(profile.id, entity_type, entity_id)
        return SavedItemResponse.model_validate(item)

    async def unsave_item(
        self,
        jwt_payload: Dict[str, Any],
        entity_type: str,
        entity_id: uuid.UUID,
    ) -> MessageResponse:
        auth_user_id = _extract_auth_user_id(jwt_payload)
        profile = await self._get_or_create_profile(auth_user_id)
        await self._saved.unsave(profile.id, entity_type, entity_id)
        return MessageResponse(message="Item removed from saved.")

    # ------------------------------------------------------------------
    # Avatar upload (POST /users/me/avatar)
    # ------------------------------------------------------------------

    async def upload_avatar(
        self,
        jwt_payload: Dict[str, Any],
        file_data: bytes,
        content_type: str,
    ) -> MediaUploadResponse:
        self._validate_upload(file_data, content_type)

        auth_user_id = _extract_auth_user_id(jwt_payload)
        profile = await self._get_or_create_profile(auth_user_id)
        ext = MIME_TO_EXT[content_type]
        object_name = make_avatar_object_name(profile.id, ext)

        # Upload first — do NOT update DB if upload fails
        await upload_object(object_name, file_data, content_type)

        # Only update DB after successful upload
        await self._profiles.update(profile.id, avatar_url=object_name)

        url = await presigned_url(object_name, expires_hours=1)
        logger.info("Avatar uploaded", extra={"extra_data": {"profile_id": str(profile.id)}})
        return MediaUploadResponse(
            object_name=object_name,
            presigned_url=url,
            message="Avatar uploaded successfully.",
        )

    # ------------------------------------------------------------------
    # Cover upload (POST /users/me/cover)
    # ------------------------------------------------------------------

    async def upload_cover(
        self,
        jwt_payload: Dict[str, Any],
        file_data: bytes,
        content_type: str,
    ) -> MediaUploadResponse:
        self._validate_upload(file_data, content_type)

        auth_user_id = _extract_auth_user_id(jwt_payload)
        profile = await self._get_or_create_profile(auth_user_id)
        ext = MIME_TO_EXT[content_type]
        object_name = make_cover_object_name(profile.id, ext)

        await upload_object(object_name, file_data, content_type)
        await self._profiles.update(profile.id, cover_url=object_name)

        url = await presigned_url(object_name, expires_hours=1)
        logger.info("Cover uploaded", extra={"extra_data": {"profile_id": str(profile.id)}})
        return MediaUploadResponse(
            object_name=object_name,
            presigned_url=url,
            message="Cover image uploaded successfully.",
        )

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _validate_upload(file_data: bytes, content_type: str) -> None:
        """Validate content-type and file size before any upload attempt."""
        from shared.exceptions import ValidationException
        if content_type not in ALLOWED_MIME_TYPES:
            raise ValidationException(
                message=f"Unsupported file type '{content_type}'. Allowed: {', '.join(sorted(ALLOWED_MIME_TYPES))}",
                error_code="INVALID_FILE_TYPE",
            )
        if len(file_data) > MAX_UPLOAD_BYTES:
            raise ValidationException(
                message=f"File exceeds maximum allowed size of {MAX_UPLOAD_BYTES // (1024*1024)} MB.",
                error_code="FILE_TOO_LARGE",
            )
        if len(file_data) == 0:
            raise ValidationException(
                message="File is empty.",
                error_code="EMPTY_FILE",
            )
