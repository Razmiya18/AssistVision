"""
API Endpoints for YOLOv8 Object Detection.
"""

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from app.api.dependencies import get_yolo_service, get_storage_service
from app.services.detection.yolo_service import YOLOService
from app.services.upload.storage import StorageService
from app.schemas.detection import ObjectDetectionResponse

router = APIRouter(prefix="/detection", tags=["YOLOv8 Object Detection"])


@router.post("/process", response_model=ObjectDetectionResponse, summary="Detect objects in uploaded image frame")
async def detect_objects(
    file: UploadFile = File(...),
    yolo_service: YOLOService = Depends(get_yolo_service),
    storage_service: StorageService = Depends(get_storage_service),
):
    """
    Uploads a camera frame image, executes YOLOv8 object detection, and returns detected items with spatial position & distances.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File provided is not a valid image format.",
        )

    saved_path = await storage_service.save_upload_file(file)
    try:
        results = await yolo_service.detect_objects(saved_path)
        return results
    finally:
        storage_service.cleanup_file(saved_path)
