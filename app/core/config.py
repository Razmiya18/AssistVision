"""
Application Configuration Settings.
Uses Pydantic BaseSettings to parse environment variables.
"""

from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Global application settings for BlindViz 2.0.
    """
    PROJECT_NAME: str = "BlindViz 2.0 API"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"

    # Server settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True

    # CORS settings
    ALLOWED_ORIGINS: List[str] = ["*"]

    # Storage paths
    UPLOAD_DIR: str = "uploads"
    LOG_DIR: str = "logs"

    # YOLOv8 Object Detection Settings
    YOLO_MODEL_PATH: str = "models/yolov8n.pt"
    YOLO_CONF_THRESHOLD: float = 0.45

    # OCR Settings
    OCR_LANGUAGES: List[str] = ["en"]
    OCR_USE_GPU: bool = False

    # LLM & Vision Settings
    OPENAI_API_KEY: str = ""
    LLM_MODEL_NAME: str = "gpt-4-vision-preview"

    # Speech Processing Settings (TTS & STT)
    TTS_DEFAULT_VOICE: str = "en"
    WHISPER_MODEL_SIZE: str = "base"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )


settings = Settings()
