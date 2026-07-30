"""
API Endpoints for Optical Character Recognition (OCR).
"""

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from app.api.dependencies import get_ocr_service, get_storage_service
from app.services.ocr.ocr_service import OCRService
from app.services.upload.storage import StorageService
from app.schemas.ocr import OCRResponse

router = APIRouter(prefix="/ocr", tags=["OCR Text Recognition"])


@router.post("/extract", response_model=OCRResponse, summary="Extract readable text from image")
async def extract_text_from_image(
    file: UploadFile = File(...),
    ocr_service: OCRService = Depends(get_ocr_service),
    storage_service: StorageService = Depends(get_storage_service),
):
    """
    Uploads a camera frame or photo, runs OCR text extraction, and formats text for audio screen readers.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File provided is not a valid image.",
        )

    saved_path = await storage_service.save_upload_file(file)
    try:
        results = await ocr_service.extract_text(saved_path)
        return results
    finally:
        storage_service.cleanup_file(saved_path)
