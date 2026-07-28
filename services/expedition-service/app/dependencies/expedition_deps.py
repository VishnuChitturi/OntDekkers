"""
Expedition Service — FastAPI dependency injection factories.

Every service class is constructed here using FastAPI's `Depends` system.
Routers never instantiate repositories or services directly — they declare
them as function parameters using `Depends(get_xxx_service)`.

This keeps routers thin and makes services trivially testable:
override the dependency in tests to inject mocks.

Pattern:
  1. get_db (from shared) → AsyncSession
  2. get_xxx_repository(session) → XxxRepository
  3. get_xxx_service(repo_a, repo_b) → XxxService
  4. Router parameter: service = Depends(get_xxx_service)
"""

from __future__ import annotations

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dependencies import get_db

from app.repositories.expedition_repository import ExpeditionRepository
from app.repositories.gallery_repository import GalleryRepository
from app.repositories.gear_item_repository import GearItemRepository
from app.repositories.itinerary_repository import ItineraryRepository
from app.repositories.join_request_repository import JoinRequestRepository
from app.repositories.participant_repository import ParticipantRepository
from app.repositories.review_repository import ReviewRepository

from app.services.expedition_service import ExpeditionService
from app.services.gallery_service import GalleryService
from app.services.gear_item_service import GearItemService
from app.services.itinerary_service import ItineraryService
from app.services.join_request_service import JoinRequestService
from app.services.participant_service import ParticipantService
from app.services.review_service import ReviewService


# ---------------------------------------------------------------------------
# Repository factories
# ---------------------------------------------------------------------------

def get_expedition_repository(
    session: AsyncSession = Depends(get_db),
) -> ExpeditionRepository:
    return ExpeditionRepository(session)


def get_participant_repository(
    session: AsyncSession = Depends(get_db),
) -> ParticipantRepository:
    return ParticipantRepository(session)


def get_join_request_repository(
    session: AsyncSession = Depends(get_db),
) -> JoinRequestRepository:
    return JoinRequestRepository(session)


def get_itinerary_repository(
    session: AsyncSession = Depends(get_db),
) -> ItineraryRepository:
    return ItineraryRepository(session)


def get_gallery_repository(
    session: AsyncSession = Depends(get_db),
) -> GalleryRepository:
    return GalleryRepository(session)


def get_gear_item_repository(
    session: AsyncSession = Depends(get_db),
) -> GearItemRepository:
    return GearItemRepository(session)


def get_review_repository(
    session: AsyncSession = Depends(get_db),
) -> ReviewRepository:
    return ReviewRepository(session)


# ---------------------------------------------------------------------------
# Service factories
# ---------------------------------------------------------------------------

def get_expedition_service(
    expedition_repo: ExpeditionRepository = Depends(get_expedition_repository),
    participant_repo: ParticipantRepository = Depends(get_participant_repository),
) -> ExpeditionService:
    return ExpeditionService(expedition_repo, participant_repo)


def get_participant_service(
    expedition_repo: ExpeditionRepository = Depends(get_expedition_repository),
    participant_repo: ParticipantRepository = Depends(get_participant_repository),
) -> ParticipantService:
    return ParticipantService(expedition_repo, participant_repo)


def get_join_request_service(
    expedition_repo: ExpeditionRepository = Depends(get_expedition_repository),
    join_request_repo: JoinRequestRepository = Depends(get_join_request_repository),
    participant_repo: ParticipantRepository = Depends(get_participant_repository),
) -> JoinRequestService:
    return JoinRequestService(expedition_repo, join_request_repo, participant_repo)


def get_itinerary_service(
    expedition_repo: ExpeditionRepository = Depends(get_expedition_repository),
    itinerary_repo: ItineraryRepository = Depends(get_itinerary_repository),
    participant_repo: ParticipantRepository = Depends(get_participant_repository),
) -> ItineraryService:
    return ItineraryService(expedition_repo, itinerary_repo, participant_repo)


def get_gallery_service(
    expedition_repo: ExpeditionRepository = Depends(get_expedition_repository),
    gallery_repo: GalleryRepository = Depends(get_gallery_repository),
    participant_repo: ParticipantRepository = Depends(get_participant_repository),
) -> GalleryService:
    return GalleryService(expedition_repo, gallery_repo, participant_repo)


def get_gear_item_service(
    expedition_repo: ExpeditionRepository = Depends(get_expedition_repository),
    gear_repo: GearItemRepository = Depends(get_gear_item_repository),
    participant_repo: ParticipantRepository = Depends(get_participant_repository),
) -> GearItemService:
    return GearItemService(expedition_repo, gear_repo, participant_repo)


def get_review_service(
    expedition_repo: ExpeditionRepository = Depends(get_expedition_repository),
    review_repo: ReviewRepository = Depends(get_review_repository),
    participant_repo: ParticipantRepository = Depends(get_participant_repository),
) -> ReviewService:
    return ReviewService(expedition_repo, review_repo, participant_repo)
