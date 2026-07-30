"""
Pydantic Schemas for Optical Character Recognition (OCR).
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class TextBlock(BaseModel):
    """
    Extracted text region with location and confidence score.
    """
    text: str
    confidence: float
    bbox: Optional[List[List[int]]] = Field(None, description="Polygon points around recognized text block")


class OCRResponse(BaseModel):
    """
    Response schema for text recognition requests.
    """
    image_id: str
    full_text: str = Field(..., description="Concatenated clean text ready for screen reader / TTS playback")
    text_blocks: List[TextBlock]
    language_detected: str = "en"
