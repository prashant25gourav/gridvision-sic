"""Tests for raw to Parquet ingestion (P1)."""

import pytest
from pathlib import Path
import pandas as pd
from pipeline.config import get_project_root
from pipeline.ingestion.to_parquet import convert_block_to_parquet, HH_COLS


def test_convert_single_block(tmp_path):
    """Test converting a single block to Parquet with flat-rate filtering."""
    root = get_project_root()
    raw_dir = root / "data" / "raw" / "hhblock_dataset"
    if not (raw_dir / "block_0.csv").exists():
        pytest.skip("Raw block data not present in data/raw/hhblock_dataset")

    out_dir = tmp_path / "interim"
    valid_hh = {"MAC000002"}

    res = convert_block_to_parquet(
        block_id=0,
        raw_dir=raw_dir,
        output_dir=out_dir,
        valid_households=valid_hh,
    )

    assert res["block_id"] == 0
    assert res["filtered_households"] == 1
    assert res["negative_readings"] == 0

    # Read back parquet
    df = pd.read_parquet(res["parquet_path"])
    assert (df["LCLid"] == "MAC000002").all()
    assert len(df) == res["filtered_rows"]
    for col in HH_COLS:
        assert col in df.columns
        assert df[col].dtype == "float32"
        # Verify no negative readings
        assert (df[col].dropna() >= 0).all()
