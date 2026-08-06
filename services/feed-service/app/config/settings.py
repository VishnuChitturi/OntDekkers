from pydantic_settings import BaseSettings
from shared.config import CommonSettings

class Settings(CommonSettings):
    SERVICE_NAME: str = "feed-service"
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@postgres:5432/feed_db"
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 10

    # MinIO configuration — values injected by Docker Compose
    MINIO_ENDPOINT: str = "minio:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_SECURE: bool = False

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
