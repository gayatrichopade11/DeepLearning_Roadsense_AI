import os
import csv
import shutil
from pathlib import Path

def create_relabel_workspace():
    project_root = Path(".").resolve()
    candidate_dir = project_root / "ml" / "dataset" / "yolo_candidate_303"
    workspace_dir = project_root / "ml" / "dataset" / "relabel_workspace"
    images_dest_dir = workspace_dir / "images"
    metadata_dest_dir = workspace_dir / "metadata"

    print("=" * 75)
    print("RoadSense AI — Relabel Workspace Setup")
    print("=" * 75)

    images_dest_dir.mkdir(parents=True, exist_ok=True)
    metadata_dest_dir.mkdir(parents=True, exist_ok=True)

    splits = ["train", "val", "test"]

    # Source folders mapping for origin verification
    orig_dirs = {
        "Asphalt": project_root / "ml" / "dataset" / "Asphalt",
        "Crack": project_root / "ml" / "dataset" / "Crack",
        "Pothole": project_root / "ml" / "dataset" / "Pothole"
    }
    orig_map = {}
    for cname, p in orig_dirs.items():
        if p.exists():
            for f in p.glob("*.*"):
                orig_map[f.name.lower()] = cname

    # Load all 303 images
    all_images = {}
    for sp in splits:
        img_dir = candidate_dir / "images" / sp
        lbl_dir = candidate_dir / "labels" / sp
        for img_f in sorted(img_dir.glob("*.*")):
            lbl_f = lbl_dir / f"{img_f.stem}.txt"
            classes = set()
            boxes = []
            if lbl_f.exists():
                lines = [l.strip().split() for l in lbl_f.read_text(encoding="utf-8").splitlines() if l.strip()]
                classes = set(int(p[0]) for p in lines)
                boxes = lines
            all_images[img_f.name] = {
                "file_path": img_f,
                "split": sp,
                "classes": classes,
                "boxes": boxes,
                "orig_folder": orig_map.get(img_f.name.lower(), "Unknown")
            }

    print(f"Total candidate dataset images: {len(all_images)}")

    # 1. Specific problematic test examples from ERROR_ANALYSIS_REPORT.md
    explicit_test_problems = {
        "11 (2).jpg": ("Pothole", "Pothole", "Shifted bounding box: box placed on empty pavement above crater; requires re-centering tightly on crater", "High / Needs Bounding Box Re-alignment"),
        "12 (2).jpg": ("Pothole", "Pothole", "Shifted bounding box: box placed on empty pavement above crater; requires re-centering tightly on crater", "High / Needs Bounding Box Re-alignment"),
        "20240301_085244.jpg": ("Crack", "Pothole", "Excavated crater with exposed red sub-base mislabeled as Crack; reclassify as Pothole", "High / Needs Class Reassignment"),
        "53 (2).JPG": ("Crack", "Pothole", "Deep elongated road crater with broken edges mislabeled as Crack; reclassify as Pothole", "High / Needs Class Reassignment"),
        "IMG20240301092818.jpg": ("Crack", "Pothole", "Collapsed hole depression with broken asphalt rim mislabeled as Crack; reclassify as Pothole", "High / Needs Class Reassignment"),
        "IMG20240301090425.jpg": ("Crack", "Pothole", "Missing asphalt depression with exposed sub-base mislabeled as Crack; reclassify as Pothole", "High / Needs Class Reassignment"),
        "IMG20240301092533.jpg": ("Crack", "Pothole", "Excavated road crater with exposed dirt mislabeled as Crack; reclassify as Pothole", "High / Needs Class Reassignment"),
        "28 (2).JPG": ("Pothole", "Crack", "Surface alligator/fatigue crack network on planar asphalt mislabeled as Pothole; reclassify as Crack", "High / Needs Class Reassignment"),
        "32.JPG": ("Pothole", "Crack", "Alligator crack network on flat asphalt surface mislabeled as Pothole; reclassify as Crack", "High / Needs Class Reassignment"),
        "32 (2).jpg": ("Pothole", "Crack", "Alligator crack network on flat asphalt surface mislabeled as Pothole; reclassify as Crack", "High / Needs Class Reassignment"),
        "33.JPG": ("Pothole", "Crack", "Surface fatigue cracking on flat pavement mislabeled as Pothole; reclassify as Crack", "High / Needs Class Reassignment"),
        "33 (2).jpg": ("Pothole", "Crack", "Surface fatigue cracking on flat pavement mislabeled as Pothole; reclassify as Crack", "High / Needs Class Reassignment"),
        "50.JPG": ("Crack", "Crack", "Alligator crack cluster; verify tight bounding box perimeter and distinction from fatigue potholing", "Medium / Needs Boundary Verification"),
        "85 (2).JPG": ("Crack", "Crack", "Interconnected planar surface cracks; verify bounding box boundary", "Medium / Needs Boundary Verification"),
        "52 (4).JPG": ("Asphalt, Crack", "Crack", "Multi-class collision across adjacent damage; verify crack boundary and separate from road surface", "High / Needs Multi-Class Separation"),
        "20240301_081401.jpg": ("Pothole", "Pothole", "Tiny distant box on road; evaluate whether distinct pothole or negative background", "Medium / Needs Scope Verification")
    }

    queue = []
    seen = set()

    # Step 1: Explicit test problems
    for fname, (curr_c, prop_c, reason, conf) in explicit_test_problems.items():
        matched_k = None
        for k in all_images:
            if k.lower() == fname.lower():
                matched_k = k
                break
        if matched_k and matched_k.lower() not in seen:
            queue.append({
                "image filename": matched_k,
                "current class": curr_c,
                "proposed new class": prop_c,
                "reason for review": reason,
                "confidence/status": conf,
                "_source_path": all_images[matched_k]["file_path"]
            })
            seen.add(matched_k.lower())

    # Step 2: Legacy Asphalt labeled images (0 in old taxonomy)
    # Under new taxonomy (0: Pothole, 1: Crack, 2: Road_Patch), Asphalt does not exist.
    for fname, data in all_images.items():
        if fname.lower() in seen:
            continue
        if 0 in data["classes"]:
            orig = data["orig_folder"]
            name_lower = fname.lower()
            if orig == "Crack" or "crack" in name_lower or fname.lower().startswith("69"):
                prop = "Crack"
                reason = "Legacy 'Asphalt' label on image exhibiting crack features; verify if Crack (1) or Road_Patch (2)"
                conf = "High / Needs Reclassification to Crack or Road_Patch"
            elif orig == "Pothole" or "pothole" in name_lower:
                prop = "Pothole"
                reason = "Legacy 'Asphalt' label on image originating from Pothole dataset; verify if Pothole (0) or Road_Patch (2)"
                conf = "High / Needs Reclassification to Pothole or Road_Patch"
            else:
                prop = "Road_Patch"
                reason = "Legacy 'Asphalt' class retired under new taxonomy; verify if asphalt repair patch (Road_Patch, 2) or intact road"
                conf = "High / Needs Reclassification to Road_Patch"

            queue.append({
                "image filename": fname,
                "current class": "Asphalt",
                "proposed new class": prop,
                "reason for review": reason,
                "confidence/status": conf,
                "_source_path": data["file_path"]
            })
            seen.add(fname.lower())

    # Step 3: Images from Pothole folder labeled as Crack (Class 1)
    for fname, data in all_images.items():
        if fname.lower() in seen:
            continue
        if data["orig_folder"] == "Pothole" and 1 in data["classes"]:
            queue.append({
                "image filename": fname,
                "current class": "Crack",
                "proposed new class": "Pothole",
                "reason for review": "Image collected in Pothole dataset but labeled as Crack in YOLO; verify if pothole crater (0) or crack (1)",
                "confidence/status": "High / Needs Class Reassignment",
                "_source_path": data["file_path"]
            })
            seen.add(fname.lower())

    # Step 4: Images from Crack or Asphalt folder labeled as Pothole (Class 2)
    for fname, data in all_images.items():
        if fname.lower() in seen:
            continue
        if data["orig_folder"] == "Crack" and 2 in data["classes"]:
            queue.append({
                "image filename": fname,
                "current class": "Pothole",
                "proposed new class": "Crack",
                "reason for review": "Image collected in Crack dataset but labeled as Pothole in YOLO; verify if surface crack (1) or pothole (0)",
                "confidence/status": "High / Needs Class Reassignment",
                "_source_path": data["file_path"]
            })
            seen.add(fname.lower())
        elif data["orig_folder"] == "Asphalt" and 2 in data["classes"]:
            queue.append({
                "image filename": fname,
                "current class": "Pothole",
                "proposed new class": "Pothole",
                "reason for review": "Image collected in Asphalt folder but labeled as Pothole; verify whether true pothole, patch, or surface wear",
                "confidence/status": "Medium / Needs Scope Verification",
                "_source_path": data["file_path"]
            })
            seen.add(fname.lower())

    # Step 5: Alligator crack stems in train/val
    alligator_stems = ["28", "32", "33"]
    for fname, data in list(all_images.items()):
        if fname.lower() in seen:
            continue
        stem = Path(fname).stem
        for pfx in alligator_stems:
            if stem == pfx or stem.startswith(f"{pfx} ") or stem.startswith(f"{pfx}("):
                if 2 in data["classes"]:
                    queue.append({
                        "image filename": fname,
                        "current class": "Pothole",
                        "proposed new class": "Crack",
                        "reason for review": "Alligator/fatigue cracking cluster image labeled as Pothole in YOLO; verify if Crack (1)",
                        "confidence/status": "High / Needs Class Reassignment",
                        "_source_path": data["file_path"]
                    })
                    seen.add(fname.lower())
                    break

    print(f"Total review queue entries: {len(queue)}")

    # Copy images to relabel_workspace/images/
    copied_count = 0
    for item in queue:
        src = item["_source_path"]
        dst = images_dest_dir / item["image filename"]
        if not dst.exists():
            shutil.copy2(src, dst)
        copied_count += 1

    print(f"Successfully copied {copied_count} images to: {images_dest_dir}")

    # Write relabel_queue.csv
    csv_path = metadata_dest_dir / "relabel_queue.csv"
    fieldnames = [
        "image filename",
        "current class",
        "proposed new class",
        "reason for review",
        "confidence/status"
    ]
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for item in queue:
            writer.writerow({
                "image filename": item["image filename"],
                "current class": item["current class"],
                "proposed new class": item["proposed new class"],
                "reason for review": item["reason for review"],
                "confidence/status": item["confidence/status"]
            })

    print(f"Successfully wrote relabel queue CSV to: {csv_path}")

    # Calculate statistics
    prop_counts = {"Pothole": 0, "Crack": 0, "Road_Patch": 0}
    for item in queue:
        p = item["proposed new class"]
        prop_counts[p] = prop_counts.get(p, 0) + 1

    print("Candidate counts by proposed class:")
    for k, v in prop_counts.items():
        print(f"  - {k:12}: {v}")

    # Create relabel_workspace/README.md
    readme_content = f"""# RoadSense AI — Relabeling Workspace & Annotation Guide

This workspace isolates all candidate images requiring human review to transition the dataset to the **clean 3-class road condition taxonomy**.

---

## 1. Scope & Rules of Engagement

1. **Human Review Is Mandatory**: No labels in any active or historical dataset are modified automatically. Human annotators must inspect every queued image before modifying or creating annotations.
2. **Existing Datasets Untouched**: `ml/dataset/yolo_candidate_303/`, `ml/dataset/yolo_final/`, and model weights (`ml/models/best.pt`, `best_303.pt`) remain strictly intact.
3. **Target Workspace**:
   - Images for review: `ml/dataset/relabel_workspace/images/` ({copied_count} images)
   - Review metadata queue: `ml/dataset/relabel_workspace/metadata/relabel_queue.csv`

---

## 2. Standardized Taxonomy Definition

| Class ID | Class Name | Definition | Visual Criteria | What NOT to Label |
| :---: | :---: | :--- | :--- | :--- |
| **0** | **Pothole** | Structural bowl-shaped cavity or depression in road surface where asphalt has fractured and excavated. | Depressed crater; visible depth/shadow; broken vertical asphalt edges; exposed sub-base gravel, soil, or aggregate. | Flat surface cracks without depth; surface staining; dark road wetness; clean asphalt patches. |
| **1** | **Crack** | Planar fracture in the asphalt pavement (longitudinal, transverse, or fatigue/alligator network). | Linear fractures or interconnected honeycomb/alligator patterns where the pavement remains planar (no crater or missing sub-base). | Craters with missing asphalt (those are Potholes); expansion joints filled with tar; paint markings. |
| **2** | **Road_Patch** | Man-made maintenance repairs or asphalt overlay applied over previous defects. | Distinct rectangular, circular, or irregular asphalt patches; fresh dark asphalt over weathered pavement; joint lines along repaired road sections. | Natural continuous asphalt roadway; unpaved shoulders; potholes or cracks inside a patch (label the defect itself). |

---

## 3. Class-Specific Annotation Instructions

### Class 0: Pothole
- **Bounding Box Geometry**: Draw a single tight bounding box framing the entire outer rim of the cavity.
- **Critical Fix (Shifted Boxes)**: Ensure the box is centered directly on the crater cavity. In legacy test images (e.g. `11 (2).jpg`, `12 (2).jpg`), legacy boxes were mistakenly placed on flat pavement above the pothole. Correct these to tightly fit the true crater.
- **Multiple Potholes**: If two distinct holes have separate rims, annotate them as two separate boxes. If they have merged into one contiguous trough, draw one bounding box.

### Class 1: Crack
- **Bounding Box Geometry**: Frame the extent of the crack network with minimal excess plain asphalt.
- **Alligator / Fatigue Cracks**: Group localized dense networks of interconnected cracks into a single encompassing `Crack` box (resolving legacy errors where alligator cracks like `28 (2).JPG`, `32.JPG`, `33.JPG` were mislabeled as Potholes).
- **Crack vs Pothole Rule**: If asphalt pieces within the crack have dislodged and created a vertical depression (> 25 mm deep) exposing aggregate, classify as **Pothole**. If the pavement remains level, classify as **Crack**.

### Class 2: Road_Patch
- **Bounding Box Geometry**: Frame the perimeter of the asphalt repair patch.
- **Legacy Asphalt Migration**: Legacy `Asphalt` annotations on maintenance repairs (`asp...` series) should be reviewed and tagged as `Road_Patch` if they represent distinct repair sections.
- **Intact Pavement Rule**: Normal, undamaged continuous road pavement MUST NOT be labeled. If an image contains only smooth roadway with no patch or defect, mark it as negative background (zero bounding boxes).

---

## 4. Review Queue Statistics

- **Total Images Requiring Human Review**: `{copied_count}`
- **Proposed Pothole Candidates**: `{prop_counts.get("Pothole", 0)}`
- **Proposed Crack Candidates**: `{prop_counts.get("Crack", 0)}`
- **Proposed Road_Patch Candidates**: `{prop_counts.get("Road_Patch", 0)}`
- **Queue Location**: [`ml/dataset/relabel_workspace/metadata/relabel_queue.csv`](file:///d:/MDM_CIVIL_PROJECT/ml/dataset/relabel_workspace/metadata/relabel_queue.csv)

---

## 5. Review Protocol for Annotators

1. Load `ml/dataset/relabel_workspace/images/` into your annotation tool (e.g., CVAT, LabelImg, Roboflow).
2. Open `metadata/relabel_queue.csv` to consult the proposed class and reason for review.
3. Apply the 3-class taxonomy rules above:
   - Verify class designation (0: Pothole, 1: Crack, 2: Road_Patch).
   - Verify bounding box bounds (tight fit, no shifted boxes).
   - If the image contains no defects or patches (pure plain asphalt), record zero boxes (negative background).
4. Save the verified labels in standard YOLO format (`class x_center y_center width height`) inside `ml/dataset/relabel_workspace/labels/` upon completing review.
"""
    readme_path = workspace_dir / "README.md"
    readme_path.write_text(readme_content, encoding="utf-8")
    print(f"Successfully created README at: {readme_path}")
    print("=" * 75)

    return copied_count, prop_counts, csv_path

if __name__ == "__main__":
    create_relabel_workspace()
