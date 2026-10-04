"""
RoadSense AI - Isolated Test Split Evaluation (Clean 3-Class Model)
===================================================================
Evaluates ml/models/best_clean_303.pt on ml/dataset/yolo_clean_303/data.yaml test split.
Outputs are saved strictly to ml/runs/detect/test_clean_303/.
Ensures existing datasets and models remain strictly untouched.
"""

import sys
import hashlib
from pathlib import Path

def get_file_hash(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while chunk := f.read(8192):
            h.update(chunk)
    return h.hexdigest()

def main():
    print("=" * 75)
    print("RoadSense AI — Clean 3-Class Isolated Test Evaluation")
    print("=" * 75)

    project_root = Path(__file__).resolve().parent.parent
    model_path = project_root / "ml" / "models" / "best_clean_303.pt"
    data_yaml = project_root / "ml" / "dataset" / "yolo_clean_303" / "data.yaml"
    baseline_model = project_root / "ml" / "models" / "best.pt"
    cand_model = project_root / "ml" / "models" / "best_303.pt"
    eval_project = project_root / "ml" / "runs" / "detect"
    eval_name = "test_clean_303"

    # Pre-run protected assets verification
    baseline_hash_before = get_file_hash(baseline_model) if baseline_model.exists() else None
    cand_hash_before = get_file_hash(cand_model) if cand_model.exists() else None
    clean_hash_before = get_file_hash(model_path) if model_path.exists() else None

    if not model_path.exists():
        print(f"[ERROR] Clean model not found: {model_path}")
        sys.exit(1)

    if not data_yaml.exists():
        print(f"[ERROR] Data YAML not found: {data_yaml}")
        sys.exit(1)

    model_size_mb = model_path.stat().st_size / (1024 * 1024)
    print(f"Model Path          : {model_path}")
    print(f"Model Size          : {model_size_mb:.2f} MB")
    print(f"Model SHA-256       : {clean_hash_before}")
    print(f"Data YAML           : {data_yaml}")
    print(f"Evaluation Split    : test")
    print(f"Output Directory    : {eval_project / eval_name}")
    print("-" * 75)

    # Test split inspection
    test_img_dir = project_root / "ml" / "dataset" / "yolo_clean_303" / "images" / "test"
    test_lbl_dir = project_root / "ml" / "dataset" / "yolo_clean_303" / "labels" / "test"

    test_imgs = sorted([f for f in test_img_dir.iterdir() if f.is_file()])
    test_lbls = sorted([f for f in test_lbl_dir.iterdir() if f.is_file()])

    print(f"Test Images Found   : {len(test_imgs)}")
    print(f"Test Labels Found   : {len(test_lbls)}")

    class_names = {0: "Pothole", 1: "Crack", 2: "Road_Patch"}
    class_box_counts = {0: 0, 1: 0, 2: 0}
    total_boxes = 0

    for lbl in test_lbls:
        lines = [line.strip().split() for line in lbl.read_text(encoding="utf-8").splitlines() if line.strip()]
        for parts in lines:
            c = int(parts[0])
            class_box_counts[c] = class_box_counts.get(c, 0) + 1
            total_boxes += 1

    print(f"Ground Truth Boxes  : {total_boxes}")
    for cid in sorted(class_names.keys()):
        print(f"  - Class {cid} ({class_names[cid]}): {class_box_counts.get(cid, 0)} boxes")
    print("-" * 75)

    # Load YOLO
    try:
        from ultralytics import YOLO
    except ImportError as e:
        print(f"[ERROR] Failed to import ultralytics: {e}")
        sys.exit(1)

    print("[INFO] Loading clean YOLO model...")
    model = YOLO(str(model_path))

    warnings_encountered = []
    errors_encountered = []

    print("[INFO] Running evaluation on TEST split...")
    try:
        metrics = model.val(
            data=str(data_yaml),
            split="test",
            project=str(eval_project),
            name=eval_name,
            plots=True,
            exist_ok=True,
            verbose=True,
            save_json=False
        )
    except Exception as e:
        errors_encountered.append(str(e))
        print(f"[ERROR] Evaluation encountered an exception: {e}")
        sys.exit(1)

    print("=" * 75)
    print("TEST EVALUATION EXECUTION COMPLETE")
    print("=" * 75)

    # Post-run baseline and model verification
    if baseline_model.exists():
        baseline_hash_after = get_file_hash(baseline_model)
        if baseline_hash_before == baseline_hash_after:
            print("[VERIFY] Baseline best.pt is STRICTLY UNCHANGED.")
        else:
            print("[CRITICAL ERROR] Baseline best.pt WAS MODIFIED!")
            errors_encountered.append("Baseline best.pt hash mismatch")

    if cand_model.exists():
        cand_hash_after = get_file_hash(cand_model)
        if cand_hash_before == cand_hash_after:
            print("[VERIFY] Candidate best_303.pt is STRICTLY UNCHANGED.")
        else:
            print("[CRITICAL ERROR] Candidate best_303.pt WAS MODIFIED!")
            errors_encountered.append("Candidate best_303.pt hash mismatch")

    clean_hash_after = get_file_hash(model_path)
    if clean_hash_before == clean_hash_after:
        print("[VERIFY] Clean best_clean_303.pt is STRICTLY UNCHANGED.")
    else:
        print("[CRITICAL ERROR] Clean best_clean_303.pt WAS MODIFIED!")
        errors_encountered.append("Clean best_clean_303.pt hash mismatch")

    # Extract metrics
    p_all = metrics.box.mp
    r_all = metrics.box.mr
    map50_all = metrics.box.map50
    map50_95_all = metrics.box.map

    print("\n" + "=" * 75)
    print("DETECTION METRICS (OVERALL)")
    print("=" * 75)
    print(f"Overall Precision (P)    : {p_all:.4f} ({p_all*100:.2f}%)")
    print(f"Overall Recall (R)       : {r_all:.4f} ({r_all*100:.2f}%)")
    print(f"Overall mAP@50           : {map50_all:.4f} ({map50_all*100:.2f}%)")
    print(f"Overall mAP@50-95        : {map50_95_all:.4f} ({map50_95_all*100:.2f}%)")
    print("-" * 75)

    print("\n" + "=" * 75)
    print("PER-CLASS METRICS")
    print("=" * 75)
    per_class_results = {}
    for idx, cname in class_names.items():
        try:
            res = metrics.box.class_result(idx)
            # res format: (p, r, map50, map50-95)
            cp, cr, cmap50, cmap50_95 = res
            per_class_results[cname] = {
                "P": cp,
                "R": cr,
                "mAP50": cmap50,
                "mAP50-95": cmap50_95,
                "gt_boxes": class_box_counts.get(idx, 0)
            }
            print(f"  {cname:10} (ID {idx}) [GT: {class_box_counts.get(idx, 0):2d}]: "
                  f"P = {cp:.4f} ({cp*100:5.2f}%), "
                  f"R = {cr:.4f} ({cr*100:5.2f}%), "
                  f"mAP@50 = {cmap50:.4f} ({cmap50*100:5.2f}%), "
                  f"mAP@50-95 = {cmap50_95:.4f} ({cmap50_95*100:5.2f}%)")
        except Exception as ex:
            warnings_encountered.append(f"Per-class extraction for {cname} failed: {ex}")
            print(f"  {cname:10} (ID {idx}): Error extracting metrics ({ex})")

    # Speed metrics
    if hasattr(metrics, "speed") and metrics.speed:
        print("\nInference Speed (per image):")
        for stage, duration in metrics.speed.items():
            print(f"  {stage:12}: {duration:.2f} ms")

    # Confusion Matrix
    if hasattr(metrics, "confusion_matrix") and metrics.confusion_matrix is not None:
        try:
            cm = metrics.confusion_matrix.matrix
            print("\nConfusion Matrix (Rows=True, Cols=Predicted):")
            print("Matrix order: [Pothole, Crack, Road_Patch, background]")
            print(cm)
        except Exception as ex:
            warnings_encountered.append(f"Confusion matrix error: {ex}")

    # Output directory verification
    eval_dir = eval_project / eval_name
    print("\n" + "=" * 75)
    print(f"OUTPUT ARTIFACTS IN: {eval_dir}")
    print("=" * 75)
    if eval_dir.exists():
        saved_files = sorted(list(eval_dir.iterdir()))
        print(f"Total files generated: {len(saved_files)}")
        for f in saved_files:
            size_kb = f.stat().st_size / 1024
            print(f"  - {f.name:30} ({size_kb:7.2f} KB)")
    else:
        errors_encountered.append(f"Evaluation directory {eval_dir} does not exist!")

    print("\n" + "=" * 75)
    print("DIAGNOSTICS & WARNINGS SUMMARY")
    print("=" * 75)
    if not errors_encountered and not warnings_encountered:
        print("[STATUS] No errors or warnings encountered. All processes completed cleanly.")
    else:
        if warnings_encountered:
            print(f"Warnings ({len(warnings_encountered)}):")
            for w in warnings_encountered:
                print(f"  - [WARN] {w}")
        if errors_encountered:
            print(f"Errors ({len(errors_encountered)}):")
            for e in errors_encountered:
                print(f"  - [ERROR] {e}")

    print("=" * 75)

if __name__ == "__main__":
    main()
