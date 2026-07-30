"""
API Endpoints for Image & Media Upload Management.
"""

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from app.api.dependencies import get_storage_service
from app.services.upload.storage import StorageService
from app.schemas.common import GenericResponse

router = APIRouter(prefix="/upload", tags=["Image Uploads"])


@router.post("", response_model=GenericResponse[str], summary="Upload and store camera frame")
async def upload_image(
    file: UploadFile = File(...),
    storage_service: StorageService = Depends(get_storage_service),
):
    """
    Accepts multipart image upload, validates file type, and saves to storage directory.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must be a valid image.",
        )

    saved_path = await storage_service.save_upload_file(file)
    return GenericResponse[str](
        success=True,
        message="Image uploaded successfully.",
        data=saved_path,
    )
