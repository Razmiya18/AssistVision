"""
API Endpoints for Text-to-Speech (TTS) and Speech-to-Text (STT).
"""

from fastapi import APIRouter, Depends, UploadFile, File
from app.api.dependencies import get_tts_service, get_stt_service, get_storage_service
from app.services.speech.tts_service import TTSService
from app.services.speech.stt_service import STTService
from app.services.upload.storage import StorageService
from app.schemas.speech import TTSRequest, TTSResponse, STTResponse

router = APIRouter(prefix="/speech", tags=["Speech TTS & STT"])


@router.post("/tts", response_model=TTSResponse, summary="Synthesize text into spoken audio file")
async def text_to_speech(
    request: TTSRequest,
    tts_service: TTSService = Depends(get_tts_service),
):
    """
    Synthesizes AI response text into downloadable/playable speech audio file.
    """
    return await tts_service.synthesize(request)


@router.post("/stt", response_model=STTResponse, summary="Transcribe user voice recording into text")
async def speech_to_text(
    audio_file: UploadFile = File(...),
    stt_service: STTService = Depends(get_stt_service),
    storage_service: StorageService = Depends(get_storage_service),
):
    """
    Transcribes audio voice query recorded by visually impaired user into text command.
    """
    saved_path = await storage_service.save_upload_file(audio_file)
    try:
        return await stt_service.transcribe(saved_path)
    finally:
        storage_service.cleanup_file(saved_path)
