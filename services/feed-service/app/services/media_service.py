"""
Feed Service — Media Business Logic

Service class for media upload URL generation and post media metadata persistence.
Uses the official MinIO Python SDK (minio>=7.2.0) for presigned URL generation
and bucket management.
"""

import asyncio
import uuid
from datetime import timedelta
from typing import Optional

from minio import Minio
from minio.error import S3Error
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.settings import settings
from app.repositories import PostRepository
from app.schemas.feed import MediaUploadRequest, MediaUploadResponse, PostMediaCreateRequest
from shared.exceptions import NotFoundError, ForbiddenError

# MinIO bucket for post media
POST_BUCKET = "posts"


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
    """Business logic for post media upload management."""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.post_repo = PostRepository(session)

    # -------------------------------------------------------------------------
    # Presigned URL generation
    # -------------------------------------------------------------------------

    async def generate_upload_url(
        self,
        post_id: uuid.UUID,
        request: MediaUploadRequest,
        user_id: uuid.UUID,
    ) -> MediaUploadResponse:
        """Generate a presigned PUT URL for uploading media to a post.

        Post author only.
        """
        post = await self.post_repo.get_by_id(post_id)
        if not post:
            raise NotFoundError(f"Post {post_id} not found")

        if post.author_id != user_id:
            raise ForbiddenError("You can only upload media to your own posts")

        ext = self._get_extension(request.filename)
        object_key = f"{POST_BUCKET}/{post_id}/{uuid.uuid4()}{ext}"

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
        Derives the permanent public media_url from the object_key using the
        configured MinIO endpoint.

        Post author only.
        """
        post = await self.post_repo.get_by_id(post_id)
        if not post:
            raise NotFoundError(f"Post {post_id} not found")

        if post.author_id != user_id:
            raise ForbiddenError("You can only add media to your own posts")

        # Build a permanent public URL: http(s)://<endpoint>/<object_key>
        # The object_key already includes the bucket prefix (posts/<post_id>/<uuid>.ext)
        # so the URL must not double-insert the bucket name.
        scheme = "https" if settings.MINIO_SECURE else "http"
        media_url = f"{scheme}://{settings.MINIO_ENDPOINT}/{request.object_key}"

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
    # Private helpers
    # -------------------------------------------------------------------------

    def _generate_presigned_put_url(self, object_key: str) -> str:
        """Synchronous helper: ensure bucket exists, then return a presigned PUT URL.

        Runs inside a thread pool executor (called via run_in_executor).

        The stored object_key has the form  posts/{post_id}/{uuid}.ext  so that the
        public URL (scheme://endpoint/object_key) resolves without an explicit bucket
        segment.  When calling the MinIO SDK we strip the leading "posts/" prefix
        because the SDK inserts the bucket name in the URL path itself:
          presigned_put_object("posts", "{post_id}/{uuid}.ext")
          → http://minio:9000/posts/{post_id}/{uuid}.ext?…   (correct)
        Passing the full object_key would produce the doubled path /posts/posts/…
        """
        client = _build_minio_client()
        _ensure_bucket(client, POST_BUCKET)
        bucket_prefix = POST_BUCKET + "/"
        sdk_object_name = (
            object_key[len(bucket_prefix):]
            if object_key.startswith(bucket_prefix)
            else object_key
        )
        return client.presigned_put_object(
            POST_BUCKET,
            sdk_object_name,
            expires=timedelta(hours=1),
        )

    @staticmethod
    def _get_extension(filename: str) -> str:
        """Extract the file extension, defaulting to .jpg."""
        if "." in filename:
            return "." + filename.rsplit(".", 1)[-1].lower()
        return ".jpg"
