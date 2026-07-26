"""
Feed Service — Media Business Logic

Service class for media upload URL generation and post media metadata persistence.

NOTE: MinIO integration is STUBBED in Phase 1. The presigned URL returned is a
placeholder. Real MinIO SDK calls will be added in Checkpoint 4 (MinIO integration).
"""

import uuid
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories import PostRepository
from app.schemas.feed import MediaUploadRequest, MediaUploadResponse, PostMediaCreateRequest
from shared.exceptions import NotFoundError, ForbiddenError, ValidationError
from app.config.settings import settings

# MinIO bucket for post media
POST_BUCKET = "posts"


class MediaService:
    """Business logic for post media upload management."""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.post_repo = PostRepository(session)

    # -------------------------------------------------------------------------
    # Presigned URL generation  (stubbed — Phase 1)
    # -------------------------------------------------------------------------

    async def generate_upload_url(
        self,
        post_id: uuid.UUID,
        request: MediaUploadRequest,
        user_id: uuid.UUID,
    ) -> MediaUploadResponse:
        """Generate a presigned PUT URL for uploading media to a post.

        Post author only.

        TODO (Checkpoint 4): Replace stub with real MinIO presigned_put_object call.
        """
        post = await self.post_repo.get_by_id(post_id)
        if not post:
            raise NotFoundError(f"Post {post_id} not found")

        if post.author_id != user_id:
            raise ForbiddenError("You can only upload media to your own posts")

        ext = self._get_extension(request.filename)
        object_key = f"{POST_BUCKET}/{post_id}/{uuid.uuid4()}{ext}"

        # TODO (Checkpoint 4): Replace with real MinIO presigned URL
        # minio_host comes from settings.MINIO_ENDPOINT (to be added to settings)
        minio_host = getattr(settings, "MINIO_ENDPOINT", "minio:9000")
        upload_url = f"http://{minio_host}/{object_key}?stub=true"

        return MediaUploadResponse(
            upload_url=upload_url,
            object_key=object_key,
            expires_in=3600,
        )

    # -------------------------------------------------------------------------
    # Media metadata persistence (called after client uploads to MinIO)
    # -------------------------------------------------------------------------

    async def associate_media_with_post(
        self,
        post_id: uuid.UUID,
        request: PostMediaCreateRequest,
        user_id: uuid.UUID,
    ):
        """Associate uploaded media metadata with a post.

        The client has already uploaded the binary to MinIO before calling this.
        Derives the public media_url from the object_key.

        Post author only.
        """
        post = await self.post_repo.get_by_id(post_id)
        if not post:
            raise NotFoundError(f"Post {post_id} not found")

        if post.author_id != user_id:
            raise ForbiddenError("You can only add media to your own posts")

        # TODO (Checkpoint 4): Build real MinIO URL via SDK
        minio_host = getattr(settings, "MINIO_ENDPOINT", "minio:9000")
        media_url = f"http://{minio_host}/{POST_BUCKET}/{request.object_key}"

        media = await self.post_repo.add_media(
            post_id=post_id,
            media_url=media_url,
            object_key=request.object_key,
            display_order=request.display_order,
            alt_text=request.alt_text,
            created_by=user_id,
        )

        return media

    # -------------------------------------------------------------------------
    # Helpers
    # -------------------------------------------------------------------------

    @staticmethod
    def _get_extension(filename: str) -> str:
        """Extract the file extension, defaulting to .jpg."""
        if "." in filename:
            return "." + filename.rsplit(".", 1)[-1].lower()
        return ".jpg"
