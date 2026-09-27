---
name: integration-check
description: >
  GridVision integration validation skill. Verifies artifact schemas,
  cross-module contracts, API contracts, and the mandatory 50-HH gate.
  Read this before integration testing or the 50-HH pilot.
---

# GridVision — Integration Check Skill

## Purpose

Verifies that GridVision's pipeline modules, backend APIs, and frontend correctly
interoperate. Ensures artifacts flow correctly between producers and consumers.

**"Integration passed" requires actual evidence — not just successful imports.**

## The 50-HH Integration Gate (MANDATORY)

Before scaling from the pilot to the full 500–800 household sample, the **entire pipeline**
must pass end-to-end on a fixed 50-household pilot. This gate is defined in
Team Execution Contract §5.

### Required Checks

| # | Check | Evidence Required |
|---|---|---|
| 1 | Row counts | 50 households at every stage; no silent drops |
| 2 | Schema validation | Every artifact validates against Blueprint v2 §C schema |
| 3 | Household IDs | Consistent `LCLid` / `household_id` across every table; no orphaned IDs |
| 4 | Chronological ordering | Window sequence per household strictly increasing |
| 5 | Calibration isolation | Each `calibrate_household()` call sees exactly 1 household |
| 6 | No future leakage | `forecast_global.parquet.trained_up_to_window < window_id` for every row |
| 7 | Cluster alignment | Aligned labels stable under a known synthetic shuffle test |
| 8 | Transition counting | First Analysis-window row has `n_transitions_observed == 2` |
| 9 | Forecast target alignment | `window_w_plus_1` is always the literal calendar successor of `window_w` |
| 10 | Missing/non-adjacent behavior | A pilot HH with a deliberate gap produces no row for that pair |
| 11 | API responses | All 6 endpoints return valid schema for pilot households; 404 for unknown IDs |
| 12 | Frontend rendering | All 4 pages render pilot data without error |
| 13 | RAG grounding | All 4 grounding tests pass against pilot artifacts |

**PASS:** Every check has evidence and no failure. **FAIL:** Any single check fails → fix and rerun before touching the full sample.

## Artifact Schema Verification

For each artifact in the pipeline, verify:

### Column Names and Types

```
household_id  → string, never null
window_id     → string, one of W01..W14, never null
window_role   → string, one of: calibration_1, calibration_2, analysis, holdout
timestamps    → datetime-compatible
numeric cols  → float64 or int, no unexpected NaN
boolean cols  → true/false, no null
```

### Cross-Artifact Consistency

| Rule | How to Check |
|---|---|
| Every `household_id` in any artifact must exist in `households_sampled.parquet` | Left join, assert no nulls |
| Every `window_id` must be one of the 14 LOCKED calendar windows | Set membership check |
| `calibration_assignment.parquet` HH count == `households_sampled.parquet` HH count | Count comparison |
| `behavioral_features.parquet` covers all usable windows (incl. calibration pair) | Cross-check with `window_eligibility.parquet` |
| `cluster_assignments.parquet` has rows for calibration windows too | Filter by `window_role`, verify calibration_1/2 present |
| `instability_volatility.parquet` has Analysis windows ONLY | Assert no calibration/holdout rows |
| `research_table.parquet` has at most 1 `is_holdout == True` row per HH (exactly 1 for HHs whose immediate calendar predecessor was usable; none for ineligible) | Filter `is_holdout==True`, verify predecessor usability |
| `forecast_global.parquet.trained_up_to_window < window_id` for every row | Column comparison |

### Row Granularity

| Artifact | Expected Grain |
|---|---|
| `households_sampled.parquet` | Exactly 1 row per household |
| `window_eligibility.parquet` | 1 row per (household, window) — 14 rows per HH |
| `calibration_assignment.parquet` | Exactly 1 row per household |
| `behavioral_features.parquet` | 1 row per (household, usable window) |
| `cluster_assignments.parquet` | 1 row per (household, usable window) including calibration |
| `instability_volatility.parquet` | 1 row per (household, Analysis window) |
| `calibration_summary.parquet` | Exactly 1 row per household |
| `forecast_global.parquet` | 1 row per (household, window w+1, half-hour slot) |
| `research_table.parquet` | 1 row per (household, adjacent usable Analysis window-pair) + 1 holdout row |

## API Contract Verification

Verify each backend endpoint against Blueprint v2 §F:

| Endpoint | Method | Key Checks |
|---|---|---|
| `/overview` | GET | Returns `n_households`, `n_active_anomalies`, `cluster_distribution`, `last_pipeline_run` |
| `/household/{id}/forecast` | GET | Returns series with `actual`, `predicted_global`, `predicted_percluster`; 404 for unknown ID |
| `/household/{id}/segment` | GET | Returns `trajectory` (ordered by window), `current_cluster_id`; 404 for unknown ID |
| `/household/{id}/instability` | GET | Returns `instability`, `volatility_cv`, `reliability`; 404 for unknown ID |
| `/household/{id}/anomaly` | GET | Returns `flags` with `is_anomaly`, `triggering_statistic`; 404 for unknown ID |
| `/chat` | POST | Returns `answer`, `tool_calls`, `grounded` boolean; handles unsupported questions |

## Frontend Verification

| Page | What to Check |
|---|---|
| Overview | KPI metrics render; cluster distribution chart renders; alerts show |
| Household Explorer | Household list loads; load curves render; SHAP panel shows (if data available) |
| Behavioral Trajectory | Cluster trajectory timeline renders; persistence score displays |
| Copilot | Chat interface works; tool calls execute; responses are grounded |

## RAG Grounding Verification

From Blueprint v2 §H, verify these test cases:

1. **Unsupported question** — LLM gracefully declines rather than fabricating.
2. **Missing data** — Returns appropriate error when household data doesn't exist.
3. **Invalid household ID** — Returns 404 / appropriate error.
4. **Ungrounded numeric claim** — Response marked `grounded: false` when a number doesn't trace to a tool call or retrieved passage.

## Run Consistency

For the full pipeline run:

- `run_manifest.json` exists in the run directory.
- Git commit hash is recorded.
- `config/pipeline.yaml` hash is recorded.
- All seeds are recorded.
- The `latest` symlink points to the correct run directory.

## What Integration Checking is NOT

- **Not a substitute for unit tests.** Module-level correctness is tested separately.
- **Not a rubber stamp.** "Tests passed" is not enough — schema checks, leakage audits, and row counts are all required.
- **Not optional.** The 50-HH gate must pass before the full-sample run. Scaling up on a failing pilot is not permitted.
