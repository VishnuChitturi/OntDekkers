"""Initial migration - community_db tables

Revision ID: 001_initial
Revises:
Create Date: 2026-07-25 02:00:00.000000

Creates all tables for the Community Service in community_db.

Table creation order respects FK dependencies:
    1. communities             (root aggregate — no intra-service FK dependencies)
    2. community_members       (FK → communities)
    3. join_requests           (FK → communities)
    4. community_rules         (FK → communities)
    5. discussions             (FK → communities)
    6. discussion_comments     (FK → discussions)

All user_id / author_id / creator_id / requester_id columns are plain UUIDs
with NO SQL FK constraints — they reference user_db which is a separate database.
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# ---------------------------------------------------------------------------
# Alembic revision identifiers
# ---------------------------------------------------------------------------
revision: str = "001_initial"
down_revision: Union[str, None] = None   # root migration
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# ---------------------------------------------------------------------------
# upgrade
# ---------------------------------------------------------------------------

def upgrade() -> None:
    # ── Table 1: communities ──────────────────────────────────────────
    # Root aggregate. External reference: creator_id (UUID, no SQL FK).
    # AuditMixin: created_at, updated_at, created_by, updated_by
    # SoftDeleteMixin: is_deleted, deleted_at, deleted_by
    op.create_table(
        "communities",
        sa.Column("id",                postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("creator_id",        postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name",              sa.String(100),  nullable=False),
        sa.Column("slug",              sa.String(120),  nullable=False),
        sa.Column("description",       sa.Text,         nullable=True),
        sa.Column("location",          sa.String(255),  nullable=True),
        sa.Column("logo_url",          sa.String(1024), nullable=True),
        sa.Column("logo_object_key",   sa.String(1024), nullable=True),
        sa.Column("banner_url",        sa.String(1024), nullable=True),
        sa.Column("banner_object_key", sa.String(1024), nullable=True),
        sa.Column("status",            sa.String(20),   nullable=False, server_default="ACTIVE"),
        sa.Column("visibility",        sa.String(20),   nullable=False, server_default="PUBLIC"),
        sa.Column("requires_approval", sa.Boolean,      nullable=False, server_default="false"),
        sa.Column("member_count",      sa.Integer,      nullable=False, server_default="0"),
        # SoftDeleteMixin
        sa.Column("is_deleted",  sa.Boolean,               nullable=False, server_default="false"),
        sa.Column("deleted_at",  sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by",  postgresql.UUID(as_uuid=True), nullable=True),
        # AuditMixin
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("updated_by", postgresql.UUID(as_uuid=True), nullable=True),
        # Constraints
        sa.UniqueConstraint("slug", name="uq_communities_slug"),
    )
    op.create_index("ix_communities_slug",               "communities", ["slug"],           unique=True)
    op.create_index("ix_communities_creator_id",         "communities", ["creator_id"])
    op.create_index("ix_communities_status_visibility",  "communities", ["status", "visibility"])
    op.create_index("ix_communities_creator_created",    "communities", ["creator_id", "created_at"])

    # ── Table 2: community_members ────────────────────────────────────
    # FK → communities. External reference: user_id (no SQL FK).
    # TimestampMixin + AuditMixin
    op.create_table(
        "community_members",
        sa.Column("id",           postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("community_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("communities.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id",      postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("role",         sa.String(20), nullable=False, server_default="MEMBER"),
        sa.Column("status",       sa.String(20), nullable=False, server_default="ACTIVE"),
        # AuditMixin
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("updated_by", postgresql.UUID(as_uuid=True), nullable=True),
        # Constraints
        sa.UniqueConstraint("community_id", "user_id", name="uq_community_member"),
    )
    op.create_index("ix_community_members_user_id",          "community_members", ["user_id"])
    op.create_index("ix_community_members_community_status", "community_members", ["community_id", "status"])

    # ── Table 3: join_requests ────────────────────────────────────────
    # FK → communities. External reference: requester_id, reviewed_by (no SQL FKs).
    op.create_table(
        "join_requests",
        sa.Column("id",           postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("community_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("communities.id", ondelete="CASCADE"), nullable=False),
        sa.Column("requester_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("message",      sa.Text,        nullable=True),
        sa.Column("status",       sa.String(20),  nullable=False, server_default="PENDING"),
        sa.Column("reviewed_by",  postgresql.UUID(as_uuid=True), nullable=True),
        # AuditMixin
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("updated_by", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_index("ix_join_requests_community_status", "join_requests", ["community_id", "status"])
    op.create_index("ix_join_requests_requester_id",     "join_requests", ["requester_id"])

    # ── Table 4: community_rules ──────────────────────────────────────
    # FK → communities.
    op.create_table(
        "community_rules",
        sa.Column("id",           postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("community_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("communities.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title",        sa.String(255), nullable=False),
        sa.Column("description",  sa.Text,        nullable=True),
        sa.Column("order_index",  sa.Integer,     nullable=False, server_default="1"),
        # AuditMixin
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("updated_by", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_index("ix_community_rules_community_order", "community_rules", ["community_id", "order_index"])

    # ── Table 5: discussions ──────────────────────────────────────────
    # FK → communities. External reference: author_id (no SQL FK).
    # AuditMixin + SoftDeleteMixin
    op.create_table(
        "discussions",
        sa.Column("id",            postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("community_id",  postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("communities.id", ondelete="CASCADE"), nullable=False),
        sa.Column("author_id",     postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title",         sa.String(255), nullable=False),
        sa.Column("content",       sa.Text,        nullable=True),
        sa.Column("comment_count", sa.Integer,     nullable=False, server_default="0"),
        # SoftDeleteMixin
        sa.Column("is_deleted", sa.Boolean,               nullable=False, server_default="false"),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", postgresql.UUID(as_uuid=True), nullable=True),
        # AuditMixin
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("updated_by", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_index("ix_discussions_community_created", "discussions", ["community_id", "created_at"])
    op.create_index("ix_discussions_author_id",         "discussions", ["author_id"])

    # ── Table 6: discussion_comments ──────────────────────────────────
    # FK → discussions. External reference: author_id (no SQL FK).
    # TimestampMixin + SoftDeleteMixin
    op.create_table(
        "discussion_comments",
        sa.Column("id",            postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("discussion_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("discussions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("author_id",     postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("content",       sa.Text, nullable=False),
        # SoftDeleteMixin
        sa.Column("is_deleted", sa.Boolean,               nullable=False, server_default="false"),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", postgresql.UUID(as_uuid=True), nullable=True),
        # TimestampMixin
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        # Constraints
        sa.CheckConstraint("LENGTH(TRIM(content)) > 0", name="ck_discussion_comment_not_empty"),
    )
    op.create_index("ix_discussion_comments_discussion_created", "discussion_comments", ["discussion_id", "created_at"])
    op.create_index("ix_discussion_comments_author_id",          "discussion_comments", ["author_id"])


# ---------------------------------------------------------------------------
# downgrade — fully reverses upgrade() in reverse dependency order
# ---------------------------------------------------------------------------

def downgrade() -> None:
    op.drop_table("discussion_comments")
    op.drop_table("discussions")
    op.drop_table("community_rules")
    op.drop_table("join_requests")
    op.drop_table("community_members")
    op.drop_table("communities")
