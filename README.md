# BlindViz 2.0 - FastAPI Backend Architecture

BlindViz 2.0 is a professional, modular AI computer vision backend engineered to empower visually impaired and blind users with real-time scene understanding, obstacle identification, text reading, and voice interaction.

---

## 📁 Directory Structure & Purpose of Each Folder

```text
c:\Users\USER\Desktop\AssistVision\
├── app/                            # Core FastAPI Application Package
│   ├── __init__.py                 # Package version and metadata
│   ├── main.py                     # FastAPI application factory, lifespan, and entry point
│   │
│   ├── core/                       # Global Core Configurations & System Infrastructure
│   │   ├── __init__.py
│   │   ├── config.py               # Central environment configuration (Pydantic BaseSettings)
│   │   ├── logging.py              # Loguru structured logging setup (console + file appenders)
│   │   └── security.py             # API Key validation & CORS security handling
│   │
│   ├── api/                        # REST API Transport & Routing Layer
│   │   ├── __init__.py
│   │   ├── dependencies.py         # Shared FastAPI dependency injection providers (Singletons)
│   │   └── v1/                     # Version 1 API Route Handlers
│   │       ├── __init__.py
│   │       ├── router.py           # Master v1 router aggregating feature sub-routers
│   │       ├── detection.py        # POST /api/v1/detection/process (YOLOv8 inference)
│   │       ├── ocr.py              # POST /api/v1/ocr/extract (Text extraction)
│   │       ├── llm.py              # POST /api/v1/llm/describe (Vision-Language scene narration)
│   │       ├── speech.py           # POST /api/v1/speech/tts & /stt (Voice accessibility)
│   │       └── upload.py           # POST /api/v1/upload (Media upload processing)
│   │
│   ├── services/                   # Business Logic & AI Engine Services Layer
│   │   ├── __init__.py
│   │   ├── detection/              # YOLOv8 Object Detection Module
│   │   │   ├── __init__.py
│   │   │   ├── yolo_service.py     # YOLOv8 inference runner & bounding box post-processing
│   │   │   └── utils.py            # Spatial positioning & proximity distance estimator
│   │   ├── ocr/                    # Optical Character Recognition (OCR) Module
│   │   │   ├── __init__.py
│   │   │   ├── ocr_service.py      # EasyOCR engine wrapper for text extraction
│   │   │   └── preprocessor.py     # Contrast enhancement, deskewing & binarization
│   │   ├── llm/                    # Vision-Language (LLM) Scene Synthesis Module
│   │   │   ├── __init__.py
│   │   │   ├── llm_service.py      # Multimodal LLM integration (GPT-4 Vision / Ollama)
│   │   │   └── prompts.py          # Assistive audio narration system prompts
│   │   ├── speech/                 # Voice Accessibility (TTS & STT) Module
│   │   │   ├── __init__.py
│   │   │   ├── tts_service.py      # Text-to-Speech audio synthesizer (gTTS / Edge-TTS)
│   │   │   └── stt_service.py      # Speech-to-Text audio transcriber (Whisper)
│   │   └── upload/                 # File & Image Storage Service
│   │       ├── __init__.py
│   │       ├── storage.py          # Storage manager, unique UUID naming & auto cleanup
│   │       └── image_processor.py  # MIME validation, EXIF auto-rotation & resizing
│   │
│   ├── schemas/                    # Pydantic Data Transfer Objects (DTOs)
│   │   ├── __init__.py
│   │   ├── common.py               # Generic API envelope & Health check response models
│   │   ├── detection.py            # BoundingBox, DetectedObject & DetectionResponse models
│   │   ├── ocr.py                  # TextBlock & OCRResponse models
│   │   ├── llm.py                  # LLMQueryRequest & LLMSceneResponse models
│   │   └── speech.py               # TTSRequest, TTSResponse & STTResponse models
│   │
│   └── utils/                      # Helper & Utility Scripts
│       ├── __init__.py
│       └── helpers.py              # File checksums, timestamp generators & string utilities
│
├── uploads/                        # Local temporary storage for uploaded media (gitignored)
├── logs/                           # Automated log rotation storage (gitignored)
├── tests/                          # Automated Testing Suite (Pytest)
│   ├── __init__.py
│   ├── test_detection.py           # Unit tests for YOLOv8 service
│   ├── test_ocr.py                 # Unit tests for OCR service
│   ├── test_llm.py                 # Unit tests for LLM service
│   ├── test_speech.py              # Unit tests for Speech services
│   └── test_api.py                 # FastAPI integration end-to-end tests
│
├── .env.example                    # Template for environment settings
├── .gitignore                      # Git exclusion rules
├── requirements.txt                # Python package dependency specifications
└── README.md                       # Architecture documentation
```

---

## 🚀 Quick Start Guide

### 1. Installation
Create virtual environment and install dependencies:
```bash
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Environment Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Run Development Server
```bash
python -m app.main
# Or using uvicorn directly:
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Interactive Documentation
Open your browser and navigate to:
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

---

## 🧪 Running Automated Tests
```bash
pytest tests/
```
