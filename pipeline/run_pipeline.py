"""GridVision Pipeline CLI Runner (P1).

Orchestrates the complete offline data and research pipeline stages:
1. Ingestion (Raw CSVs -> Interim Parquet blocks)
2. Quality & Window Eligibility (14 common-calendar windows)
3. Stratified Household Sampling (500-800 HHs, seed=42)
4. Per-Household Calibration Assignment (own first-2 usable windows)
5. Behavioral Feature Extraction (8 features across all usable windows)
6. K Selection (Silhouette sweep on calibration features)
7. K-Means Clustering (Every usable window, role annotation)
8. Hungarian Alignment (Chained from Calibration Window 1 forward)
9. Instability & Volatility Computation (Analysis windows only)

Writes all artifacts to:
- data/artifacts/run_<timestamp>/
- Updates data/artifacts/latest junction
- Writes run_manifest.json with git hash, config hash, seeds, and metadata.
"""

from pathlib import Path
from typing import Any, Dict, List, Optional
import os
import sys
import json
import hashlib
import logging
import argparse
import subprocess
from datetime import datetime

import pandas as pd

from pipeline.config import get_project_root, load_config
from pipeline.ingestion.to_parquet import convert_all_blocks
from pipeline.windows.eligibility import compute_dataset_window_eligibility
from pipeline.sampling.stratified_sample import draw_stratified_sample
from pipeline.windows.calibration_select import assign_calibration_windows
from pipeline.features.behavioral import compute_behavioral_features
from pipeline.clustering.k_selection import run_k_selection_sweep
from pipeline.clustering.kmeans_fit import fit_kmeans_per_window
from pipeline.clustering.alignment import align_all_cluster_assignments
from pipeline.instability.metrics import compute_instability_and_volatility
from pipeline.quality.report import generate_quality_report
from pipeline.forecasting.calibration_forecast import run_calibration_forecaster
from pipeline.research.extreme_failure import derive_extreme_failure_threshold
from pipeline.forecasting.global_forecaster import run_global_forecaster
from pipeline.forecasting.cluster_forecaster import run_cluster_forecaster
from pipeline.research.build_research_table import build_research_table
from pipeline.research.statistical_model import fit_statistical_models
from pipeline.research.holdout_eval import evaluate_holdout

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("GridVisionPipeline")


def get_git_commit_hash() -> str:
    """Get the current HEAD git commit hash."""
    try:
        res = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            capture_output=True,
            text=True,
            check=True,
        )
        return res.stdout.strip()
    except Exception:
        return "unknown"


def get_file_sha256(path: Path) -> str:
    """Calculate SHA256 hash of a file."""
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()


def update_latest_link(run_dir: Path) -> None:
    """Update the data/artifacts/latest junction/symlink on Windows or Linux."""
    root = get_project_root()
    latest_path = root / "data" / "artifacts" / "latest"

    # Remove existing latest junction if present
    if latest_path.exists() or latest_path.is_symlink():
        try:
            if os.name == "nt":
                subprocess.run(f'cmd /c rmdir "{latest_path}"', shell=True, check=False)
            else:
                latest_path.unlink()
        except Exception as e:
            logger.warning(f"Could not remove existing latest link: {e}")

    # Re-create junction / link
    try:
        if os.name == "nt":
            cmd = f'cmd /c mklink /J "{latest_path}" "{run_dir.resolve()}"'
            subprocess.run(cmd, shell=True, check=True, capture_output=True)
        else:
            os.symlink(run_dir.resolve(), latest_path, target_is_directory=True)
        logger.info(f"Updated data/artifacts/latest -> {run_dir.name}")
    except Exception as e:
        logger.warning(f"Failed to update latest junction ({e}).")


def run_pipeline(
    pilot: bool = False,
    skip_ingestion: bool = True,
    sample_size: Optional[int] = None,
    seed: int = 42,
    include_p2: bool = False,
) -> Path:
    """Execute the full P1 and optional P2 pipeline sequence deterministically.
    
    Args:
        pilot: If True, runs on 50-household pilot subset.
        skip_ingestion: If True, uses existing interim Parquet blocks if present.
        sample_size: Target household sample size (defaults to 50 for pilot, 620 for full).
        seed: Random seed for sampling and clustering (default 42).
        include_p2: If True, runs P2 calibration, global & per-cluster forecasting,
                    research table assembly, statistical modeling, and holdout evaluation.
        
    Returns:
        Path to the generated run directory.
    """
    root = get_project_root()
    config_file = root / "config" / "pipeline.yaml"
    config = load_config(config_file)

    # Resolve target sample size
    if sample_size is None:
        sample_size = 50 if pilot else config["sampling"].get("target_sample_size", 620)

    # 1. Create run timestamp directory
    timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
    run_dir = root / "data" / "artifacts" / f"run_{timestamp_str}"
    run_dir.mkdir(parents=True, exist_ok=True)
    logger.info(f"=== Starting GridVision Pipeline Run: {run_dir.name} ===")
    logger.info(f"Configuration: Pilot={pilot}, SampleSize={sample_size}, Seed={seed}")

    # 2. Ingestion
    interim_blocks_dir = root / "data" / "interim" / "blocks"
    has_blocks = interim_blocks_dir.exists() and len(list(interim_blocks_dir.glob("block_*.parquet"))) >= 110
    if not has_blocks or not skip_ingestion:
        logger.info("Stage 1: Ingesting raw CSV blocks to Parquet...")
        convert_all_blocks(output_dir=interim_blocks_dir)
    else:
        logger.info(f"Stage 1: Using existing {len(list(interim_blocks_dir.glob('block_*.parquet')))} interim blocks.")

    # 3. Window Eligibility
    logger.info("Stage 2: Computing 14-window usability and eligibility...")
    elig_path = run_dir / "window_eligibility.parquet"
    elig_df = compute_dataset_window_eligibility(
        interim_dir=interim_blocks_dir,
        output_path=elig_path,
    )

    # 4. Stratified Household Sampling
    logger.info(f"Stage 3: Drawing stratified sample of {sample_size} households (seed={seed})...")
    sampled_path = run_dir / "households_sampled.parquet"
    sampled_df = draw_stratified_sample(
        eligibility_df=elig_df,
        target_sample_size=sample_size,
        seed=seed,
        output_path=sampled_path,
    )

    # Also save pilot artifact if running full
    if not pilot:
        draw_stratified_sample(
            eligibility_df=elig_df,
            target_sample_size=50,
            seed=seed,
            output_path=run_dir / "households_pilot.parquet",
        )

    # 5. Calibration Assignment
    logger.info("Stage 4: Assigning per-household calibration and analysis windows...")
    cal_path = run_dir / "calibration_assignment.parquet"
    cal_df = assign_calibration_windows(
        sampled_households_df=sampled_df,
        eligibility_df=elig_df,
        output_path=cal_path,
    )

    # 6. Behavioral Feature Extraction
    logger.info("Stage 5: Computing 8 behavioral features for all usable windows...")
    bf_path = run_dir / "behavioral_features.parquet"
    features_df = compute_behavioral_features(
        sampled_households_df=sampled_df,
        eligibility_df=elig_df,
        interim_dir=interim_blocks_dir,
        output_path=bf_path,
    )

    # 7. K Selection
    logger.info("Stage 6: Running silhouette sweep on pooled calibration features...")
    k_res_path = run_dir / "k_selection_results.json"
    optimal_k, k_res = run_k_selection_sweep(
        behavioral_features_df=features_df,
        calibration_assignment_df=cal_df,
        k_min=config["clustering"].get("k_min", 3),
        k_max=config["clustering"].get("k_max", 8),
        random_state=seed,
        output_path=k_res_path,
    )
    # If config locks fixed_k, use that for clustering
    clustering_k = config["clustering"].get("fixed_k", optimal_k)

    # 8. K-Means Clustering & Role Annotation
    logger.info(f"Stage 7: Fitting K-Means with K={clustering_k} per calendar window...")
    raw_assignments_df, centroids_dict = fit_kmeans_per_window(
        features_df=features_df,
        calibration_assignment_df=cal_df,
        k=clustering_k,
        random_state=seed,
    )

    # 9. Hungarian Alignment
    logger.info("Stage 8: Chaining Hungarian cluster alignment across household trajectories...")
    ca_path = run_dir / "cluster_assignments.parquet"
    aligned_df = align_all_cluster_assignments(
        raw_assignments_df=raw_assignments_df,
        centroids_by_window=centroids_dict,
        output_path=ca_path,
    )

    # 10. Instability & Volatility
    logger.info("Stage 9: Computing persistence, instability, and volatility metrics...")
    iv_path = run_dir / "instability_volatility.parquet"
    metrics_df = compute_instability_and_volatility(
        cluster_assignments_df=aligned_df,
        behavioral_features_df=features_df,
        output_path=iv_path,
    )

    # 11. Data Quality Report
    logger.info("Stage 10: Generating data quality report...")
    qc_report_path = run_dir / "data_quality_report.json"
    generate_quality_report(artifacts_dir=run_dir, output_path=qc_report_path)

    # Optional P2 Stages
    if include_p2:
        logger.info("--- Beginning P2 Forecasting and Statistical Research Pipeline ---")

        # 12. Calibration Forecaster
        logger.info("Stage 11: Running per-household calibration forecaster...")
        run_calibration_forecaster(
            calibration_assignment_df=cal_df,
            interim_dir=interim_blocks_dir,
            output_dir=run_dir,
            random_state=seed,
        )

        # 13. Extreme Failure Threshold
        logger.info("Stage 12: Deriving extreme-failure threshold from calibration residuals...")
        threshold_res = derive_extreme_failure_threshold(
            residuals_df=pd.read_parquet(run_dir / "calibration_residuals.parquet"),
            summary_df=pd.read_parquet(run_dir / "calibration_summary.parquet"),
            output_path=run_dir / "extreme_failure_threshold.json",
        )

        # 14. Global Forecaster
        logger.info("Stage 13: Running pooled global forecaster across calendar transitions...")
        run_global_forecaster(
            sampled_households_df=sampled_df,
            eligibility_df=elig_df,
            behavioral_features_df=features_df,
            interim_dir=interim_blocks_dir,
            output_dir=run_dir,
            random_state=seed,
        )

        # 15. Per-Cluster Forecaster
        logger.info("Stage 14: Running per-cluster forecaster across calendar transitions...")
        run_cluster_forecaster(
            sampled_households_df=sampled_df,
            eligibility_df=elig_df,
            behavioral_features_df=features_df,
            cluster_assignments_df=aligned_df,
            interim_dir=interim_blocks_dir,
            output_dir=run_dir,
            random_state=seed,
        )

        # 16. Research Table Assembly
        logger.info("Stage 15: Assembling research table and labeling outcomes...")
        res_table = build_research_table(
            instability_volatility_df=metrics_df,
            forecast_global_summary_df=pd.read_parquet(run_dir / "forecast_global_summary.parquet"),
            calibration_summary_df=pd.read_parquet(run_dir / "calibration_summary.parquet"),
            threshold_config=threshold_res,
            calibration_assignment_df=cal_df,
            eligibility_df=elig_df,
            sampled_households_df=sampled_df,
            output_dir=run_dir,
        )

        # 17. Statistical Model
        logger.info("Stage 16: Fitting cluster-robust logistic regression (H1/H0)...")
        stat_res = fit_statistical_models(
            research_table_df=res_table,
            output_dir=run_dir,
        )

        # 18. Holdout Evaluation
        logger.info("Stage 17: Forward-only holdout evaluation (Day 19 protocol)...")
        evaluate_holdout(
            research_table_df=res_table,
            statistical_results=stat_res,
            output_dir=run_dir,
        )

    # Run Manifest
    manifest = {
        "run_id": run_dir.name,
        "timestamp": datetime.now().isoformat(),
        "git_commit": get_git_commit_hash(),
        "config_sha256": get_file_sha256(config_file) if config_file.exists() else "none",
        "parameters": {
            "pilot": pilot,
            "sample_size": sample_size,
            "random_seed": seed,
            "optimal_k": optimal_k,
            "include_p2": include_p2,
        },
        "artifacts": {
            f.name: {
                "size_bytes": f.stat().st_size,
                "rows": int(len(pd.read_parquet(f))) if f.suffix == ".parquet" else None,
            }
            for f in sorted(run_dir.glob("*")) if f.is_file() and f.name != "run_manifest.json"
        },
    }

    manifest_path = run_dir / "run_manifest.json"
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
    logger.info(f"Saved run manifest to {manifest_path}")

    # Update latest link
    update_latest_link(run_dir)

    logger.info(f"=== GridVision Pipeline Completed Successfully in {run_dir.name} ===")
    return run_dir


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="GridVision Pipeline Runner")
    parser.add_argument("--pilot", action="store_true", help="Run 50-household pilot gate subset")
    parser.add_argument("--sample-size", type=int, default=None, help="Household sample size")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    parser.add_argument("--full-ingestion", action="store_true", help="Force re-converting all raw CSVs")
    parser.add_argument("--include-p2", action="store_true", help="Execute P2 forecasting, research table, and statistics")
    args = parser.parse_args()

    out_run = run_pipeline(
        pilot=args.pilot,
        skip_ingestion=not args.full_ingestion,
        sample_size=args.sample_size,
        seed=args.seed,
        include_p2=args.include_p2,
    )
    print(f"\nPipeline finished. Outputs saved in: {out_run}")
