"""
User Service — API Router

All User Service endpoints. Mounted at /users in main.py.

External gateway path: /api/v1/user-service/users/*
  Traefik strips /api/v1/user-service before forwarding.
Internal FastAPI path: /users/*

Endpoint inventory:
  GET    /users/me                              — private profile (lazy-created)
  PUT    /users/me                              — update profile
  PATCH  /users/me/interests                   — replace interests list
  PATCH  /users/me/preferences                 — update preferences
  POST   /users/me/avatar                      — upload avatar image
  POST   /users/me/cover                       — upload cover image
  GET    /users/me/saved                        — list saved items
  POST   /users/me/saved                        — save an item
  DELETE /users/me/saved/{entity_type}/{entity_id} — unsave an item
  GET    /users/{username}                      — public profile (by username)
  POST   /users/{user_id}/follow               — follow a user
  DELETE /users/{user_id}/follow               — unfollow a user
  GET    /users/{user_id}/followers             — followers list
  GET    /users/{user_id}/following             — following list
  GET    /users/{user_id}/badges                — badges list
  GET    /users/{user_id}/reputation            — reputation details
"""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, File, Header, Query, UploadFile, status

from app.dependencies.user import get_current_user_payload, get_user_service
from app.schemas.user import (
    BadgeResponse,
    MediaUploadResponse,
    MessageResponse,
    PaginatedFollowersResponse,
    PrivateProfileResponse,
    PublicProfileResponse,
    ReputationResponse,
    SavedItemResponse,
    UpdateInterestsRequest,
    UpdatePreferencesRequest,
    UpdateProfileRequest,
    SaveItemRequest,
)
from app.services.user import UserService
from app.config.settings import settings
from shared.exceptions import ValidationException

router = APIRouter(prefix="/users", tags=["Users"])

# ---------------------------------------------------------------------------
# Current user — private profile
# ---------------------------------------------------------------------------

@router.get("/me", response_model=PrivateProfileResponse, status_code=status.HTTP_200_OK)
async def get_my_profile(
    jwt_payload: dict = Depends(get_current_user_payload),
    svc: UserService = Depends(get_user_service),
) -> PrivateProfileResponse:
    """Return the full private profile of the authenticated user. Creates it lazily if absent."""
    return await svc.get_my_profile(jwt_payload)


@router.put("/me", response_model=PrivateProfileResponse, status_code=status.HTTP_200_OK)
async def update_my_profile(
    body: UpdateProfileRequest,
    jwt_payload: dict = Depends(get_current_user_payload),
    svc: UserService = Depends(get_user_service),
) -> PrivateProfileResponse:
    """Update editable profile fields for the authenticated user."""
    return await svc.update_my_profile(
        jwt_payload=jwt_payload,
        username=body.username,
        display_name=body.display_name,
        bio=body.bio,
        city=body.city,
        country=body.country,
    )


@router.patch(
    "/me/interests",
    response_model=PrivateProfileResponse,
    status_code=status.HTTP_200_OK,
)
async def update_interests(
    body: UpdateInterestsRequest,
    jwt_payload: dict = Depends(get_current_user_payload),
    svc: UserService = Depends(get_user_service),
) -> PrivateProfileResponse:
    """Replace the full set of travel interests for the authenticated user."""
    return await svc.update_interests(jwt_payload=jwt_payload, interests=body.interests)


@router.patch(
    "/me/preferences",
    response_model=PrivateProfileResponse,
    status_code=status.HTTP_200_OK,
)
async def update_preferences(
    body: UpdatePreferencesRequest,
    jwt_payload: dict = Depends(get_current_user_payload),
    svc: UserService = Depends(get_user_service),
) -> PrivateProfileResponse:
    """Update travel preferences for the authenticated user."""
    return await svc.update_preferences(
        jwt_payload=jwt_payload,
        **body.model_dump(exclude_none=True),
    )


@router.post(
    "/me/avatar",
    response_model=MediaUploadResponse,
    status_code=status.HTTP_200_OK,
)
async def upload_avatar(
    file: UploadFile = File(...),
    jwt_payload: dict = Depends(get_current_user_payload),
    svc: UserService = Depends(get_user_service),
) -> MediaUploadResponse:
    """
    Upload an avatar image (JPEG/PNG/WebP, max 5 MB).
    The profiles bucket is private; a presigned URL is returned for retrieval.
    """
    data = await file.read()
    if len(data) > settings.MINIO_MAX_FILE_SIZE:
        raise ValidationException(
            message=f"File exceeds {settings.MINIO_MAX_FILE_SIZE // (1024*1024)} MB limit.",
            error_code="FILE_TOO_LARGE",
        )
    content_type = file.content_type or "application/octet-stream"
    return await svc.upload_avatar(jwt_payload=jwt_payload, file_data=data, content_type=content_type)


@router.post(
    "/me/cover",
    response_model=MediaUploadResponse,
    status_code=status.HTTP_200_OK,
)
async def upload_cover(
    file: UploadFile = File(...),
    jwt_payload: dict = Depends(get_current_user_payload),
    svc: UserService = Depends(get_user_service),
) -> MediaUploadResponse:
    """Upload a cover image (JPEG/PNG/WebP, max 5 MB)."""
    data = await file.read()
    if len(data) > settings.MINIO_MAX_FILE_SIZE:
        raise ValidationException(
            message=f"File exceeds {settings.MINIO_MAX_FILE_SIZE // (1024*1024)} MB limit.",
            error_code="FILE_TOO_LARGE",
        )
    content_type = file.content_type or "application/octet-stream"
    return await svc.upload_cover(jwt_payload=jwt_payload, file_data=data, content_type=content_type)


# ---------------------------------------------------------------------------
# Saved items
# ---------------------------------------------------------------------------

@router.get(
    "/me/saved",
    response_model=list[SavedItemResponse],
    status_code=status.HTTP_200_OK,
)
async def list_saved(
    entity_type: Optional[str] = Query(None, description="Filter by STORY|COMMUNITY|EXPEDITION|GUIDE"),
    jwt_payload: dict = Depends(get_current_user_payload),
    svc: UserService = Depends(get_user_service),
):
    return await svc.list_saved(jwt_payload=jwt_payload, entity_type=entity_type)


@router.post(
    "/me/saved",
    response_model=SavedItemResponse,
    status_code=status.HTTP_201_CREATED,
)
async def save_item(
    body: SaveItemRequest,
    jwt_payload: dict = Depends(get_current_user_payload),
    svc: UserService = Depends(get_user_service),
) -> SavedItemResponse:
    return await svc.save_item(
        jwt_payload=jwt_payload,
        entity_type=body.entity_type,
        entity_id=body.entity_id,
    )


@router.delete(
    "/me/saved/{entity_type}/{entity_id}",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
)
async def unsave_item(
    entity_type: str,
    entity_id: uuid.UUID,
    jwt_payload: dict = Depends(get_current_user_payload),
    svc: UserService = Depends(get_user_service),
) -> MessageResponse:
    et = entity_type.upper()
    from app.schemas.user import ALLOWED_ENTITY_TYPES
    if et not in ALLOWED_ENTITY_TYPES:
        raise ValidationException(
            message=f"entity_type must be one of: {', '.join(sorted(ALLOWED_ENTITY_TYPES))}",
            error_code="INVALID_ENTITY_TYPE",
        )
    return await svc.unsave_item(
        jwt_payload=jwt_payload,
        entity_type=et,
        entity_id=entity_id,
    )


# ---------------------------------------------------------------------------
# Public profile (by username)
# ---------------------------------------------------------------------------

@router.get(
    "/{username}",
    response_model=PublicProfileResponse,
    status_code=status.HTTP_200_OK,
)
async def get_public_profile(
    username: str,
    svc: UserService = Depends(get_user_service),
) -> PublicProfileResponse:
    """Return the public profile for the given username. No authentication required."""
    return await svc.get_public_profile(username)


# ---------------------------------------------------------------------------
# Social graph — follow/unfollow
# ---------------------------------------------------------------------------

@router.post(
    "/{user_id}/follow",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
)
async def follow_user(
    user_id: uuid.UUID,
    jwt_payload: dict = Depends(get_current_user_payload),
    svc: UserService = Depends(get_user_service),
) -> MessageResponse:
    return await svc.follow_user(jwt_payload=jwt_payload, target_profile_id=user_id)


@router.delete(
    "/{user_id}/follow",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
)
async def unfollow_user(
    user_id: uuid.UUID,
    jwt_payload: dict = Depends(get_current_user_payload),
    svc: UserService = Depends(get_user_service),
) -> MessageResponse:
    return await svc.unfollow_user(jwt_payload=jwt_payload, target_profile_id=user_id)


@router.get(
    "/{user_id}/followers",
    response_model=PaginatedFollowersResponse,
    status_code=status.HTTP_200_OK,
)
async def get_followers(
    user_id: uuid.UUID,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    svc: UserService = Depends(get_user_service),
) -> PaginatedFollowersResponse:
    return await svc.get_followers(profile_id=user_id, page=page, size=size)


@router.get(
    "/{user_id}/following",
    response_model=PaginatedFollowersResponse,
    status_code=status.HTTP_200_OK,
)
async def get_following(
    user_id: uuid.UUID,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    svc: UserService = Depends(get_user_service),
) -> PaginatedFollowersResponse:
    return await svc.get_following(profile_id=user_id, page=page, size=size)


# ---------------------------------------------------------------------------
# Badges and Reputation (read-only in Phase 1)
# ---------------------------------------------------------------------------

@router.get(
    "/{user_id}/badges",
    response_model=list[BadgeResponse],
    status_code=status.HTTP_200_OK,
)
async def get_badges(
    user_id: uuid.UUID,
    svc: UserService = Depends(get_user_service),
):
    return await svc.get_badges(profile_id=user_id)


@router.get(
    "/{user_id}/reputation",
    response_model=ReputationResponse,
    status_code=status.HTTP_200_OK,
)
async def get_reputation(
    user_id: uuid.UUID,
    svc: UserService = Depends(get_user_service),
) -> ReputationResponse:
    return await svc.get_reputation(profile_id=user_id)
