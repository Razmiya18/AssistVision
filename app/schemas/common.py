"""
Common Pydantic Schemas for Generic API Responses.
"""

from typing import Generic, Optional, TypeVar
from pydantic import BaseModel

T = TypeVar("T")


class GenericResponse(BaseModel, Generic[T]):
    """
    Standardized response structure for all endpoints.
    """
    success: bool
    message: str
    data: Optional[T] = None


class HealthCheckResponse(BaseModel):
    """
    Health check endpoint response format.
    """
    status: str
    version: str
    yolo_loaded: bool
    ocr_loaded: bool
    llm_connected: bool
