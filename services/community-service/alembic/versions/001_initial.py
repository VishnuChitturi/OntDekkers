"""Initial migration - community_db tables

Revision ID: 001_initial
Revises: 
Create Date: 2026-07-25 02:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ------------------------------------------------------------------
    # communities
    # ------------------------------------------------------------------
    op.create_table(
        'communities',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('creator_id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('slug', sa.String(length=120), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('location', sa.String(length=255), nullable=True),
        sa.Column('logo_url', sa.String(length=1024), nullable=True),
        sa.Column('logo_object_key', sa.String(length=1024), nullable=True),
        sa.Column('banner_url', sa.String(length=1024), nullable=True),
        sa.Column('banner_object_key', sa.String(length=1024), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('visibility', sa.String(length=20), nullable=False),
        sa.Column('requires_approval', sa.Boolean(), nullable=False),
        sa.Column('member_count', sa.Integer(), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('deleted_by', sa.UUID(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_by', sa.UUID(), nullable=True),
        sa.Column('updated_by', sa.UUID(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('slug', name='uq_communities_slug'),
    )
    op.create_index('ix_communities_slug', 'communities', ['slug'], unique=True)
    op.create_index('ix_communities_creator_id', 'communities', ['creator_id'], unique=False)
    op.create_index('ix_communities_status_visibility', 'communities', ['status', 'visibility'], unique=False)
    op.create_index('ix_communities_creator_created', 'communities', ['creator_id', 'created_at'], unique=False)

    # ------------------------------------------------------------------
    # community_members
    # ------------------------------------------------------------------
    op.create_table(
        'community_members',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('community_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('role', sa.String(length=20), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['community_id'], ['communities.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('community_id', 'user_id', name='uq_community_member'),
    )
    op.create_index('ix_community_members_user_id', 'community_members', ['user_id'], unique=False)
    op.create_index('ix_community_members_community_status', 'community_members', ['community_id', 'status'], unique=False)

    # ------------------------------------------------------------------
    # join_requests
    # ------------------------------------------------------------------
    op.create_table(
        'join_requests',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('community_id', sa.UUID(), nullable=False),
        sa.Column('requester_id', sa.UUID(), nullable=False),
        sa.Column('message', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('reviewed_by', sa.UUID(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_by', sa.UUID(), nullable=True),
        sa.Column('updated_by', sa.UUID(), nullable=True),
        sa.ForeignKeyConstraint(['community_id'], ['communities.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_join_requests_community_status', 'join_requests', ['community_id', 'status'], unique=False)
    op.create_index('ix_join_requests_requester_id', 'join_requests', ['requester_id'], unique=False)

    # ------------------------------------------------------------------
    # community_rules
    # ------------------------------------------------------------------
    op.create_table(
        'community_rules',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('community_id', sa.UUID(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('order_index', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_by', sa.UUID(), nullable=True),
        sa.Column('updated_by', sa.UUID(), nullable=True),
        sa.ForeignKeyConstraint(['community_id'], ['communities.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_community_rules_community_order', 'community_rules', ['community_id', 'order_index'], unique=False)

    # ------------------------------------------------------------------
    # discussions
    # ------------------------------------------------------------------
    op.create_table(
        'discussions',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('community_id', sa.UUID(), nullable=False),
        sa.Column('author_id', sa.UUID(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('content', sa.Text(), nullable=True),
        sa.Column('comment_count', sa.Integer(), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('deleted_by', sa.UUID(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_by', sa.UUID(), nullable=True),
        sa.Column('updated_by', sa.UUID(), nullable=True),
        sa.ForeignKeyConstraint(['community_id'], ['communities.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_discussions_community_created', 'discussions', ['community_id', 'created_at'], unique=False)
    op.create_index('ix_discussions_author_id', 'discussions', ['author_id'], unique=False)

    # ------------------------------------------------------------------
    # discussion_comments
    # ------------------------------------------------------------------
    op.create_table(
        'discussion_comments',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('discussion_id', sa.UUID(), nullable=False),
        sa.Column('author_id', sa.UUID(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('deleted_by', sa.UUID(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("LENGTH(TRIM(content)) > 0", name='ck_discussion_comment_not_empty'),
        sa.ForeignKeyConstraint(['discussion_id'], ['discussions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_discussion_comments_discussion_created', 'discussion_comments', ['discussion_id', 'created_at'], unique=False)
    op.create_index('ix_discussion_comments_author_id', 'discussion_comments', ['author_id'], unique=False)


def downgrade() -> None:
    op.drop_table('discussion_comments')
    op.drop_table('discussions')
    op.drop_table('community_rules')
    op.drop_table('join_requests')
    op.drop_table('community_members')
    op.drop_table('communities')
