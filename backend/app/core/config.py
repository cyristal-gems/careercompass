from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    database_url: str = "postgresql+psycopg://localhost/jobtrackr"
    secret_key: str = Field(min_length=32)
    environment: str = "development"
    allowed_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    access_token_expire_minutes: int = Field(default=30, ge=1, le=1440)
    frontend_url: str = "http://localhost:3000"
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_from: str = ""


@lru_cache
def settings() -> Settings:
    return Settings()
