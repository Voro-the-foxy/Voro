from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    anthropic_api_key: str = ""
    voyage_api_key: str = ""
    database_url: str = "postgresql+psycopg://voro:voro@localhost:5432/voro"
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    log_level: str = "INFO"

    @field_validator("database_url", mode="before")
    @classmethod
    def normalize_database_url(cls, v: str) -> str:
        # Railway (and most platforms) provide postgres:// or postgresql://
        # SQLAlchemy + psycopg3 requires postgresql+psycopg://
        if v.startswith("postgres://"):
            return "postgresql+psycopg://" + v[len("postgres://"):]
        if v.startswith("postgresql://"):
            return "postgresql+psycopg://" + v[len("postgresql://"):]
        return v


settings = Settings()
