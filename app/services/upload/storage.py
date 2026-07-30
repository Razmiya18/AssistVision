"""
File Storage Service Handler.
Manages file uploads, unique filename generation, directory creation, and temp file cleanup.
"""

import os
import uuid
from pathlib import Path
from fastapi import UploadFile
from loguru import logger
from app.core.config import settings


class StorageService:
    """
    Handles saving uploaded images and managing temporary storage.
    """

    def __init__(self, upload_dir: str = settings.UPLOAD_DIR) -> None:
        self.upload_dir = Path(upload_dir)
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    async def save_upload_file(self, upload_file: UploadFile) -> str:
        """
        Saves incoming FastAPI UploadFile to local disk with unique UUID filename.

        :param upload_file: Incoming multipart form-data file.
        :return: Absolute file path to saved file.
        """
        ext = Path(upload_file.filename or "file.jpg").suffix
        filename = f"{uuid.uuid4()}{ext}"
        destination_path = self.upload_dir / filename

        logger.info(f"Saving uploaded file {upload_file.filename} -> {destination_path}")

        content = await upload_file.read()
        with open(destination_path, "wb") as f:
            f.write(content)

        return str(destination_path.resolve())

    def cleanup_file(self, file_path: str) -> bool:
        """
        Deletes temporary file from disk.
        """
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.debug(f"Cleaned up file: {file_path}")
                return True
        except Exception as e:
            logger.error(f"Error cleaning up file {file_path}: {e}")
        return False


storage_service_instance = StorageService()
