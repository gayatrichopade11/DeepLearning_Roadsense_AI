"""
RoadSense AI - Model Training Pipeline
======================================
This script serves as the centralized training entry point for RoadSense AI.

Project: AI-Based Road Condition Analysis and Damage Prediction Using Deep Learning
Target Classes: Asphalt (0), Crack (1), Pothole (2)

STATUS: VERIFIED & READY FOR TRAINING
- Dataset has been audited, verified, and partitioned with anti-leakage grouping.
- Workspace: ml/dataset/yolo_final/ (data.yaml)
"""

import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path


def ensure_venv_execution():
    """Ensure ultralytics is available; if not, re-exec with project .venv if available."""
    try:
        import ultralytics
        return
    except ImportError:
        venv_python = Path(__file__).resolve().parent.parent / ".venv" / "Scripts" / "python.exe"
        if venv_python.exists() and str(Path(sys.executable).resolve()) != str(venv_python.resolve()):
            print(f"[INFO] Switching to project virtual environment: {venv_python}")
            result = subprocess.run([str(venv_python)] + sys.argv)
            sys.exit(result.returncode)


def parse_args():
    parser = argparse.ArgumentParser(description="RoadSense AI Model Training Pipeline")
    parser.add_argument(
        "--data",
        type=str,
        default=str(Path(__file__).parent / "dataset" / "yolo_final" / "data.yaml"),
        help="Path to dataset data.yaml configuration file"
    )
    parser.add_argument(
        "--model",
        type=str,
        default="yolov8n.pt",
        help="Pretrained YOLO model weights or architecture (e.g. yolov8n.pt, yolov8s.pt)"
    )
    parser.add_argument(
        "--epochs",
        type=int,
        default=50,
        help="Number of training epochs (default: 50)"
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=16,
        help="Batch size for training (default: 16)"
    )
    parser.add_argument(
        "--img-size",
        type=int,
        default=640,
        help="Image input resolution (default: 640)"
    )
    parser.add_argument(
        "--device",
        type=str,
        default="",
        help="Device to run on (e.g. '0', 'cpu', default: auto-detect)"
    )
    parser.add_argument(
        "--project",
        type=str,
        default=str(Path(__file__).parent / "runs" / "detect"),
        help="Project directory to save training runs"
    )
    parser.add_argument(
        "--name",
        type=str,
        default="road_condition_experiment",
        help="Name of the experiment run"
    )
    parser.add_argument(
        "--output-model",
        type=str,
        default="",
        help="Destination path for best trained weights (default: ml/models/best.pt)"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate pipeline configuration and data.yaml without starting training"
    )
    return parser.parse_args()


def main():
    ensure_venv_execution()

    args = parse_args()
    print("=" * 70)
    print("RoadSense AI — Deep Learning Training Pipeline")
    print("=" * 70)
    print(f"Data config : {args.data}")
    print(f"Base model  : {args.model}")
    print(f"Epochs      : {args.epochs}")
    print(f"Batch size  : {args.batch_size}")
    print(f"Image size  : {args.img_size}")
    print(f"Device      : {args.device or 'Auto'}")
    print(f"Project dir : {args.project}")
    print(f"Run name    : {args.name}")
    print("-" * 70)

    data_path = Path(args.data)
    if not data_path.exists():
        print(f"[ERROR] Dataset configuration not found: {data_path}")
        print("[INFO] Run 'python ml/verify_split.py' first to build the verified dataset.")
        sys.exit(1)

    print(f"[INFO] Verified dataset config found: {data_path}")

    if args.dry_run:
        print("[INFO] --dry-run active. Pipeline configuration and paths verified successfully.")
        print("[INFO] Ready for training execution upon approval.")
        print("=" * 70)
        return

    try:
        from ultralytics import YOLO
    except ImportError:
        print("[ERROR] 'ultralytics' is not installed in the current Python environment.")
        print("[INFO] Install requirements: pip install ultralytics")
        sys.exit(1)

    print(f"[INFO] Initializing YOLO model with weights: {args.model}")
    model = YOLO(args.model)

    print(f"[INFO] Launching training run...")
    train_kwargs = {
        "data": str(data_path),
        "epochs": args.epochs,
        "batch": args.batch_size,
        "imgsz": args.img_size,
        "project": args.project,
        "name": args.name,
        "save": True,
        "val": True,
        "exist_ok": True,
        "plots": True,
    }
    if args.device:
        train_kwargs["device"] = args.device

    results = model.train(**train_kwargs)
    print("=" * 70)
    print("[SUCCESS] Training pipeline completed successfully.")

    # Locate best.pt in experiment directory
    save_dir = Path(model.trainer.save_dir) if hasattr(model, "trainer") and hasattr(model.trainer, "save_dir") else (Path(args.project) / args.name)
    best_pt_source = save_dir / "weights" / "best.pt"
    
    models_dir = Path(__file__).parent / "models"
    models_dir.mkdir(parents=True, exist_ok=True)
    if args.output_model:
        best_pt_dest = Path(args.output_model)
        best_pt_dest.parent.mkdir(parents=True, exist_ok=True)
    else:
        best_pt_dest = models_dir / "best.pt"

    if best_pt_source.exists():
        shutil.copy2(best_pt_source, best_pt_dest)
        print(f"[INFO] Best model copied to: {best_pt_dest} ({best_pt_dest.stat().st_size / 1024 / 1024:.2f} MB)")
    else:
        # Fallback to last.pt if best.pt not found
        last_pt_source = save_dir / "weights" / "last.pt"
        if last_pt_source.exists():
            shutil.copy2(last_pt_source, best_pt_dest)
            print(f"[INFO] Last model copied to: {best_pt_dest} ({best_pt_dest.stat().st_size / 1024 / 1024:.2f} MB)")

    # Print summary metrics
    print("\n" + "=" * 70)
    print("TRAINING METRICS SUMMARY")
    print("=" * 70)
    print(f"Run directory : {save_dir}")
    print(f"Best model    : {best_pt_dest}")
    
    if hasattr(model, "trainer") and hasattr(model.trainer, "metrics"):
        metrics = model.trainer.metrics
        print("Validation Metrics:")
        for k, v in metrics.items():
            if isinstance(v, (int, float)):
                print(f"  {k:20}: {v:.4f}")
            else:
                print(f"  {k:20}: {v}")
    elif hasattr(results, "results_dict"):
        print("Results Dict:")
        for k, v in results.results_dict.items():
            if isinstance(v, (int, float)):
                print(f"  {k:20}: {v:.4f}")
            else:
                print(f"  {k:20}: {v}")
    print("=" * 70)


if __name__ == "__main__":
    main()
