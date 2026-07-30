"""
Pydantic Schemas for YOLOv8 Object Detection.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class BoundingBox(BaseModel):
    """
    Coordinates of detected object bounding box (normalized or pixel coords).
    """
    xmin: float
    ymin: float
    xmax: float
    ymax: float


class DetectedObject(BaseModel):
    """
    Individual object metadata detected by YOLOv8.
    """
    label: str = Field(..., description="Class name of detected object (e.g. 'chair', 'person')")
    confidence: float = Field(..., description="Detection confidence score between 0.0 and 1.0")
    bbox: BoundingBox
    position: Optional[str] = Field(None, description="Spatial position relative to user (e.g., 'center left', 'ahead')")
    estimated_distance: Optional[str] = Field(None, description="Approximate distance (e.g., 'close', '2 meters')")


class ObjectDetectionResponse(BaseModel):
    """
    Response schema for YOLOv8 object detection endpoint.
    """
    image_id: str
    object_count: int
    detected_objects: List[DetectedObject]
    summary_text: str = Field(..., description="Audio-ready description snippet for visually impaired users")
