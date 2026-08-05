from enum import Enum


class StoryStatus(str, Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    ARCHIVED = "ARCHIVED"
    DELETED = "DELETED"


class PostStatus(str, Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    ARCHIVED = "ARCHIVED"
    DELETED = "DELETED"


class PostVisibility(str, Enum):
    PUBLIC = "PUBLIC"
    COMMUNITY = "COMMUNITY"
    PRIVATE = "PRIVATE"


class MediaType(str, Enum):
    IMAGE = "IMAGE"
    VIDEO = "VIDEO"


class CommunityStatus(str, Enum):
    ACTIVE = "ACTIVE"
    ARCHIVED = "ARCHIVED"
    DELETED = "DELETED"


class CommunityVisibility(str, Enum):
    PUBLIC = "PUBLIC"
    PRIVATE = "PRIVATE"


class MemberRole(str, Enum):
    OWNER = "OWNER"
    MODERATOR = "MODERATOR"
    MEMBER = "MEMBER"
    BANNED = "BANNED"


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


class ExpeditionStatus(str, Enum):
    PENDING = "PENDING"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class GuideStatus(str, Enum):
    APPLIED = "APPLIED"
    VERIFIED = "VERIFIED"
    SUSPENDED = "SUSPENDED"
    REJECTED = "REJECTED"
