"""
Object Detection Router — POST /api/detect
Accepts a base64 image, returns detected objects.
Supports YOLOv8 when available, falls back to smart mock data.
"""
import base64
import io
import logging
import random
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from PIL import Image
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

# Try loading YOLOv8 model
YOLO_MODEL = None
if not settings.USE_MOCK_DETECTION:
    try:
        from ultralytics import YOLO
        YOLO_MODEL = YOLO(settings.YOLO_MODEL_PATH)
        logger.info(f"YOLOv8 model loaded from {settings.YOLO_MODEL_PATH}")
    except Exception as e:
        logger.warning(f"YOLO model not loaded: {e}. Using mock detections.")


class DetectionRequest(BaseModel):
    image: str  # Base64 image
    mode: str = "object"  # 'object' | 'face' | 'traffic'


class Detection(BaseModel):
    label: str
    confidence: float
    distance_estimate: Optional[float] = None
    direction: str = "Center"
    x: float
    y: float
    width: float
    height: float
    warning: bool = False


class DetectionResponse(BaseModel):
    detections: List[Detection]
    count: int
    mock: bool = False


MOCK_OBJECTS = [
    "Person", "Chair", "Table", "Door", "Bicycle", "Car", "Motorcycle",
    "Backpack", "Umbrella", "Handbag", "Laptop", "Cell Phone", "Book",
    "Potted Plant", "TV Monitor", "Keyboard", "Mouse"
]

TRAFFIC_SIGNALS = ["Red Signal — STOP", "Green Signal — GO", "Yellow Signal — CAUTION"]


def estimate_distance(box_height_fraction: float) -> float:
    """Rough distance estimate based on bounding box height (fraction of image)."""
    # Larger box = closer object
    if box_height_fraction > 0.6:
        return round(0.4 + random.uniform(0, 0.3), 1)
    elif box_height_fraction > 0.3:
        return round(0.8 + random.uniform(0, 0.7), 1)
    else:
        return round(1.5 + random.uniform(0, 2.0), 1)


@router.post("", response_model=DetectionResponse)
async def detect_objects(request: DetectionRequest):
    """Detect objects in an image frame."""
    try:
        # Decode image
        raw = request.image
        if "," in raw:
            raw = raw.split(",")[1]
        image_data = base64.b64decode(raw)
        img = Image.open(io.BytesIO(image_data))
        img_w, img_h = img.size

        if YOLO_MODEL is not None:
            # ── Real YOLO Detection ──────────────────────────────────────────
            results = YOLO_MODEL(img, conf=settings.YOLO_CONFIDENCE, iou=settings.YOLO_IOU)
            detections = []
            for r in results:
                for box in r.boxes:
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    conf = float(box.conf[0])
                    cls = int(box.cls[0])
                    label = YOLO_MODEL.names[cls]
                    bh_frac = (y2 - y1) / img_h
                    cx = (x1 + x2) / 2 / img_w
                    direction = "Left" if cx < 0.35 else "Right" if cx > 0.65 else "Center"
                    dist = estimate_distance(bh_frac)
                    detections.append(Detection(
                        label=label,
                        confidence=round(conf * 100, 1),
                        distance_estimate=dist,
                        direction=direction,
                        x=round(x1 / img_w * 100, 1),
                        y=round(y1 / img_h * 100, 1),
                        width=round((x2 - x1) / img_w * 100, 1),
                        height=round((y2 - y1) / img_h * 100, 1),
                        warning=dist < 1.0
                    ))
            return DetectionResponse(detections=detections, count=len(detections))

        else:
            # ── Mock Detection ───────────────────────────────────────────────
            n = random.randint(0, 2)
            detections = []
            for i in range(n):
                dist = round(0.5 + random.uniform(0, 3.0), 1)
                lbl = random.choice(TRAFFIC_SIGNALS if request.mode == "traffic" else MOCK_OBJECTS)
                detections.append(Detection(
                    label=lbl,
                    confidence=round(70 + random.uniform(0, 28), 1),
                    distance_estimate=dist,
                    direction=random.choice(["Left", "Center", "Right"]),
                    x=round(random.uniform(5, 60), 1),
                    y=round(random.uniform(10, 60), 1),
                    width=round(random.uniform(15, 35), 1),
                    height=round(random.uniform(20, 40), 1),
                    warning=dist < 1.0
                ))
            return DetectionResponse(detections=detections, count=len(detections), mock=True)

    except Exception as e:
        logger.error(f"Detection error: {e}")
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")
