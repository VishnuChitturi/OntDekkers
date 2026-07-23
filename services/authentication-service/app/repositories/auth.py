"""
Authentication Service — Repository Layer

Repositories are responsible only for persistence operations (CRUD + queries).
They never contain business logic, never call other services, and never
publish Kafka events.

All queries operate within the async SQLAlchemy session passed by the
FastAPI dependency system.
"""

import hashlib
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import (
    EmailVerificationToken,
    PasswordResetToken,
    RefreshToken,
    Role,
    User,
    UserRole_,
)


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------

def _sha256(raw: str) -> str:
    """Return the SHA-256 hex digest of a raw token string."""
    return hashlib.sha256(raw.encode()).hexdigest()


# ---------------------------------------------------------------------------
# UserRepository
# ---------------------------------------------------------------------------

class UserRepository:
    """Persistence operations for the users table."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_id(self, user_id: uuid.UUID) -> Optional[User]:
        result = await self._session.execute(
            select(User).where(User.id == user_id, User.is_deleted == False)  # noqa: E712
        )
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> Optional[User]:
        result = await self._session.execute(
            select(User).where(User.email == email, User.is_deleted == False)  # noqa: E712
        )
        return result.scalar_one_or_none()

    async def create(self, email: str, password_hash: str) -> User:
        """
        Insert a new user row.

        Raises IntegrityError if the email already exists — callers must
        catch this and convert it to ConflictException.
        """
        user = User(
            email=email,
            password_hash=password_hash,
            is_verified=False,
            is_active=True,
            is_deleted=False,
        )
        self._session.add(user)
        await self._session.flush()  # assigns id without committing
        return user

    async def mark_verified(self, user_id: uuid.UUID) -> None:
        await self._session.execute(
            update(User)
            .where(User.id == user_id)
            .values(
                is_verified=True,
                updated_at=datetime.now(timezone.utc),
            )
        )

    async def update_password(self, user_id: uuid.UUID, password_hash: str) -> None:
        await self._session.execute(
            update(User)
            .where(User.id == user_id)
            .values(
                password_hash=password_hash,
                updated_at=datetime.now(timezone.utc),
            )
        )


# ---------------------------------------------------------------------------
# RoleRepository
# ---------------------------------------------------------------------------

class RoleRepository:
    """Persistence operations for the roles and user_roles tables."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_name(self, name: str) -> Optional[Role]:
        result = await self._session.execute(
            select(Role).where(Role.name == name)
        )
        return result.scalar_one_or_none()

    async def get_roles_for_user(self, user_id: uuid.UUID) -> List[str]:
        """Return role names for a given user."""
        result = await self._session.execute(
            select(Role.name)
            .join(UserRole_, UserRole_.role_id == Role.id)
            .where(UserRole_.user_id == user_id)
        )
        return [row[0] for row in result.all()]

    async def assign_role(self, user_id: uuid.UUID, role_id: uuid.UUID) -> None:
        """
        Assign a role to a user.

        Fully idempotent and concurrency-safe:
          - Uses PostgreSQL INSERT ... ON CONFLICT DO NOTHING against
            the uq_user_roles_user_role unique constraint.
          - If the assignment already exists (same user_id + role_id),
            the INSERT is silently ignored at the database level.
          - No SELECT required, no IntegrityError raised, no rollback of
            the caller's transaction under any concurrency scenario.
          - The unique constraint remains the authoritative DB guard.
        """
        from sqlalchemy.dialects.postgresql import insert as pg_insert
        from datetime import datetime, timezone

        now = datetime.now(timezone.utc)
        stmt = (
            pg_insert(UserRole_)
            .values(
                id=uuid.uuid4(),
                user_id=user_id,
                role_id=role_id,
                created_at=now,
                updated_at=now,
            )
            .on_conflict_do_nothing(constraint="uq_user_roles_user_role")
        )
        await self._session.execute(stmt)


# ---------------------------------------------------------------------------
# RefreshTokenRepository
# ---------------------------------------------------------------------------

class RefreshTokenRepository:
    """Persistence operations for the refresh_tokens table."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(
        self,
        user_id: uuid.UUID,
        raw_token: str,
        expires_at: datetime,
    ) -> RefreshToken:
        """
        Persist a refresh token record using the SHA-256 hash of the raw token.
        The raw token itself is never stored.
        """
        token = RefreshToken(
            user_id=user_id,
            token_hash=_sha256(raw_token),
            expires_at=expires_at,
            is_revoked=False,
        )
        self._session.add(token)
        await self._session.flush()
        return token

    async def get_by_raw_token(self, raw_token: str) -> Optional[RefreshToken]:
        """Look up a refresh token record by the raw token value."""
        token_hash = _sha256(raw_token)
        result = await self._session.execute(
            select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        )
        return result.scalar_one_or_none()

    async def revoke(self, token_id: uuid.UUID) -> None:
        """Mark a single refresh token as revoked."""
        await self._session.execute(
            update(RefreshToken)
            .where(RefreshToken.id == token_id)
            .values(
                is_revoked=True,
                updated_at=datetime.now(timezone.utc),
            )
        )

    async def revoke_all_for_user(self, user_id: uuid.UUID) -> None:
        """Revoke all refresh tokens for a user (e.g., forced logout)."""
        await self._session.execute(
            update(RefreshToken)
            .where(RefreshToken.user_id == user_id, RefreshToken.is_revoked == False)  # noqa: E712
            .values(
                is_revoked=True,
                updated_at=datetime.now(timezone.utc),
            )
        )


# ---------------------------------------------------------------------------
# EmailVerificationTokenRepository
# ---------------------------------------------------------------------------

class EmailVerificationTokenRepository:
    """Persistence operations for the email_verification_tokens table."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(
        self,
        user_id: uuid.UUID,
        raw_token: str,
        expires_at: datetime,
    ) -> EmailVerificationToken:
        token = EmailVerificationToken(
            user_id=user_id,
            token_hash=_sha256(raw_token),
            expires_at=expires_at,
            is_used=False,
        )
        self._session.add(token)
        await self._session.flush()
        return token

    async def get_by_raw_token(self, raw_token: str) -> Optional[EmailVerificationToken]:
        token_hash = _sha256(raw_token)
        result = await self._session.execute(
            select(EmailVerificationToken).where(
                EmailVerificationToken.token_hash == token_hash
            )
        )
        return result.scalar_one_or_none()

    async def mark_used(self, token_id: uuid.UUID) -> None:
        await self._session.execute(
            update(EmailVerificationToken)
            .where(EmailVerificationToken.id == token_id)
            .values(is_used=True, updated_at=datetime.now(timezone.utc))
        )


# ---------------------------------------------------------------------------
# PasswordResetTokenRepository
# ---------------------------------------------------------------------------

class PasswordResetTokenRepository:
    """Persistence operations for the password_reset_tokens table."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(
        self,
        user_id: uuid.UUID,
        raw_token: str,
        expires_at: datetime,
    ) -> PasswordResetToken:
        token = PasswordResetToken(
            user_id=user_id,
            token_hash=_sha256(raw_token),
            expires_at=expires_at,
            is_used=False,
        )
        self._session.add(token)
        await self._session.flush()
        return token

    async def get_by_raw_token(self, raw_token: str) -> Optional[PasswordResetToken]:
        token_hash = _sha256(raw_token)
        result = await self._session.execute(
            select(PasswordResetToken).where(
                PasswordResetToken.token_hash == token_hash
            )
        )
        return result.scalar_one_or_none()

    async def mark_used(self, token_id: uuid.UUID) -> None:
        await self._session.execute(
            update(PasswordResetToken)
            .where(PasswordResetToken.id == token_id)
            .values(is_used=True, updated_at=datetime.now(timezone.utc))
        )
