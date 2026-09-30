"""Tests for GridVision pipeline CLI runner (P1)."""

from pathlib import Path
import pytest
from pipeline.run_pipeline import get_git_commit_hash, get_file_sha256
from pipeline.config import get_project_root


def test_git_commit_hash():
    """Verify git commit hash retrieval."""
    commit = get_git_commit_hash()
    assert isinstance(commit, str)
    assert len(commit) >= 7 or commit == "unknown"


def test_file_sha256(tmp_path):
    """Verify SHA256 file hashing."""
    test_file = tmp_path / "test.txt"
    test_file.write_text("GridVision locked research methodology", encoding="utf-8")

    h = get_file_sha256(test_file)
    assert isinstance(h, str)
    assert len(h) == 64
