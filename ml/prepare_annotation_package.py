"""
RoadSense AI - Relabel Workspace Annotation Package Generator
=============================================================
Prepares the 231-image relabel workspace for fast human annotation:
1. Groups images by candidate class (Pothole, Crack, Road_Patch).
2. Preserves current bounding boxes as reference labels.
3. Generates clear review CSV sheet with required blank columns.
4. Generates preview images showing current bounding boxes and class names.
5. Creates ANNOTATION_QUICK_GUIDE.md.
Preserves all original datasets and model weights strictly untouched.
"""

import csv
import shutil
from pathlib import Path
import cv2
import numpy as np

def prepare_annotation_package():
    project_root = Path(".").resolve()
    candidate_dir = project_root / "ml" / "dataset" / "yolo_candidate_303"
    workspace_dir = project_root / "ml" / "dataset" / "relabel_workspace"
    queue_csv = workspace_dir / "metadata" / "relabel_queue.csv"

    print("=" * 75)
    print("RoadSense AI — Annotation Package Preparation")
    print("=" * 75)

    if not queue_csv.exists():
        print(f"[ERROR] Queue CSV not found: {queue_csv}")
        return

    with open(queue_csv, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        queue_rows = list(reader)

    print(f"Total review images from queue: {len(queue_rows)}")

    # Directories to create
    candidates_dir = workspace_dir / "candidates"
    pothole_cand_dir = candidates_dir / "Pothole"
    crack_cand_dir = candidates_dir / "Crack"
    patch_cand_dir = candidates_dir / "Road_Patch"

    ref_labels_dir = workspace_dir / "reference_labels"
    previews_dir = workspace_dir / "previews"
    pothole_prev_dir = previews_dir / "Pothole"
    crack_prev_dir = previews_dir / "Crack"
    patch_prev_dir = previews_dir / "Road_Patch"

    for d in [pothole_cand_dir, crack_cand_dir, patch_cand_dir,
              ref_labels_dir, previews_dir,
              pothole_prev_dir, crack_prev_dir, patch_prev_dir]:
        d.mkdir(parents=True, exist_ok=True)

    # Class mappings for legacy labels
    # 0: Asphalt, 1: Crack, 2: Pothole
    legacy_class_names = {0: "Asphalt", 1: "Crack", 2: "Pothole"}
    # Colors (BGR for OpenCV):
    # Asphalt: Deep Orange/Amber (0, 140, 255)
    # Crack: Bright Cyan (255, 255, 0)
    # Pothole: Crimson Red (0, 0, 255)
    class_colors_bgr = {
        0: (0, 140, 255),
        1: (255, 255, 0),
        2: (0, 0, 255)
    }

    counts_by_candidate = {"Pothole": 0, "Crack": 0, "Road_Patch": 0}
    review_sheet_rows = []

    # Map candidate directory targets
    cand_dir_map = {
        "Pothole": pothole_cand_dir,
        "Crack": crack_cand_dir,
        "Road_Patch": patch_cand_dir
    }
    prev_dir_map = {
        "Pothole": pothole_prev_dir,
        "Crack": crack_prev_dir,
        "Road_Patch": patch_prev_dir
    }

    print("\n[INFO] Processing images, labels, candidate grouping, and preview generation...")

    for idx, row in enumerate(queue_rows, start=1):
        fname = row["image filename"]
        curr_cls = row["current class"]
        prop_cls = row["proposed new class"]
        reason = row["reason for review"]
        status = row["confidence/status"]

        stem = Path(fname).stem
        ext = Path(fname).suffix

        # 1. Locate source image and original label file in yolo_candidate_303
        src_img = None
        src_lbl = None
        for sp in ["train", "val", "test"]:
            img_candidate = candidate_dir / "images" / sp / fname
            lbl_candidate = candidate_dir / "labels" / sp / f"{stem}.txt"
            if img_candidate.exists():
                src_img = img_candidate
            if lbl_candidate.exists():
                src_lbl = lbl_candidate
            if src_img and src_lbl:
                break

        if not src_img:
            # Fallback to relabel_workspace/images
            ws_img = workspace_dir / "images" / fname
            if ws_img.exists():
                src_img = ws_img

        # 2. Copy image into candidate grouping folder
        target_cand_dir = cand_dir_map.get(prop_cls, pothole_cand_dir)
        dst_cand_img = target_cand_dir / fname
        if src_img and not dst_cand_img.exists():
            shutil.copy2(src_img, dst_cand_img)

        # 3. Preserve reference bounding boxes in reference_labels/
        dst_ref_lbl = ref_labels_dir / f"{stem}.txt"
        boxes = []
        if src_lbl and src_lbl.exists():
            if not dst_ref_lbl.exists():
                shutil.copy2(src_lbl, dst_ref_lbl)
            lines = [l.strip().split() for l in src_lbl.read_text(encoding="utf-8").splitlines() if l.strip()]
            for p in lines:
                try:
                    c = int(p[0])
                    cx, cy, w, h = float(p[1]), float(p[2]), float(p[3]), float(p[4])
                    boxes.append((c, cx, cy, w, h))
                except Exception:
                    pass

        # 4. Generate visual preview image with bounding boxes
        if src_img and src_img.exists():
            img_bgr = cv2.imread(str(src_img))
            if img_bgr is not None:
                img_h, img_w = img_bgr.shape[:2]

                # Draw bounding boxes
                for b_idx, (cls_id, cx, cy, bw, bh) in enumerate(boxes, start=1):
                    x1 = int((cx - bw / 2) * img_w)
                    y1 = int((cy - bh / 2) * img_h)
                    x2 = int((cx + bw / 2) * img_w)
                    y2 = int((cy + bh / 2) * img_h)

                    x1 = max(0, min(img_w - 1, x1))
                    y1 = max(0, min(img_h - 1, y1))
                    x2 = max(0, min(img_w - 1, x2))
                    y2 = max(0, min(img_h - 1, y2))

                    color = class_colors_bgr.get(cls_id, (0, 255, 0))
                    cls_name = legacy_class_names.get(cls_id, f"Class_{cls_id}")

                    # Draw rectangle
                    cv2.rectangle(img_bgr, (x1, y1), (x2, y2), color, 3)

                    # Label tag
                    tag_text = f"#{b_idx} {cls_name} (ID {cls_id})"
                    font = cv2.FONT_HERSHEY_SIMPLEX
                    font_scale = max(0.5, min(img_w, img_h) / 1000.0)
                    thickness = max(1, int(font_scale * 2))

                    (tw, th), baseline = cv2.getTextSize(tag_text, font, font_scale, thickness)
                    tag_y1 = max(0, y1 - th - 6)
                    tag_y2 = y1
                    tag_x2 = min(img_w - 1, x1 + tw + 8)

                    cv2.rectangle(img_bgr, (x1, tag_y1), (tag_x2, tag_y2), color, -1)
                    cv2.putText(img_bgr, tag_text, (x1 + 4, tag_y2 - 4), font, font_scale, (0, 0, 0), thickness, cv2.LINE_AA)

                # Add top informational header banner
                banner_h = max(40, int(img_h * 0.06))
                banner = np.zeros((banner_h, img_w, 3), dtype=np.uint8)
                header_text = f"FILE: {fname} | PROPOSED: {prop_cls} | CURRENT: {curr_cls} | BOXES: {len(boxes)}"
                font = cv2.FONT_HERSHEY_SIMPLEX
                font_scale = max(0.45, min(img_w, img_h) / 1200.0)
                thickness = 1
                (tw, th), _ = cv2.getTextSize(header_text, font, font_scale, thickness)
                text_y = int((banner_h + th) / 2)
                cv2.putText(banner, header_text, (10, text_y), font, font_scale, (255, 255, 255), thickness, cv2.LINE_AA)

                preview_img = np.vstack([banner, img_bgr])

                # Save preview to both root previews and class subfolder
                out_path_root = previews_dir / fname
                out_path_class = prev_dir_map.get(prop_cls, pothole_prev_dir) / fname

                cv2.imwrite(str(out_path_root), preview_img)
                cv2.imwrite(str(out_path_class), preview_img)

        # 5. Populate Review Sheet row
        # Required columns:
        # filename, current_class, proposed_class, reviewer_decision, corrected_class, bbox_correction_required, notes
        notes_text = f"{reason} | Status: {status}"
        review_sheet_rows.append({
            "filename": fname,
            "current_class": curr_cls,
            "proposed_class": prop_cls,
            "reviewer_decision": "",          # Blank for reviewer
            "corrected_class": "",            # Blank for reviewer
            "bbox_correction_required": "",   # Blank for reviewer
            "notes": notes_text
        })

        counts_by_candidate[prop_cls] = counts_by_candidate.get(prop_cls, 0) + 1

    print(f"[INFO] Processed all {len(review_sheet_rows)} review items.")

    # Write relabel_review_sheet.csv
    review_csv_fields = [
        "filename",
        "current_class",
        "proposed_class",
        "reviewer_decision",
        "corrected_class",
        "bbox_correction_required",
        "notes"
    ]
    sheet_destinations = [
        workspace_dir / "metadata" / "relabel_review_sheet.csv",
        workspace_dir / "relabel_review_sheet.csv"
    ]

    for s_path in sheet_destinations:
        with open(s_path, mode="w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=review_csv_fields)
            writer.writeheader()
            for r in review_sheet_rows:
                writer.writerow(r)
        print(f"[INFO] Written review sheet to: {s_path}")

    # Write ANNOTATION_QUICK_GUIDE.md
    guide_path = workspace_dir / "ANNOTATION_QUICK_GUIDE.md"
    guide_content = f"""# RoadSense AI — Fast Annotation Quick Guide (231 Images)

This guide provides immediate instructions for reviewing and annotating the **231 queued candidate images** in `ml/dataset/relabel_workspace/`.

---

## 1. Core Taxonomy & Decision Rules

| Class Name | ID | Visual Definition | Decision Rule |
| :--- | :---: | :--- | :--- |
| **Pothole** | `0` | Visible cavity, depression, or bowl-shaped opening in the road surface where asphalt has broken away. | Asphalt has missing depth (> 25mm), vertical walls, shadow, or exposed dirt/gravel sub-base. |
| **Crack** | `1` | Visible linear, branching, or interconnected network cracking. | Surface fractures (transverse, longitudinal, alligator) where the road surface remains flat and planar (no excavated hole). |
| **Road_Patch** | `2` | Repaired or overlay road surface area without being a pothole. | Distinct rectangular or irregular maintenance patch (fresh dark/light asphalt) applied over a previous repair. |
| **Uncertain** | — | Ambiguous, blurry, or mixed damage. | Mark as **`REVIEW_REQUIRED`** in `reviewer_decision`. |

---

## 2. Review Sheet Instructions (`relabel_review_sheet.csv`)

Open [`relabel_review_sheet.csv`](file:///d:/MDM_CIVIL_PROJECT/ml/dataset/relabel_workspace/relabel_review_sheet.csv) in Excel or your CSV editor. Fill in the columns as follows:

1. **`reviewer_decision`**:
   - `APPROVE`: The proposed class in `proposed_class` is correct.
   - `REJECT`: The proposed class is incorrect. Provide the true class in `corrected_class`.
   - `REVIEW_REQUIRED`: Image is ambiguous, blurry, or requires engineering consensus.
   - `REMOVE_BACKGROUND`: Image is clean asphalt road with no defects (should be used as negative background).
2. **`corrected_class`**:
   - Fill with `Pothole`, `Crack`, or `Road_Patch` if decision is `REJECT`. Leave blank if `APPROVE`.
3. **`bbox_correction_required`**:
   - `YES`: The existing bounding box is shifted off the defect, too loose, or misplaced (e.g. `11 (2).jpg`, `12 (2).jpg`).
   - `NO`: The existing bounding box is accurate and tightly fits the defect.
4. **`notes`**:
   - Add any specific observations (e.g. "needs 2 boxes", "patch has crack inside", "shifted 50px left").

---

## 3. Directory Layout

- **Candidates by Proposed Class**:
  - Potholes ({counts_by_candidate.get('Pothole', 0)} images): [`candidates/Pothole/`](file:///d:/MDM_CIVIL_PROJECT/ml/dataset/relabel_workspace/candidates/Pothole/)
  - Cracks ({counts_by_candidate.get('Crack', 0)} images): [`candidates/Crack/`](file:///d:/MDM_CIVIL_PROJECT/ml/dataset/relabel_workspace/candidates/Crack/)
  - Road Patches ({counts_by_candidate.get('Road_Patch', 0)} images): [`candidates/Road_Patch/`](file:///d:/MDM_CIVIL_PROJECT/ml/dataset/relabel_workspace/candidates/Road_Patch/)
- **Visual Preview Images**:
  - All Previews: [`previews/`](file:///d:/MDM_CIVIL_PROJECT/ml/dataset/relabel_workspace/previews/)
  - Pothole Previews: [`previews/Pothole/`](file:///d:/MDM_CIVIL_PROJECT/ml/dataset/relabel_workspace/previews/Pothole/)
  - Crack Previews: [`previews/Crack/`](file:///d:/MDM_CIVIL_PROJECT/ml/dataset/relabel_workspace/previews/Crack/)
  - Road Patch Previews: [`previews/Road_Patch/`](file:///d:/MDM_CIVIL_PROJECT/ml/dataset/relabel_workspace/previews/Road_Patch/)
- **Starting Reference Labels**:
  - YOLO-format labels: [`reference_labels/`](file:///d:/MDM_CIVIL_PROJECT/ml/dataset/relabel_workspace/reference_labels/)

---

## 4. Integrity Commitment

- **No labels have been automatically approved or altered.**
- **`ml/dataset/yolo_candidate_303/` remains strictly unchanged.**
- **`ml/models/best.pt` and `best_303.pt` remain strictly unchanged.**
"""
    guide_path.write_text(guide_content, encoding="utf-8")
    print(f"[INFO] Created quick annotation guide at: {guide_path}")

    print("\n" + "=" * 75)
    print("ANNOTATION PACKAGE SETUP COMPLETE")
    print("=" * 75)
    print(f"Total review images          : {len(queue_rows)}")
    for k, v in counts_by_candidate.items():
        print(f"  - {k:15}: {v} images")
    print(f"Preview images directory     : {previews_dir}")
    print(f"Review CSV sheet location    : {workspace_dir / 'relabel_review_sheet.csv'}")
    print("=" * 75)

if __name__ == "__main__":
    prepare_annotation_package()
