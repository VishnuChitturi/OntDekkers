# models package initialisation
#
# CRITICAL FOR ALEMBIC: every model module must be imported here.
#
# When alembic/env.py runs `import app.models` and then reads
# Base.metadata, SQLAlchemy only knows about tables whose ORM classes
# have been imported into the Python process. Importing them here
# ensures that a single `import app.models` is sufficient for Alembic
# to detect all 6 tables in feed_db.
#
# Import order follows the FK dependency graph:
#   Post (root) → PostMedia, PostTag (media/tags)
#               → Comment (comments, self-referential)
#   Like, Bookmark, Share (interactions — FK to Post)

from app.models.post import Post, PostMedia, PostTag
from app.models.comment import Comment
from app.models.interaction import Like, Bookmark, Share

__all__ = [
    # Root aggregate
    "Post",

    # Post children
    "PostMedia",
    "PostTag",

    # Comments
    "Comment",

    # Interactions
    "Like",
    "Bookmark",
    "Share",
]
