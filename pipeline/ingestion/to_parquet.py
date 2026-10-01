"""Ingestion module: Converts raw CSV blocks to typed, flat-rate Parquet files.

Master Plan v4 §3 & Blueprint v2 §C/§D:
- Filters households to flat-rate standard tariff only (stdorToU == 'Std').
- Validates that half-hourly readings are non-negative.
- Writes partitioned interim Parquet files in data/interim/blocks/block_{i}.parquet.
"""

from pathlib import Path
from typing import Any, Dict, List, Optional, Set
import logging
import argparse
import pandas as pd
import numpy as np

from pipeline.config import get_project_root, load_config
from pipeline.ingestion.metadata import get_flat_rate_metadata

logger = logging.getLogger(__name__)

HH_COLS = [f"hh_{i}" for i in range(48)]


def convert_block_to_parquet(
    block_id: int,
    raw_dir: Path,
    output_dir: Path,
    valid_households: Optional[Set[str]] = None,
) -> Dict[str, Any]:
    """Convert a single raw CSV block to Parquet, filtering to flat-rate households.
    
    Args:
        block_id: Integer block identifier (0 to 111).
        raw_dir: Directory containing raw block_*.csv files.
        output_dir: Directory where interim Parquet files will be written.
        valid_households: Optional set of allowed household IDs (flat-rate).
            If None, loads flat-rate IDs from metadata.
            
    Returns:
        Dict with block statistics.
    """
    csv_path = raw_dir / f"block_{block_id}.csv"
    if not csv_path.exists():
        raise FileNotFoundError(f"Raw block file not found: {csv_path}")

    output_dir.mkdir(parents=True, exist_ok=True)
    parquet_path = output_dir / f"block_{block_id}.parquet"

    # Read raw CSV
    df = pd.read_csv(csv_path)
    raw_rows = len(df)
    raw_households = df["LCLid"].nunique()

    # Filter to valid households
    if valid_households is not None:
        df = df[df["LCLid"].isin(valid_households)].copy()
    
    filtered_rows = len(df)
    filtered_households = df["LCLid"].nunique()

    # Cast columns and validate
    for col in HH_COLS:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").astype("float32")

    # Check for negative readings
    readings_vals = df[HH_COLS].values
    neg_mask = readings_vals < 0
    neg_count = int(np.sum(neg_mask & ~np.isnan(readings_vals)))
    if neg_count > 0:
        logger.warning(f"Block {block_id}: Found {neg_count} negative readings! Clipping to 0.")
        df[HH_COLS] = df[HH_COLS].clip(lower=0.0)

    # Ensure day is formatted as string YYYY-MM-DD
    df["day"] = df["day"].astype(str)
    df["LCLid"] = df["LCLid"].astype(str)

    # Sort deterministically
    df = df.sort_values(["LCLid", "day"]).reset_index(drop=True)

    # Write Parquet with snappy compression
    df.to_parquet(parquet_path, index=False, engine="pyarrow", compression="snappy")

    return {
        "block_id": block_id,
        "parquet_path": str(parquet_path),
        "raw_rows": raw_rows,
        "filtered_rows": filtered_rows,
        "raw_households": raw_households,
        "filtered_households": filtered_households,
        "negative_readings": neg_count,
        "file_size_bytes": parquet_path.stat().st_size,
    }


def convert_all_blocks(
    raw_dir: Optional[Path] = None,
    output_dir: Optional[Path] = None,
    max_blocks: Optional[int] = None,
) -> Dict[str, Any]:
    """Convert all raw CSV blocks (0..111) to Parquet.
    
    Args:
        raw_dir: Directory containing raw block_*.csv. Defaults to config paths.
        output_dir: Output directory for Parquet files. Defaults to data/interim/blocks.
        max_blocks: If specified, only convert blocks 0 to max_blocks - 1.
        
    Returns:
        Summary dict of conversion results.
    """
    root = get_project_root()
    config = load_config()

    if raw_dir is None:
        raw_dir = root / config["paths"]["hhblock_dir"]
    else:
        raw_dir = Path(raw_dir)

    if output_dir is None:
        output_dir = root / config["paths"]["interim_dir"] / "blocks"
    else:
        output_dir = Path(output_dir)

    output_dir.mkdir(parents=True, exist_ok=True)

    # Get valid flat-rate households
    flat_meta = get_flat_rate_metadata()
    valid_households = set(flat_meta["LCLid"])
    logger.info(f"Loaded {len(valid_households)} flat-rate households for filtering.")

    total_blocks = 112 if max_blocks is None else min(112, max_blocks)
    results: List[Dict[str, Any]] = []
    total_filtered_rows = 0
    all_households_seen: Set[str] = set()
    total_negative_readings = 0

    for b in range(total_blocks):
        res = convert_block_to_parquet(
            block_id=b,
            raw_dir=raw_dir,
            output_dir=output_dir,
            valid_households=valid_households,
        )
        results.append(res)
        total_filtered_rows += res["filtered_rows"]
        total_negative_readings += res["negative_readings"]
        
        # Read back unique households for reporting
        block_df = pd.read_parquet(res["parquet_path"], columns=["LCLid"])
        all_households_seen.update(block_df["LCLid"].unique())

        if (b + 1) % 10 == 0 or (b + 1) == total_blocks:
            logger.info(
                f"Converted {b + 1}/{total_blocks} blocks. "
                f"Cumulative rows: {total_filtered_rows:,}, unique HH: {len(all_households_seen)}"
            )

    summary = {
        "blocks_converted": len(results),
        "total_rows": total_filtered_rows,
        "unique_flat_rate_households": len(all_households_seen),
        "total_negative_readings": total_negative_readings,
        "output_dir": str(output_dir),
    }

    return summary


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    parser = argparse.ArgumentParser(description="Convert raw CSV blocks to Parquet")
    parser.add_argument("--max-blocks", type=int, default=None, help="Maximum number of blocks to process")
    args = parser.parse_args()

    summary = convert_all_blocks(max_blocks=args.max_blocks)
    print("\nConversion complete:")
    for k, v in summary.items():
        print(f"  {k}: {v}")
