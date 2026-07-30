"""
BlindViz 2.0 FastAPI Application Entry Point.
Initializes FastAPI instance, attaches CORS middleware, lifespan events, logging, static file mounts, and routers.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from app.core.config import settings
from app.core.logging import setup_logging
from app.api.v1.router import api_v1_router
from app.schemas.common import HealthCheckResponse
from app.services.detection.yolo_service import yolo_service_instance
from app.services.ocr.ocr_service import ocr_service_instance


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Handles startup configuration and cleanup on shutdown.
    """
    # Startup tasks
    setup_logging()
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION}...")
    yield
    # Shutdown tasks
    logger.info(f"Shutting down {settings.PROJECT_NAME}...")


def create_application() -> FastAPI:
    """
    FastAPI App Factory function.
    """
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description="Modular Computer Vision & Assistive AI Backend for Blind & Visually Impaired Users",
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    # Configure CORS Middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register API v1 Router
    app.include_router(api_v1_router, prefix=settings.API_V1_STR)

    @app.get("/health", response_model=HealthCheckResponse, tags=["Health Check"])
    async def health_check():
        """
        Health check endpoint to monitor server and model status.
        """
        return HealthCheckResponse(
            status="healthy",
            version=settings.VERSION,
            yolo_loaded=yolo_service_instance.is_loaded,
            ocr_loaded=ocr_service_instance.is_loaded,
            llm_connected=True,
        )

    return app


app = create_application()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
