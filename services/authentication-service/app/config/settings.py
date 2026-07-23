from pydantic_settings import BaseSettings
from shared.config import CommonSettings

class Settings(CommonSettings):
    SERVICE_NAME: str = "authentication-service"
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@postgres:5432/auth_db"
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 10
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
