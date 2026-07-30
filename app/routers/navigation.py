"""
Navigation / Geocoding Router — GET /api/geocode
Proxies geocoding requests to Nominatim (OpenStreetMap).
"""
import logging
import httpx
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

NOMINATIM_BASE = "https://nominatim.openstreetmap.org"


class GeocodeResponse(BaseModel):
    found: bool
    lat: Optional[float] = None
    lon: Optional[float] = None
    display_name: Optional[str] = None
    place_type: Optional[str] = None


@router.get("", response_model=GeocodeResponse)
async def geocode(q: str = Query(..., description="Place name or address to geocode")):
    """Geocode a place name using Nominatim (OpenStreetMap)."""
    try:
        async with httpx.AsyncClient(timeout=settings.GEOCODING_TIMEOUT) as client:
            response = await client.get(
                f"{NOMINATIM_BASE}/search",
                params={
                    "q": q,
                    "format": "json",
                    "limit": 1,
                    "addressdetails": 1
                },
                headers={"User-Agent": settings.NOMINATIM_USER_AGENT}
            )

        if response.status_code != 200:
            raise HTTPException(status_code=502, detail="Geocoding service unavailable")

        data = response.json()
        if not data:
            return GeocodeResponse(found=False)

        result = data[0]
        return GeocodeResponse(
            found=True,
            lat=float(result["lat"]),
            lon=float(result["lon"]),
            display_name=result.get("display_name"),
            place_type=result.get("type")
        )

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Geocoding request timed out")
    except Exception as e:
        logger.error(f"Geocoding error: {e}")
        raise HTTPException(status_code=500, detail=f"Geocoding failed: {str(e)}")


@router.get("/reverse", response_model=GeocodeResponse)
async def reverse_geocode(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude")
):
    """Reverse geocode coordinates to a human-readable address."""
    try:
        async with httpx.AsyncClient(timeout=settings.GEOCODING_TIMEOUT) as client:
            response = await client.get(
                f"{NOMINATIM_BASE}/reverse",
                params={"lat": lat, "lon": lon, "format": "json"},
                headers={"User-Agent": settings.NOMINATIM_USER_AGENT}
            )

        if response.status_code != 200:
            raise HTTPException(status_code=502, detail="Reverse geocoding unavailable")

        data = response.json()
        if "error" in data:
            return GeocodeResponse(found=False)

        return GeocodeResponse(
            found=True,
            lat=lat,
            lon=lon,
            display_name=data.get("display_name"),
            place_type=data.get("type")
        )
    except Exception as e:
        logger.error(f"Reverse geocoding error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
