"""
Community Service — Membership Models
Owns: community_members, join_requests tables in community_db.

Design rules:
- user_id is a plain UUID (NOT a database FK) — references user_db.
- community_id IS a real FK within community_db → communities.id.
- A user can be a member of a community exactly once (unique constraint).
- Banned members have role=BANNED and status=BANNED.
- Join requests are created for private communities or communities requiring approval.
"""

import uuid
from typing import Optional, TYPE_CHECKING

from sqlalchemy import (
    UUID,
    ForeignKey,
    Index,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from shared.database import Base, TimestampMixin, AuditMixin
from shared.constants.status import MemberRole, MembershipStatus, JoinRequestStatus

if TYPE_CHECKING:
    from .community import Community


class CommunityMember(Base, TimestampMixin):
    """
    Records a user's membership in a community.
    A user can be a member of a given community exactly once.
    Role determines permissions within the community.
    """

    __tablename__ = "community_members"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )

    # FK within community_db
    community_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("communities.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # External reference — references user_db, NOT a FK
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
    )

    # Role within the community
    role: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=MemberRole.MEMBER,
        index=True,
    )

    # Membership status (ACTIVE, LEFT, REMOVED, BANNED)
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=MembershipStatus.ACTIVE,
        index=True,
    )

    # Relationship back to community
    community: Mapped["Community"] = relationship("Community", back_populates="members")

    __table_args__ = (
        # One active membership record per user per community
        UniqueConstraint("community_id", "user_id", name="uq_community_member"),
        Index("ix_community_members_user_id", "user_id"),
        Index("ix_community_members_community_status", "community_id", "status"),
    )

    def __repr__(self) -> str:
        return f"<CommunityMember community={self.community_id} user={self.user_id} role={self.role}>"


class JoinRequest(Base, AuditMixin):
    """
    Records a user's request to join a private or approval-required community.
    After approval/rejection the record is kept for audit purposes.
    """

    __tablename__ = "join_requests"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )

    # FK within community_db
    community_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("communities.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # External reference — references user_db, NOT a FK
    requester_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
    )

    # Optional message from the requester (e.g., "Why I want to join…")
    message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # PENDING | APPROVED | REJECTED | CANCELLED
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=JoinRequestStatus.PENDING,
        index=True,
    )

    # UUID of moderator/owner who acted on the request (nullable until actioned)
    reviewed_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
    )

    # Relationship back to community
    community: Mapped["Community"] = relationship("Community", back_populates="join_requests")

    __table_args__ = (
        Index("ix_join_requests_community_status", "community_id", "status"),
        Index("ix_join_requests_requester_id", "requester_id"),
        # A user can only have one PENDING request per community at a time
        # (enforced at service layer — historical records are kept)
    )

    def __repr__(self) -> str:
        return f"<JoinRequest community={self.community_id} requester={self.requester_id} status={self.status}>"
