"""
Emergency SOS Router — POST /api/sos
Logs SOS events and returns confirmation.
"""
import json
import logging
import os
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

os.makedirs(os.path.dirname(settings.SOS_LOG_FILE), exist_ok=True)


class EmergencyContact(BaseModel):
    name: str
    phone: str


class SOSRequest(BaseModel):
    lat: Optional[float] = None
    lon: Optional[float] = None
    message: str
    contacts: Optional[List[EmergencyContact]] = []
    user_id: Optional[str] = "anonymous"


class SOSResponse(BaseModel):
    success: bool
    event_id: str
    timestamp: str
    message: str


@router.post("", response_model=SOSResponse)
async def send_sos(request: SOSRequest):
    """Log an emergency SOS event and return confirmation."""
    try:
        event_id = f"SOS-{datetime.utcnow().strftime('%Y%m%d%H%M%S%f')[:17]}"
        timestamp = datetime.utcnow().isoformat() + "Z"

        event = {
            "event_id": event_id,
            "timestamp": timestamp,
            "lat": request.lat,
            "lon": request.lon,
            "message": request.message,
            "contacts": [c.dict() for c in (request.contacts or [])],
            "user_id": request.user_id
        }

        # Append to log file
        try:
            existing = []
            if os.path.exists(settings.SOS_LOG_FILE):
                with open(settings.SOS_LOG_FILE, "r") as f:
                    existing = json.load(f)
        except Exception:
            existing = []

        existing.append(event)

        with open(settings.SOS_LOG_FILE, "w") as f:
            json.dump(existing, f, indent=2)

        logger.warning(f"[SOS] Event logged: {event_id} at ({request.lat}, {request.lon})")

        # Future: trigger SMS/email/push notifications here
        if settings.SOS_NOTIFY_BACKEND:
            logger.info(f"[SOS] Backend notification would be triggered for contacts: {[c.phone for c in (request.contacts or [])]}")

        return SOSResponse(
            success=True,
            event_id=event_id,
            timestamp=timestamp,
            message=f"SOS event logged. Emergency contacts: {len(request.contacts or [])}. ID: {event_id}"
        )

    except Exception as e:
        logger.error(f"SOS logging error: {e}")
        raise HTTPException(status_code=500, detail=f"SOS event logging failed: {str(e)}")


@router.get("/logs", tags=["Emergency SOS"])
async def get_sos_logs():
    """Retrieve all logged SOS events (admin use)."""
    try:
        if not os.path.exists(settings.SOS_LOG_FILE):
            return {"events": [], "count": 0}
        with open(settings.SOS_LOG_FILE, "r") as f:
            events = json.load(f)
        return {"events": events, "count": len(events)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
