"""
RoadSense AI - API Pydantic Schemas
====================================
Data validation and response schemas for image, video, and frame analysis.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class Detection(BaseModel):
    """
    Object detection output schema.
    Matches Ultralytics YOLO output format.
    """
    class_id: int = Field(..., description="Target class ID: 0=Pothole, 1=Crack, 2=Road_Patch")
    class_name: str = Field(..., description="Human-readable class name: Pothole, Crack, Road_Patch")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score between 0.0 and 1.0")
    bbox: List[float] = Field(..., description="Bounding box coordinates in [x1, y1, x2, y2] format")
    is_low_confidence: Optional[bool] = Field(default=False, description="Flag indicating tentative prediction (< 0.15)")
    confidence_tier: Optional[str] = Field(default="confirmed", description="Confidence tier: confirmed (>=0.20), moderate (0.15-0.20), or tentative (<0.15)")


class ImageAnalysisResponse(BaseModel):
    """
    Response schema for POST /api/analyze/image and POST /api/analyze/frame.
    """
    filename: str = Field(..., description="Name of the processed image file")
    status: str = Field(..., description="Processing status: success, pending_trained_model, or error")
    message: str = Field(..., description="Detailed status message")
    image_url: Optional[str] = Field(None, description="Public URL to access the saved image")
    saved_path: Optional[str] = Field(None, description="Server filepath where image is stored")
    detections: List[Detection] = Field(default_factory=list, description="List of detected road features/distresses")
    road_condition: str = Field(default="unknown", description="Overall road condition: unknown, good, monitored, damaged, severe")
    effective_thresholds: Optional[dict] = Field(default=None, description="Per-class confidence thresholds applied during inference")


class VideoAnalysisResponse(BaseModel):
    """
    Response schema for POST /api/analyze/video.
    """
    filename: str = Field(..., description="Name of the processed video file")
    status: str = Field(..., description="Processing status: success, pending_trained_model, or error")
    message: str = Field(..., description="Detailed status message")
    video_url: Optional[str] = Field(None, description="Public URL to access the saved video")
    saved_path: Optional[str] = Field(None, description="Server filepath where video is stored")
    detections: List[Detection] = Field(default_factory=list, description="Aggregated or sampled detections")
    road_condition: str = Field(default="unknown", description="Overall evaluated road condition: unknown, good, damaged")


class HealthResponse(BaseModel):
    """
    Response schema for GET /health.
    """
    status: str = Field("ok", description="Service health status")
    service: str = Field("RoadSense AI Backend", description="Service name")
