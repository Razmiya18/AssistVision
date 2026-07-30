"""
Pydantic Schemas for Text-to-Speech (TTS) and Speech-to-Text (STT).
"""

from typing import Optional
from pydantic import BaseModel, Field


class TTSRequest(BaseModel):
    """
    Request payload to convert text response into audio synthesis.
    """
    text: str = Field(..., description="Text content to be converted into spoken speech")
    voice_language: str = Field("en", description="Target voice language identifier")
    speech_rate: float = Field(1.0, description="Playback speed factor")


class TTSResponse(BaseModel):
    """
    Metadata response containing generated audio file location or streaming URL.
    """
    audio_file_path: str
    audio_url: str
    duration_seconds: float


class STTResponse(BaseModel):
    """
    Transcribed spoken command payload from blind user audio recording.
    """
    transcribed_text: str
    confidence: float
    detected_language: str = "en"
