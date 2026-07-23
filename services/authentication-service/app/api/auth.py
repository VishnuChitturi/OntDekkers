"""
Authentication Service — API Router

Public endpoints documented in 03-microservices.md:

  POST   /auth/register          — create new account (HTTP 201)
  POST   /auth/login             — authenticate, receive tokens (HTTP 200)
  POST   /auth/refresh           — exchange refresh token for new access token (HTTP 200)
  POST   /auth/logout            — revoke refresh token (HTTP 200)
  GET    /auth/me                — return current user identity (HTTP 200) [requires JWT]
  GET    /auth/verify-email      — mark email as verified (HTTP 200)
  POST   /auth/forgot-password   — generate password reset token (HTTP 200)
  POST   /auth/reset-password    — update password (HTTP 200)

API prefix resolution:
  team_guidelines.md: "All public endpoints must utilize the gateway prefix
  standard: /api/v1/{service-name}/*. Traefik strips the prefix before
  forwarding to the microservice port."

  The service name is "authentication-service".
  External URL:  /api/v1/authentication/auth/register
  Internal path: /auth/register   ← what FastAPI declares

  This router is mounted at /auth in main.py.
  Traefik strips /api/v1/authentication before forwarding.

Phase 1 status of each endpoint:
  /register      — IMPLEMENTED
  /login         — IMPLEMENTED
  /refresh       — IMPLEMENTED
  /logout        — IMPLEMENTED
  /me            — IMPLEMENTED
  /verify-email  — IMPLEMENTED (business logic; email delivery is Phase 2)
  /forgot-password  — IMPLEMENTED (business logic; email delivery is Phase 2)
  /reset-password   — IMPLEMENTED (business logic; email delivery is Phase 2)
"""

import logging

from fastapi import APIRouter, Depends, status

from app.dependencies.auth import get_auth_service, get_current_user_payload
from app.schemas.auth import (
    AccessTokenResponse,
    ForgotPasswordRequest,
    LoginRequest,
    LogoutRequest,
    MessageResponse,
    RefreshRequest,
    RegisterRequest,
    RegisterResponse,
    ResetPasswordRequest,
    TokenResponse,
    UserIdentityResponse,
)
from app.services.auth import AuthService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ---------------------------------------------------------------------------
# POST /auth/register
# ---------------------------------------------------------------------------

@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
)
async def register(
    body: RegisterRequest,
    service: AuthService = Depends(get_auth_service),
) -> RegisterResponse:
    """
    Create a new user account.

    - Email is normalised to lowercase.
    - Password is bcrypt-hashed before storage.
    - The USER role is assigned atomically in the same transaction.
    - An email verification token is generated (email delivery: Phase 2).
    - Returns 409 if the email is already registered.
    """
    return await service.register(email=body.email, password=body.password)


# ---------------------------------------------------------------------------
# POST /auth/login
# ---------------------------------------------------------------------------

@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Authenticate and receive access + refresh tokens",
)
async def login(
    body: LoginRequest,
    service: AuthService = Depends(get_auth_service),
) -> TokenResponse:
    """
    Verify credentials and issue tokens.

    - Returns 401 for unknown email or wrong password (no enumeration).
    - Returns 401 if the account is inactive.
    - access_token: short-lived JWT (Bearer).
    - refresh_token: opaque high-entropy string, persisted as SHA-256 hash.
    """
    return await service.login(email=body.email, password=body.password)


# ---------------------------------------------------------------------------
# POST /auth/refresh
# ---------------------------------------------------------------------------

@router.post(
    "/refresh",
    response_model=AccessTokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Exchange a valid refresh token for a new access token",
)
async def refresh(
    body: RefreshRequest,
    service: AuthService = Depends(get_auth_service),
) -> AccessTokenResponse:
    """
    Validate the refresh token and return a new access token.

    - Returns 401 if the token is invalid, revoked, or expired.
    - The refresh token itself is not rotated here.
    """
    return await service.refresh(raw_refresh_token=body.refresh_token)


# ---------------------------------------------------------------------------
# POST /auth/logout
# ---------------------------------------------------------------------------

@router.post(
    "/logout",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Revoke a refresh token",
)
async def logout(
    body: LogoutRequest,
    service: AuthService = Depends(get_auth_service),
) -> MessageResponse:
    """
    Revoke the provided refresh token.

    - Idempotent: revoking an already-revoked or unknown token returns 200.
    - The corresponding access token remains valid until it expires (stateless JWT).
      Phase 2 will add Redis-based JWT blacklisting for immediate access token
      invalidation.
    """
    return await service.logout(raw_refresh_token=body.refresh_token)


# ---------------------------------------------------------------------------
# GET /auth/me
# ---------------------------------------------------------------------------

@router.get(
    "/me",
    response_model=UserIdentityResponse,
    status_code=status.HTTP_200_OK,
    summary="Return the current authenticated user's identity",
)
async def me(
    jwt_payload: dict = Depends(get_current_user_payload),
    service: AuthService = Depends(get_auth_service),
) -> UserIdentityResponse:
    """
    Return the identity of the currently authenticated user.

    Requires a valid Bearer JWT in the Authorization header.
    The JWT is validated by the get_current_user_payload dependency.
    """
    return await service.get_me(jwt_payload=jwt_payload)


# ---------------------------------------------------------------------------
# GET /auth/verify-email
# ---------------------------------------------------------------------------

@router.get(
    "/verify-email",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Verify email address using a one-time token",
)
async def verify_email(
    token: str,
    service: AuthService = Depends(get_auth_service),
) -> MessageResponse:
    """
    Verify email ownership using a one-time token.

    Phase 1: business logic is fully implemented (token validation, account
    activation). Email delivery (sending the token to the user's inbox)
    is Phase 2 infrastructure — no SMTP service is required to call this
    endpoint in Phase 1 development/testing.
    """
    return await service.verify_email(raw_token=token)


# ---------------------------------------------------------------------------
# POST /auth/forgot-password
# ---------------------------------------------------------------------------

@router.post(
    "/forgot-password",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Request a password reset token",
)
async def forgot_password(
    body: ForgotPasswordRequest,
    service: AuthService = Depends(get_auth_service),
) -> MessageResponse:
    """
    Generate a password reset token for the given email.

    - Always returns success regardless of whether the email exists
      (prevents account enumeration).
    - Phase 1: token is generated and persisted. Email delivery is Phase 2.
    """
    return await service.forgot_password(email=body.email)


# ---------------------------------------------------------------------------
# POST /auth/reset-password
# ---------------------------------------------------------------------------

@router.post(
    "/reset-password",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Reset password using a one-time token",
)
async def reset_password(
    body: ResetPasswordRequest,
    service: AuthService = Depends(get_auth_service),
) -> MessageResponse:
    """
    Update the user's password using a valid one-time reset token.

    - Returns 401 if token is invalid, expired, or already used.
    - New password is bcrypt-hashed before storage.
    - Token is consumed atomically with the password update.
    """
    return await service.reset_password(
        raw_token=body.token,
        new_password=body.new_password,
    )
