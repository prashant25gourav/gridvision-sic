"""Configuration loader for the GridVision pipeline."""

from pathlib import Path
from typing import Any, Dict, List
import yaml


def get_project_root() -> Path:
    """Returns the root directory of the GridVision repository."""
    return Path(__file__).resolve().parent.parent


def load_config(config_path: Path | str | None = None) -> Dict[str, Any]:
    """Load pipeline YAML configuration."""
    if config_path is None:
        config_path = get_project_root() / "config" / "pipeline.yaml"
    else:
        config_path = Path(config_path)

    if not config_path.exists():
        raise FileNotFoundError(f"Configuration file not found: {config_path}")

    with open(config_path, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)

    return config


def get_artifacts_dir(run_name: str = "latest") -> Path:
    """Returns path to artifacts directory for given run.
    
    If run_name is 'latest', returns data/artifacts/latest if present,
    or falls back to the most recent run_* directory.
    """
    root = get_project_root()
    config = load_config()
    base_dir = root / config["paths"].get("artifacts_dir", "data/artifacts")
    
    target_dir = base_dir / run_name
    if target_dir.exists():
        return target_dir

    if run_name == "latest":
        runs = sorted(base_dir.glob("run_*"))
        if runs:
            return runs[-1]

    target_dir.mkdir(parents=True, exist_ok=True)
    return target_dir
