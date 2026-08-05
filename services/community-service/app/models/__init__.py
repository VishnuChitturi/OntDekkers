# models package initialisation
#
# CRITICAL FOR ALEMBIC: every model module must be imported here.
#
# When alembic/env.py runs `import app.models` and then reads
# Base.metadata, SQLAlchemy only knows about tables whose ORM classes
# have been imported into the Python process. Importing them here
# ensures that a single `import app.models` is sufficient for Alembic
# to detect all 6 tables in community_db.
#
# Import order follows the FK dependency graph:
#   Community (root) → CommunityMember, JoinRequest (membership)
#                    → CommunityRule (rule)
#                    → Discussion → DiscussionComment (discussion)

from app.models.community import Community
from app.models.membership import CommunityMember, JoinRequest
from app.models.rule import CommunityRule
from app.models.discussion import Discussion, DiscussionComment

__all__ = [
    # Root aggregate
    "Community",

    # Membership
    "CommunityMember",
    "JoinRequest",

    # Rules
    "CommunityRule",

    # Discussions
    "Discussion",
    "DiscussionComment",
]
