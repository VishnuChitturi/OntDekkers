"""Initial migration - feed_db tables

Revision ID: 001_initial
Revises:
Create Date: 2026-07-25 02:00:00.000000

Creates all tables for the Feed Service in feed_db.

Table creation order respects FK dependencies:
    1. posts                   (root aggregate — no intra-service FK dependencies)
    2. post_media              (FK → posts)
    3. post_tags               (FK → posts)
    4. comments                (FK → posts, self-referential FK for nesting)
    5. likes                   (FK → posts)
    6. bookmarks               (FK → posts)
    7. shares                  (FK → posts)

All author_id, user_id, community_id, expedition_id columns are plain UUIDs
with NO SQL FK constraints — they reference other databases.
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
    # ── Table 1: posts ────────────────────────────────────────────────
    # Root aggregate. External references: author_id, community_id, expedition_id (no SQL FKs).
    # AuditMixin: created_at, updated_at, created_by, updated_by
    # SoftDeleteMixin: is_deleted, deleted_at, deleted_by
    op.create_table(
        "posts",
        sa.Column("id",            postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("author_id",     postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("community_id",  postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("expedition_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("title",         sa.String(255), nullable=True),
        sa.Column("content",       sa.Text,        nullable=True),
        sa.Column("location",      sa.String(255), nullable=True),
        sa.Column("status",        sa.String(20),  nullable=False, server_default="PUBLISHED"),
        sa.Column("visibility",    sa.String(20),  nullable=False, server_default="PUBLIC"),
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
    op.create_index("ix_posts_author_created",     "posts", ["author_id", "created_at"])
    op.create_index("ix_posts_community_created",  "posts", ["community_id", "created_at"])
    op.create_index("ix_posts_status_visibility",  "posts", ["status", "visibility"])

    # ── Table 2: post_media ───────────────────────────────────────────
    # FK → posts. MinIO URLs only, no binary content.
    op.create_table(
        "post_media",
        sa.Column("id",            postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("post_id",       postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("posts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("media_url",     sa.String(1024), nullable=False),
        sa.Column("object_key",    sa.String(1024), nullable=False),
        sa.Column("media_type",    sa.String(20),   nullable=False, server_default="IMAGE"),
        sa.Column("display_order", sa.Integer,      nullable=False, server_default="0"),
        sa.Column("alt_text",      sa.String(255),  nullable=True),
    )
    op.create_index("ix_post_media_post_order", "post_media", ["post_id", "display_order"])

    # ── Table 3: post_tags ────────────────────────────────────────────
    # FK → posts.
    op.create_table(
        "post_tags",
        sa.Column("id",      postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("post_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("posts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("tag",     sa.String(50), nullable=False),
        # Constraints
        sa.UniqueConstraint("post_id", "tag", name="uq_post_tag"),
    )
    op.create_index("ix_post_tags_tag", "post_tags", ["tag"])

    # ── Table 4: comments ─────────────────────────────────────────────
    # FK → posts. Self-referential FK for one-level nesting.
    # External reference: author_id (no SQL FK).
    # TimestampMixin + SoftDeleteMixin
    op.create_table(
        "comments",
        sa.Column("id",                postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("post_id",           postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("posts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("author_id",         postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("parent_comment_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("comments.id"), nullable=True),
        sa.Column("content",           sa.Text, nullable=False),
        # SoftDeleteMixin
        sa.Column("is_deleted", sa.Boolean,               nullable=False, server_default="false"),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", postgresql.UUID(as_uuid=True), nullable=True),
        # TimestampMixin
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        # Constraints
        sa.CheckConstraint("LENGTH(TRIM(content)) > 0", name="ck_comment_content_not_empty"),
    )
    op.create_index("ix_comments_post_created", "comments", ["post_id", "created_at"])
    op.create_index("ix_comments_parent_id",    "comments", ["parent_comment_id"])
    op.create_index("ix_comments_author_id",    "comments", ["author_id"])

    # ── Table 5: likes ────────────────────────────────────────────────
    # FK → posts. Idempotent per user per post (unique constraint).
    # External reference: user_id (no SQL FK).
    # TimestampMixin
    op.create_table(
        "likes",
        sa.Column("id",      postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("post_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("posts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        # TimestampMixin
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        # Constraints
        sa.UniqueConstraint("post_id", "user_id", name="uq_like_post_user"),
    )
    op.create_index("ix_likes_user_id", "likes", ["user_id"])

    # ── Table 6: bookmarks ────────────────────────────────────────────
    # FK → posts. Idempotent per user per post (unique constraint). Private.
    # External reference: user_id (no SQL FK).
    # TimestampMixin
    op.create_table(
        "bookmarks",
        sa.Column("id",      postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("post_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("posts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        # TimestampMixin
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        # Constraints
        sa.UniqueConstraint("post_id", "user_id", name="uq_bookmark_post_user"),
    )
    op.create_index("ix_bookmarks_user_id",      "bookmarks", ["user_id"])
    op.create_index("ix_bookmarks_user_created", "bookmarks", ["user_id", "created_at"])

    # ── Table 7: shares ───────────────────────────────────────────────
    # FK → posts. NOT idempotent — each share is a distinct event.
    # External reference: user_id (no SQL FK).
    # TimestampMixin
    op.create_table(
        "shares",
        sa.Column("id",            postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("post_id",       postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("posts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id",       postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("share_channel", sa.String(50), nullable=True),
        # TimestampMixin
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_shares_post_id", "shares", ["post_id"])
    op.create_index("ix_shares_user_id", "shares", ["user_id"])


# ---------------------------------------------------------------------------
# downgrade — fully reverses upgrade() in reverse dependency order
# ---------------------------------------------------------------------------

def downgrade() -> None:
    op.drop_table("shares")
    op.drop_table("bookmarks")
    op.drop_table("likes")
    op.drop_table("comments")
    op.drop_table("post_tags")
    op.drop_table("post_media")
    op.drop_table("posts")
