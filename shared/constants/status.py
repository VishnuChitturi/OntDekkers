from enum import Enum


# ---------------------------------------------------------------------------
# Story / Post Status
# ---------------------------------------------------------------------------

class StoryStatus(str, Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    ARCHIVED = "ARCHIVED"
    DELETED = "DELETED"


# Canonical alias used by Feed Service (the public API uses "post" terminology)
class PostStatus(str, Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    ARCHIVED = "ARCHIVED"
    DELETED = "DELETED"


# ---------------------------------------------------------------------------
# Post / Story Visibility
# ---------------------------------------------------------------------------

class PostVisibility(str, Enum):
    PUBLIC = "PUBLIC"          # Visible to everyone
    COMMUNITY = "COMMUNITY"    # Visible only to community members
    PRIVATE = "PRIVATE"        # Visible only to the author


# ---------------------------------------------------------------------------
# Media
# ---------------------------------------------------------------------------

class MediaType(str, Enum):
    IMAGE = "IMAGE"
    VIDEO = "VIDEO"            # Future phase


# ---------------------------------------------------------------------------
# Community Status
# ---------------------------------------------------------------------------

class CommunityStatus(str, Enum):
    ACTIVE = "ACTIVE"
    ARCHIVED = "ARCHIVED"
    DELETED = "DELETED"


# ---------------------------------------------------------------------------
# Community Visibility
# ---------------------------------------------------------------------------

class CommunityVisibility(str, Enum):
    PUBLIC = "PUBLIC"
    PRIVATE = "PRIVATE"


# ---------------------------------------------------------------------------
# Community Member Roles
# ---------------------------------------------------------------------------

class MemberRole(str, Enum):
    OWNER = "OWNER"
    MODERATOR = "MODERATOR"
    MEMBER = "MEMBER"
    BANNED = "BANNED"


# ---------------------------------------------------------------------------
# Membership / Join Request Status
# ---------------------------------------------------------------------------

class MembershipStatus(str, Enum):
    ACTIVE = "ACTIVE"
    LEFT = "LEFT"
    REMOVED = "REMOVED"
    BANNED = "BANNED"


class JoinRequestStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"


# ---------------------------------------------------------------------------
# Expedition Status  (owned by Dev 3 — preserved unchanged)
# ---------------------------------------------------------------------------

class ExpeditionStatus(str, Enum):
    PENDING = "PENDING"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


# ---------------------------------------------------------------------------
# Guide Status  (owned by Dev 3 — preserved unchanged)
# ---------------------------------------------------------------------------

class GuideStatus(str, Enum):
    APPLIED = "APPLIED"
    VERIFIED = "VERIFIED"
    SUSPENDED = "SUSPENDED"
    REJECTED = "REJECTED"
