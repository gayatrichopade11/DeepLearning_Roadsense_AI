"""
RoadSense AI - Dataset Audit Tool
=================================
Purpose:
--------
This script systematically inspects the RoadSense AI dataset directory (`ml/dataset/`)
to evaluate dataset health, volume, distribution, integrity, and annotation readiness
before starting the deep learning / machine learning phase.

Target Classes:
---------------
- Asphalt
- Crack
- Pothole

Key Audit Capabilities:
-----------------------
1. Counts total images and breaks down distribution by class folder.
2. Identifies all image formats and extensions (JPG, JPEG, PNG, WEBP, etc.).
3. Verifies file integrity using Pillow (PIL) to detect corrupted or unreadable files.
4. Analyzes image resolutions (min, max, median, and most frequent dimensions).
5. Searches for annotation files (.txt, .xml, .json, .csv) across all folders.
6. Determines dataset architecture type:
   - Classification: Images grouped in class-labeled directories without bounding box annotations.
   - Object Detection: Images accompanied by bounding box labels (e.g., YOLO coordinates).
   - Mixed / Unknown.
7. Evaluates class imbalance ratio and distribution percentages.

Usage:
------
    python ml/audit_dataset.py
    python ml/audit_dataset.py --dataset-dir ml/dataset
"""

import argparse
import os
import sys
from collections import Counter
from pathlib import Path

# Attempt to import PIL for image dimension and corruption checks
try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False


# Supported image and annotation extensions
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tif", ".tiff"}
ANNOTATION_EXTENSIONS = {".txt", ".xml", ".json", ".csv"}

# Target canonical classes for RoadSense AI
EXPECTED_CLASSES = ["Asphalt", "Crack", "Pothole"]

# Mapping for common name variations / spelling discrepancies
CLASS_SYNONYMS = {
    "asphalt": "Asphalt",
    "crack": "Crack",
    "creak": "Crack",
    "pothole": "Pothole",
    "pot hole": "Pothole",
    "pathole": "Pothole",
}


def canonicalize_class_name(name: str) -> str:
    """Normalize folder or label name to canonical class name if recognized."""
    cleaned = name.strip().lower()
    return CLASS_SYNONYMS.get(cleaned, name)


def inspect_dataset(dataset_dir: Path) -> dict:
    """
    Perform a complete audit of the dataset directory.

    Returns:
        dict: Detailed statistics including image counts, formats,
              dimensions, corruptions, annotations, and dataset type.
    """
    if not dataset_dir.exists():
        raise FileNotFoundError(f"Dataset directory does not exist: {dataset_dir}")

    total_images = 0
    format_counter = Counter()
    class_counter = Counter()
    corrupted_files = []
    dimensions = []
    annotations_found = []
    yolo_labels_count = 0

    # Scan all files recursively
    for root, _, files in os.walk(dataset_dir):
        root_path = Path(root)
        rel_path = root_path.relative_to(dataset_dir)

        # Identify class folder from directory structure
        folder_class = None
        if len(rel_path.parts) > 0:
            folder_class = canonicalize_class_name(rel_path.parts[0])

        for file in files:
            file_path = root_path / file
            suffix = file_path.suffix.lower()

            # Check if file is an image
            if suffix in IMAGE_EXTENSIONS:
                total_images += 1
                format_name = suffix.replace(".", "").upper()
                format_counter[format_name] += 1

                # Attribute image to class folder if nested inside a recognized folder
                if folder_class:
                    class_counter[folder_class] += 1
                else:
                    class_counter["Uncategorized"] += 1

                # Verify image integrity and dimensions using PIL
                if HAS_PIL:
                    try:
                        with Image.open(file_path) as img:
                            img.verify()  # Check for corruption without decoding full pixel buffer
                        # Re-open to read dimensions as verify() alters internal image state
                        with Image.open(file_path) as img:
                            dimensions.append(img.size)  # (width, height)
                    except Exception as err:
                        corrupted_files.append((str(file_path), str(err)))

            # Check for annotation files
            elif suffix in ANNOTATION_EXTENSIONS:
                # Disregard generic system or readme files
                if file.lower() not in {"classes.txt", "readme.txt", "notes.txt"}:
                    annotations_found.append(str(file_path))
                    if suffix == ".txt":
                        # Check if text file follows YOLO format: <class_id> <x> <y> <w> <h>
                        try:
                            with open(file_path, "r", encoding="utf-8") as f:
                                lines = [ln.strip().split() for ln in f if ln.strip()]
                                if lines and all(len(p) == 5 for p in lines):
                                    yolo_labels_count += 1
                        except Exception:
                            pass

    # Determine dataset type based on findings
    if annotations_found and yolo_labels_count > 0:
        dataset_type = "Object Detection (YOLO format with bounding boxes)"
    elif annotations_found:
        dataset_type = "Object Detection (Annotations found)"
    elif total_images > 0 and len(class_counter) > 1:
        dataset_type = "Classification (Images organized in class directories, no bounding boxes)"
    elif total_images > 0:
        dataset_type = "Unlabeled Images (Single directory, no annotations)"
    else:
        dataset_type = "Empty / Unknown"

    # Analyze dimensions
    dim_summary = "Pillow (PIL) not available to inspect dimensions"
    if dimensions:
        widths, heights = zip(*dimensions)
        min_dim = (min(widths), min(heights))
        max_dim = (max(widths), max(heights))
        avg_w = sum(widths) // len(widths)
        avg_h = sum(heights) // len(heights)
        most_common_dims = Counter(dimensions).most_common(3)
        common_str = ", ".join(f"{w}x{h} ({cnt} imgs)" for (w, h), cnt in most_common_dims)
        dim_summary = (
            f"Min: {min_dim[0]}x{min_dim[1]} px | "
            f"Max: {max_dim[0]}x{max_dim[1]} px | "
            f"Average: ~{avg_w}x{avg_h} px\n"
            f"Most frequent resolutions: {common_str}"
        )

    # Analyze class balance
    imbalance_summary = "N/A (No class data)"
    if total_images > 0 and class_counter:
        imbalance_lines = []
        counts = [class_counter.get(c, 0) for c in EXPECTED_CLASSES if c in class_counter]
        for c, count in class_counter.items():
            pct = (count / total_images) * 100
            imbalance_lines.append(f"{c}: {count} ({pct:.1f}%)")
        if counts and min(counts) > 0:
            ratio = max(counts) / min(counts)
            balance_assessment = "Well balanced" if ratio < 1.3 else ("Moderate skew" if ratio < 2.0 else "High imbalance")
            imbalance_lines.append(f"Ratio (Max/Min): {ratio:.2f} ({balance_assessment})")
        imbalance_summary = "\n".join(imbalance_lines)

    return {
        "dataset_dir": str(dataset_dir),
        "total_images": total_images,
        "class_counter": dict(class_counter),
        "format_counter": dict(format_counter),
        "corrupted_files": corrupted_files,
        "annotations_found": len(annotations_found) > 0,
        "annotation_count": len(annotations_found),
        "yolo_labels_count": yolo_labels_count,
        "dataset_type": dataset_type,
        "dim_summary": dim_summary,
        "imbalance_summary": imbalance_summary,
        "is_yolo_suitable": yolo_labels_count > 0,
    }


def print_report(audit: dict):
    """Format and print the audit results in the required standard output structure."""
    print("=" * 60)
    print("DATASET AUDIT")
    print("-" * 60)

    # Class breakdown
    classes = audit["class_counter"]
    for expected in EXPECTED_CLASSES:
        count = classes.get(expected, 0)
        print(f"{expected}: {count} images")

    # Any other found classes
    for c, count in classes.items():
        if c not in EXPECTED_CLASSES:
            print(f"{c}: {count} images")

    print(f"\nTotal images: {audit['total_images']}")

    print("\nImage formats:")
    formats = audit["format_counter"]
    for fmt in ["JPG", "JPEG", "PNG", "WEBP"]:
        cnt = formats.get(fmt, 0)
        print(f"{fmt}: {cnt}")
    for fmt, cnt in formats.items():
        if fmt not in ["JPG", "JPEG", "PNG", "WEBP"]:
            print(f"{fmt}: {cnt}")

    print("\nAnnotations found:")
    print("YES" if audit["annotations_found"] else "NO")

    print("\nDataset type:")
    print(audit["dataset_type"])

    print("\nImage problems:")
    corrupt_count = len(audit["corrupted_files"])
    print(f"Corrupted: {corrupt_count}")
    if corrupt_count > 0:
        for file_path, err in audit["corrupted_files"][:5]:
            print(f"  - {file_path}: {err}")
        if corrupt_count > 5:
            print(f"  ... and {corrupt_count - 5} more")

    print("\nImage dimensions:")
    print(audit["dim_summary"])

    print("\nClass imbalance:")
    print(audit["imbalance_summary"])

    print("=" * 60)
    print("YOLO OBJECT DETECTION READINESS:")
    if audit["is_yolo_suitable"]:
        print("[READY] Dataset contains valid YOLO bounding box annotations.")
    else:
        print("[NOT READY FOR YOLO OBJECT DETECTION]")
        print("Reason: The dataset contains images categorized by folder, but NO")
        print("bounding box coordinates (<class> <x_center> <y_center> <w> <h>) exist.")
        print("Recommended Action: See audit report next steps for annotation options.")
    print("=" * 60)


def main():
    parser = argparse.ArgumentParser(description="Audit ML dataset for RoadSense AI")
    parser.add_argument(
        "--dataset-dir",
        type=str,
        default=str(Path(__file__).parent / "dataset"),
        help="Path to dataset directory (defaults to ml/dataset)"
    )
    args = parser.parse_args()

    dataset_path = Path(args.dataset_dir)
    if not dataset_path.exists():
        print(f"[ERROR] Specified dataset directory does not exist: {dataset_path}")
        sys.exit(1)

    audit = inspect_dataset(dataset_path)
    print_report(audit)


if __name__ == "__main__":
    main()
