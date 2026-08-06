"""
Community Service — Media Business Logic

Service class that handles presigned URL generation for community logos
and banners, and persists the resulting object keys after upload.
Uses the official MinIO Python SDK (minio>=7.2.0) for presigned URL generation
and bucket management.
"""

import asyncio
import uuid
from datetime import timedelta

from minio import Minio
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.settings import settings
from app.repositories import CommunityRepository, MembershipRepository
from app.schemas.community import (
    MediaUploadRequest,
    MediaUploadResponse,
    CommunityMediaSetRequest,
    CommunitySchema,
)
from shared.constants.status import MemberRole
from shared.exceptions import NotFoundError, ForbiddenError

# MinIO bucket for community media
COMMUNITY_BUCKET = "communities"


def _build_minio_client() -> Minio:
    """Construct a MinIO client from application settings."""
    return Minio(
        endpoint=settings.MINIO_ENDPOINT,
        access_key=settings.MINIO_ACCESS_KEY,
        secret_key=settings.MINIO_SECRET_KEY,
        secure=settings.MINIO_SECURE,
    )


def _ensure_bucket(client: Minio, bucket: str) -> None:
    """Create the bucket if it does not already exist (synchronous)."""
    if not client.bucket_exists(bucket):
        client.make_bucket(bucket)


class MediaService:
    """Business logic for community logo and banner management."""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.community_repo = CommunityRepository(session)
        self.membership_repo = MembershipRepository(session)

    # -------------------------------------------------------------------------
    # Presigned URL generation
    # -------------------------------------------------------------------------

    async def generate_logo_upload_url(
        self,
        community_id: uuid.UUID,
        request: MediaUploadRequest,
        current_user_id: uuid.UUID,
    ) -> MediaUploadResponse:
        """Generate a presigned PUT URL for uploading a community logo.

        OWNER only.
        """
        await self._require_owner(community_id, current_user_id)

        ext = self._get_extension(request.filename)
        object_key = f"{COMMUNITY_BUCKET}/{community_id}/logo/{uuid.uuid4()}{ext}"

        # MinIO SDK calls are synchronous — run in the default thread pool executor
        # so we do not block the async event loop.
        loop = asyncio.get_event_loop()
        upload_url = await loop.run_in_executor(
            None,
            self._generate_presigned_put_url,
            object_key,
        )

        return MediaUploadResponse(
            upload_url=upload_url,
            object_key=object_key,
            expires_in=3600,
        )

    async def generate_banner_upload_url(
        self,
        community_id: uuid.UUID,
        request: MediaUploadRequest,
        current_user_id: uuid.UUID,
    ) -> MediaUploadResponse:
        """Generate a presigned PUT URL for uploading a community banner.

        OWNER only.
        """
        await self._require_owner(community_id, current_user_id)

        ext = self._get_extension(request.filename)
        object_key = f"{COMMUNITY_BUCKET}/{community_id}/banner/{uuid.uuid4()}{ext}"

        loop = asyncio.get_event_loop()
        upload_url = await loop.run_in_executor(
            None,
            self._generate_presigned_put_url,
            object_key,
        )

        return MediaUploadResponse(
            upload_url=upload_url,
            object_key=object_key,
            expires_in=3600,
        )

    # -------------------------------------------------------------------------
    # Media persistence (called after client uploads to MinIO)
    # -------------------------------------------------------------------------

    async def set_community_logo(
        self,
        community_id: uuid.UUID,
        request: CommunityMediaSetRequest,
        current_user_id: uuid.UUID,
    ) -> CommunitySchema:
        """Persist a logo object key after a successful client upload.

        Derives the permanent public URL from the object key.
        OWNER only.
        """
        await self._require_owner(community_id, current_user_id)

        # Build a permanent public URL: http(s)://<endpoint>/<object_key>
        # The object_key already includes the bucket prefix (communities/…)
        # so the URL resolves correctly without an extra bucket segment.
        scheme = "https" if settings.MINIO_SECURE else "http"
        logo_url = f"{scheme}://{settings.MINIO_ENDPOINT}/{request.object_key}"

        updated = await self.community_repo.update_logo(
            community_id=community_id,
            logo_url=logo_url,
            logo_object_key=request.object_key,
            updated_by=current_user_id,
        )
        await self.session.commit()
        if not updated:
            raise NotFoundError(f"Community {community_id} not found")

        # Return the full community schema
        from app.services.community_service import CommunityService
        community_service = CommunityService(self.session)
        return await community_service._to_schema(updated, current_user_id)

    async def set_community_banner(
        self,
        community_id: uuid.UUID,
        request: CommunityMediaSetRequest,
        current_user_id: uuid.UUID,
    ) -> CommunitySchema:
        """Persist a banner object key after a successful client upload.

        OWNER only.
        """
        await self._require_owner(community_id, current_user_id)

        scheme = "https" if settings.MINIO_SECURE else "http"
        banner_url = f"{scheme}://{settings.MINIO_ENDPOINT}/{request.object_key}"

        updated = await self.community_repo.update_banner(
            community_id=community_id,
            banner_url=banner_url,
            banner_object_key=request.object_key,
            updated_by=current_user_id,
        )
        await self.session.commit()
        if not updated:
            raise NotFoundError(f"Community {community_id} not found")

        from app.services.community_service import CommunityService
        community_service = CommunityService(self.session)
        return await community_service._to_schema(updated, current_user_id)

    # -------------------------------------------------------------------------
    # Private helpers
    # -------------------------------------------------------------------------

    def _generate_presigned_put_url(self, object_key: str) -> str:
        """Synchronous helper: ensure bucket exists, then return a presigned PUT URL.

        Runs inside a thread pool executor (called via run_in_executor).

        The stored object_key has the form  communities/{community_id}/logo/{uuid}.ext
        so that the public URL (scheme://endpoint/object_key) resolves correctly.
        When calling the MinIO SDK we strip the leading "communities/" prefix because
        the SDK inserts the bucket name in the URL path itself:
          presigned_put_object("communities", "{community_id}/logo/{uuid}.ext")
          → http://minio:9000/communities/{community_id}/logo/{uuid}.ext?…  (correct)
        Passing the full object_key would produce the doubled path
        /communities/communities/…
        """
        client = _build_minio_client()
        _ensure_bucket(client, COMMUNITY_BUCKET)
        bucket_prefix = COMMUNITY_BUCKET + "/"
        sdk_object_name = (
            object_key[len(bucket_prefix):]
            if object_key.startswith(bucket_prefix)
            else object_key
        )
        return client.presigned_put_object(
            COMMUNITY_BUCKET,
            sdk_object_name,
            expires=timedelta(hours=1),
        )

    async def _require_owner(self, community_id: uuid.UUID, user_id: uuid.UUID) -> None:
        community = await self.community_repo.get_by_id(community_id)
        if not community:
            raise NotFoundError(f"Community {community_id} not found")
        member = await self.membership_repo.get_active_member(community_id, user_id)
        if not member or member.role != MemberRole.OWNER:
            raise ForbiddenError("Only the community owner can manage media")

    @staticmethod
    def _get_extension(filename: str) -> str:
        """Extract the file extension, defaulting to .jpg."""
        if "." in filename:
            return "." + filename.rsplit(".", 1)[-1].lower()
        return ".jpg"
