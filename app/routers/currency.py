"""
Currency Detection Router — POST /api/currency
Detects currency notes from a base64 image.
"""
import base64
import io
import logging
import random
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from PIL import Image

logger = logging.getLogger(__name__)
router = APIRouter()

INDIAN_NOTES = [
    {"denomination": 10,   "label": "Ten Rupees",           "color": "#F59E0B"},
    {"denomination": 20,   "label": "Twenty Rupees",         "color": "#10B981"},
    {"denomination": 50,   "label": "Fifty Rupees",          "color": "#3B82F6"},
    {"denomination": 100,  "label": "One Hundred Rupees",    "color": "#8B5CF6"},
    {"denomination": 200,  "label": "Two Hundred Rupees",    "color": "#EC4899"},
    {"denomination": 500,  "label": "Five Hundred Rupees",   "color": "#10B981"},
    {"denomination": 2000, "label": "Two Thousand Rupees",   "color": "#EF4444"},
]


class CurrencyRequest(BaseModel):
    image: str  # Base64 image


class CurrencyResponse(BaseModel):
    detected: bool
    denomination: Optional[int] = None
    currency: str = "INR"
    label: Optional[str] = None
    confidence: float = 0.0
    symbol: Optional[str] = None
    mock: bool = False


@router.post("", response_model=CurrencyResponse)
async def detect_currency(request: CurrencyRequest):
    """Detect Indian Rupee currency denomination from image."""
    try:
        # Decode image
        raw = request.image
        if "," in raw:
            raw = raw.split(",")[1]
        image_data = base64.b64decode(raw)
        img = Image.open(io.BytesIO(image_data))
        img_w, img_h = img.size

        # ── Heuristic: analyze dominant color channels ─────────────────────
        # Real model would use CNN classifier here.
        # For now: check if image is predominantly colorful (not a blank scene)
        img_rgb = img.convert("RGB").resize((64, 64))
        pixels = list(img_rgb.getdata())
        avg_r = sum(p[0] for p in pixels) / len(pixels)
        avg_g = sum(p[1] for p in pixels) / len(pixels)
        avg_b = sum(p[2] for p in pixels) / len(pixels)

        # Detect if it's a rich-color document (likely a banknote)
        color_richness = max(abs(avg_r - avg_g), abs(avg_g - avg_b), abs(avg_r - avg_b))

        if color_richness > 20:
            # "Likely a colourful document" — pick note based on dominant channel
            if avg_r > avg_g and avg_r > avg_b:
                note = INDIAN_NOTES[-1]   # Warm = ₹2000
            elif avg_g > avg_r and avg_g > avg_b:
                note = INDIAN_NOTES[5]    # Green = ₹500
            else:
                note = INDIAN_NOTES[3]    # Blue = ₹100
            conf = round(70 + color_richness * 0.5, 1)
            return CurrencyResponse(
                detected=True,
                denomination=note["denomination"],
                currency="INR",
                label=note["label"],
                confidence=min(98.0, conf),
                symbol=f"₹{note['denomination']}",
                mock=True
            )
        else:
            return CurrencyResponse(detected=False, confidence=0.0)

    except Exception as e:
        logger.error(f"Currency detection error: {e}")
        raise HTTPException(status_code=500, detail=f"Currency detection failed: {str(e)}")
