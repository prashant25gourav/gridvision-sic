"""Stratified sampling module for GridVision (P1).

Draws a fixed sample of households from the qualifying pool (>= 6 usable windows)
stratified by Acorn_grouped with a locked random seed.

Artifact produced:
- data/artifacts/latest/households_sampled.parquet
  Grain: 1 row per household (target: 620 households)
  Columns:
    - household_id: str
    - acorn_grouped: str ('Affluent', 'Adversity', 'Comfortable', 'ACORN-U')
    - n_usable_windows: int (6 to 14)
    - sample_seed: int (42)
"""

from pathlib import Path
from typing import Any, Dict, Optional
import logging
import argparse
import numpy as np
import pandas as pd

from pipeline.config import get_project_root, load_config
from pipeline.ingestion.metadata import get_flat_rate_metadata
from pipeline.windows.eligibility import compute_dataset_window_eligibility, get_qualifying_households

logger = logging.getLogger(__name__)


def compute_strata_quotas(
    counts: pd.Series,
    target_sample_size: int = 620,
    min_floor: int = 5,
) -> Dict[str, int]:
    """Calculate integer sample quotas per stratum using proportional allocation.
    
    Guarantees that small strata (e.g. ACORN-U) have at least min_floor samples.
    """
    total = counts.sum()
    proportions = counts / total
    quotas = {}
    remaining_n = target_sample_size
    remaining_total = total

    # First allocate minimum floor to small categories if needed
    for cat, count in counts.items():
        expected = int(round(proportions[cat] * target_sample_size))
        if expected < min_floor and count >= min_floor:
            quotas[cat] = min_floor
            remaining_n -= min_floor
            remaining_total -= count

    # Allocate remainder proportionally
    for cat, count in counts.items():
        if cat in quotas:
            continue
        # Use largest remainder or rounded proportion
        quota = int(round((count / remaining_total) * remaining_n))
        quotas[cat] = quota

    # Adjust rounding discrepancy on largest stratum
    diff = target_sample_size - sum(quotas.values())
    if diff != 0:
        largest_cat = counts.idxmax()
        quotas[largest_cat] += diff

    return quotas


def draw_stratified_sample(
    eligibility_df: Optional[pd.DataFrame] = None,
    target_sample_size: int = 620,
    seed: int = 42,
    output_path: Optional[Path] = None,
) -> pd.DataFrame:
    """Draw a stratified random sample of households from the qualifying pool.
    
    Args:
        eligibility_df: DataFrame with window eligibility. If None, loaded from disk/interim.
        target_sample_size: Number of households to sample (default 620, locked range 500-800).
        seed: Random seed for reproducibility (default 42).
        output_path: Optional path to save households_sampled.parquet.
        
    Returns:
        DataFrame of sampled households.
    """
    root = get_project_root()
    config = load_config()

    if eligibility_df is None:
        elig_file = root / config["paths"]["artifacts_dir"] / "latest" / "window_eligibility.parquet"
        if elig_file.exists():
            eligibility_df = pd.read_parquet(elig_file)
        else:
            eligibility_df = compute_dataset_window_eligibility()

    # Get qualifying pool (>= 6 usable windows)
    qual_df = get_qualifying_households(eligibility_df, min_usable=config["data_quality"]["min_usable_windows"])
    logger.info(f"Qualifying pool size: {len(qual_df):,} households (expected 4,252).")

    # Merge with Acorn_grouped metadata
    flat_meta = get_flat_rate_metadata()
    pool = qual_df.merge(flat_meta[["LCLid", "Acorn_grouped"]], left_on="household_id", right_on="LCLid")
    pool = pool.drop(columns=["LCLid"])

    # Compute stratum quotas
    strata_counts = pool["Acorn_grouped"].value_counts()
    quotas = compute_strata_quotas(
        counts=strata_counts,
        target_sample_size=target_sample_size,
        min_floor=config["sampling"].get("acorn_u_min_floor", 5),
    )
    logger.info(f"Strata quotas for N={target_sample_size}: {quotas}")

    # Draw sample with deterministic sorting first
    sampled_dfs = []
    for cat, n_stratum in sorted(quotas.items()):
        stratum_pool = pool[pool["Acorn_grouped"] == cat].sort_values("household_id").reset_index(drop=True)
        sample = stratum_pool.sample(n=n_stratum, random_state=seed)
        sampled_dfs.append(sample)

    sampled = pd.concat(sampled_dfs, ignore_index=True)
    sampled["sample_seed"] = seed
    sampled = sampled.sort_values("household_id").reset_index(drop=True)

    # Validate output schema
    expected_cols = ["household_id", "acorn_grouped", "n_usable_windows", "sample_seed"]
    sampled = sampled.rename(columns={"Acorn_grouped": "acorn_grouped"})[expected_cols]

    if output_path is not None:
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        sampled.to_parquet(output_path, index=False, engine="pyarrow", compression="snappy")
        logger.info(f"Saved households_sampled.parquet to {output_path} ({len(sampled)} rows)")

    return sampled
