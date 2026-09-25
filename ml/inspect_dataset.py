#!/usr/bin/env python3
"""
GridVision - Safe Dataset Inspection Utility
--------------------------------------------
A standalone, read-only diagnostic utility to inspect raw smart meter datasets
placed in data/raw/ without downloading external files, modifying datasets,
or executing ML models.

Usage:
    python ml/inspect_dataset.py
    python ml/inspect_dataset.py --file data/raw/your_dataset.csv
    python ml/inspect_dataset.py --generate-sample
"""

import os
import sys
import argparse
from pathlib import Path
from typing import Optional, List


def get_file_size_str(num_bytes: int) -> str:
    """Format bytes into human-readable string."""
    for unit in ["B", "KB", "MB", "GB", "TB"]:
        if num_bytes < 1024.0:
            return f"{num_bytes:.2f} {unit}"
        num_bytes /= 1024.0
    return f"{num_bytes:.2f} PB"


def inspect_file(filepath: Path) -> None:
    """Safely inspect a tabular dataset (CSV or Parquet) and print key diagnostics."""
    print("=" * 70)
    print(f"  GRIDVISION DATASET INSPECTION: {filepath.name}")
    print("=" * 70)

    try:
        import pandas as pd
    except ImportError:
        print("[ERROR] pandas is required for dataset inspection. Run: pip install pandas")
        return

    file_size = filepath.stat().st_size
    print(f"\n[1] File Details:")
    print(f"  - Path: {filepath.resolve()}")
    print(f"  - Size: {get_file_size_str(file_size)}")

    ext = filepath.suffix.lower()
    try:
        if ext == ".csv":
            # Read first 10,000 rows for safe, fast inspection
            preview_df = pd.read_csv(filepath, nrows=10000)
            with open(filepath, "rb") as f:
                total_lines = sum(1 for _ in f)
            row_count_estimate = max(0, total_lines - 1)
        elif ext in [".parquet", ".pq"]:
            preview_df = pd.read_parquet(filepath)
            row_count_estimate = len(preview_df)
        else:
            print(f"[!] Unsupported file extension: {ext}. Expected .csv or .parquet")
            return
    except Exception as e:
        print(f"[ERROR] Failed to read dataset: {e}")
        return

    print(f"  - Estimated Total Rows: {row_count_estimate:,}")
    print(f"  - Columns ({len(preview_df.columns)}): {', '.join(preview_df.columns.tolist()[:10])}" +
          ("..." if len(preview_df.columns) > 10 else ""))

    # Column breakdown
    print(f"\n[2] Schema & Missing Values (Sample of {len(preview_df):,} rows):")
    for col in preview_df.columns:
        null_count = preview_df[col].isna().sum()
        null_pct = (null_count / len(preview_df)) * 100
        dtype_str = str(preview_df[col].dtype)
        print(f"  - {col:<24} | dtype: {dtype_str:<10} | nulls: {null_count:>5} ({null_pct:.1f}%)")

    # Timestamp column detection
    timestamp_candidates = [
        c for c in preview_df.columns
        if any(kw in c.lower() for kw in ["time", "date", "ts", "timestamp", "datetime"])
    ]
    print(f"\n[3] Temporal Dimension:")
    if timestamp_candidates:
        ts_col = timestamp_candidates[0]
        print(f"  - Inferred Timestamp Column: '{ts_col}'")
        try:
            ts_series = pd.to_datetime(preview_df[ts_col], errors="coerce")
            valid_ts = ts_series.dropna()
            if not valid_ts.empty:
                print(f"  - Earliest Record: {valid_ts.min()}")
                print(f"  - Latest Record (sample): {valid_ts.max()}")
                # Frequency estimation
                diffs = valid_ts.diff().dropna()
                median_diff = diffs.median()
                print(f"  - Inferred Median Sampling Step: {median_diff}")
        except Exception as e:
            print(f"  - [!] Could not parse timestamps: {e}")
    else:
        print("  - No obvious timestamp column detected.")

    # Meter / Household ID detection
    meter_candidates = [
        c for c in preview_df.columns
        if any(kw in c.lower() for kw in ["lclid", "meter", "household", "id", "cust"])
    ]
    print(f"\n[4] Smart Meter Identification:")
    if meter_candidates:
        meter_col = meter_candidates[0]
        unique_meters = preview_df[meter_col].nunique()
        print(f"  - Inferred Meter ID Column: '{meter_col}'")
        print(f"  - Distinct Meters in Preview: {unique_meters:,}")
        sample_ids = preview_df[meter_col].dropna().unique()[:5].tolist()
        print(f"  - Sample Meter IDs: {sample_ids}")
    else:
        print("  - No obvious meter ID column detected.")

    # Numeric Consumption Summary
    num_cols = preview_df.select_dtypes(include=["number"]).columns.tolist()
    print(f"\n[5] Numerical Metrics Summary (Sample):")
    if num_cols:
        for c in num_cols[:5]:
            stats = preview_df[c].describe()
            print(f"  - Column '{c}': min={stats['min']:.3f}, mean={stats['mean']:.3f}, max={stats['max']:.3f}, std={stats['std']:.3f}")
    else:
        print("  - No numeric energy columns detected.")

    print("\n" + "=" * 70)
    print("  INSPECTION COMPLETE (Safe read-only execution)")
    print("=" * 70)


def generate_synthetic_sample(output_path: Path) -> None:
    """Generate a tiny synthetic smart meter dataset for offline smoke testing."""
    import random
    from datetime import datetime, timedelta

    print(f"[*] Generating synthetic smart meter sample at: {output_path}")
    output_path.parent.mkdir(parents=True, exist_ok=True)

    header = "LCLid,stdorToU,DateTime,KWH/hh (per half hour),Acorn,Acorn_grouped\n"
    rows = []
    base_time = datetime(2026, 1, 1, 0, 0, 0)
    sample_meters = [
        ("MAC000002", "ToU", "Acorn-A", "Affluent"),
        ("MAC000018", "Std", "Acorn-C", "Comfortable"),
        ("MAC000045", "Std", "Acorn-E", "Adversity"),
        ("MAC000112", "ToU", "Acorn-B", "Affluent"),
        ("MAC000234", "Std", "Acorn-D", "Comfortable"),
    ]

    for meter_id, tariff, acorn, acorn_grp in sample_meters:
        for hh_idx in range(48):  # 24 hours at 30-min steps
            current_time = base_time + timedelta(minutes=30 * hh_idx)
            # Normal distribution around 0.35 kWh
            kwh = max(0.02, round(random.normalvariate(0.35, 0.12), 4))
            rows.append(f"{meter_id},{tariff},{current_time.strftime('%Y-%m-%d %H:%M:%S')},{kwh},{acorn},{acorn_grp}\n")

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(header)
        f.writelines(rows)

    print(f"[OK] Successfully wrote {len(rows)} sample records to {output_path}")


def main():
    parser = argparse.ArgumentParser(description="GridVision Safe Dataset Inspection Utility")
    parser.add_argument("--file", "-f", type=str, help="Specific dataset file to inspect")
    parser.add_argument("--generate-sample", action="store_true", help="Generate a small synthetic CSV in data/raw for testing")
    args = parser.parse_args()

    raw_dir = Path("data/raw")

    if args.generate_sample:
        sample_path = raw_dir / "sample_smart_meter_telemetry.csv"
        generate_synthetic_sample(sample_path)
        inspect_file(sample_path)
        return

    if args.file:
        target = Path(args.file)
        if not target.exists():
            print(f"[ERROR] File not found: {target}")
            sys.exit(1)
        inspect_file(target)
        return

    # Check data/raw directory for files
    if not raw_dir.exists():
        print(f"[!] data/raw directory does not exist yet.")
        return

    files = [f for f in raw_dir.iterdir() if f.is_file() and not f.name.startswith(".")]
    if not files:
        print("=" * 70)
        print("  GRIDVISION DATASET INSPECTOR")
        print("=" * 70)
        print("\n[INFO] data/raw/ is currently empty.")
        print("When raw smart meter files (.csv, .parquet) are placed in data/raw/,")
        print("run this script to inspect column schemas, time ranges, and meter counts.")
        print("\nTo generate a safe offline sample for testing, run:")
        print("    python ml/inspect_dataset.py --generate-sample\n")
        print("=" * 70)
        return

    for f in files:
        if f.suffix.lower() in [".csv", ".parquet", ".pq"]:
            inspect_file(f)


if __name__ == "__main__":
    main()
