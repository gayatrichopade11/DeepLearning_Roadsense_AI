"""
RoadSense AI - FastAPI Backend Application
==========================================
Project: AI-Based Road Condition Analysis and Damage Prediction Using Deep Learning
Target Classes: Pothole, Crack, Road_Patch
"""

import os
import shutil
import uuid
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, HTTPException, Query, Request, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.model_service import model_service
from backend.schemas import (
    HealthResponse,
    ImageAnalysisResponse,
    VideoAnalysisResponse,
)

# Base directories
BACKEND_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BACKEND_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Allowed extensions
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv", ".webm"}

app = FastAPI(
    title="RoadSense AI Backend",
    description="Backend API for AI-based road condition monitoring, damage detection, and predictive maintenance.",
    version="1.0.0",
)

# CORS configuration for React frontend integration
# Explicitly authorizes the production Vercel frontend, all Vercel preview domains via regex,
# and any custom domains specified in ALLOWED_ORIGINS (comma-separated).
raw_origins = os.environ.get("ALLOWED_ORIGINS", "").strip()
default_origins = [
    "https://deep-learning-roadsense-ai.vercel.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

if raw_origins:
    custom_origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]
    allowed_origins = list(dict.fromkeys(default_origins + custom_origins))
else:
    allowed_origins = default_origins

# If wildcard is explicitly used, credentials must be disabled per CORS specification
allow_credentials = False if "*" in allowed_origins else True

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^https:\/\/.*\.vercel\.app$",
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory for direct preview of uploaded road media
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")


@app.get("/", tags=["General"])
def root():
    """
    Root endpoint with service metadata.
    """
    return {
        "service": "RoadSense AI Backend",
        "description": "AI-Based Road Condition Analysis and Damage Prediction Using Deep Learning",
        "docs_url": "/docs",
        "health_url": "/health",
    }


@app.get("/health", response_model=HealthResponse, tags=["Health"])
def health_check():
    """
    Service health check endpoint.
    """
    return HealthResponse(
        status="ok",
        service="RoadSense AI Backend",
    )


@app.post(
    "/api/analyze/image",
    response_model=ImageAnalysisResponse,
    status_code=status.HTTP_200_OK,
    tags=["Analysis"],
)
async def analyze_image(
    request: Request,
    file: UploadFile = File(..., description="Road pavement image file"),
    conf: Optional[float] = Query(default=0.20, ge=0.01, le=1.0, description="Confidence threshold"),
):
    """
    Upload and analyze a single road image for distresses (Asphalt, Crack, Pothole).
    Saves file safely to backend/uploads/ and delegates to model_service.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided in upload.")

    # Validate image extension
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{ext}'. Supported image formats: {', '.join(sorted(ALLOWED_IMAGE_EXTENSIONS))}",
        )

    # Generate collision-free filename
    safe_basename = Path(file.filename).stem
    unique_filename = f"{uuid.uuid4().hex[:8]}_{safe_basename}{ext}"
    saved_filepath = UPLOAD_DIR / unique_filename

    # Save uploaded file safely
    try:
        with saved_filepath.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save uploaded image: {str(e)}")
    finally:
        file.file.close()

    # Delegate to model service with configured confidence threshold
    analysis = model_service.analyze_image(saved_filepath, conf=conf if conf is not None else 0.20)

    # Construct public image URL
    base_url = str(request.base_url).rstrip("/")
    image_url = f"{base_url}/uploads/{unique_filename}"

    return ImageAnalysisResponse(
        filename=unique_filename,
        status=analysis.get("status", "pending_trained_model"),
        message=analysis.get("message", "Image processed successfully."),
        image_url=image_url,
        saved_path=str(saved_filepath),
        detections=analysis.get("detections", []),
        road_condition=analysis.get("road_condition", "unknown"),
    )


@app.post(
    "/api/analyze/video",
    response_model=VideoAnalysisResponse,
    status_code=status.HTTP_200_OK,
    tags=["Analysis"],
)
async def analyze_video(
    request: Request,
    file: UploadFile = File(..., description="Road survey video file"),
):
    """
    Upload a road corridor video for batch or frame-by-frame distress inspection.
    Saves video safely inside backend/uploads/.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided in upload.")

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_VIDEO_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid video type '{ext}'. Supported video formats: {', '.join(sorted(ALLOWED_VIDEO_EXTENSIONS))}",
        )

    safe_basename = Path(file.filename).stem
    unique_filename = f"{uuid.uuid4().hex[:8]}_{safe_basename}{ext}"
    saved_filepath = UPLOAD_DIR / unique_filename

    try:
        with saved_filepath.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save video: {str(e)}")
    finally:
        file.file.close()

    base_url = str(request.base_url).rstrip("/")
    video_url = f"{base_url}/uploads/{unique_filename}"

    return VideoAnalysisResponse(
        filename=unique_filename,
        status="pending_trained_model",
        message="Video uploaded successfully. Video inference pipeline standing by for trained YOLO weights.",
        video_url=video_url,
        saved_path=str(saved_filepath),
        detections=[],
        road_condition="unknown",
    )


@app.post(
    "/api/analyze/frame",
    response_model=ImageAnalysisResponse,
    status_code=status.HTTP_200_OK,
    tags=["Live Camera"],
)
async def analyze_frame(
    file: UploadFile = File(..., description="Live camera snapshot frame"),
    conf: Optional[float] = Query(default=0.20, ge=0.01, le=1.0, description="Confidence threshold"),
):
    """
    Accepts a single live camera frame from browser MediaDevices stream.
    Designed for real-time periodic polling without saving files to disk.
    """
    if not file.filename:
        file.filename = "live_frame.jpg"

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid frame format '{ext}'. Must be an image format.",
        )

    try:
        contents = await file.read()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read camera frame: {str(e)}")
    finally:
        file.file.close()

    analysis = model_service.analyze_frame(contents, conf=conf if conf is not None else 0.20)

    return ImageAnalysisResponse(
        filename=file.filename,
        status=analysis.get("status", "pending_trained_model"),
        message=analysis.get("message", "Live frame processed."),
        image_url=None,
        saved_path=None,
        detections=analysis.get("detections", []),
        road_condition=analysis.get("road_condition", "unknown"),
    )


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=False)
