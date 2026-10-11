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


DEFAULT_CLASS_THRESHOLDS = {
    0: 0.20,  # Pothole: 20% preserves current working pothole detection
    1: 0.08,  # Crack: calibrated for subtle crack defects
    2: 0.10,  # Road_Patch: calibrated for asphalt patches
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

    def resolve_class_name(self, cls_id: int, model_names: Optional[Dict[int, str]] = None) -> str:
        """
        Dynamically resolves and canonicalizes class names from model output,
        safely mapping aliases (e.g. 'asphalt' -> 'Road_Patch') and casing.
        """
        raw_name = ""
        if model_names and cls_id in model_names:
            raw_name = str(model_names[cls_id]).strip()
        elif self.model and hasattr(self.model, "names") and cls_id in self.model.names:
            raw_name = str(self.model.names[cls_id]).strip()
        elif cls_id in CLASS_NAMES:
            raw_name = CLASS_NAMES[cls_id]
        else:
            raw_name = f"class_{cls_id}"

        # Canonicalize aliases
        lower = raw_name.lower().replace("-", "_").replace(" ", "_")
        if lower in ["pothole", "potholes"]:
            return "Pothole"
        elif lower in ["crack", "cracks"]:
            return "Crack"
        elif lower in ["road_patch", "roadpatch", "asphalt", "patch", "patches"]:
            return "Road_Patch"
        return raw_name

    def resolve_effective_thresholds(
        self,
        conf: Optional[float] = None,
        class_thresholds: Optional[Dict[Union[int, str], float]] = None,
    ) -> Dict[int, float]:
        """
        Calculates consistent per-class thresholds.
        Ensures global confidence and class-specific overrides remain synchronized
        without multi-stage truncation.
        """
        base_conf = float(conf) if conf is not None else 0.20

        # Start with default calibrated thresholds
        effective: Dict[int, float] = {cid: default_t for cid, default_t in DEFAULT_CLASS_THRESHOLDS.items()}

        # If a global conf was explicitly specified and no class overrides are provided,
        # use base_conf uniformly
        if conf is not None and not class_thresholds:
            for cid in effective:
                effective[cid] = base_conf

        # Apply specific class overrides if provided
        if class_thresholds:
            for k, val in class_thresholds.items():
                if val is None:
                    continue
                v = float(val)
                if isinstance(k, int) and k in CLASS_NAMES:
                    effective[k] = v
                elif isinstance(k, str):
                    canonical = self.resolve_class_name(-1, {-1: k})
                    for cid, cname in CLASS_NAMES.items():
                        if cname.lower() == canonical.lower() or cname.lower() == k.lower():
                            effective[cid] = v

        return effective

    def evaluate_condition(self, detections: List[Dict[str, Any]], confirmed_conf_threshold: float = 0.15) -> str:
        """
        Derives an overall road condition label from detected distresses.
        Does not automatically classify low-confidence proposals (< 0.15) as real structural damage.
        """
        if not detections:
            return "good"

        # Detections meeting the confirmed confidence threshold
        confirmed_detections = [d for d in detections if d.get("confidence", 0) >= confirmed_conf_threshold]

        if not confirmed_detections:
            # All detections are tentative / low-confidence (< 15%).
            # Flag as 'monitored' for inspection rather than confirmed active structural damage.
            return "monitored"

        has_pothole = any((d.get("class_name") or "").lower() == "pothole" for d in confirmed_detections)
        has_crack = any((d.get("class_name") or "").lower() == "crack" for d in confirmed_detections)

        if has_pothole:
            pothole_count = sum(1 for d in confirmed_detections if (d.get("class_name") or "").lower() == "pothole")
            return "severe" if pothole_count > 1 else "damaged"
        if has_crack:
            return "damaged"
        return "good"

    def analyze_image(
        self,
        image_path: Union[str, Path],
        conf: Optional[float] = 0.20,
        class_thresholds: Optional[Dict[Union[int, str], float]] = None,
    ) -> Dict[str, Any]:
        """
        Analyzes an image file for road damage (Pothole, Crack, Road_Patch)
        with consistent per-class confidence thresholds.

        Returns:
            dict containing status, message, detections list, road_condition, and effective_thresholds.
        """
        path = Path(image_path)
        if not path.exists():
            return {
                "status": "error",
                "message": f"Image file not found: {image_path}",
                "detections": [],
                "road_condition": "unknown",
                "effective_thresholds": {}
            }

        effective_threshs = self.resolve_effective_thresholds(conf=conf, class_thresholds=class_thresholds)
        thresh_dict = {CLASS_NAMES[c]: round(effective_threshs[c], 3) for c in effective_threshs}

        # Standby Mode: when trained weights are not yet integrated
        if not self.is_loaded or self.model is None:
            return {
                "status": "pending_trained_model",
                "message": (
                    "YOLO model weights (best_clean_303.pt) not yet deployed. "
                    "Empty detections returned until training is complete."
                ),
                "detections": [],
                "road_condition": "unknown",
                "effective_thresholds": thresh_dict
            }

        # Real YOLO inference (active when best_clean_303.pt is loaded)
        try:
            # Predict at the minimum threshold across classes so YOLO does not prematurely drop valid proposals
            min_conf = min(effective_threshs.values())
            results = self.model.predict(source=str(path), conf=min_conf, verbose=False)
            detections = []
            for r in results:
                boxes = r.boxes
                for box in boxes:
                    cls_id = int(box.cls[0].item())
                    confidence = float(box.conf[0].item())

                    # Check against class-specific threshold
                    cls_target_thresh = effective_threshs.get(cls_id, min_conf)
                    if confidence < cls_target_thresh:
                        continue

                    coords = [round(float(c), 2) for c in box.xyxy[0].tolist()]
                    cls_name = self.resolve_class_name(cls_id, getattr(r, "names", None))

                    is_low_conf = confidence < 0.15
                    tier = "confirmed" if confidence >= 0.20 else ("moderate" if confidence >= 0.15 else "tentative")

                    detections.append({
                        "class_id": cls_id,
                        "class_name": cls_name,
                        "confidence": round(confidence, 4),
                        "bbox": coords,
                        "is_low_confidence": is_low_conf,
                        "confidence_tier": tier,
                    })

            condition = self.evaluate_condition(detections, confirmed_conf_threshold=0.15)
            return {
                "status": "success",
                "message": f"Inference complete. {len(detections)} detection(s) found.",
                "detections": detections,
                "road_condition": condition,
                "effective_thresholds": thresh_dict
            }
        except Exception as e:
            logger.error(f"[RoadSenseModelService] Inference error: {e}")
            return {
                "status": "error",
                "message": f"Inference failed: {str(e)}",
                "detections": [],
                "road_condition": "unknown",
                "effective_thresholds": thresh_dict
            }

    def analyze_frame(
        self,
        frame_bytes: bytes,
        conf: Optional[float] = 0.20,
        class_thresholds: Optional[Dict[Union[int, str], float]] = None,
    ) -> Dict[str, Any]:
        """
        Analyzes a single raw image frame (used by live camera streaming).

        Returns:
            dict containing status, message, detections list, road_condition, and effective_thresholds.
        """
        effective_threshs = self.resolve_effective_thresholds(conf=conf, class_thresholds=class_thresholds)
        thresh_dict = {CLASS_NAMES[c]: round(effective_threshs[c], 3) for c in effective_threshs}

        if not self.is_loaded or self.model is None:
            return {
                "status": "pending_trained_model",
                "message": "Live inference standby: YOLO weights pending.",
                "detections": [],
                "road_condition": "unknown",
                "effective_thresholds": thresh_dict
            }

        try:
            import io
            from PIL import Image
            img = Image.open(io.BytesIO(frame_bytes)).convert("RGB")

            min_conf = min(effective_threshs.values())
            results = self.model.predict(source=img, conf=min_conf, verbose=False)
            detections = []
            for r in results:
                for box in r.boxes:
                    cls_id = int(box.cls[0].item())
                    confidence = float(box.conf[0].item())

                    cls_target_thresh = effective_threshs.get(cls_id, min_conf)
                    if confidence < cls_target_thresh:
                        continue

                    coords = [round(float(c), 2) for c in box.xyxy[0].tolist()]
                    cls_name = self.resolve_class_name(cls_id, getattr(r, "names", None))

                    is_low_conf = confidence < 0.15
                    tier = "confirmed" if confidence >= 0.20 else ("moderate" if confidence >= 0.15 else "tentative")

                    detections.append({
                        "class_id": cls_id,
                        "class_name": cls_name,
                        "confidence": round(confidence, 4),
                        "bbox": coords,
                        "is_low_confidence": is_low_conf,
                        "confidence_tier": tier,
                    })

            condition = self.evaluate_condition(detections, confirmed_conf_threshold=0.15)
            return {
                "status": "success",
                "message": f"Frame analyzed. {len(detections)} detection(s) found.",
                "detections": detections,
                "road_condition": condition,
                "effective_thresholds": thresh_dict
            }
        except Exception as e:
            logger.error(f"[RoadSenseModelService] Frame inference error: {e}")
            return {
                "status": "error",
                "message": f"Frame inference failed: {str(e)}",
                "detections": [],
                "road_condition": "unknown",
                "effective_thresholds": thresh_dict
            }


# Singleton service instance
model_service = RoadSenseModelService()
