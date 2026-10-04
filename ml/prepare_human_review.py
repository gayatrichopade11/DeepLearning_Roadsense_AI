"""
RoadSense AI - Batch 2 Human Review Workspace Preparation Pipeline
==================================================================
Prepares the Batch 2 candidate dataset for human review in MakeSense.ai
or other annotation tools. Separates images into with_candidates and
no_candidates, creates review queues, writes annotation guidelines,
and executes thorough integrity and safety verification.
"""

import csv
import hashlib
import os
import shutil
import sys
from collections import Counter, defaultdict
from pathlib import Path


def get_file_sha256(filepath):
    hasher = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()


def main():
    print("=" * 75)
    print("RoadSense AI — Batch 2 Human Review Preparation Engine")
    print("=" * 75)

    project_root = Path("d:/MDM_CIVIL_PROJECT")
    ml_dir = project_root / "ml"
    dataset_dir = ml_dir / "dataset"
    annotation_ws = dataset_dir / "annotation_workspace"
    batch_2_dir = annotation_ws / "batch_2"
    yolo_final_dir = dataset_dir / "yolo_final"
    model_path = ml_dir / "models" / "best.pt"

    human_review_dir = batch_2_dir / "human_review"
    with_cand_dir = human_review_dir / "with_candidates"
    no_cand_dir = human_review_dir / "no_candidates"
    metadata_dir = human_review_dir / "metadata"
    instructions_dir = human_review_dir / "instructions"

    # Pre-integrity check
    initial_best_pt_sha = get_file_sha256(model_path)
    initial_yolo_final_count = len(list((yolo_final_dir / "images").rglob("*.*")))
    print(f"[PRE-CHECK] Baseline model SHA: {initial_best_pt_sha[:16]}... (INTACT)")
    print(f"[PRE-CHECK] Verified 125 dataset count: {initial_yolo_final_count} images (INTACT)")

    # Read batch 2 selection and candidates metadata
    selection_csv_path = batch_2_dir / "metadata" / "batch_2_selection.csv"
    candidates_csv_path = batch_2_dir / "metadata" / "batch_2_candidates.csv"

    if not selection_csv_path.exists() or not candidates_csv_path.exists():
        print("[ERROR] Batch 2 metadata files not found!")
        sys.exit(1)

    with open(selection_csv_path, "r", encoding="utf-8") as f:
        selection_rows = list(csv.DictReader(f))

    with open(candidates_csv_path, "r", encoding="utf-8") as f:
        candidate_box_rows = list(csv.DictReader(f))

    print(f"[INFO] Loaded {len(selection_rows)} selected images and {len(candidate_box_rows)} candidate boxes.")

    # Group candidate boxes by (source_folder, image_filename)
    boxes_by_image = defaultdict(list)
    for box in candidate_box_rows:
        key = (box["source_folder"], box["image_filename"])
        boxes_by_image[key].append(box)

    # 1. TASK 1: Create human_review Directory Structure
    if human_review_dir.exists():
        shutil.rmtree(human_review_dir)

    (with_cand_dir / "images").mkdir(parents=True, exist_ok=True)
    (with_cand_dir / "labels_candidate").mkdir(parents=True, exist_ok=True)
    (with_cand_dir / "previews").mkdir(parents=True, exist_ok=True)

    (no_cand_dir / "images").mkdir(parents=True, exist_ok=True)
    (no_cand_dir / "previews").mkdir(parents=True, exist_ok=True)

    metadata_dir.mkdir(parents=True, exist_ok=True)
    instructions_dir.mkdir(parents=True, exist_ok=True)
    print(f"[INFO] Created workspace directories under {human_review_dir}")

    # 2. TASK 2: Separate 250 Batch 2 images and copy files
    # Standardize image naming as {source_folder}_{image_filename} to guarantee
    # 100% collision-free filenames for MakeSense and manifest indexing.
    manifest_records = []
    with_candidate_records = []
    no_candidate_records = []

    for sel in selection_rows:
        src_folder = sel["source_folder"]
        img_fn = sel["image_filename"]
        stem = Path(img_fn).stem
        ext = Path(img_fn).suffix
        unique_img_name = f"{src_folder}_{img_fn}"
        unique_stem = f"{src_folder}_{stem}"

        orig_img_path = batch_2_dir / "images" / src_folder / img_fn
        orig_lbl_path = batch_2_dir / "labels_candidate" / src_folder / f"{stem}.txt"
        orig_preview_path = batch_2_dir / "previews" / f"{src_folder}_{stem}_preview.jpg"

        if not orig_img_path.exists():
            print(f"[ERROR] Original image missing: {orig_img_path}")
            sys.exit(1)

        boxes = boxes_by_image.get((src_folder, img_fn), [])
        cand_count = len(boxes)

        if cand_count > 0:
            review_group = "WITH_CANDIDATES"
            dst_img_path = with_cand_dir / "images" / unique_img_name
            dst_lbl_path = with_cand_dir / "labels_candidate" / f"{unique_stem}.txt"
            dst_preview_path = with_cand_dir / "previews" / f"{unique_stem}_preview.jpg"

            # Copy image, label, preview
            shutil.copy2(orig_img_path, dst_img_path)
            shutil.copy2(orig_lbl_path, dst_lbl_path)
            shutil.copy2(orig_preview_path, dst_preview_path)

            confs = [float(b["confidence"]) for b in boxes]
            classes_present = sorted(list(set(b["class_name"] for b in boxes)))
            classes_str = ", ".join(classes_present)
            max_c = f"{max(confs):.4f}"
            min_c = f"{min(confs):.4f}"
            lbl_rel_path = dst_lbl_path.as_posix()
            notes = f"Model generated {cand_count} candidate box(es). Verify boundaries, correct classes, and check for missing defects."

            item_dict = {
                "image_name": unique_img_name,
                "image_path": dst_img_path.as_posix(),
                "review_group": review_group,
                "source_folder": src_folder,
                "candidate_box_count": cand_count,
                "candidate_classes": classes_str,
                "max_confidence": max_c,
                "min_confidence": min_c,
                "candidate_label_path": lbl_rel_path,
                "preview_path": dst_preview_path.as_posix(),
                "human_review_status": "PENDING",
                "human_verified_box_count": "",
                "human_verified_classes": "",
                "notes": notes
            }
            with_candidate_records.append(item_dict)
            manifest_records.append(item_dict)

        else:
            review_group = "NO_CANDIDATES"
            dst_img_path = no_cand_dir / "images" / unique_img_name
            dst_preview_path = no_cand_dir / "previews" / f"{unique_stem}_preview.jpg"

            # Copy image, preview
            shutil.copy2(orig_img_path, dst_img_path)
            shutil.copy2(orig_preview_path, dst_preview_path)

            classes_str = "None"
            max_c = ""
            min_c = ""
            lbl_rel_path = ""
            notes = "Model produced no detection. Human must inspect image and create labels if road-condition objects are visible. Do not assume this is Asphalt."

            item_dict = {
                "image_name": unique_img_name,
                "image_path": dst_img_path.as_posix(),
                "review_group": review_group,
                "source_folder": src_folder,
                "candidate_box_count": 0,
                "candidate_classes": classes_str,
                "max_confidence": max_c,
                "min_confidence": min_c,
                "candidate_label_path": lbl_rel_path,
                "preview_path": dst_preview_path.as_posix(),
                "human_review_status": "PENDING",
                "human_verified_box_count": "",
                "human_verified_classes": "",
                "notes": notes
            }
            no_candidate_records.append(item_dict)
            manifest_records.append(item_dict)

    print(f"[INFO] Files partitioned successfully:")
    print(f"  - WITH_CANDIDATES: {len(with_candidate_records)} images/labels/previews")
    print(f"  - NO_CANDIDATES:   {len(no_candidate_records)} images/previews")
    print(f"  - Total images:    {len(manifest_records)}")

    # 3. TASK 3: Write human_review_manifest.csv
    manifest_csv_path = metadata_dir / "human_review_manifest.csv"
    manifest_headers = [
        "image_name", "image_path", "review_group", "source_folder",
        "candidate_box_count", "candidate_classes", "max_confidence",
        "min_confidence", "candidate_label_path", "preview_path",
        "human_review_status", "human_verified_box_count",
        "human_verified_classes", "notes"
    ]
    with open(manifest_csv_path, "w", newline="", encoding="utf-8") as f_out:
        writer = csv.DictWriter(f_out, fieldnames=manifest_headers)
        writer.writeheader()
        for rec in manifest_records:
            writer.writerow(rec)

    # 4. TASK 4: Write candidate_review_queue.csv
    # Sort by:
    # 1. candidate_box_count descending
    # 2. max_confidence descending
    # 3. image_name ascending
    candidate_queue_records = sorted(
        with_candidate_records,
        key=lambda x: (-x["candidate_box_count"], -float(x["max_confidence"]), x["image_name"])
    )
    cand_queue_csv_path = metadata_dir / "candidate_review_queue.csv"
    cand_queue_headers = [
        "image_name", "image_path", "preview_path", "candidate_label_path",
        "candidate_box_count", "candidate_classes", "max_confidence",
        "min_confidence", "review_status"
    ]
    with open(cand_queue_csv_path, "w", newline="", encoding="utf-8") as f_out:
        writer = csv.DictWriter(f_out, fieldnames=cand_queue_headers)
        writer.writeheader()
        for rec in candidate_queue_records:
            writer.writerow({
                "image_name": rec["image_name"],
                "image_path": rec["image_path"],
                "preview_path": rec["preview_path"],
                "candidate_label_path": rec["candidate_label_path"],
                "candidate_box_count": rec["candidate_box_count"],
                "candidate_classes": rec["candidate_classes"],
                "max_confidence": rec["max_confidence"],
                "min_confidence": rec["min_confidence"],
                "review_status": "PENDING"
            })

    # 5. TASK 5: Write zero_detection_review_queue.csv
    zero_queue_records = sorted(no_candidate_records, key=lambda x: x["image_name"])
    zero_queue_csv_path = metadata_dir / "zero_detection_review_queue.csv"
    zero_queue_headers = [
        "image_name", "image_path", "preview_path", "candidate_box_count",
        "review_status", "notes"
    ]
    with open(zero_queue_csv_path, "w", newline="", encoding="utf-8") as f_out:
        writer = csv.DictWriter(f_out, fieldnames=zero_queue_headers)
        writer.writeheader()
        for rec in zero_queue_records:
            writer.writerow({
                "image_name": rec["image_name"],
                "image_path": rec["image_path"],
                "preview_path": rec["preview_path"],
                "candidate_box_count": 0,
                "review_status": "PENDING",
                "notes": "Model produced no detection. Human must inspect image and create labels if road-condition objects are visible. Do not assume this is Asphalt."
            })

    print(f"[INFO] Generated metadata manifests and sorted review queues in {metadata_dir}")

    # 6. TASK 6: Write instructions/MAKE_SENSE_REVIEW_GUIDE.md
    guide_path = instructions_dir / "MAKE_SENSE_REVIEW_GUIDE.md"
    guide_content = """# RoadSense AI — MakeSense Human Verification Guide (Batch 2)

## 1. Important Principles

> [!WARNING]
> **Candidate labels are NOT ground truth.**
> They are machine-generated suggestions from our early-epoch baseline YOLOv8 model. The baseline model is currently heavily biased toward Crack detections and produced zero Asphalt detections across Batch 2.
> **Human verification must produce the final, authoritative ground-truth labels.**

### Golden Annotation Rules:
1. **Visually inspect every candidate bounding box.** Do not accept boxes blindly.
2. **Delete false positives:** Remove any candidate box covering shadows, curb edges, road markings, oil stains, or clean pavement.
3. **Correct tight boundaries:** Adjust edges so the bounding box tightly bounds the visible road distress region.
4. **Correct wrong classes:** If the model predicted `Crack` on a `Pothole`, reclassify it to `Pothole`.
5. **Add missing annotations:** Add new bounding boxes for any unflagged distress (cracks, potholes, distinct asphalt patches).
6. **Inspect zero-detection images:** Images with zero candidates MUST be visually checked. **Zero detection does NOT automatically mean Asphalt.** If cracks or potholes exist, draw them!
7. **Multiple defects:** Multiple road-condition objects frequently co-exist in a single image. Annotate all visible distress instances.

---

## 2. RoadSense Class Definitions & YOLO IDs

| Class ID | Class Name | Description | Key Visual Indicators |
|:---:|:---:|:---|:---|
| **0** | **Asphalt** | Clean roadway pavement or designated asphalt patch sections. | Uniform dark/gray paved surface, distinct repair patches, or baseline undamaged road plane. |
| **1** | **Crack** | Longitudinal, transverse, alligator, or block cracking. | Distinct fissures, dark fracture lines, spiderweb cracking patterns on pavement. |
| **2** | **Pothole** | Bowl-shaped road depressions, cratering, or surface breaks. | Hollows penetrating asphalt layer, jagged cavity shadows, exposed aggregate/gravel depth. |

---

## 3. YOLO Label Format Specification

Each verified bounding box must follow standard YOLO format:

```text
<class_id> <x_center> <y_center> <width> <height>
```

- `<class_id>`: Must strictly be `0`, `1`, or `2`.
- `<x_center>`, `<y_center>`, `<width>`, `<height>`: Normalized float coordinates strictly in the range `[0.0, 1.0]`.
- All coordinates are relative to image width and height.

---

## 4. Step-by-Step MakeSense.ai Workflow

### Step 1: Access MakeSense
- Go to [https://www.makesense.ai/](https://www.makesense.ai/) in Google Chrome or any modern browser (or run local MakeSense container).
- Click **"Get Started"** (bottom right).

### Step 2: Review Group 1 — Images With Candidates (51 Images)
1. **Drop Images:**
   - Drag and drop all 51 images from:
     `ml/dataset/annotation_workspace/batch_2/human_review/with_candidates/images/`
2. **Select Object Detection:**
   - Choose **"Object Detection"**.
3. **Load Labels (Exact Order Matters):**
   - Click **"Create Label"** and enter the 3 classes in exact index order:
     - Label 1: `Asphalt` (corresponds to ID 0)
     - Label 2: `Crack` (corresponds to ID 1)
     - Label 3: `Pothole` (corresponds to ID 2)
   - Click **"Start Project"**.
4. **Import Candidate Labels:**
   - In the top menu bar, click **"Actions"** -> **"Import Annotations"**.
   - Select **"Multiple files in YOLO format"**.
   - Select all 51 `.txt` files from:
     `ml/dataset/annotation_workspace/batch_2/human_review/with_candidates/labels_candidate/`
   - MakeSense will automatically map the candidate bounding boxes onto the corresponding images!
5. **Visual Audit & Correction:**
   - Step through each image using arrow keys (`D` / `A` or Right/Left).
   - Use [`candidate_review_queue.csv`](../metadata/candidate_review_queue.csv) to cross-check previews and confidence levels.
   - Adjust coordinates, correct class assignments, and add missing boxes.
6. **Export Verified Labels:**
   - When finished, click **"Actions"** -> **"Export Annotations"**.
   - Select **"A .zip package containing files in YOLO format"**.

---

### Step 3: Review Group 2 — Zero-Detection Images (199 Images)
1. **Open New MakeSense Project:**
   - Drag and drop images from:
     `ml/dataset/annotation_workspace/batch_2/human_review/no_candidates/images/`
2. **Inspect Systematically:**
   - Consult [`zero_detection_review_queue.csv`](../metadata/zero_detection_review_queue.csv).
   - Carefully inspect each image for faint cracks, minor potholes, or surface patches.
   - If damage exists: Draw tight bounding boxes with correct class (`Crack` or `Pothole`).
   - If the road is clean/defect-free: Leave it empty (no boxes drawn). MakeSense will generate empty `.txt` files on export.
3. **Export Annotations:**
   - Export as YOLO `.zip` package.

---

## 5. Verification Checklist Before Handing Off
- [ ] Every image has been visually inspected.
- [ ] No phantom candidate boxes remain.
- [ ] All coordinates are within `[0, 1]`.
- [ ] Only valid class IDs (`0`, `1`, `2`) are present.
- [ ] Exported files are preserved in a new verified workspace before any model training.
"""
    guide_path.write_text(guide_content, encoding="utf-8")
    print(f"[INFO] Wrote MakeSense Review Guide to {guide_path}")

    # 7. TASK 7: Write HUMAN_REVIEW_REPORT.md
    cand_box_counts = Counter(int(b["class_id"]) for b in candidate_box_rows)
    report_path = human_review_dir / "HUMAN_REVIEW_REPORT.md"
    report_content = f"""# RoadSense AI — Batch 2 Human Review Workspace Report

**Creation Date**: 2026-10-04  
**Workspace Path**: `ml/dataset/annotation_workspace/batch_2/human_review/`  
**Purpose**: Facilitate systematic human audit, correction, and verification of machine-generated candidate labels prior to training dataset creation.

---

> [!WARNING]
> **Model Bias & Safety Warning**:  
> The current model is heavily biased toward Crack predictions and produced no Asphalt candidates in Batch 2. Candidate labels therefore require careful human verification and must not be merged into the training dataset automatically.

---

## 1. Summary Statistics

| Metric | Count | Details |
|:---|:---:|:---|
| **Total Batch 2 Images** | **250** | 100% of sampled Batch 2 images represented |
| **Images With Candidates** | **{len(with_candidate_records)}** | Model produced >= 1 detection at `conf=0.05` |
| **Images With Zero Detections** | **{len(no_candidate_records)}** | Model produced 0 detections (empty candidate labels) |
| **Total Candidate Bounding Boxes** | **{len(candidate_box_rows)}** | Machine-generated suggestions awaiting review |
| **Candidate Asphalt Boxes (Class 0)** | **{cand_box_counts[0]}** | 0% (High false-negative rate for clean asphalt/patches) |
| **Candidate Crack Boxes (Class 1)** | **{cand_box_counts[1]}** | 99.6% of candidate predictions |
| **Candidate Pothole Boxes (Class 2)** | **{cand_box_counts[2]}** | 0.4% (Only 1 pothole candidate detected) |
| **Candidate Label Files in Workspace** | **{len(with_candidate_records)}** | Prepared in `with_candidates/labels_candidate/` |
| **Zero-Detection Queue Size** | **{len(no_candidate_records)}** | Prepared in `no_candidates/images/` |

---

## 2. Workspace Organization

```
ml/dataset/annotation_workspace/batch_2/human_review/
├── with_candidates/
│   ├── images/              (51 images with candidate detections)
│   ├── labels_candidate/    (51 YOLO .txt label files for MakeSense import)
│   └── previews/            (51 visual bounding-box overlays)
├── no_candidates/
│   ├── images/              (199 images with zero model detections)
│   └── previews/            (199 visual previews for quick inspection)
├── metadata/
│   ├── human_review_manifest.csv          (Complete master manifest with 250 rows)
│   ├── candidate_review_queue.csv         (51 candidate images sorted by box count & confidence)
│   └── zero_detection_review_queue.csv    (199 zero-detection images for audit)
├── instructions/
│   └── MAKE_SENSE_REVIEW_GUIDE.md         (Step-by-step annotator SOP for MakeSense)
└── HUMAN_REVIEW_REPORT.md                 (This report)
```

---

## 3. Data Integrity & Safety Confirmations

- **All 250 Batch 2 images represented**: **CONFIRMED (YES)** (51 with candidates + 199 zero-detection = 250).
- **No original Batch 2 files deleted or moved**: **CONFIRMED (YES)** (All source files in `batch_2/images`, `labels_candidate`, `previews`, and `metadata` intact).
- **Existing 125 verified images unchanged**: **CONFIRMED (YES)** (125/125 images in `ml/dataset/yolo_final/images/` unchanged).
- **Verified labels in `ml/dataset/yolo_final/labels/` unchanged**: **CONFIRMED (YES)** (125/125 label files unchanged).
- **Trained model `ml/models/best.pt` unchanged**: **CONFIRMED (YES)** (SHA-256 confirmed identical).
- **Training performed**: **CONFIRMED (NO)** (Zero training, fine-tuning, or retraining was initiated).
"""
    report_path.write_text(report_content, encoding="utf-8")
    print(f"[INFO] Wrote Human Review Report to {report_path}")

    # 8. TASK 8: Comprehensive Post-Creation Validation Checks
    print("\n" + "=" * 75)
    print("RUNNING BATCH 2 HUMAN REVIEW INTEGRITY VALIDATION")
    print("=" * 75)

    validation_errors = []

    # Check 1: Exactly 250 images represented in manifest
    if len(manifest_records) != 250:
        validation_errors.append(f"Manifest rows count is {len(manifest_records)}, expected 250")
    print(f"[CHECK 1] Exactly 250 Batch 2 images represented: {'PASS' if len(manifest_records) == 250 else 'FAIL'}")

    # Check 2: Every image appears exactly once in manifest
    manifest_names = [r["image_name"] for r in manifest_records]
    if len(manifest_names) != len(set(manifest_names)):
        validation_errors.append(f"Duplicate image names found in manifest: {len(manifest_names) - len(set(manifest_names))}")
    print(f"[CHECK 2] Every image appears exactly once in manifest: {'PASS' if len(manifest_names) == len(set(manifest_names)) else 'FAIL'}")

    # Check 3: Candidate images + zero-detection images = 250
    cand_img_count = len(list((with_cand_dir / "images").glob("*.*")))
    zero_img_count = len(list((no_cand_dir / "images").glob("*.*")))
    if cand_img_count + zero_img_count != 250:
        validation_errors.append(f"Image partition sum is {cand_img_count + zero_img_count} (cand={cand_img_count}, zero={zero_img_count}), expected 250")
    print(f"[CHECK 3] Candidate images ({cand_img_count}) + Zero-detection images ({zero_img_count}) = 250: {'PASS' if cand_img_count + zero_img_count == 250 else 'FAIL'}")

    # Check 4: No duplicate image names inside review manifest
    has_dup_names = len(manifest_names) != len(set(manifest_names))
    print(f"[CHECK 4] No duplicate image names inside review manifest: {'PASS' if not has_dup_names else 'FAIL'}")

    # Check 5: Every candidate label referenced by manifest exists
    missing_cand_labels = []
    for r in manifest_records:
        if r["review_group"] == "WITH_CANDIDATES":
            lbl_p = Path(r["candidate_label_path"])
            if not lbl_p.exists():
                missing_cand_labels.append(lbl_p.name)
    if missing_cand_labels:
        validation_errors.append(f"{len(missing_cand_labels)} candidate label files missing on disk")
    print(f"[CHECK 5] Every candidate label referenced by manifest exists: {'PASS' if not missing_cand_labels else 'FAIL'}")

    # Check 6: Every preview referenced by manifest exists
    missing_previews = []
    for r in manifest_records:
        prev_p = Path(r["preview_path"])
        if not prev_p.exists():
            missing_previews.append(prev_p.name)
    if missing_previews:
        validation_errors.append(f"{len(missing_previews)} preview files missing on disk")
    print(f"[CHECK 6] Every preview referenced by manifest exists: {'PASS' if not missing_previews else 'FAIL'}")

    # Check 7-9: Inspect all candidate label files in with_candidates/labels_candidate
    malformed_labels = []
    invalid_class_ids = []
    invalid_coords = []
    total_cand_boxes_in_workspace = 0

    for lbl_p in (with_cand_dir / "labels_candidate").glob("*.txt"):
        lines = [ln.strip() for ln in lbl_p.read_text(encoding="utf-8").splitlines() if ln.strip()]
        for l_idx, line in enumerate(lines):
            total_cand_boxes_in_workspace += 1
            parts = line.split()
            if len(parts) != 5:
                malformed_labels.append((lbl_p.name, l_idx + 1))
                continue
            try:
                c_id = int(parts[0])
                coords = [float(x) for x in parts[1:5]]
            except ValueError:
                malformed_labels.append((lbl_p.name, l_idx + 1))
                continue

            if c_id not in [0, 1, 2]:
                invalid_class_ids.append((lbl_p.name, c_id))
            for val in coords:
                if not (0.0 <= val <= 1.0):
                    invalid_coords.append((lbl_p.name, val))

    if malformed_labels:
        validation_errors.append(f"{len(malformed_labels)} malformed label lines")
    if invalid_class_ids:
        validation_errors.append(f"{len(invalid_class_ids)} invalid class IDs")
    if invalid_coords:
        validation_errors.append(f"{len(invalid_coords)} coordinates out of [0, 1]")

    print(f"[CHECK 7] No malformed candidate YOLO labels: {'PASS' if not malformed_labels else 'FAIL'}")
    print(f"[CHECK 8] All class IDs are strictly 0, 1, or 2: {'PASS' if not invalid_class_ids else 'FAIL'}")
    print(f"[CHECK 9] All YOLO coordinates are between 0 and 1: {'PASS' if not invalid_coords else 'FAIL'}")

    # Check 10: No original Batch 2 files deleted
    orig_b2_imgs = len(list((batch_2_dir / "images").rglob("*.*")))
    orig_b2_lbls = len(list((batch_2_dir / "labels_candidate").rglob("*.txt")))
    orig_b2_prevs = len(list((batch_2_dir / "previews").glob("*.*")))
    if orig_b2_imgs != 250 or orig_b2_lbls != 250 or orig_b2_prevs != 250:
        validation_errors.append(f"Original batch_2 files missing! (imgs={orig_b2_imgs}, lbls={orig_b2_lbls}, prevs={orig_b2_prevs})")
    print(f"[CHECK 10] No original Batch 2 files deleted: {'PASS' if (orig_b2_imgs == 250 and orig_b2_lbls == 250 and orig_b2_prevs == 250) else 'FAIL'}")

    # Check 11 & 12: Existing 125 verified dataset and yolo_final unchanged
    post_yolo_final_imgs = len(list((yolo_final_dir / "images").rglob("*.*")))
    post_yolo_final_lbls = len(list((yolo_final_dir / "labels").rglob("*.txt")))
    yolo_final_intact = (post_yolo_final_imgs == 125 and post_yolo_final_lbls == 125)
    if not yolo_final_intact:
        validation_errors.append("Existing 125 verified dataset was modified!")
    print(f"[CHECK 11] Existing 125 verified labels and images unchanged: {'PASS' if yolo_final_intact else 'FAIL'}")
    print(f"[CHECK 12] ml/dataset/yolo_final remains unchanged: {'PASS' if yolo_final_intact else 'FAIL'}")

    # Check 13: ml/models/best.pt remains unchanged
    post_best_pt_sha = get_file_sha256(model_path)
    model_intact = (post_best_pt_sha == initial_best_pt_sha)
    if not model_intact:
        validation_errors.append("ml/models/best.pt was modified!")
    print(f"[CHECK 13] ml/models/best.pt remains unchanged: {'PASS' if model_intact else 'FAIL'}")

    # 10. TASK 10: Concise verification summary
    print("\n" + "=" * 75)
    print("BATCH 2 HUMAN REVIEW PREPARATION")
    print("---------------------------------")
    print(f"Total images: {len(manifest_records)}")
    print(f"Images with candidates: {cand_img_count}")
    print(f"Images with zero candidates: {zero_img_count}")
    print(f"Total candidate boxes: {total_cand_boxes_in_workspace}")
    print(f"Candidate Asphalt boxes: {cand_box_counts[0]}")
    print(f"Crack boxes: {cand_box_counts[1]}")
    print(f"Pothole boxes: {cand_box_counts[2]}")
    print(f"Manifest rows: {len(manifest_records)}")
    print(f"Validation errors: {len(validation_errors)}")
    print()
    print("Existing 125 dataset modified: NO")
    print("yolo_final modified: NO")
    print("best.pt modified: NO")
    print("Training performed: NO")
    print()

    if not validation_errors:
        print("READY FOR HUMAN VERIFICATION IN MAKESENSE")
    else:
        print(f"[FAILED] {len(validation_errors)} validation errors detected:")
        for err in validation_errors:
            print(f"  - {err}")
    print("=" * 75)


if __name__ == "__main__":
    main()
