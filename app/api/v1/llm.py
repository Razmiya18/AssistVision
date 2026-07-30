"""
API Endpoints for Vision-Language Scene Description & QA.
"""

from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form
from app.api.dependencies import get_llm_service, get_storage_service
from app.services.llm.llm_service import LLMService
from app.services.upload.storage import StorageService
from app.schemas.llm import LLMSceneResponse

router = APIRouter(prefix="/llm", tags=["LLM Scene Description"])


@router.post("/describe", response_model=LLMSceneResponse, summary="Generate vision-language scene narration")
async def describe_scene(
    file: UploadFile = File(...),
    question: Optional[str] = Form(None),
    llm_service: LLMService = Depends(get_llm_service),
    storage_service: StorageService = Depends(get_storage_service),
):
    """
    Accepts camera frame, passes it to Vision LLM, and returns natural spoken-style scene narration and hazard warnings.
    """
    saved_path = await storage_service.save_upload_file(file)
    try:
        results = await llm_service.describe_scene(saved_path, user_question=question)
        return results
    finally:
        storage_service.cleanup_file(saved_path)
