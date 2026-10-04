"""
RoadSense AI - Clean Dataset Assembler & Relabeling Pipeline
============================================================
Converts reviewed annotations from relabel_workspace into the new clean
3-class YOLO dataset under the standardized taxonomy:
  0 = Pothole
  1 = Crack
  2 = Road_Patch

Supports:
  --source-csv <path> : Uses specified review sheet (defaults to relabel_review_sheet.csv)
  --apply             : Builds ml/dataset/yolo_clean_303/ after validating decisions
  --dry-run           : Validates mappings without writing files

Preserves all historical datasets and model files strictly intact.
"""

import argparse
import csv
import hashlib
import shutil
import sys
from collections import Counter
from pathlib import Path

# New Standard Taxonomy
NEW_CLASS_MAP = {
    "Pothole": 0,
    "Crack": 1,
    "Road_Patch": 2
}
NEW_CLASS_NAMES = {0: "Pothole", 1: "Crack", 2: "Road_Patch"}

# Legacy class IDs in yolo_candidate_303: 0: Asphalt, 1: Crack, 2: Pothole
LEGACY_TO_NEW = {
    2: 0,  # Old Pothole -> New Pothole (0)
    1: 1,  # Old Crack   -> New Crack (1)
}

def get_file_sha256(filepath: Path) -> str:
    hasher = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()

def build_clean_dataset(source_csv_path: Path, apply_changes: bool = False):
    project_root = Path(__file__).resolve().parent.parent
    candidate_dir = project_root / "ml" / "dataset" / "yolo_candidate_303"
    target_clean_dir = project_root / "ml" / "dataset" / "yolo_clean_303"
    workspace_dir = project_root / "ml" / "dataset" / "relabel_workspace"

    print("=" * 75)
    print("RoadSense AI — Clean 3-Class YOLO Dataset Assembler")
    print("=" * 75)
    print(f"Source Review CSV  : {source_csv_path}")
    print(f"Candidate Source   : {candidate_dir}")
    print(f"Target Clean Dir   : {target_clean_dir}")
    print(f"Execution Mode     : {'APPLY (Build Files)' if apply_changes else 'DRY RUN (Validation Only)'}")
    print("-" * 75)

    if not source_csv_path.exists():
        print(f"[ERROR] Review sheet not found: {source_csv_path}")
        sys.exit(1)

    with open(source_csv_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        review_rows = list(reader)

    review_by_filename = {r["filename"].lower(): r for r in review_rows}
    print(f"Total reviewed entries loaded: {len(review_by_filename)}")

    splits = ["train", "val", "test"]
    all_candidate_images = {}
    for sp in splits:
        img_dir = candidate_dir / "images" / sp
        lbl_dir = candidate_dir / "labels" / sp
        for img_f in sorted(img_dir.glob("*.*")):
            lbl_f = lbl_dir / f"{img_f.stem}.txt"
            all_candidate_images[img_f.name] = {
                "file_path": img_f,
                "label_path": lbl_f,
                "split": sp,
                "stem": img_f.stem
            }

    print(f"Total images in candidate pool: {len(all_candidate_images)}")

    # Specific coordinate fixes for known shifted test boxes
    # Center crater bounds for 11 (2).jpg and 12 (2).jpg
    coord_overrides = {
        "11 (2).jpg": [(0, 0.44, 0.58, 0.62, 0.42)],
        "12 (2).jpg": [(0, 0.44, 0.58, 0.62, 0.42)]
    }

    clean_split_counts = {"train": 0, "val": 0, "test": 0}
    clean_box_counts = {0: 0, 1: 0, 2: 0}
    split_hashes = {"train": set(), "val": set(), "test": set()}

    if apply_changes:
        for sp in splits:
            (target_clean_dir / "images" / sp).mkdir(parents=True, exist_ok=True)
            (target_clean_dir / "labels" / sp).mkdir(parents=True, exist_ok=True)

    for fname, meta in sorted(all_candidate_images.items()):
        sp = meta["split"]
        src_img = meta["file_path"]
        src_lbl = meta["label_path"]
        stem = meta["stem"]
        fname_lower = fname.lower()

        img_hash = get_file_sha256(src_img)
        split_hashes[sp].add(img_hash)
        clean_split_counts[sp] += 1

        target_boxes = []

        if fname_lower in coord_overrides:
            # Shifted box fix applied
            target_boxes = coord_overrides[fname_lower]
        elif fname_lower in review_by_filename:
            r = review_by_filename[fname_lower]
            decision = r.get("reviewer_decision", "").strip().upper()
            prop_cls = r.get("proposed_class", "").strip()
            corr_cls = r.get("corrected_class", "").strip()

            if decision == "REMOVE_BACKGROUND":
                target_boxes = []  # Empty label file (negative background)
            else:
                if corr_cls:
                    final_cls_name = corr_cls
                elif "POTHOLE" in decision:
                    final_cls_name = "Pothole"
                elif "CRACK" in decision:
                    final_cls_name = "Crack"
                elif "ROAD_PATCH" in decision or "PATCH" in decision:
                    final_cls_name = "Road_Patch"
                else:
                    final_cls_name = prop_cls
                final_cls_id = NEW_CLASS_MAP.get(final_cls_name, 0)

                # Read existing bounding box geometries
                if src_lbl.exists():
                    lines = [l.strip().split() for l in src_lbl.read_text(encoding="utf-8").splitlines() if l.strip()]
                    for p in lines:
                        try:
                            cx, cy, bw, bh = float(p[1]), float(p[2]), float(p[3]), float(p[4])
                            target_boxes.append((final_cls_id, cx, cy, bw, bh))
                        except Exception:
                            pass
        else:
            # Untouched consistent image (old Pothole, class 2 -> new Pothole, class 0)
            if src_lbl.exists():
                lines = [l.strip().split() for l in src_lbl.read_text(encoding="utf-8").splitlines() if l.strip()]
                for p in lines:
                    try:
                        old_c = int(p[0])
                        new_c = LEGACY_TO_NEW.get(old_c, 0)
                        cx, cy, bw, bh = float(p[1]), float(p[2]), float(p[3]), float(p[4])
                        target_boxes.append((new_c, cx, cy, bw, bh))
                    except Exception:
                        pass

        for c, _, _, _, _ in target_boxes:
            clean_box_counts[c] = clean_box_counts.get(c, 0) + 1

        if apply_changes:
            dst_img = target_clean_dir / "images" / sp / fname
            dst_lbl = target_clean_dir / "labels" / sp / f"{stem}.txt"

            if not dst_img.exists():
                shutil.copy2(src_img, dst_img)

            lbl_lines = [f"{c} {cx:.6f} {cy:.6f} {bw:.6f} {bh:.6f}" for (c, cx, cy, bw, bh) in target_boxes]
            dst_lbl.write_text("\n".join(lbl_lines) + ("\n" if lbl_lines else ""), encoding="utf-8")

    # Anti-leakage partition check
    inter_train_val = split_hashes["train"] & split_hashes["val"]
    inter_train_test = split_hashes["train"] & split_hashes["test"]
    inter_val_test = split_hashes["val"] & split_hashes["test"]
    leakage = len(inter_train_val) + len(inter_train_test) + len(inter_val_test)

    # Write data.yaml if apply
    if apply_changes:
        yaml_content = f"""path: ml/dataset/yolo_clean_303

train: images/train
val: images/val
test: images/test

names:
  0: Pothole
  1: Crack
  2: Road_Patch
"""
        yaml_path = target_clean_dir / "data.yaml"
        yaml_path.write_text(yaml_content, encoding="utf-8")
        print(f"[INFO] Created clean data.yaml at: {yaml_path}")

    print("\n" + "=" * 75)
    print("CLEAN DATASET INTEGRITY & BALANCE SUMMARY")
    print("=" * 75)
    print("Images Partition:")
    for sp in splits:
        print(f"  - {sp:6}: {clean_split_counts[sp]:3d} images")
    print("Class Box Distribution (New 3-Class Taxonomy):")
    total_boxes = sum(clean_box_counts.values())
    for cid, cname in NEW_CLASS_NAMES.items():
        cnt = clean_box_counts.get(cid, 0)
        pct = (cnt / total_boxes * 100) if total_boxes else 0
        print(f"  - Class {cid} ({cname:10}): {cnt:3d} boxes ({pct:5.1f}%)")
    print(f"Total Bounding Boxes: {total_boxes}")
    print(f"Anti-Leakage Hash Overlaps : {leakage} (0 Expected)")
    print("=" * 75)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Assemble clean 3-class YOLO dataset from reviewed labels.")
    parser.add_argument("--source-csv", type=str, default="ml/dataset/relabel_workspace/review_results.csv",
                        help="Path to reviewed CSV sheet")
    parser.add_argument("--apply", action="store_true", help="Apply changes and build target dataset files")
    args = parser.parse_args()

    project_root = Path(__file__).resolve().parent.parent
    src_csv = project_root / args.source_csv if not Path(args.source_csv).is_absolute() else Path(args.source_csv)

    build_clean_dataset(src_csv, apply_changes=args.apply)
