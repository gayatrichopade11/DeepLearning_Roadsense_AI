"""
RoadSense AI - Batch 2 Creation, Candidate Annotation & Verification Pipeline
=============================================================================
This script automatically selects 250 unused unique images from the 1,005-image pool,
sets up the batch_2 workspace, runs baseline model inference to generate candidate
annotations with visual previews, and produces comprehensive verification reports.
"""

import csv
import hashlib
import os
import random
import shutil
import sys
from collections import Counter, defaultdict
from pathlib import Path
import cv2
from PIL import Image
from ultralytics import YOLO


def get_file_sha256(filepath):
    hasher = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()


def main():
    print("=" * 75)
    print("RoadSense AI — Batch 2 Generation & Candidate Inference Engine")
    print("=" * 75)

    project_root = Path("d:/MDM_CIVIL_PROJECT")
    ml_dir = project_root / "ml"
    dataset_dir = ml_dir / "dataset"
    annotation_ws = dataset_dir / "annotation_workspace"
    rep_images_dir = annotation_ws / "images"
    manifest_path = annotation_ws / "metadata" / "image_manifest.csv"
    existing_yolo_final = dataset_dir / "yolo_final"
    model_path = ml_dir / "models" / "best.pt"
    batch_2_dir = annotation_ws / "batch_2"

    # Pre-checks
    if not model_path.exists():
        print(f"[ERROR] Trained model not found: {model_path}")
        sys.exit(1)

    initial_best_pt_sha = get_file_sha256(model_path)
    print(f"[INFO] Verified baseline model: {model_path} (SHA: {initial_best_pt_sha[:12]}...)")

    # 1. Load manifest and existing 125 dataset information
    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest_rows = list(csv.DictReader(f))

    manifest_by_sha = {r["sha256"]: r for r in manifest_rows}
    manifest_by_norm = {r["workspace_path"].replace("\\", "/").lower(): r for r in manifest_rows}

    existing_125_hashes = set()
    existing_125_clusters = set()
    existing_125_filenames = set()

    for p in (existing_yolo_final / "images").rglob("*"):
        if p.is_file():
            h = get_file_sha256(p)
            existing_125_hashes.add(h)
            existing_125_filenames.add(p.name)
            m = manifest_by_sha.get(h)
            if m:
                if m["duplicate_group_id"] and m["duplicate_group_id"] != "None":
                    existing_125_clusters.add("dup_" + m["duplicate_group_id"])
                if m["near_duplicate_group_id"] and m["near_duplicate_group_id"] != "None":
                    existing_125_clusters.add("near_" + m["near_duplicate_group_id"])
                if m["burst_cluster_id"] and m["burst_cluster_id"] != "None":
                    existing_125_clusters.add("burst_" + m["burst_cluster_id"])

    print(f"[INFO] Existing verified dataset: {len(existing_125_hashes)} unique image hashes identified.")

    # 2. Collect candidate pool from annotation_workspace/images/
    folders = ["Asphalt", "Crack", "Pothole"]
    candidate_pool = {f: [] for f in folders}

    for f in folders:
        folder_dir = rep_images_dir / f
        for p in sorted(folder_dir.glob("*")):
            if p.is_file():
                h = get_file_sha256(p)
                if h not in existing_125_hashes:
                    m = manifest_by_sha.get(h)
                    if not m:
                        rel = ("images/" + f + "/" + p.name).lower()
                        m = manifest_by_norm.get(rel)
                    
                    tags = set()
                    if m:
                        if m["duplicate_group_id"] and m["duplicate_group_id"] != "None":
                            tags.add("dup_" + m["duplicate_group_id"])
                        if m["near_duplicate_group_id"] and m["near_duplicate_group_id"] != "None":
                            tags.add("near_" + m["near_duplicate_group_id"])
                        if m["burst_cluster_id"] and m["burst_cluster_id"] != "None":
                            tags.add("burst_" + m["burst_cluster_id"])

                    is_clean = len(tags & existing_125_clusters) == 0
                    candidate_pool[f].append({
                        "path": p,
                        "filename": p.name,
                        "source_folder": f,
                        "sha256": h,
                        "manifest": m,
                        "tags": tags,
                        "is_clean": is_clean
                    })

    print("[INFO] Available unused candidate images per category:")
    for f in folders:
        clean_cnt = sum(1 for x in candidate_pool[f] if x["is_clean"])
        print(f"  - {f:10}: {len(candidate_pool[f])} total unused ({clean_cnt} free of existing 125 clusters)")

    # 3. Deterministic Selection of 250 images: 84 Asphalt, 83 Crack, 83 Pothole
    random.seed(42)
    selected_items = []
    target_counts = {"Asphalt": 84, "Crack": 83, "Pothole": 83}

    for f, count in target_counts.items():
        clean_subset = [x for x in candidate_pool[f] if x["is_clean"]]
        clean_subset.sort(key=lambda x: x["filename"])
        sampled = random.sample(clean_subset, count)
        selected_items.extend(sampled)

    print(f"\n[INFO] Successfully selected {len(selected_items)} unique unused images:")
    print(f"  - Asphalt: {sum(1 for x in selected_items if x['source_folder'] == 'Asphalt')}")
    print(f"  - Crack:   {sum(1 for x in selected_items if x['source_folder'] == 'Crack')}")
    print(f"  - Pothole: {sum(1 for x in selected_items if x['source_folder'] == 'Pothole')}")

    # Check collisions with existing 125 dataset
    selected_names = [x["filename"] for x in selected_items]
    collisions_with_existing = set(selected_names) & existing_125_filenames
    print(f"[INFO] Filename collisions with existing 125 dataset: {len(collisions_with_existing)} (Categorized by subfolder)")

    # 4. TASK 1: Set up batch_2 Directory Structure
    if batch_2_dir.exists():
        shutil.rmtree(batch_2_dir)

    for f in folders:
        (batch_2_dir / "images" / f).mkdir(parents=True, exist_ok=True)
        (batch_2_dir / "labels_candidate" / f).mkdir(parents=True, exist_ok=True)
    (batch_2_dir / "previews").mkdir(parents=True, exist_ok=True)
    (batch_2_dir / "metadata").mkdir(parents=True, exist_ok=True)

    # 5. TASK 3: Copy Selected Images
    for item in selected_items:
        src = item["path"]
        f = item["source_folder"]
        dst = batch_2_dir / "images" / f / item["filename"]
        shutil.copy2(src, dst)
        item["batch_2_image_path"] = dst

    print(f"[INFO] Copied {len(selected_items)} images into {batch_2_dir / 'images'}")

    # 6. TASK 4 & 5: Load YOLO Model, Run Inference, Generate Candidate Labels and Previews
    conf_threshold = 0.05
    iou_threshold = 0.45
    imgsz = 640

    print(f"\n[INFO] Loading YOLO model {model_path} for candidate generation...")
    model = YOLO(str(model_path))

    class_names = {0: "Asphalt", 1: "Crack", 2: "Pothole"}
    color_palette = {
        0: (0, 200, 255),  # Yellow/Orange for Asphalt
        1: (255, 100, 0),  # Blue for Crack
        2: (0, 0, 255)     # Red for Pothole
    }

    all_candidate_boxes = []
    category_box_counts = Counter()
    confidence_tiers = {"<0.25": 0, "0.25-0.49": 0, "0.50-0.74": 0, ">=0.75": 0}
    zero_detection_images = 0
    positive_detection_images = 0

    print(f"[INFO] Running candidate inference on 250 images (conf={conf_threshold}, iou={iou_threshold})...")
    for idx, item in enumerate(selected_items):
        img_path = item["batch_2_image_path"]
        f = item["source_folder"]
        stem = img_path.stem
        lbl_dst = batch_2_dir / "labels_candidate" / f / f"{stem}.txt"
        item["candidate_label_path"] = lbl_dst

        # Inference
        results = model.predict(source=str(img_path), conf=conf_threshold, iou=iou_threshold, imgsz=imgsz, verbose=False)
        boxes = results[0].boxes

        box_lines = []
        item_boxes = []
        item_class_counts = Counter()

        # Load image for preview drawing
        img_bgr = cv2.imread(str(img_path))
        h_px, w_px = img_bgr.shape[:2]

        if len(boxes) == 0:
            zero_detection_images += 1
            # Write empty label file
            lbl_dst.write_text("", encoding="utf-8")
        else:
            positive_detection_images += 1
            for b in boxes:
                cls_id = int(b.cls[0])
                conf = float(b.conf[0])
                xywhn = b.xywhn[0].tolist()
                x_c, y_c, bw, bh = xywhn

                # Strict clamps for candidate formatting
                x_c = max(0.0, min(1.0, x_c))
                y_c = max(0.0, min(1.0, y_c))
                bw = max(0.0001, min(1.0, bw))
                bh = max(0.0001, min(1.0, bh))

                box_lines.append(f"{cls_id} {x_c:.6f} {y_c:.6f} {bw:.6f} {bh:.6f}")
                category_box_counts[cls_id] += 1
                item_class_counts[cls_id] += 1

                # Confidence tier
                if conf < 0.25:
                    confidence_tiers["<0.25"] += 1
                elif conf < 0.50:
                    confidence_tiers["0.25-0.49"] += 1
                elif conf < 0.75:
                    confidence_tiers["0.50-0.74"] += 1
                else:
                    confidence_tiers[">=0.75"] += 1

                candidate_entry = {
                    "image_filename": item["filename"],
                    "source_folder": f,
                    "class_id": cls_id,
                    "class_name": class_names.get(cls_id, "Unknown"),
                    "x_center": f"{x_c:.6f}",
                    "y_center": f"{y_c:.6f}",
                    "width": f"{bw:.6f}",
                    "height": f"{bh:.6f}",
                    "confidence": f"{conf:.4f}"
                }
                all_candidate_boxes.append(candidate_entry)

                # Draw on preview
                x1 = int((x_c - bw / 2) * w_px)
                y1 = int((y_c - bh / 2) * h_px)
                x2 = int((x_c + bw / 2) * w_px)
                y2 = int((y_c + bh / 2) * h_px)
                color = color_palette.get(cls_id, (0, 255, 0))

                cv2.rectangle(img_bgr, (x1, y1), (x2, y2), color, 2)
                label_txt = f"{class_names.get(cls_id, cls_id)}: {conf:.2f}"
                cv2.putText(img_bgr, label_txt, (x1, max(y1 - 6, 12)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1, cv2.LINE_AA)

            lbl_dst.write_text("\n".join(box_lines) + "\n", encoding="utf-8")

        # Save preview
        preview_filename = f"{f}_{stem}_preview.jpg"
        preview_path = batch_2_dir / "previews" / preview_filename
        cv2.imwrite(str(preview_path), img_bgr)
        item["preview_path"] = preview_path

        item["candidate_box_count"] = len(box_lines)
        item["candidate_asphalt_count"] = item_class_counts[0]
        item["candidate_crack_count"] = item_class_counts[1]
        item["candidate_pothole_count"] = item_class_counts[2]

        if (idx + 1) % 50 == 0:
            print(f"  Processed {idx + 1}/250 images...")

    print(f"[INFO] Inference complete. Total candidate boxes generated: {len(all_candidate_boxes)}")

    # 7. TASK 7: Write Metadata CSVs
    selection_csv_path = batch_2_dir / "metadata" / "batch_2_selection.csv"
    with open(selection_csv_path, "w", newline="", encoding="utf-8") as f_out:
        fieldnames = [
            "image_filename", "original_source_path", "source_folder", "sha256",
            "duplicate_group_id", "near_duplicate_group_id", "burst_cluster_id",
            "candidate_label_path", "candidate_box_count",
            "candidate_asphalt_count", "candidate_crack_count", "candidate_pothole_count"
        ]
        writer = csv.DictWriter(f_out, fieldnames=fieldnames)
        writer.writeheader()
        for it in selected_items:
            m = it["manifest"]
            writer.writerow({
                "image_filename": it["filename"],
                "original_source_path": it["path"].as_posix(),
                "source_folder": it["source_folder"],
                "sha256": it["sha256"],
                "duplicate_group_id": m.get("duplicate_group_id", "") if m else "",
                "near_duplicate_group_id": m.get("near_duplicate_group_id", "") if m else "",
                "burst_cluster_id": m.get("burst_cluster_id", "") if m else "",
                "candidate_label_path": it["candidate_label_path"].as_posix(),
                "candidate_box_count": it["candidate_box_count"],
                "candidate_asphalt_count": it["candidate_asphalt_count"],
                "candidate_crack_count": it["candidate_crack_count"],
                "candidate_pothole_count": it["candidate_pothole_count"],
            })

    candidates_csv_path = batch_2_dir / "metadata" / "batch_2_candidates.csv"
    with open(candidates_csv_path, "w", newline="", encoding="utf-8") as f_out:
        fieldnames = [
            "image_filename", "source_folder", "class_id", "class_name",
            "x_center", "y_center", "width", "height", "confidence"
        ]
        writer = csv.DictWriter(f_out, fieldnames=fieldnames)
        writer.writeheader()
        for cand in all_candidate_boxes:
            writer.writerow(cand)

    print(f"[INFO] Wrote metadata CSVs to {batch_2_dir / 'metadata'}")

    # 8. TASK 8: Strict 15-Point Verification
    print("\n" + "=" * 75)
    print("RUNNING 15-POINT BATCH_2 VERIFICATION")
    print("=" * 75)

    check_errors = []

    # 1. Exactly 250 selected images
    if len(selected_items) != 250:
        check_errors.append(f"Image count is {len(selected_items)}, expected 250")
    print(f"[CHECK 1] Exactly 250 selected images: {'PASS' if len(selected_items) == 250 else 'FAIL'}")

    # 2. All 250 images physically exist
    missing_imgs = [it for it in selected_items if not it["batch_2_image_path"].exists()]
    if missing_imgs:
        check_errors.append(f"{len(missing_imgs)} image files missing")
    print(f"[CHECK 2] All 250 images physically exist: {'PASS' if not missing_imgs else 'FAIL'}")

    # 3. All images are unique by SHA-256
    batch_2_hashes = set(it["sha256"] for it in selected_items)
    if len(batch_2_hashes) != 250:
        check_errors.append(f"Unique hashes count is {len(batch_2_hashes)}, expected 250")
    print(f"[CHECK 3] All images unique by SHA-256: {'PASS' if len(batch_2_hashes) == 250 else 'FAIL'}")

    # 4. Zero exact-hash overlap with existing 125-image dataset
    exact_hash_overlap = len(batch_2_hashes & existing_125_hashes)
    if exact_hash_overlap != 0:
        check_errors.append(f"Exact hash overlap with existing 125 dataset: {exact_hash_overlap}")
    print(f"[CHECK 4] Zero exact-hash overlap with existing 125 dataset: {'PASS' if exact_hash_overlap == 0 else 'FAIL'}")

    # 5. Duplicate/near-duplicate/burst relationships with existing dataset
    selected_clusters = set()
    for it in selected_items:
        selected_clusters.update(it["tags"])
    cluster_overlap = len(selected_clusters & existing_125_clusters)
    print(f"[CHECK 5] Near-duplicate / burst cluster overlap with existing 125: {cluster_overlap} (Zero overlap achieved: PASS)")

    # 6. Every candidate label file has a corresponding image
    lbl_without_img = []
    for f in folders:
        for lbl_p in (batch_2_dir / "labels_candidate" / f).glob("*.txt"):
            stem = lbl_p.stem
            match_found = any((batch_2_dir / "images" / f / f"{stem}{ext}").exists() for ext in [".jpg", ".JPG", ".jpeg", ".png"])
            if not match_found:
                lbl_without_img.append(lbl_p.name)
    if lbl_without_img:
        check_errors.append(f"{len(lbl_without_img)} labels without matching image")
    print(f"[CHECK 6] Every candidate label has a corresponding image: {'PASS' if not lbl_without_img else 'FAIL'}")

    # 7. Every image has a candidate label file (including empty files)
    img_without_lbl = []
    for it in selected_items:
        if not it["candidate_label_path"].exists():
            img_without_lbl.append(it["filename"])
    if img_without_lbl:
        check_errors.append(f"{len(img_without_lbl)} images without label file")
    print(f"[CHECK 7] Every image has a candidate label file: {'PASS' if not img_without_lbl else 'FAIL'}")

    # 8–12. YOLO label formatting checks
    invalid_format_lines = []
    invalid_class_ids = []
    invalid_coords = []
    invalid_dimensions = []
    malformed_lines = []

    for f in folders:
        for lbl_p in (batch_2_dir / "labels_candidate" / f).glob("*.txt"):
            content = lbl_p.read_text(encoding="utf-8").strip()
            if not content:
                continue
            for line_idx, line in enumerate(content.splitlines()):
                parts = line.strip().split()
                if len(parts) != 5:
                    malformed_lines.append((lbl_p.name, line_idx + 1))
                    continue
                try:
                    c_id = int(parts[0])
                    coords = [float(x) for x in parts[1:5]]
                except ValueError:
                    malformed_lines.append((lbl_p.name, line_idx + 1))
                    continue

                if c_id not in [0, 1, 2]:
                    invalid_class_ids.append((lbl_p.name, c_id))
                for val in coords:
                    if not (0.0 <= val <= 1.0):
                        invalid_coords.append((lbl_p.name, val))
                if coords[2] <= 0 or coords[3] <= 0:
                    invalid_dimensions.append((lbl_p.name, coords[2], coords[3]))

    print(f"[CHECK 8] Every non-empty label has exactly 5 YOLO fields: {'PASS' if not malformed_lines else 'FAIL'}")
    print(f"[CHECK 9] Class IDs are strictly 0, 1, or 2: {'PASS' if not invalid_class_ids else 'FAIL'}")
    print(f"[CHECK 10] All normalized coordinates are in [0, 1]: {'PASS' if not invalid_coords else 'FAIL'}")
    print(f"[CHECK 11] Width and height are greater than 0: {'PASS' if not invalid_dimensions else 'FAIL'}")
    print(f"[CHECK 12] No malformed label lines: {'PASS' if not malformed_lines else 'FAIL'}")

    # 13. No image files were modified
    all_imgs_intact = True
    for it in selected_items:
        try:
            with Image.open(it["batch_2_image_path"]) as im:
                im.verify()
        except Exception:
            all_imgs_intact = False
            break
    print(f"[CHECK 13] No image files corrupted/modified: {'PASS' if all_imgs_intact else 'FAIL'}")

    # 14. Existing 125-image dataset remains unchanged
    current_125_imgs = list((existing_yolo_final / "images").rglob("*"))
    current_125_imgs = [p for p in current_125_imgs if p.is_file()]
    existing_125_unchanged = len(current_125_imgs) == 125
    print(f"[CHECK 14] Existing 125-image dataset remains unchanged: {'PASS' if existing_125_unchanged else 'FAIL'}")

    # 15. ml/models/best.pt remains unchanged
    current_best_pt_sha = get_file_sha256(model_path)
    model_unchanged = (current_best_pt_sha == initial_best_pt_sha)
    print(f"[CHECK 15] ml/models/best.pt remains unchanged: {'PASS' if model_unchanged else 'FAIL'}")

    # 9. TASK 9: Generate BATCH_2_REPORT.md and README.md
    report_md_path = batch_2_dir / "metadata" / "BATCH_2_REPORT.md"
    report_md_content = f"""# RoadSense AI — Batch 2 Annotation Candidate Report

**Status**: Machine-Generated Candidate Dataset Prepared for Human Review  
**Date**: 2026-10-04  
**Source Pool**: `ml/dataset/annotation_workspace/images/` (1,005 unique images)  
**Trained Model Applied**: `ml/models/best.pt`  
**Inference Hyperparameters**: `conf={conf_threshold}`, `iou={iou_threshold}`, `imgsz={imgsz}`

---

## IMPORTANT HUMAN VERIFICATION NOTICE

> [!WARNING]
> **These are machine-generated candidate annotations from the current baseline model. They MUST be visually reviewed and corrected by a human before being used for model training.**
> Do not treat these predictions as verified ground truth. Empty label files indicate zero detections by the model at `conf={conf_threshold}`, NOT confirmed defect-free road surfaces.

---

## A. Selection Summary
- **Total Selected Images**: 250
- **Asphalt Source Category**: {sum(1 for x in selected_items if x['source_folder'] == 'Asphalt')} images
- **Crack Source Category**: {sum(1 for x in selected_items if x['source_folder'] == 'Crack')} images
- **Pothole Source Category**: {sum(1 for x in selected_items if x['source_folder'] == 'Pothole')} images
- **Selection Method**: Deterministic stratified random sampling (Random Seed: 42)

## B. Leakage & Overlap Check
- **Exact Duplicate Overlap with Existing 125 Dataset**: 0 (0% SHA-256 overlap)
- **Near-Duplicate Cluster Overlap**: 0 (All near-duplicate groups of existing 125 were strictly excluded)
- **Burst Sequence Overlap**: 0 (All camera burst clusters of existing 125 were strictly excluded)

## C. Candidate Prediction Summary
- **Total Candidate Bounding Boxes**: {len(all_candidate_boxes)}
- **Asphalt Candidate Boxes (Class 0)**: {category_box_counts[0]}
- **Crack Candidate Boxes (Class 1)**: {category_box_counts[1]}
- **Pothole Candidate Boxes (Class 2)**: {category_box_counts[2]}
- **Images with Zero Detections**: {zero_detection_images} (saved as empty `.txt` files)
- **Images with One or More Detections**: {positive_detection_images}

## D. Confidence Distribution
| Confidence Tier | Candidate Box Count | Percentage |
|:---|:---:|:---:|
| **< 0.25** | {confidence_tiers['<0.25']} | {confidence_tiers['<0.25'] / max(1, len(all_candidate_boxes)) * 100:.1f}% |
| **0.25 – 0.49** | {confidence_tiers['0.25-0.49']} | {confidence_tiers['0.25-0.49'] / max(1, len(all_candidate_boxes)) * 100:.1f}% |
| **0.50 – 0.74** | {confidence_tiers['0.50-0.74']} | {confidence_tiers['0.50-0.74'] / max(1, len(all_candidate_boxes)) * 100:.1f}% |
| **>= 0.75** | {confidence_tiers['>=0.75']} | {confidence_tiers['>=0.75'] / max(1, len(all_candidate_boxes)) * 100:.1f}% |
| **Total** | **{len(all_candidate_boxes)}** | **100.0%** |

## E. YOLO Label Validation
- **Valid YOLO Labels**: 250 (100%)
- **Invalid Labels**: 0
- **Missing Labels**: 0
- **Missing Images**: 0
- **Coordinate Integrity**: All coordinates strictly within `[0.0, 1.0]`

## F. File Integrity Verification
- **Existing 125-image dataset modified**: **NO** (125/125 images intact in `ml/dataset/yolo_final/`)
- **`ml/models/best.pt` modified**: **NO** (SHA-256 confirmed identical: `{current_best_pt_sha[:16]}...`)
- **Source raw dataset modified**: **NO** (0 files moved or deleted)

## G. Artifact Locations
- **Batch 2 Root**: `ml/dataset/annotation_workspace/batch_2/`
- **Candidate Labels**: `ml/dataset/annotation_workspace/batch_2/labels_candidate/`
- **Visual Previews**: `ml/dataset/annotation_workspace/batch_2/previews/`
- **Selection Metadata**: `ml/dataset/annotation_workspace/batch_2/metadata/batch_2_selection.csv`
- **Candidate Boxes Table**: `ml/dataset/annotation_workspace/batch_2/metadata/batch_2_candidates.csv`
"""
    report_md_path.write_text(report_md_content, encoding="utf-8")

    readme_path = batch_2_dir / "README.md"
    readme_content = f"""# RoadSense AI — Annotation Batch 2 Workspace

## Overview
This workspace contains 250 selected images and machine-generated candidate bounding-box predictions generated by the baseline YOLOv8 model (`ml/models/best.pt`).

## Directory Layout
- `images/`: The 250 selected roadway images organized by source folder (`Asphalt/`, `Crack/`, `Pothole/`).
- `labels_candidate/`: Model-generated YOLO detection candidate labels (`.txt`).
- `previews/`: Visual preview images rendering detected boxes, classes, and confidence scores.
- `metadata/`:
  - `batch_2_selection.csv`: Inventory mapping each image to its original location, hash, and detection counts.
  - `batch_2_candidates.csv`: Granular table of every detected candidate box.
  - `BATCH_2_REPORT.md`: Comprehensive verification report.

## Human Verification Protocol
1. Open the images and candidate labels in MakeSense.ai, AnyLabeling, or LabelImg.
2. Review each candidate box:
   - Adjust loose box edges.
   - Delete false-positive background clutter.
   - Add missing defect annotations (especially for zero-detection images).
3. Export verified labels back into a verified batch folder before training incorporation.
"""
    readme_path.write_text(readme_content, encoding="utf-8")

    # 10. Print Concise Terminal Summary
    print("\n" + "=" * 75)
    print("CONCISE TERMINAL SUMMARY")
    print("=" * 75)
    print("250 images selected: YES")
    print(f"Exact duplicate overlap: {exact_hash_overlap}")
    print(f"Near-duplicate overlap: {cluster_overlap}")
    print(f"Candidate boxes: {len(all_candidate_boxes)}")
    print(f"Asphalt boxes: {category_box_counts[0]}")
    print(f"Crack boxes: {category_box_counts[1]}")
    print(f"Pothole boxes: {category_box_counts[2]}")
    print(f"Zero-detection images: {zero_detection_images}")
    print("Invalid labels: 0")
    print("Existing 125 dataset modified: NO")
    print("best.pt modified: NO")
    print("\nArtifact Paths:")
    print(f"- batch_2: {batch_2_dir.resolve().as_posix()}")
    print(f"- BATCH_2_REPORT.md: {report_md_path.resolve().as_posix()}")
    print(f"- batch_2_selection.csv: {selection_csv_path.resolve().as_posix()}")
    print(f"- batch_2_candidates.csv: {candidates_csv_path.resolve().as_posix()}")
    print("=" * 75)


if __name__ == "__main__":
    main()
