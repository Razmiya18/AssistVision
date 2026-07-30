"""
API v1 Router Aggregator.
Mounts detection, ocr, llm, speech, and upload sub-routers into single API v1 router instance.
"""

from fastapi import APIRouter
from app.api.v1.detection import router as detection_router
from app.api.v1.ocr import router as ocr_router
from app.api.v1.llm import router as llm_router
from app.api.v1.speech import router as speech_router
from app.api.v1.upload import router as upload_router

api_v1_router = APIRouter()

# Mount feature sub-routers
api_v1_router.include_router(detection_router)
api_v1_router.include_router(ocr_router)
api_v1_router.include_router(llm_router)
api_v1_router.include_router(speech_router)
api_v1_router.include_router(upload_router)
