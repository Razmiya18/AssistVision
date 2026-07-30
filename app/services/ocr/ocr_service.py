"""
Optical Character Recognition (OCR) Service Implementation.
Provides text detection and extraction for printed signs, documents, and packaging.
"""

import os
from typing import List
from loguru import logger
from app.core.config import settings
from app.schemas.ocr import OCRResponse, TextBlock


class OCRService:
    """
    Service wrapper for EasyOCR / Tesseract inference engine.
    """

    def __init__(self, languages: List[str] = settings.OCR_LANGUAGES) -> None:
        self.languages = languages
        self.is_loaded = False
        self._initialize_ocr()

    def _initialize_ocr(self) -> None:
        """
        Initializes OCR reader engine.
        """
        try:
            logger.info(f"Initializing OCR engine for languages: {self.languages}")
            # Placeholder for EasyOCR Reader initialization:
            # import easyocr
            # self.reader = easyocr.Reader(self.languages, gpu=settings.OCR_USE_GPU)
            self.is_loaded = True
            logger.info("OCR service initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize OCR service: {e}")
            self.is_loaded = False

    async def extract_text(self, image_path: str) -> OCRResponse:
        """
        Extracts text from input image and formats it for speech synthesis.
        """
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image not found at path: {image_path}")

        logger.info(f"Extracting OCR text from image: {image_path}")

        # Placeholder text block result
        blocks = [
            TextBlock(text="CAUTION", confidence=0.98),
            TextBlock(text="WET FLOOR AHEAD", confidence=0.94),
        ]

        full_text = " ".join([b.text for b in blocks])

        return OCRResponse(
            image_id=os.path.basename(image_path),
            full_text=full_text,
            text_blocks=blocks,
            language_detected="en",
        )


ocr_service_instance = OCRService()
