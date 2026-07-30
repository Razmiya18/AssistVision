"""
OCR Router — POST /api/ocr
Accepts a base64 image, returns extracted text via pytesseract.
"""
import base64
import io
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from PIL import Image, ImageEnhance, ImageFilter
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

try:
    import pytesseract
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False
    logger.warning("pytesseract not installed. OCR will return mock data.")


class OCRRequest(BaseModel):
    image: str  # Base64 encoded image (data:image/... or raw base64)
    language: str = "eng"


class OCRResponse(BaseModel):
    text: str
    confidence: float
    word_count: int
    language: str
    mock: bool = False


def preprocess_image(img: Image.Image) -> Image.Image:
    """Enhance image for better OCR accuracy."""
    # Grayscale
    img = img.convert("L")
    # Sharpen
    img = img.filter(ImageFilter.SHARPEN)
    # Enhance contrast
    img = ImageEnhance.Contrast(img).enhance(2.0)
    # Resize if too small
    w, h = img.size
    if w < 800:
        scale = 800 / w
        img = img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
    return img


@router.post("", response_model=OCRResponse)
async def ocr_image(request: OCRRequest):
    """Extract text from an image using Tesseract OCR."""
    try:
        # Decode base64 image
        raw = request.image
        if "," in raw:
            raw = raw.split(",")[1]
        image_data = base64.b64decode(raw)
        img = Image.open(io.BytesIO(image_data))
        img = preprocess_image(img)

        if not TESSERACT_AVAILABLE:
            # Mock response when tesseract not installed
            return OCRResponse(
                text="PHARMACY — OPEN 24 HOURS. EMERGENCY ENTRANCE 50M AHEAD.",
                confidence=92.5,
                word_count=8,
                language=request.language,
                mock=True
            )

        # Run OCR
        lang = request.language or settings.OCR_LANGUAGE
        result = pytesseract.image_to_data(
            img,
            lang=lang,
            output_type=pytesseract.Output.DICT,
            config="--oem 3 --psm 6"
        )

        words = []
        confidences = []
        for i, word in enumerate(result["text"]):
            conf = int(result["conf"][i])
            if conf > settings.OCR_MIN_CONFIDENCE and word.strip():
                words.append(word.strip())
                confidences.append(conf)

        text = " ".join(words)
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0

        return OCRResponse(
            text=text,
            confidence=round(avg_confidence, 1),
            word_count=len(words),
            language=lang
        )

    except Exception as e:
        logger.error(f"OCR error: {e}")
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")
