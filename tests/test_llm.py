"""
Unit tests for Vision LLM Service.
"""

import pytest
from app.services.llm.llm_service import LLMService


@pytest.mark.asyncio
async def test_llm_service_initialization():
    service = LLMService()
    assert service.model_name is not None
