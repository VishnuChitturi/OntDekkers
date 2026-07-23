"""
Authentication Service — Service Layer

Business logic for all authentication flows.

Layer contract:
  - Receives validated data from the API layer (Pydantic-validated).
  - Calls repositories for all persistence.
  - Uses shared exceptions for all error cases.
  - Never constructs HTTP responses (no Request/Response objects here).
  - Never accesses the database directly — only through repositories.
  - Transactions are managed by the FastAPI get_db dependency (commit on
    success, rollback on exception). Repositories use flush() for
    intermediate writes within the same transaction.

Phase 1 scope:
  - register()       — create user + assign USER role + create email verification token
  - login()          — verify credentials, issue access + refresh tokens
  - refresh()        — validate refresh token, issue new access token
  - logout()         — revoke a refresh token
  - get_me()         — return current user identity from a validated JWT payload

Phase 2 (not implemented here):
  - verify_email()   — requires email delivery infrastructure
  - forgot_password() / reset_password() — requires email delivery
  - Kafka event publishing
  - Redis JWT blacklisting
"""

import logging
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.auth import (
    EmailVerificationTokenRepository,
    PasswordResetTokenRepository,
    RefreshTokenRepository,
    RoleRepository,
    UserRepository,
)
from app.schemas.auth import (
    AccessTokenResponse,
    MessageResponse,
    RegisterResponse,
    TokenResponse,
    UserIdentityResponse,
)
from app.security import (
    access_token_expires_at,
    generate_access_token,
    generate_raw_opaque_token,
    generate_raw_refresh_token,
    refresh_token_expires_at,
    reset_token_expires_at,
    verification_token_expires_at,
)
from shared.constants.roles import UserRole
from shared.exceptions import (
    ConflictException,
    NotFoundException,
    UnauthorizedException,
)
from shared.utils.security import get_password_hash, verify_password

logger = logging.getLogger(__name__)

# The role automatically assigned to every newly registered user.
DEFAULT_ROLE = UserRole.USER.value


class AuthService:
    """
    Orchestrates all authentication business workflows.

    One instance per request — constructed in the API dependency with the
    current async session.
    """

    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._users = UserRepository(session)
        self._roles = RoleRepository(session)
        self._refresh_tokens = RefreshTokenRepository(session)
        self._verification_tokens = EmailVerificationTokenRepository(session)
        self._reset_tokens = PasswordResetTokenRepository(session)

    # ------------------------------------------------------------------
    # Registration
    # ------------------------------------------------------------------

    async def register(self, email: str, password: str) -> RegisterResponse:
        """
        Create a new user account and assign the default USER role.

        Flow:
          1. Hash the password.
          2. Insert the user row (flush — part of current transaction).
          3. Look up the USER role (must exist from seed migration).
          4. Assign the USER role to the new user (flush).
          5. Create an email verification token (flush).
          6. Transaction commits when the request completes successfully.

        Concurrency safety:
          The application-level email check is an optimisation only.
          The database UNIQUE constraint on users.email is the authoritative
          guard against duplicates — IntegrityError is caught and converted
          to ConflictException (HTTP 409).

        Registration and role assignment are in the same transaction.
        If role assignment fails, the entire transaction rolls back — no
        partial user record is left in the database.
        """
        # Step 1: hash password first (outside the transaction flush)
        hashed = get_password_hash(password)

        # Step 2: insert user — IntegrityError if email already exists
        try:
            user = await self._users.create(email=email, password_hash=hashed)
        except IntegrityError:
            # The unique constraint on users.email fired.
            await self._session.rollback()
            raise ConflictException(
                message="An account with this email address already exists.",
                error_code="EMAIL_ALREADY_REGISTERED",
            )

        # Step 3: look up the USER role (seeded by migration a1b2c3d4e5f6)
        user_role = await self._roles.get_by_name(DEFAULT_ROLE)
        if user_role is None:
            # This should never happen in a correctly migrated database.
            logger.error(
                "System role USER not found — run 'alembic upgrade head' to seed roles."
            )
            raise ConflictException(
                message="System configuration error: USER role is missing.",
                error_code="SYSTEM_ROLE_MISSING",
            )

        # Step 4: assign USER role — atomic with user creation
        await self._roles.assign_role(user_id=user.id, role_id=user_role.id)

        # Step 5: generate and persist an email verification token
        raw_verification = generate_raw_opaque_token()
        await self._verification_tokens.create(
            user_id=user.id,
            raw_token=raw_verification,
            expires_at=verification_token_expires_at(),
        )

        logger.info(
            "User registered",
            extra={"extra_data": {"user_id": str(user.id), "email": email}},
        )

        # NOTE (Phase 2): publish USER_REGISTERED Kafka event here.
        # NOTE (Phase 2): send verification email with raw_verification token here.

        return RegisterResponse(
            message="Registration successful. Please verify your email address.",
            user_id=user.id,
            email=user.email,
        )

    # ------------------------------------------------------------------
    # Login
    # ------------------------------------------------------------------

    async def login(self, email: str, password: str) -> TokenResponse:
        """
        Authenticate a user and issue access + refresh tokens.

        Returns 401 for all credential failures — never distinguishes
        "email not found" from "wrong password" to avoid user enumeration.
        """
        user = await self._users.get_by_email(email)

        # Unified 401 for unknown email OR wrong password
        if user is None or not verify_password(password, user.password_hash):
            raise UnauthorizedException(
                message="Invalid email or password.",
                error_code="INVALID_CREDENTIALS",
            )

        if not user.is_active:
            raise UnauthorizedException(
                message="This account has been deactivated.",
                error_code="ACCOUNT_INACTIVE",
            )

        # Load roles for JWT claims
        role_names = await self._roles.get_roles_for_user(user.id)

        # Generate access token (short-lived JWT)
        access_token = generate_access_token(
            user_id=str(user.id),
            email=user.email,
            roles=role_names,
        )

        # Generate and persist refresh token (opaque, hashed)
        raw_refresh = generate_raw_refresh_token()
        await self._refresh_tokens.create(
            user_id=user.id,
            raw_token=raw_refresh,
            expires_at=refresh_token_expires_at(),
        )

        logger.info(
            "User logged in",
            extra={"extra_data": {"user_id": str(user.id)}},
        )

        return TokenResponse(
            access_token=access_token,
            refresh_token=raw_refresh,
            token_type="bearer",
            expires_in=_minutes_to_seconds(),
        )

    # ------------------------------------------------------------------
    # Refresh
    # ------------------------------------------------------------------

    async def refresh(self, raw_refresh_token: str) -> AccessTokenResponse:
        """
        Validate a refresh token and issue a new access token.

        The documentation specifies Token Refresh Flow as:
          Refresh Token → Validate → Generate New Access Token → Return.

        This implementation validates: existence, not-revoked, not-expired.
        It does NOT rotate the refresh token on each use (no new refresh token
        is issued here) — rotation happens explicitly on logout/re-login.

        Returns 401 for all invalid token states to avoid leaking information.
        """
        token_record = await self._refresh_tokens.get_by_raw_token(raw_refresh_token)

        if token_record is None:
            raise UnauthorizedException(
                message="Invalid refresh token.",
                error_code="INVALID_REFRESH_TOKEN",
            )

        if token_record.is_revoked:
            raise UnauthorizedException(
                message="Refresh token has been revoked.",
                error_code="REFRESH_TOKEN_REVOKED",
            )

        if token_record.expires_at < datetime.now(timezone.utc):
            raise UnauthorizedException(
                message="Refresh token has expired.",
                error_code="REFRESH_TOKEN_EXPIRED",
            )

        # Load the user (must still be active and not deleted)
        user = await self._users.get_by_id(token_record.user_id)
        if user is None or not user.is_active:
            raise UnauthorizedException(
                message="Account is no longer active.",
                error_code="ACCOUNT_INACTIVE",
            )

        role_names = await self._roles.get_roles_for_user(user.id)

        access_token = generate_access_token(
            user_id=str(user.id),
            email=user.email,
            roles=role_names,
        )

        return AccessTokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=_minutes_to_seconds(),
        )

    # ------------------------------------------------------------------
    # Logout
    # ------------------------------------------------------------------

    async def logout(self, raw_refresh_token: str) -> MessageResponse:
        """
        Revoke a refresh token.

        Idempotent — revoking an already-revoked or non-existent token
        returns success (no information leaked about token validity).
        """
        token_record = await self._refresh_tokens.get_by_raw_token(raw_refresh_token)

        if token_record is not None and not token_record.is_revoked:
            await self._refresh_tokens.revoke(token_record.id)

        logger.info("Refresh token revoked")

        # NOTE (Phase 2): add token to Redis blacklist here.

        return MessageResponse(message="Logged out successfully.")

    # ------------------------------------------------------------------
    # Me (current identity)
    # ------------------------------------------------------------------

    async def get_me(self, jwt_payload: Dict[str, Any]) -> UserIdentityResponse:
        """
        Return the identity of the currently authenticated user from a
        validated JWT payload.

        The JWT payload has already been verified by the get_current_user
        dependency before this method is called.
        """
        user_id_str = jwt_payload.get("sub")
        if not user_id_str:
            raise UnauthorizedException(
                message="Invalid token claims.",
                error_code="INVALID_TOKEN_CLAIMS",
            )

        try:
            user_id = uuid.UUID(user_id_str)
        except ValueError:
            raise UnauthorizedException(
                message="Invalid token subject.",
                error_code="INVALID_TOKEN_SUBJECT",
            )

        user = await self._users.get_by_id(user_id)
        if user is None:
            raise NotFoundException(
                message="User not found.",
                error_code="USER_NOT_FOUND",
            )

        role_names = await self._roles.get_roles_for_user(user.id)

        return UserIdentityResponse(
            id=user.id,
            email=user.email,
            is_verified=user.is_verified,
            is_active=user.is_active,
            roles=role_names,
            created_at=user.created_at,
        )

    # ------------------------------------------------------------------
    # Verify Email
    # ------------------------------------------------------------------

    async def verify_email(self, raw_token: str) -> MessageResponse:
        """
        Validate an email verification token and mark the user verified.

        Phase 1 behaviour: the token itself is validated and the account is
        activated. Email delivery (sending the token to the user's inbox)
        is Phase 2 infrastructure — the token is returned in the
        registration response log for development purposes only.

        Validation order:
          1. Look up token record by SHA-256 hash.
          2. Reject if not found (invalid / already hard-deleted).
          3. Reject if already used.
          4. Reject if expired.
          5. Mark user verified and mark token used — atomic.
        """
        token_record = await self._verification_tokens.get_by_raw_token(raw_token)

        if token_record is None:
            raise UnauthorizedException(
                message="Invalid or expired verification token.",
                error_code="INVALID_VERIFICATION_TOKEN",
            )

        if token_record.is_used:
            raise UnauthorizedException(
                message="This verification token has already been used.",
                error_code="VERIFICATION_TOKEN_ALREADY_USED",
            )

        if token_record.expires_at < datetime.now(timezone.utc):
            raise UnauthorizedException(
                message="Verification token has expired.",
                error_code="VERIFICATION_TOKEN_EXPIRED",
            )

        # Mark token consumed and user verified — same transaction
        await self._verification_tokens.mark_used(token_record.id)
        await self._users.mark_verified(token_record.user_id)

        logger.info(
            "Email verified",
            extra={"extra_data": {"user_id": str(token_record.user_id)}},
        )

        return MessageResponse(message="Email verified successfully. Your account is now active.")

    # ------------------------------------------------------------------
    # Forgot Password
    # ------------------------------------------------------------------

    async def forgot_password(self, email: str) -> MessageResponse:
        """
        Generate a password reset token for the given email address.

        Security: always returns the same success message whether or not
        the email exists in the database, preventing account enumeration.

        Phase 1 behaviour: the raw reset token is logged at DEBUG level
        for development testing. Email delivery is Phase 2 infrastructure.
        """
        user = await self._users.get_by_email(email)

        if user is not None and user.is_active:
            raw_reset = generate_raw_opaque_token()
            await self._reset_tokens.create(
                user_id=user.id,
                raw_token=raw_reset,
                expires_at=reset_token_expires_at(),
            )
            # Phase 2: send email containing the raw_reset token to user.email here.
            # The raw token is not logged — raw authentication secrets must never
            # appear in application logs at any level.

        # Always return success — do not reveal whether email exists
        return MessageResponse(
            message="If an account with that email exists, a password reset link has been sent."
        )

    # ------------------------------------------------------------------
    # Reset Password
    # ------------------------------------------------------------------

    async def reset_password(self, raw_token: str, new_password: str) -> MessageResponse:
        """
        Validate a reset token and update the user's password.

        Validation order:
          1. Look up token by SHA-256 hash.
          2. Reject if not found.
          3. Reject if already used.
          4. Reject if expired.
          5. Hash new password, update user, mark token used — atomic.
        """
        token_record = await self._reset_tokens.get_by_raw_token(raw_token)

        if token_record is None:
            raise UnauthorizedException(
                message="Invalid or expired password reset token.",
                error_code="INVALID_RESET_TOKEN",
            )

        if token_record.is_used:
            raise UnauthorizedException(
                message="This password reset token has already been used.",
                error_code="RESET_TOKEN_ALREADY_USED",
            )

        if token_record.expires_at < datetime.now(timezone.utc):
            raise UnauthorizedException(
                message="Password reset token has expired.",
                error_code="RESET_TOKEN_EXPIRED",
            )

        new_hash = get_password_hash(new_password)
        await self._users.update_password(token_record.user_id, new_hash)
        await self._reset_tokens.mark_used(token_record.id)

        logger.info(
            "Password reset completed",
            extra={"extra_data": {"user_id": str(token_record.user_id)}},
        )

        return MessageResponse(message="Password updated successfully.")



def _minutes_to_seconds() -> int:
    """Convert ACCESS_TOKEN_EXPIRE_MINUTES to seconds for the expires_in field."""
    from app.config.settings import settings
    return settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
