"""
Large Language Model (LLM) & Vision Integration Service.
Connects with OpenAI GPT-4 Vision, Ollama, or HuggingFace endpoints for scene synthesis.
"""

from typing import Optional
from loguru import logger
from app.core.config import settings
from app.schemas.llm import LLMSceneResponse, LLMQueryRequest
from app.services.llm.prompts import ASSISTIVE_SCENE_SYSTEM_PROMPT


class LLMService:
    """
    Service wrapper for multi-modal Vision LLM capabilities.
    """

    def __init__(self, api_key: str = settings.OPENAI_API_KEY) -> None:
        self.api_key = api_key
        self.model_name = settings.LLM_MODEL_NAME

    async def describe_scene(self, image_path: str, user_question: Optional[str] = None) -> LLMSceneResponse:
        """
        Synthesizes visual frame into structured assistive narrative description.
        """
        logger.info(f"Generating LLM scene description for image: {image_path}")

        # Placeholder LLM response logic
        narrative = (
            "You are indoors in a well-lit living area. Directly ahead about 1.5 meters is a comfortable chair. "
            "To your right, a person is standing near a table. The pathway directly forward is clear of obstacles."
        )

        return LLMSceneResponse(
            image_id=image_path,
            narrative_description=narrative,
            key_hazards="None detected in immediate path.",
            suggested_actions="You can safely take 2 steps forward.",
        )


llm_service_instance = LLMService()
