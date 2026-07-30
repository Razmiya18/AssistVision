"""
Unit tests for Optical Character Recognition (OCR) Service.
"""

import pytest
from app.services.ocr.ocr_service import OCRService


@pytest.mark.asyncio
async def test_ocr_service_initialization():
    service = OCRService()
    assert service.is_loaded is True
