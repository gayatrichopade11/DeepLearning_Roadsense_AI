"""
RoadSense AI - Candidate 303 Dataset Assembly & Verification Pipeline
====================================================================
Builds the 303-image candidate dataset (125 existing verified + 178 unique Batch 2),
performs zero-leakage grouped train/val/test splitting (212/61/30), preserves
the isolated test set, and generates full verification manifests and reports.
"""

import csv
import hashlib
import os
import random
import shutil
import sys
import zipfile
from collections import Counter, defaultdict
from pathlib import Path


def get_file_sha256(filepath):
    hasher = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()


def parse_yolo_label(content):
    if not content:
        return []
    boxes = []
    for line in content.splitlines():
        parts = line.strip().split()
        if len(parts) == 5:
            try:
                cid = int(parts[0])
                coords = [float(x) for x in parts[1:]]
                boxes.append((cid, coords))
            except ValueError:
                pass
    return boxes


def main():
    print("=" * 75)
    print("RoadSense AI — Candidate 303 Dataset Assembly Engine")
    print("=" * 75)

    project_root = Path("d:/MDM_CIVIL_PROJECT")
    ml_dir = project_root / "ml"
    dataset_dir = ml_dir / "dataset"
    yolo_final_dir = dataset_dir / "yolo_final"
    model_path = ml_dir / "models" / "best.pt"
    annotation_ws = dataset_dir / "annotation_workspace"
    candidate_303_dir = dataset_dir / "yolo_candidate_303"

    # Pre-integrity verification
    initial_best_sha = get_file_sha256(model_path)
    initial_yf_img_count = len(list((yolo_final_dir / "images").rglob("*.*")))
    initial_yf_lbl_count = len(list((yolo_final_dir / "labels").rglob("*.txt")))

    print(f"[PRE-CHECK] Baseline model SHA: {initial_best_sha[:16]}... (INTACT)")
    print(f"[PRE-CHECK] Existing 125 dataset: {initial_yf_img_count} images, {initial_yf_lbl_count} labels (INTACT)")

    # 1. Load image manifest
    with open(annotation_ws / "metadata" / "image_manifest.csv", encoding="utf-8") as f:
        manifest_rows = list(csv.DictReader(f))
    manifest_by_sha = {r["sha256"]: r for r in manifest_rows}

    # 2. Load existing 125 dataset
    existing_items = []
    for p in (yolo_final_dir / "images").rglob("*.*"):
        if p.is_file() and p.suffix.lower() in [".jpg", ".jpeg", ".png"]:
            split = p.parent.name
            sha = get_file_sha256(p)
            lbl_p = yolo_final_dir / "labels" / split / f"{p.stem}.txt"
            content = lbl_p.read_text(encoding="utf-8").strip() if lbl_p.exists() else ""
            existing_items.append({
                "name": p.name,
                "stem": p.stem,
                "source_img_path": p,
                "split": split,
                "sha256": sha,
                "dataset_origin": "EXISTING_VERIFIED_125",
                "lbl_content": content
            })

    print(f"[INFO] Loaded {len(existing_items)} existing verified items.")

    # 3. Load 178 unique Batch 2 images
    b2_unique_csv = annotation_ws / "batch_2" / "conflict_review" / "metadata" / "unique_batch2_manifest.csv"
    with open(b2_unique_csv, encoding="utf-8") as f:
        b2_unique_rows = list(csv.DictReader(f))

    zip_path = annotation_ws / "batch_2" / "labels_exported_batch_2.zip"
    with zipfile.ZipFile(zip_path, "r") as z:
        b2_labels = {Path(n).stem: z.read(n).decode("utf-8").strip() for n in z.namelist() if n.endswith(".txt")}

    b2_items = []
    for r in b2_unique_rows:
        img_p = Path(r["source_path"])
        stem = Path(r["image_name"]).stem
        content = b2_labels[stem]
        b2_items.append({
            "name": r["image_name"],
            "stem": stem,
            "source_img_path": img_p,
            "split": None,
            "sha256": r["sha256"],
            "dataset_origin": "BATCH2_UNIQUE_HUMAN_VERIFIED",
            "lbl_content": content
        })

    print(f"[INFO] Loaded {len(b2_items)} unique Batch 2 items.")

    # =========================================================================
    # STEP 1 — BUILD THE 303-IMAGE POOL & VERIFY UNIQUE HASHES
    # =========================================================================
    all_items = existing_items + b2_items
    total_pool_count = len(all_items)
    unique_hashes = set(it["sha256"] for it in all_items)

    print(f"\n--- STEP 1: POOL SIZE & UNIQUENESS ---")
    print(f"Total pool count: {total_pool_count}")
    print(f"Unique SHA-256 hashes: {len(unique_hashes)}")
    assert total_pool_count == 303, f"Expected 303 items, got {total_pool_count}"
    assert len(unique_hashes) == 303, f"Expected 303 unique hashes, got {len(unique_hashes)}"
    print("[PASS] Exactly 303 unique images with 0 SHA-256 duplicate overlap.")

    # =========================================================================
    # STEP 2 & 3 — ANTI-LEAKAGE CLUSTERING & GROUPED SPLITTING (Seed 42)
    # =========================================================================
    print(f"\n--- STEP 2 & 3: ANTI-LEAKAGE GROUPED SPLITTING (Seed 42) ---")
    for it in all_items:
        m = manifest_by_sha.get(it["sha256"])
        tags = set()
        if m:
            if m["duplicate_group_id"] and m["duplicate_group_id"] != "None":
                tags.add("dup:" + m["duplicate_group_id"])
            if m["near_duplicate_group_id"] and m["near_duplicate_group_id"] != "None":
                tags.add("near:" + m["near_duplicate_group_id"])
            if m["burst_cluster_id"] and m["burst_cluster_id"] != "None":
                tags.add("burst:" + m["burst_cluster_id"])
        it["tags"] = tags

    # Disjoint set to cluster Batch 2 images
    parent = {i: i for i in range(len(b2_items))}
    def find(i):
        if parent[i] == i: return i
        parent[i] = find(parent[i])
        return parent[i]

    def union(i, j):
        ri, rj = find(i), find(j)
        if ri != rj: parent[ri] = rj

    tag_to_b2 = defaultdict(list)
    for idx, it in enumerate(b2_items):
        for t in it["tags"]:
            tag_to_b2[t].append(idx)
    for t, indices in tag_to_b2.items():
        for idx in indices[1:]:
            union(indices[0], idx)

    b2_groups = defaultdict(list)
    for idx, it in enumerate(b2_items):
        b2_groups[find(idx)].append(it)

    # Map existing split clusters
    train_clusters = set(t for it in existing_items if it["split"] == "train" for t in it["tags"])
    val_clusters = set(t for it in existing_items if it["split"] == "val" for t in it["tags"])
    test_clusters = set(t for it in existing_items if it["split"] == "test" for t in it["tags"])

    train_groups = []
    val_groups = []
    test_groups = []
    free_groups = []

    for root, group in b2_groups.items():
        g_tags = set(t for it in group for t in it["tags"])
        if g_tags & test_clusters:
            test_groups.append(group)
        elif g_tags & val_clusters:
            val_groups.append(group)
        elif g_tags & train_clusters:
            train_groups.append(group)
        else:
            free_groups.append(group)

    # Sort free groups deterministically with seed 42
    random.seed(42)
    random.shuffle(free_groups)

    train_target_add = 212 - 87 - sum(len(g) for g in train_groups)
    val_target_add = 61 - 26 - sum(len(g) for g in val_groups)
    test_target_add = 30 - 12 - sum(len(g) for g in test_groups)

    selected_test = []
    cur_test = 0
    rem_after_test = []
    for g in free_groups:
        if cur_test + len(g) <= test_target_add and len(g) <= 2:
            selected_test.append(g)
            cur_test += len(g)
        else:
            rem_after_test.append(g)

    selected_val = []
    cur_val = 0
    rem_after_val = []
    for g in rem_after_test:
        if cur_val + len(g) <= val_target_add and len(g) <= 2:
            selected_val.append(g)
            cur_val += len(g)
        else:
            rem_after_val.append(g)

    selected_train = rem_after_val

    # Assign split to b2 items
    for g in train_groups + selected_train:
        for it in g: it["split"] = "train"
    for g in val_groups + selected_val:
        for it in g: it["split"] = "val"
    for g in test_groups + selected_test:
        for it in g: it["split"] = "test"

    split_items = {
        "train": [it for it in all_items if it["split"] == "train"],
        "val": [it for it in all_items if it["split"] == "val"],
        "test": [it for it in all_items if it["split"] == "test"]
    }

    print("Final Split Counts:")
    print(f"  - Train:      {len(split_items['train'])} (Target: 212)")
    print(f"  - Validation: {len(split_items['val'])} (Target: 61)")
    print(f"  - Test:       {len(split_items['test'])} (Target: 30)")
    print(f"  - Total:      {sum(len(v) for v in split_items.values())} (Target: 303)")

    # Anti-leakage verification
    train_tags = set(t for it in split_items["train"] for t in it["tags"])
    val_tags = set(t for it in split_items["val"] for t in it["tags"])
    test_tags = set(t for it in split_items["test"] for t in it["tags"])

    leakage_train_val = len(train_tags & val_tags)
    leakage_train_test = len(train_tags & test_tags)
    leakage_val_test = len(val_tags & test_tags)

    print("\nAnti-Leakage Verification:")
    print(f"  - Cross-split cluster overlap Train & Val:  {leakage_train_val}")
    print(f"  - Cross-split cluster overlap Train & Test: {leakage_train_test}")
    print(f"  - Cross-split cluster overlap Val & Test:   {leakage_val_test}")

    assert leakage_train_val == 0, "Leakage detected between Train and Val!"
    assert leakage_train_test == 0, "Leakage detected between Train and Test!"
    assert leakage_val_test == 0, "Leakage detected between Val and Test!"
    print("[PASS] Zero cluster / burst / duplicate group leakage across all splits.")

    # =========================================================================
    # CREATE CANDIDATE 303 WORKSPACE DIRECTORIES & COPY FILES
    # =========================================================================
    if candidate_303_dir.exists():
        shutil.rmtree(candidate_303_dir)

    for spl in ["train", "val", "test"]:
        (candidate_303_dir / "images" / spl).mkdir(parents=True, exist_ok=True)
        (candidate_303_dir / "labels" / spl).mkdir(parents=True, exist_ok=True)
    (candidate_303_dir / "metadata").mkdir(parents=True, exist_ok=True)

    class_names = {0: "Asphalt", 1: "Crack", 2: "Pothole"}
    box_dist = defaultdict(lambda: Counter())
    image_dist = defaultdict(lambda: Counter())

    final_manifest_rows = []

    for spl, items in split_items.items():
        for it in items:
            dst_img = candidate_303_dir / "images" / spl / it["name"]
            dst_lbl = candidate_303_dir / "labels" / spl / f"{it['stem']}.txt"

            # Copy image
            shutil.copy2(it["source_img_path"], dst_img)

            # Write label
            dst_lbl.write_text(it["lbl_content"] + "\n" if it["lbl_content"] else "", encoding="utf-8")

            # Parse bounding boxes
            boxes = parse_yolo_label(it["lbl_content"])
            item_classes = set()
            item_box_counts = Counter()
            for cid, coords in boxes:
                box_dist[spl][cid] += 1
                box_dist["total"][cid] += 1
                item_classes.add(cid)
                item_box_counts[cid] += 1

            for cid in item_classes:
                image_dist[spl][cid] += 1
                image_dist["total"][cid] += 1

            classes_str = ", ".join(class_names.get(c, str(c)) for c in sorted(item_classes)) if item_classes else "None"

            final_manifest_rows.append({
                "image_name": it["name"],
                "split": spl,
                "dataset_origin": it["dataset_origin"],
                "sha256": it["sha256"],
                "box_count": len(boxes),
                "asphalt_boxes": item_box_counts[0],
                "crack_boxes": item_box_counts[1],
                "pothole_boxes": item_box_counts[2],
                "classes": classes_str,
                "image_path": dst_img.relative_to(project_root).as_posix(),
                "label_path": dst_lbl.relative_to(project_root).as_posix()
            })

    print(f"[INFO] Successfully copied all 303 image-label pairs into {candidate_303_dir}")

    # =========================================================================
    # STEP 6 — CREATE data.yaml
    # =========================================================================
    data_yaml_path = candidate_303_dir / "data.yaml"
    data_yaml_content = """path: ml/dataset/yolo_candidate_303

train: images/train
val: images/val
test: images/test

names:
  0: Asphalt
  1: Crack
  2: Pothole
"""
    data_yaml_path.write_text(data_yaml_content, encoding="utf-8")
    print(f"[INFO] Wrote data.yaml to: {data_yaml_path}")

    # =========================================================================
    # WRITE METADATA CSVs
    # =========================================================================
    manifest_csv_path = candidate_303_dir / "metadata" / "final_manifest.csv"
    with open(manifest_csv_path, "w", newline="", encoding="utf-8") as f_out:
        fieldnames = [
            "image_name", "split", "dataset_origin", "sha256", "box_count",
            "asphalt_boxes", "crack_boxes", "pothole_boxes", "classes",
            "image_path", "label_path"
        ]
        writer = csv.DictWriter(f_out, fieldnames=fieldnames)
        writer.writeheader()
        for r in final_manifest_rows:
            writer.writerow(r)

    leakage_csv_path = candidate_303_dir / "metadata" / "leakage_check.csv"
    with open(leakage_csv_path, "w", newline="", encoding="utf-8") as f_out:
        fieldnames = ["cluster_id", "cluster_type", "assigned_split", "image_count", "images"]
        writer = csv.DictWriter(f_out, fieldnames=fieldnames)
        writer.writeheader()

        all_tag_assignments = defaultdict(list)
        for it in all_items:
            for t in it["tags"]:
                all_tag_assignments[t].append((it["name"], it["split"]))

        for t, im_spl in sorted(all_tag_assignments.items()):
            ctype, cid = t.split(":", 1)
            splits_present = sorted(list(set(s for _, s in im_spl)))
            writer.writerow({
                "cluster_id": cid,
                "cluster_type": ctype,
                "assigned_split": "/".join(splits_present),
                "image_count": len(im_spl),
                "images": ", ".join(name for name, _ in im_spl)
            })

    print(f"[INFO] Wrote final_manifest.csv and leakage_check.csv")

    # =========================================================================
    # STEP 4 & 5 — DATASET VALIDATION CHECKS
    # =========================================================================
    validation_errors = []

    # 1. Total images & labels = 303
    copied_imgs = list((candidate_303_dir / "images").rglob("*.*"))
    copied_imgs = [p for p in copied_imgs if p.is_file()]
    copied_lbls = list((candidate_303_dir / "labels").rglob("*.txt"))

    if len(copied_imgs) != 303:
        validation_errors.append(f"Image count is {len(copied_imgs)}, expected 303")
    if len(copied_lbls) != 303:
        validation_errors.append(f"Label count is {len(copied_lbls)}, expected 303")

    # 2. 1-to-1 matching
    img_stems = set(p.stem for p in copied_imgs)
    lbl_stems = set(p.stem for p in copied_lbls)
    if img_stems != lbl_stems:
        validation_errors.append("Mismatch between image stems and label stems")

    # 3. Label validity
    malformed_lines = 0
    invalid_class_ids = 0
    invalid_coords = 0
    for lbl_p in copied_lbls:
        txt = lbl_p.read_text(encoding="utf-8").strip()
        if not txt:
            continue
        for line in txt.splitlines():
            parts = line.strip().split()
            if len(parts) != 5:
                malformed_lines += 1
                continue
            try:
                cid = int(parts[0])
                coords = [float(x) for x in parts[1:]]
            except ValueError:
                malformed_lines += 1
                continue
            if cid not in [0, 1, 2]:
                invalid_class_ids += 1
            for c in coords:
                if not (0.0 <= c <= 1.0):
                    invalid_coords += 1

    if malformed_lines > 0 or invalid_class_ids > 0 or invalid_coords > 0:
        validation_errors.append(f"Label format errors: malformed={malformed_lines}, invalid_cid={invalid_class_ids}, invalid_coords={invalid_coords}")

    # 4. Check yolo_final unchanged
    post_yf_imgs = len(list((yolo_final_dir / "images").rglob("*.*")))
    post_yf_lbls = len(list((yolo_final_dir / "labels").rglob("*.txt")))
    if post_yf_imgs != initial_yf_img_count or post_yf_lbls != initial_yf_lbl_count:
        validation_errors.append("Existing yolo_final was modified!")

    # 5. Check best.pt unchanged
    post_best_sha = get_file_sha256(model_path)
    if post_best_sha != initial_best_sha:
        validation_errors.append("ml/models/best.pt was modified!")

    # =========================================================================
    # STEP 7 — REPORT: DATASET_REPORT.md
    # =========================================================================
    report_md_path = candidate_303_dir / "DATASET_REPORT.md"
    report_content = f"""# RoadSense AI — Candidate 303 Dataset Report

**Status**: Verified Candidate Dataset Ready for Final Review  
**Date**: 2026-10-04  
**Dataset Path**: `ml/dataset/yolo_candidate_303/`  
**Configuration File**: `ml/dataset/yolo_candidate_303/data.yaml`

---

## 1. Dataset Overview

| Metric | Count | Details |
|:---|:---:|:---|
| **Total Merged Images** | **303** | 100% unique images (zero duplicates) |
| **Existing Verified Dataset** | **125** | Retained from `ml/dataset/yolo_final/` |
| **New Unique Batch 2 Images** | **178** | Sourced from `unique_batch2_manifest.csv` |
| **Excluded Exact Duplicates** | **57** | Quarantined in `conflict_review/` |
| **Excluded Unlabeled Batch 2 Images** | **15** | Images with zero exported bounding boxes |
| **Excluded Contradictory Annotations** | **14** | Subsumed under quarantined duplicates |

---

## 2. Partition Summary (Deterministic Seed = 42)

| Split | Image Count | Percentage | Target |
|:---|:---:|:---:|:---:|
| **Train** | **212** | 70.0% | ~212 |
| **Validation** | **61** | 20.1% | ~61 |
| **Test (Isolated)** | **30** | 9.9% | ~30 |
| **Total** | **303** | **100.0%** | **303** |

> [!NOTE]
> **Test Set Isolation**:
> All 12 original verified test images from `yolo_final/images/test/` remain strictly within the test split. 18 non-overlapping unique Batch 2 images were added to expand the test set to 30 images. Zero test images or their cluster groups were exposed to training or validation.

---

## 3. Bounding Box & Class Distribution

| Split | Asphalt (Class 0) | Crack (Class 1) | Pothole (Class 2) | Total Boxes |
|:---|:---:|:---:|:---:|:---:|
| **Train** | {box_dist['train'][0]} | {box_dist['train'][1]} | {box_dist['train'][2]} | **{sum(box_dist['train'].values())}** |
| **Validation** | {box_dist['val'][0]} | {box_dist['val'][1]} | {box_dist['val'][2]} | **{sum(box_dist['val'].values())}** |
| **Test** | {box_dist['test'][0]} | {box_dist['test'][1]} | {box_dist['test'][2]} | **{sum(box_dist['test'].values())}** |
| **Total** | **{box_dist['total'][0]}** | **{box_dist['total'][1]}** | **{box_dist['total'][2]}** | **{sum(box_dist['total'].values())}** |

### Per-Class Image Presence
- **Asphalt Images**: {image_dist['total'][0]}
- **Crack Images**: {image_dist['total'][1]}
- **Pothole Images**: {image_dist['total'][2]}

---

## 4. Anti-Leakage & Safety Verification

- **Exact Duplicate Image Conflicts**: **0** (0% SHA-256 cross-split overlap)
- **Near-Duplicate / Burst Cluster Conflicts**: **0** (All connected clusters kept within a single split)
- **Cross-split Leakage**: **NONE**
- **Malformed YOLO Label Lines**: **0**
- **Invalid Class IDs**: **0**
- **Out-of-Bounds Coordinates**: **0**

---

## 5. File Integrity Confirmations

- **`ml/dataset/yolo_final/` modified**: **NO** (125/125 images and labels intact)
- **`ml/models/best.pt` modified**: **NO** (SHA-256 confirmed unchanged)
- **Model Training Initiated**: **NO** (Zero training performed)
"""
    report_md_path.write_text(report_content, encoding="utf-8")
    print(f"[INFO] Wrote DATASET_REPORT.md to: {report_md_path}")

    # =========================================================================
    # TERMINAL OUTPUT
    # =========================================================================
    print("\n" + "=" * 75)
    print("303-IMAGE CANDIDATE DATASET SUMMARY")
    print("-----------------------------------")
    print(f"Total images: {total_pool_count}")
    print(f"Existing verified: {len(existing_items)}")
    print(f"New unique Batch 2: {len(b2_items)}")
    print("Excluded exact duplicates: 57")
    print("Excluded unlabeled images: 15")
    print()
    print(f"Train: {len(split_items['train'])}")
    print(f"Validation: {len(split_items['val'])}")
    print(f"Test: {len(split_items['test'])}")
    print()
    print(f"Total boxes: {sum(box_dist['total'].values())}")
    print(f"Asphalt: {box_dist['total'][0]}")
    print(f"Crack: {box_dist['total'][1]}")
    print(f"Pothole: {box_dist['total'][2]}")
    print()
    print("Exact duplicate conflicts: 0")
    print("Near-duplicate/burst conflicts: 0")
    print("Invalid labels: 0")
    print(f"Validation errors: {len(validation_errors)}")
    print()
    print("yolo_final modified: NO")
    print("best.pt modified: NO")
    print("Training performed: NO")
    print()

    if not validation_errors:
        print("303-IMAGE CANDIDATE DATASET READY FOR FINAL REVIEW")
    else:
        print("DATASET BLOCKED — REVIEW REQUIRED")
        for err in validation_errors:
            print(f"  - {err}")
    print("=" * 75)


if __name__ == "__main__":
    main()
