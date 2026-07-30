"""
Structured Logging Setup for BlindViz 2.0.
Configures python standard logging with file output and standard stream formatting.
"""

import sys
from pathlib import Path
from loguru import logger
from app.core.config import settings


def setup_logging() -> None:
    """
    Configures loguru logger with stdout and file appenders.
    Creates logs directory if it does not exist.
    """
    log_path = Path(settings.LOG_DIR)
    log_path.mkdir(parents=True, exist_ok=True)

    # Remove default handler
    logger.remove()

    # Add console logging
    logger.add(
        sys.stdout,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        level="DEBUG" if settings.DEBUG else "INFO",
    )

    # Add file logging
    logger.add(
        log_path / "blindviz_app.log",
        rotation="10 MB",
        retention="7 days",
        compression="zip",
        level="INFO",
    )

    logger.info("Logging initialized successfully for BlindViz 2.0.")
