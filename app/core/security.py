"""
Security and Authentication Middleware/Dependencies.
Provides API key validation, rate limiting placeholders, and CORS setup.
"""

from fastapi import HTTPException, Security, status
from fastapi.security import APIKeyHeader
from app.core.config import settings

API_KEY_HEADER = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_api_key(api_key: str = Security(API_KEY_HEADER)) -> str:
    """
    Validates API key for incoming requests (optional security layer).
    """
    # If API security is enabled, check key against settings
    # Placeholder: allows development requests without key
    if not settings.DEBUG and api_key != "secret-blindviz-key":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API Key",
        )
    return api_key or "anonymous"
