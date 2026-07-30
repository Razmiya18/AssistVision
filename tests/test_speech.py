"""
Unit tests for Speech Processing (TTS / STT) Services.
"""

import pytest
from app.schemas.speech import TTSRequest
from app.services.speech.tts_service import TTSService


@pytest.mark.asyncio
async def test_tts_service_synthesis():
    service = TTSService()
    req = TTSRequest(text="Test audio output")
    res = await service.synthesize(req)
    assert res.audio_file_path is not None
