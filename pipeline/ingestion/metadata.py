"""Household metadata loader and tariff validation (P1).

Authoritative source: GridVision Master Plan v4 §3.1-3.3.
Expected counts:
- 5,566 total households
- 4,443 flat-rate (stdorToU == 'Std') households
- 1,123 dynamic-tariff (stdorToU == 'ToU') households
- Acorn_grouped (Std only):
    Affluent: 1,702
    Adversity: 1,518
    Comfortable: 1,184
    ACORN-U: 39
"""

from pathlib import Path
from typing import Dict, List, Optional, Set
import pandas as pd

from pipeline.config import get_project_root, load_config


REQUIRED_COLUMNS = ["LCLid", "stdorToU", "Acorn", "Acorn_grouped", "file"]


def load_raw_metadata(metadata_path: Optional[Path | str] = None) -> pd.DataFrame:
    """Load and validate the raw informations_households.csv file."""
    if metadata_path is None:
        cfg = load_config()
        rel_path = cfg["paths"]["metadata_path"]
        metadata_path = get_project_root() / rel_path
    else:
        metadata_path = Path(metadata_path)

    if not metadata_path.exists():
        raise FileNotFoundError(f"Metadata file not found: {metadata_path}")

    df = pd.read_csv(metadata_path)

    # Validate schema
    missing_cols = set(REQUIRED_COLUMNS) - set(df.columns)
    if missing_cols:
        raise ValueError(f"Metadata missing required columns: {missing_cols}")

    # Ensure correct string dtypes and strip whitespace
    for col in REQUIRED_COLUMNS:
        df[col] = df[col].astype(str).str.strip()

    # Validate no nulls
    null_counts = df[REQUIRED_COLUMNS].isnull().sum().to_dict()
    if any(c > 0 for c in null_counts.values()):
        raise ValueError(f"Null values found in metadata: {null_counts}")

    # Validate total row count
    if len(df) != 5566:
        raise ValueError(f"Expected 5,566 households, found {len(df)}")

    return df


def get_flat_rate_metadata(metadata_path: Optional[Path | str] = None) -> pd.DataFrame:
    """Load metadata filtered strictly to flat-rate (stdorToU == 'Std') households.

    Returns:
        pd.DataFrame with 4,443 rows containing flat-rate households.
    """
    df = load_raw_metadata(metadata_path)
    flat_rate = df[df["stdorToU"] == "Std"].copy().reset_index(drop=True)

    if len(flat_rate) != 4443:
        raise ValueError(
            f"Expected 4,443 flat-rate households, found {len(flat_rate)}"
        )

    return flat_rate


def get_block_to_households_map(
    metadata_path: Optional[Path | str] = None, flat_rate_only: bool = True
) -> Dict[str, List[str]]:
    """Map block file names (e.g., 'block_0') to their respective household IDs.

    Args:
        metadata_path: Optional path to informations_households.csv
        flat_rate_only: If True, only include Std households.

    Returns:
        Dict mapping block name (str) to list of LCLid strings.
    """
    if flat_rate_only:
        df = get_flat_rate_metadata(metadata_path)
    else:
        df = load_raw_metadata(metadata_path)

    mapping: Dict[str, List[str]] = {}
    for block_name, group in df.groupby("file"):
        mapping[block_name] = group["LCLid"].tolist()

    return mapping
