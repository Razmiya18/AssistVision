"""
Text-to-Speech (TTS) Service Implementation.
Converts text strings into spoken audio files (gTTS, Coqui TTS, or Edge-TTS).
"""

import os
from loguru import logger
from app.core.config import settings
from app.schemas.speech import TTSRequest, TTSResponse


class TTSService:
    """
    Service wrapper for text-to-speech synthesis engines.
    """

    def __init__(self) -> None:
        self.default_voice = settings.TTS_DEFAULT_VOICE

    async def synthesize(self, request: TTSRequest) -> TTSResponse:
        """
        Converts text input into WAV/MP3 audio file for playback on user device.
        """
        logger.info(f"Synthesizing speech for text snippet length {len(request.text)}")

        # Output audio file placeholder
        output_filename = "output_speech.mp3"
        output_path = os.path.join(settings.UPLOAD_DIR, output_filename)

        # Placeholder: gTTS(text=request.text, lang=request.voice_language).save(output_path)

        return TTSResponse(
            audio_file_path=output_path,
            audio_url=f"/static/{output_filename}",
            duration_seconds=3.5,
        )


tts_service_instance = TTSService()
