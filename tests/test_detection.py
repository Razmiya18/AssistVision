"""
Unit tests for YOLOv8 Object Detection Service.
"""

import pytest
from app.services.detection.yolo_service import YOLOService


@pytest.mark.asyncio
async def test_yolo_service_initialization():
    service = YOLOService()
    assert service.is_loaded is True
