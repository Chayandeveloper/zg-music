import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    HOST: str = "0.0.0.0"
    PORT: int = 8001
    DEBUG: bool = False
    YTMUSIC_AUTH_FILE: Optional[str] = None
    REQUEST_TIMEOUT_SECONDS: int = 10
    # yt-dlp auth options
    YTDLP_USE_OAUTH2: bool = True
    YTDLP_COOKIES_FILE: Optional[str] = None
    YTDLP_OAUTH2_TOKEN_FILE: Optional[str] = None
    YTDLP_COOKIES_FROM_BROWSER: Optional[str] = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
