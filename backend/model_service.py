"""
RoadSense AI - Model Service Layer
===================================
Handles deep learning model lifecycle and inference for road condition analysis.

Project Target Classes:
- 0: Pothole
- 1: Crack
- 2: Road_Patch

Model Weight Path:
ml/models/best_clean_303.pt

Note:
This service starts gracefully whether model weights exist or not.
When weights are not found, it returns empty detections without failing.
Once trained weights are placed at ml/models/best_clean_303.pt, Ultralytics YOLO
will automatically load and perform real-time bounding box detection.
"""

import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

logger = logging.getLogger("roadsense.model_service")

# Resolve project paths relative to this file
BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent
DEFAULT_WEIGHTS_PATH = PROJECT_ROOT / "ml" / "models" / "best_clean_303.pt"
FALLBACK_WEIGHTS_PATH = PROJECT_ROOT / "ml" / "models" / "best.pt"

CLASS_NAMES = {
    0: "Pothole",
    1: "Crack",
    2: "Road_Patch"
}


class RoadSenseModelService:
    """
    Service managing YOLO model loading and inference for RoadSense AI.
    """

    def __init__(self, weights_path: Optional[Union[str, Path]] = None):
        if weights_path:
            self.weights_path = Path(weights_path)
        elif DEFAULT_WEIGHTS_PATH.exists():
            self.weights_path = DEFAULT_WEIGHTS_PATH
        else:
            self.weights_path = FALLBACK_WEIGHTS_PATH
        self.model: Any = None
        self.is_loaded: bool = False
        self.load_model()

    def load_model(self) -> bool:
        """
        Attempts to load YOLO weights if present and ultralytics is installed.
        Does not raise errors if weights are missing.
        """
        if not self.weights_path.exists():
            logger.info(
                f"[RoadSenseModelService] Model weights not found at: {self.weights_path}. "
                "Inference will run in standby mode returning placeholder detections."
            )
            self.model = None
            self.is_loaded = False
            return False

        try:
            from ultralytics import YOLO  # type: ignore
            logger.info(f"[RoadSenseModelService] Loading trained YOLO weights from: {self.weights_path}")
            self.model = YOLO(str(self.weights_path))
            self.is_loaded = True
            logger.info("[RoadSenseModelService] YOLO model loaded successfully.")
            return True
        except ImportError:
            logger.warning(
                "[RoadSenseModelService] 'ultralytics' package is not installed. "
                "Run 'pip install ultralytics' to enable YOLO inference."
            )
            self.model = None
            self.is_loaded = False
            return False
        except Exception as e:
            logger.error(f"[RoadSenseModelService] Failed to load YOLO model: {e}")
            self.model = None
            self.is_loaded = False
            return False

    def evaluate_condition(self, detections: List[Dict[str, Any]]) -> str:
        """
        Derives an overall road condition label from detected distresses.
        """
        if not detections:
            return "unknown"

        has_pothole = any(d.get("class_name") == "Pothole" for d in detections)
        has_crack = any(d.get("class_name") == "Crack" for d in detections)

        if has_pothole:
            return "severe" if len([d for d in detections if d.get("class_name") == "Pothole"]) > 1 else "damaged"
        if has_crack:
            return "damaged"
        return "good"

    def analyze_image(self, image_path: Union[str, Path], conf: float = 0.25) -> Dict[str, Any]:
        """
        Analyzes an image file for road damage (Pothole, Crack, Road_Patch).

        Returns:
            dict containing status, message, detections list, and road_condition.
        """
        path = Path(image_path)
        if not path.exists():
            return {
                "status": "error",
                "message": f"Image file not found: {image_path}",
                "detections": [],
                "road_condition": "unknown"
            }

        # Standby Mode: when trained weights are not yet integrated
        if not self.is_loaded or self.model is None:
            return {
                "status": "pending_trained_model",
                "message": (
                    "YOLO model weights (best_clean_303.pt) not yet deployed. "
                    "Empty detections returned until training is complete."
                ),
                "detections": [],
                "road_condition": "unknown"
            }

        # Real YOLO inference (active when best_clean_303.pt is loaded)
        try:
            results = self.model.predict(source=str(path), conf=conf, verbose=False)
            detections = []
            for r in results:
                boxes = r.boxes
                for box in boxes:
                    cls_id = int(box.cls[0].item())
                    confidence = float(box.conf[0].item())
                    # Format: [x1, y1, x2, y2]
                    coords = [round(float(c), 2) for c in box.xyxy[0].tolist()]
                    cls_name = CLASS_NAMES.get(cls_id, r.names.get(cls_id, f"class_{cls_id}"))

                    detections.append({
                        "class_id": cls_id,
                        "class_name": cls_name,
                        "confidence": round(confidence, 4),
                        "bbox": coords
                    })

            condition = self.evaluate_condition(detections)
            return {
                "status": "success",
                "message": f"Inference complete. {len(detections)} detection(s) found.",
                "detections": detections,
                "road_condition": condition
            }
        except Exception as e:
            logger.error(f"[RoadSenseModelService] Inference error: {e}")
            return {
                "status": "error",
                "message": f"Inference failed: {str(e)}",
                "detections": [],
                "road_condition": "unknown"
            }

    def analyze_frame(self, frame_bytes: bytes, conf: float = 0.25) -> Dict[str, Any]:
        """
        Analyzes a single raw image frame (used by live camera streaming).

        Returns:
            dict containing status, message, detections list, and road_condition.
        """
        if not self.is_loaded or self.model is None:
            return {
                "status": "pending_trained_model",
                "message": "Live inference standby: YOLO weights pending.",
                "detections": [],
                "road_condition": "unknown"
            }

        try:
            import io
            from PIL import Image
            img = Image.open(io.BytesIO(frame_bytes)).convert("RGB")
            
            results = self.model.predict(source=img, conf=conf, verbose=False)
            detections = []
            for r in results:
                for box in r.boxes:
                    cls_id = int(box.cls[0].item())
                    confidence = float(box.conf[0].item())
                    coords = [round(float(c), 2) for c in box.xyxy[0].tolist()]
                    cls_name = CLASS_NAMES.get(cls_id, r.names.get(cls_id, f"class_{cls_id}"))
                    detections.append({
                        "class_id": cls_id,
                        "class_name": cls_name,
                        "confidence": round(confidence, 4),
                        "bbox": coords
                    })

            condition = self.evaluate_condition(detections)
            return {
                "status": "success",
                "message": f"Frame analyzed. {len(detections)} detection(s) found.",
                "detections": detections,
                "road_condition": condition
            }
        except Exception as e:
            logger.error(f"[RoadSenseModelService] Frame inference error: {e}")
            return {
                "status": "error",
                "message": f"Frame inference failed: {str(e)}",
                "detections": [],
                "road_condition": "unknown"
            }


# Singleton service instance
model_service = RoadSenseModelService()
