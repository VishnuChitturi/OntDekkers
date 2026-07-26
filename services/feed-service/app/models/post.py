"""
Feed Service — Post Models
Owns: posts, post_media, post_tags tables in feed_db.

Design rules:
- author_id, community_id, expedition_id are plain UUIDs (NOT database FKs).
  They reference user_db, community_db, trip_db respectively.
  Referential integrity is enforced at the application/service layer only.
- Binary media is never stored here. post_media stores MinIO object URLs only.
- Soft-delete via SoftDeleteMixin (is_deleted, deleted_at, deleted_by).
"""

import uuid
from typing import Optional, TYPE_CHECKING

from sqlalchemy import (
    UUID,
    Boolean,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from shared.database import AuditMixin, Base, SoftDeleteMixin
from shared.constants.status import MediaType, PostStatus, PostVisibility

if TYPE_CHECKING:
    from .comment import Comment


class Post(Base, AuditMixin, SoftDeleteMixin):
    """
    Core travel post entity.
    Represents a user's travel story shared on the platform.
    """

    __tablename__ = "posts"

    # Primary key
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )

    # -----------------------------------------------------------------------
    # External references — plain UUID columns, NOT database FKs
    # -----------------------------------------------------------------------
    # References user_db → user_profiles.id (via User Service)
    author_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
    )

    # References community_db → communities.id (via Community Service)
    # Optional — a post may exist independently of any community
    community_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
        index=True,
    )

    # References trip_db → expeditions.id (via Expedition Service)
    # Optional — a post may be linked to an expedition
    expedition_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
        index=True,
    )

    # -----------------------------------------------------------------------
    # Content fields
    # -----------------------------------------------------------------------
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Optional location string (city name, landmark, coordinates-as-text, etc.)
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # -----------------------------------------------------------------------
    # Status & visibility
    # -----------------------------------------------------------------------
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=PostStatus.PUBLISHED,
        index=True,
    )
    visibility: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=PostVisibility.PUBLIC,
        index=True,
    )

    # -----------------------------------------------------------------------
    # Relationships (within feed_db only)
    # -----------------------------------------------------------------------
    media: Mapped[list["PostMedia"]] = relationship(
        "PostMedia",
        back_populates="post",
        cascade="all, delete-orphan",
        order_by="PostMedia.display_order",
        lazy="selectin",
    )
    tags: Mapped[list["PostTag"]] = relationship(
        "PostTag",
        back_populates="post",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    
    # Import Comment lazily to avoid circular imports
    comments: Mapped[list["Comment"]] = relationship(
        "Comment",
        foreign_keys="Comment.post_id",
        cascade="all, delete-orphan",
        lazy="select",
    )

    # -----------------------------------------------------------------------
    # Indexes for common query patterns
    # -----------------------------------------------------------------------
    __table_args__ = (
        Index("ix_posts_author_created", "author_id", "created_at"),
        Index("ix_posts_community_created", "community_id", "created_at"),
        Index("ix_posts_status_visibility", "status", "visibility"),
    )

    def __repr__(self) -> str:
        return f"<Post id={self.id} title={self.title!r} author={self.author_id}>"


class PostMedia(Base, AuditMixin):
    """
    Media metadata for a post.
    Binary files are stored in MinIO (bucket: posts).
    Only the MinIO object URL is persisted here.
    """

    __tablename__ = "post_media"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )

    # FK within feed_db — safe to use a real FK here
    post_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("posts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Full MinIO object URL (e.g. https://cdn.ontdekker.com/posts/{post_id}/{uuid}.jpg)
    media_url: Mapped[str] = mapped_column(String(1024), nullable=False)

    # MinIO object key for deletion (e.g. posts/{post_id}/{uuid}.jpg)
    object_key: Mapped[str] = mapped_column(String(1024), nullable=False)

    # Media type — IMAGE for Phase 1, VIDEO in future
    media_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=MediaType.IMAGE,
    )

    # Ordering within the post gallery (0-indexed, 0 = cover image)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Optional alt text for accessibility
    alt_text: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Relationship back to parent post
    post: Mapped["Post"] = relationship("Post", back_populates="media")

    __table_args__ = (
        Index("ix_post_media_post_order", "post_id", "display_order"),
    )

    def __repr__(self) -> str:
        return f"<PostMedia id={self.id} post_id={self.post_id} order={self.display_order}>"


class PostTag(Base):
    """
    Travel tags attached to a post.
    Examples: 'Hiking', 'Camping', 'Wildlife', 'Culture', 'Photography'.
    """

    __tablename__ = "post_tags"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )

    # FK within feed_db
    post_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("posts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Tag value — lowercase, trimmed at service layer
    tag: Mapped[str] = mapped_column(String(50), nullable=False)

    # Relationship back to parent post
    post: Mapped["Post"] = relationship("Post", back_populates="tags")

    __table_args__ = (
        # A post cannot have the same tag twice
        UniqueConstraint("post_id", "tag", name="uq_post_tag"),
        Index("ix_post_tags_tag", "tag"),
    )

    def __repr__(self) -> str:
        return f"<PostTag post_id={self.post_id} tag={self.tag!r}>"
