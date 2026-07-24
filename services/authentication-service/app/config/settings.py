from pydantic_settings import BaseSettings
from typing import List
from shared.config import CommonSettings

class Settings(CommonSettings):
    SERVICE_NAME: str = "authentication-service"
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@postgres:5432/auth_db"
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 10
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    # CORS — comma-separated list of allowed origins.
    # Default permits the Next.js local development server.
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
