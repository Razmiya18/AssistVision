"""
FastAPI Shared Dependency Injectors.
Provides singleton instances of AI services (YOLO, OCR, LLM, Speech, Storage) to endpoint handlers.
"""

from app.services.detection.yolo_service import YOLOService, yolo_service_instance
from app.services.ocr.ocr_service import OCRService, ocr_service_instance
from app.services.llm.llm_service import LLMService, llm_service_instance
from app.services.speech.tts_service import TTSService, tts_service_instance
from app.services.speech.stt_service import STTService, stt_service_instance
from app.services.upload.storage import StorageService, storage_service_instance


def get_yolo_service() -> YOLOService:
    """Dependency injector for YOLOv8 Object Detection Service."""
    return yolo_service_instance


def get_ocr_service() -> OCRService:
    """Dependency injector for OCR Service."""
    return ocr_service_instance


def get_llm_service() -> LLMService:
    """Dependency injector for Vision LLM Service."""
    return llm_service_instance


def get_tts_service() -> TTSService:
    """Dependency injector for Text-to-Speech Service."""
    return tts_service_instance


def get_stt_service() -> STTService:
    """Dependency injector for Speech-to-Text Service."""
    return stt_service_instance


def get_storage_service() -> StorageService:
    """Dependency injector for File Storage Service."""
    return storage_service_instance
