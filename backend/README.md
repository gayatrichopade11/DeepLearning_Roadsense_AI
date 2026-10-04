# RoadSense AI — Backend API Service

FastAPI-powered backend foundation for **AI-Based Road Condition Analysis and Damage Prediction Using Deep Learning**.

---

## 1. Overview & Architecture

The RoadSense AI backend provides RESTful endpoints for road distress analysis, live browser camera inspection, and survey video processing.

- **Target Classes**: `0: Asphalt`, `1: Crack`, `2: Pothole`
- **Model Weight Destination**: `ml/models/best.pt`
- **Inference Engine**: [Ultralytics YOLO](https://docs.ultralytics.com/) (plug-and-play architecture)

> [!NOTE]
> **Standby Mode Notice**:
> Until the YOLO model is trained and `ml/models/best.pt` is generated, the backend intentionally returns `detections: []` and `road_condition: "unknown"`.
> No fake or random bounding boxes are generated. Once `best.pt` is placed in `ml/models/`, the backend automatically begins live object detection with no architectural changes required.

---

## 2. Installation

1. Navigate to the project root:
   ```powershell
   cd d:\MDM_CIVIL_PROJECT
   ```

2. Install the backend dependencies:
   ```powershell
   pip install -r backend/requirements.txt
   ```

---

## 3. Starting the Server

Run Uvicorn with auto-reload enabled:

```powershell
uvicorn backend.main:app --reload --port 8000
```

Once started:
- **API Base URL**: `http://127.0.0.1:8000`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`
- **ReDoc Documentation**: `http://127.0.0.1:8000/redoc`

---

## 4. API Endpoints

| Method | Endpoint | Description | Request Body |
|---|---|---|---|
| `GET` | `/health` | Service health status | None |
| `POST` | `/api/analyze/image` | Upload & analyze road pavement image | `multipart/form-data` (`file`) |
| `POST` | `/api/analyze/video` | Upload road corridor inspection video | `multipart/form-data` (`file`) |
| `POST` | `/api/analyze/frame` | Process single live camera stream frame | `multipart/form-data` (`file`) |

---

## 5. Example Requests

### A. Health Check
```powershell
curl -X GET http://127.0.0.1:8000/health
```
**Response (200 OK):**
```json
{
  "status": "ok",
  "service": "RoadSense AI Backend"
}
```

### B. Analyze Road Image
```powershell
curl -X POST http://127.0.0.1:8000/api/analyze/image `
  -F "file=@public/images/pothole_sample.jpg"
```
**Response (200 OK - Standby Phase):**
```json
{
  "filename": "4b1a8f9c_pothole_sample.jpg",
  "status": "pending_trained_model",
  "message": "YOLO model weights (best.pt) not yet deployed. Empty detections returned until training is complete.",
  "image_url": "http://127.0.0.1:8000/uploads/4b1a8f9c_pothole_sample.jpg",
  "saved_path": "D:\\MDM_CIVIL_PROJECT\\backend\\uploads\\4b1a8f9c_pothole_sample.jpg",
  "detections": [],
  "road_condition": "unknown"
}
```

### C. Analyze Live Camera Frame
```powershell
curl -X POST http://127.0.0.1:8000/api/analyze/frame `
  -F "file=@public/images/crack_sample.jpg"
```
**Response (200 OK):**
```json
{
  "filename": "crack_sample.jpg",
  "status": "pending_trained_model",
  "message": "Live inference standby: YOLO weights pending.",
  "image_url": null,
  "saved_path": null,
  "detections": [],
  "road_condition": "unknown"
}
```

---

## 6. Plugging in the Trained Model

Once the YOLO model is trained:
1. Copy or export the trained weights to:
   ```text
   ml/models/best.pt
   ```
2. Restart the backend (or let `--reload` detect it).
3. The `RoadSenseModelService` will automatically detect `best.pt`, load Ultralytics YOLO, and output real bounding boxes:
   ```json
   "detections": [
     {
       "class_id": 2,
       "class_name": "Pothole",
       "confidence": 0.9472,
       "bbox": [124.5, 88.0, 310.2, 245.8]
     }
   ],
   "road_condition": "damaged"
   ```
