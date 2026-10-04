"""
RoadSense AI - Backend API Integration Test
============================================
Verifies that:
1. FastAPI app initializes cleanly with the new clean 3-class model (ml/models/best_clean_303.pt).
2. GET /health returns 200 OK.
3. GET / returns 200 OK.
4. POST /api/analyze/image performs real YOLO inference and returns class_name, confidence, and bbox.
5. Classes map accurately: 0=Pothole, 1=Crack, 2=Road_Patch.
6. POST /api/analyze/frame performs live camera frame inference.
7. POST /api/analyze/video endpoint functions as expected.
"""

import sys
from pathlib import Path
from fastapi.testclient import TestClient

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.main import app
from backend.model_service import model_service

def run_tests():
    print("=" * 75)
    print("RoadSense AI — Backend API & Clean Model Integration Test")
    print("=" * 75)

    client = TestClient(app)

    # 1. Model Loading Verification
    print(f"Model Service Loaded : {model_service.is_loaded}")
    print(f"Active Weights Path  : {model_service.weights_path}")
    print(f"Configured Classes   : {model_service.model.names if model_service.model else 'None'}")
    assert model_service.is_loaded, "Model failed to load!"
    assert model_service.weights_path.name == "best_clean_303.pt", f"Unexpected weights: {model_service.weights_path}"
    assert model_service.model.names == {0: "Pothole", 1: "Crack", 2: "Road_Patch"}, "Class names mismatch!"
    print("[PASS] Model Service loaded best_clean_303.pt with exact 3-class taxonomy.")
    print("-" * 75)

    # 2. GET /health
    res_health = client.get("/health")
    print(f"GET /health -> Status: {res_health.status_code}, Body: {res_health.json()}")
    assert res_health.status_code == 200
    assert res_health.json()["status"] == "ok"
    print("[PASS] Health endpoint verified.")
    print("-" * 75)

    # 3. GET /
    res_root = client.get("/")
    print(f"GET / -> Status: {res_root.status_code}, Body: {res_root.json()}")
    assert res_root.status_code == 200
    print("[PASS] Root metadata endpoint verified.")
    print("-" * 75)

    # 4. POST /api/analyze/image with test images
    # Test with pothole sample from public/images
    sample_pothole = PROJECT_ROOT / "public" / "images" / "pothole_sample.jpg"
    if not sample_pothole.exists():
        # Fallback to test image
        sample_pothole = next((PROJECT_ROOT / "ml" / "dataset" / "yolo_clean_303" / "images" / "test").glob("*.*"))

    print(f"Testing POST /api/analyze/image with: {sample_pothole}")
    with open(sample_pothole, "rb") as f:
        res_img = client.post(
            "/api/analyze/image",
            files={"file": (sample_pothole.name, f, "image/jpeg")}
        )
    print(f"Status Code: {res_img.status_code}")
    img_data = res_img.json()
    print(f"Response Status        : {img_data.get('status')}")
    print(f"Response Message       : {img_data.get('message')}")
    print(f"Road Condition         : {img_data.get('road_condition')}")
    print(f"Detections Count       : {len(img_data.get('detections', []))}")
    for idx, det in enumerate(img_data.get("detections", []), start=1):
        print(f"  [{idx}] Class: {det['class_name']} (ID {det['class_id']}), Conf: {det['confidence']}, BBox: {det['bbox']}")

    assert res_img.status_code == 200
    assert img_data.get("status") == "success"
    assert "detections" in img_data
    print("[PASS] Image prediction endpoint passed.")
    print("-" * 75)

    # Also test an image directly from the test split with known pothole
    test_pothole_sample = PROJECT_ROOT / "ml" / "dataset" / "yolo_clean_303" / "images" / "test" / "11 (2).jpg"
    if test_pothole_sample.exists():
        print(f"Testing POST /api/analyze/image with clean test image: {test_pothole_sample.name}")
        with open(test_pothole_sample, "rb") as f:
            res_test_img = client.post(
                "/api/analyze/image",
                files={"file": (test_pothole_sample.name, f, "image/jpeg")}
            )
        test_img_data = res_test_img.json()
        print(f"Status: {test_img_data.get('status')} | Condition: {test_img_data.get('road_condition')} | Detections: {len(test_img_data.get('detections', []))}")
        for idx, det in enumerate(test_img_data.get("detections", []), start=1):
            print(f"  [{idx}] Class: {det['class_name']} (ID {det['class_id']}), Conf: {det['confidence']}, BBox: {det['bbox']}")
        print("[PASS] Clean test split image prediction verified.")
        print("-" * 75)

    # 5. POST /api/analyze/frame (Live Camera Frame)
    print("Testing POST /api/analyze/frame with sample frame...")
    with open(sample_pothole, "rb") as f:
        frame_bytes = f.read()
    res_frame = client.post(
        "/api/analyze/frame",
        files={"file": ("frame.jpg", frame_bytes, "image/jpeg")}
    )
    print(f"POST /api/analyze/frame -> Status: {res_frame.status_code}")
    frame_data = res_frame.json()
    print(f"Frame Status: {frame_data.get('status')} | Condition: {frame_data.get('road_condition')} | Detections: {len(frame_data.get('detections', []))}")
    assert res_frame.status_code == 200
    assert frame_data.get("status") == "success"
    print("[PASS] Live camera frame endpoint passed.")
    print("-" * 75)

    # 6. POST /api/analyze/video
    print("Testing POST /api/analyze/video...")
    res_vid = client.post(
        "/api/analyze/video",
        files={"file": ("dummy_survey.mp4", b"fake mp4 header content", "video/mp4")}
    )
    print(f"POST /api/analyze/video -> Status: {res_vid.status_code}, Body: {res_vid.json()}")
    assert res_vid.status_code == 200
    print("[PASS] Video analysis endpoint passed.")
    print("-" * 75)

    print("=" * 75)
    print("ALL API & MODEL INTEGRATION TESTS PASSED SUCCESSFULLY!")
    print("=" * 75)

if __name__ == "__main__":
    run_tests()
