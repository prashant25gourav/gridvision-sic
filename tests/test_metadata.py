"""Tests for metadata ingestion and tariff filtering (P1)."""

import pytest
from pipeline.ingestion.metadata import (
    load_raw_metadata,
    get_flat_rate_metadata,
    get_block_to_households_map,
)


def test_raw_metadata_counts_and_schema():
    """Verify total household count and required columns."""
    df = load_raw_metadata()
    assert len(df) == 5566
    for col in ["LCLid", "stdorToU", "Acorn", "Acorn_grouped", "file"]:
        assert col in df.columns
        assert df[col].isnull().sum() == 0


def test_flat_rate_tariff_filtering():
    """Verify flat-rate tariff filtering against Master Plan v4 §3.2."""
    df = get_flat_rate_metadata()
    assert len(df) == 4443
    assert (df["stdorToU"] == "Std").all()


def test_acorn_grouped_distribution():
    """Verify ACORN stratification counts for flat-rate households against Master Plan v4 §3.3."""
    df = get_flat_rate_metadata()
    counts = df["Acorn_grouped"].value_counts().to_dict()
    assert counts.get("Affluent") == 1702
    assert counts.get("Adversity") == 1518
    assert counts.get("Comfortable") == 1184
    assert counts.get("ACORN-U") == 39


def test_block_mapping():
    """Verify block to household mapping."""
    block_map = get_block_to_households_map()
    assert len(block_map) == 112
    total_hh = sum(len(hhs) for hhs in block_map.values())
    assert total_hh == 4443
