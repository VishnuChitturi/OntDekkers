"""
Community Service — Media Business Logic

Service class that handles presigned URL generation for community logos
and banners, and persists the resulting object keys after upload.

NOTE: MinIO integration is STUBBED in Phase 1. The presigned URL returned
is a placeholder. Real MinIO SDK calls will be added in Checkpoint 4.
"""

import uuid
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories import CommunityRepository, MembershipRepository
from app.schemas.community import (
    MediaUploadRequest,
    MediaUploadResponse,
    CommunityMediaSetRequest,
    CommunitySchema,
)
from shared.constants.status import MemberRole
from shared.exceptions import NotFoundError, ForbiddenError, ValidationError

# MinIO bucket for community media
COMMUNITY_BUCKET = "communities"


class MediaService:
    """Business logic for community logo and banner management."""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.community_repo = CommunityRepository(session)
        self.membership_repo = MembershipRepository(session)

    # -------------------------------------------------------------------------
    # Presigned URL generation  (stubbed — Phase 1)
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

        # TODO (Checkpoint 4): Replace with real MinIO presigned URL
        upload_url = f"http://minio:9000/{object_key}?stub=true"

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

        # TODO (Checkpoint 4): Replace with real MinIO presigned URL
        upload_url = f"http://minio:9000/{object_key}?stub=true"

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

        Derives the public URL from the object key.
        OWNER only.
        """
        await self._require_owner(community_id, current_user_id)

        # TODO (Checkpoint 4): Build real MinIO URL via SDK
        logo_url = f"http://minio:9000/{request.object_key}"

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

        # TODO (Checkpoint 4): Build real MinIO URL via SDK
        banner_url = f"http://minio:9000/{request.object_key}"

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
    # Helpers
    # -------------------------------------------------------------------------

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
