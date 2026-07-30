"""
Speech-to-Text (STT) Service Implementation.
Transcribes voice queries from user microphone using OpenAI Whisper model.
"""

from loguru import logger
from app.core.config import settings
from app.schemas.speech import STTResponse


class STTService:
    """
    Service wrapper for speech transcription (Whisper).
    """

    def __init__(self) -> None:
        self.model_size = settings.WHISPER_MODEL_SIZE

    async def transcribe(self, audio_file_path: str) -> STTResponse:
        """
        Transcribes voice audio recording into text string.
        """
        logger.info(f"Transcribing audio file: {audio_file_path}")

        # Placeholder Whisper transcription result
        return STTResponse(
            transcribed_text="What obstacles are in front of me?",
            confidence=0.96,
            detected_language="en",
        )


stt_service_instance = STTService()
