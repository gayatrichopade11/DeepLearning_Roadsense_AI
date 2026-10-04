"""
RoadSense AI - Model Evaluation Pipeline (Test Split)
====================================================
Evaluates the trained YOLOv8 model on the isolated TEST split.
Generates test metrics, confusion matrix, and detection plots.
"""

import sys
from pathlib import Path
from PIL import Image

def main():
    print("=" * 70)
    print("RoadSense AI — Model Evaluation Engine (TEST Split)")
    print("=" * 70)

    # Paths
    project_root = Path(__file__).resolve().parent.parent
    model_path = project_root / "ml" / "models" / "best.pt"
    data_yaml = project_root / "ml" / "dataset" / "yolo_final" / "data.yaml"
    eval_project = project_root / "ml" / "runs" / "detect"
    eval_name = "test_evaluation"

    if not model_path.exists():
        fallback = project_root / "ml" / "runs" / "detect" / "road_condition_experiment" / "weights" / "best.pt"
        if fallback.exists():
            import shutil
            model_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(fallback, model_path)
            print(f"[INFO] Copied {fallback} to {model_path}")
        else:
            print(f"[ERROR] Model file not found: {model_path}")
            sys.exit(1)

    if not data_yaml.exists():
        print(f"[ERROR] Data config not found: {data_yaml}")
        sys.exit(1)

    print(f"Model Path       : {model_path} ({model_path.stat().st_size / 1024 / 1024:.2f} MB)")
    print(f"Data YAML Path   : {data_yaml}")
    print(f"Evaluation Split : test")
    print("-" * 70)

    # Test set counts
    test_img_dir = project_root / "ml" / "dataset" / "yolo_final" / "images" / "test"
    test_lbl_dir = project_root / "ml" / "dataset" / "yolo_final" / "labels" / "test"

    test_images = list(test_img_dir.glob("*"))
    test_image_count = len([f for f in test_images if f.is_file()])

    total_test_boxes = 0
    test_class_boxes = {0: 0, 1: 0, 2: 0}
    for lbl in test_lbl_dir.glob("*.txt"):
        lines = [line.strip().split() for line in lbl.read_text(encoding="utf-8").splitlines() if line.strip()]
        for parts in lines:
            c = int(parts[0])
            test_class_boxes[c] = test_class_boxes.get(c, 0) + 1
            total_test_boxes += 1

    print(f"Test image count        : {test_image_count}")
    print(f"Test bounding-box count : {total_test_boxes} (Asphalt: {test_class_boxes.get(0,0)}, Crack: {test_class_boxes.get(1,0)}, Pothole: {test_class_boxes.get(2,0)})")
    print("-" * 70)

    try:
        from ultralytics import YOLO
    except ImportError:
        print("[ERROR] ultralytics is not installed in current Python environment.")
        sys.exit(1)

    print("[INFO] Loading trained model weights...")
    model = YOLO(str(model_path))

    print("[INFO] Running evaluation on TEST split...")
    metrics = model.val(
        data=str(data_yaml),
        split="test",
        project=str(eval_project),
        name=eval_name,
        plots=True,
        exist_ok=True,
        verbose=True
    )

    print("=" * 70)
    print("TEST EVALUATION RESULTS SUMMARY")
    print("=" * 70)

    # Global box metrics
    p = metrics.box.mp
    r = metrics.box.mr
    map50 = metrics.box.map50
    map50_95 = metrics.box.map

    print(f"Overall Metrics (All Classes):")
    print(f"  Precision (P)   : {p:.4f} ({p*100:.1f}%)")
    print(f"  Recall (R)      : {r:.4f} ({r*100:.1f}%)")
    print(f"  mAP@50          : {map50:.4f} ({map50*100:.1f}%)")
    print(f"  mAP@50-95       : {map50_95:.4f} ({map50_95*100:.1f}%)")
    print("-" * 70)

    # Per-class metrics
    class_names = ["Asphalt", "Crack", "Pothole"]
    print("Per-Class Metrics:")
    for idx, name in enumerate(class_names):
        try:
            res = metrics.box.class_result(idx)
            # res: (p, r, map50, map50-95)
            cp, cr, cmap50, cmap50_95 = res
            print(f"  {name:10} (Class {idx}): P={cp:.4f}, R={cr:.4f}, mAP@50={cmap50:.4f}, mAP@50-95={cmap50_95:.4f}")
        except Exception as e:
            print(f"  {name:10} (Class {idx}): {e}")

    # Confusion matrix
    print("-" * 70)
    eval_dir = eval_project / eval_name
    print(f"Evaluation Artifacts Directory: {eval_dir}")
    if hasattr(metrics, "confusion_matrix") and metrics.confusion_matrix is not None:
        matrix = metrics.confusion_matrix.matrix
        print(f"Confusion Matrix Array (shape {matrix.shape}):")
        print(matrix)

    # Generated plots
    plots = list(eval_dir.glob("*.png")) + list(eval_dir.glob("*.jpg"))
    print(f"Generated Plot Files ({len(plots)} files):")
    for pl in sorted(plots):
        print(f"  {pl.name}")

    print("=" * 70)


if __name__ == "__main__":
    main()
