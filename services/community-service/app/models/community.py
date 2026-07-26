"""
Community Service — Community Model
Owns: communities table in community_db.

Design rules:
- creator_id is a plain UUID (NOT a database FK) — references user_db.
- Binary media (logos, banners) are never stored here. Only MinIO URLs.
- Soft-delete via SoftDeleteMixin.
- member_count is a denormalized counter updated on membership changes.
"""

import uuid
from typing import Optional, TYPE_CHECKING

from sqlalchemy import (
    UUID,
    Boolean,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from shared.database import AuditMixin, Base, SoftDeleteMixin
from shared.constants.status import CommunityStatus, CommunityVisibility

if TYPE_CHECKING:
    from .membership import CommunityMember, JoinRequest
    from .rule import CommunityRule
    from .discussion import Discussion


class Community(Base, AuditMixin, SoftDeleteMixin):
    """
    Core community entity.
    Represents a location-based social group for slow travelers.
    """

    __tablename__ = "communities"

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
    creator_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
    )

    # -----------------------------------------------------------------------
    # Core content fields
    # -----------------------------------------------------------------------
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(120), nullable=False, unique=True, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # -----------------------------------------------------------------------
    # Media — MinIO URLs only, no binary data
    # -----------------------------------------------------------------------
    logo_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    logo_object_key: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    banner_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    banner_object_key: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)

    # -----------------------------------------------------------------------
    # Status & visibility
    # -----------------------------------------------------------------------
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=CommunityStatus.ACTIVE,
        index=True,
    )
    visibility: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=CommunityVisibility.PUBLIC,
        index=True,
    )

    # Whether joining requires approval (private communities always do)
    requires_approval: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # Denormalized member count — updated by service layer on membership changes
    member_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # -----------------------------------------------------------------------
    # Relationships (within community_db only)
    # -----------------------------------------------------------------------
    members: Mapped[list["CommunityMember"]] = relationship(
        "CommunityMember",
        back_populates="community",
        cascade="all, delete-orphan",
        lazy="select",
    )
    join_requests: Mapped[list["JoinRequest"]] = relationship(
        "JoinRequest",
        back_populates="community",
        cascade="all, delete-orphan",
        lazy="select",
    )
    rules: Mapped[list["CommunityRule"]] = relationship(
        "CommunityRule",
        back_populates="community",
        cascade="all, delete-orphan",
        order_by="CommunityRule.order_index",
        lazy="selectin",
    )
    discussions: Mapped[list["Discussion"]] = relationship(
        "Discussion",
        back_populates="community",
        cascade="all, delete-orphan",
        lazy="select",
    )

    # -----------------------------------------------------------------------
    # Indexes for common query patterns
    # -----------------------------------------------------------------------
    __table_args__ = (
        Index("ix_communities_status_visibility", "status", "visibility"),
        Index("ix_communities_creator_created", "creator_id", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<Community id={self.id} name={self.name!r} slug={self.slug!r}>"
