# GridVision — Team Execution Contract

> Converts the locked methodology (v4) and `IMPLEMENTATION_BLUEPRINT_v2.md` into an operational contract. Not a new plan. If this document and v4 ever disagree, **v4 wins** — any such case is flagged `OPEN`, never silently resolved here.

**Status labels:** `LOCKED` `VERIFIED` `IMPLEMENTED` `TESTED` `INTEGRATED` `OPEN` `BLOCKED` `DERIVED` (implementation naming/choice not specified upstream).

---

## 1. Roles

| Role | Owns |
|---|---|
| **P1** — Data / Research Pipeline Lead | ingestion, QC, sampling, common-calendar windows, per-household calibration assignment, behavioral features, K selection / K-Means, cluster alignment / Hungarian matching, instability, volatility |
| **P2** — Forecasting / Statistics | calibration forecaster, global forecaster, per-cluster forecaster, forecast-error standardization, extreme-failure threshold, research table construction, statistical analysis, holdout evaluation |
| **P3** — Anomaly / Explainability | anomaly detection (Isolation Forest, synthetic injection), SHAP (global forecaster only), explainability |
| **P4** — Backend / Frontend / RAG | backend (FastAPI), frontend (React), RAG / Copilot (FAISS + chat), integrating all artifacts into the app |

Ownership is strictly reconciled to match the authoritative v4 / handoff role structure:
- **Reasoning to preserve:** Ownership conflicts can cause duplicated work, missing work, incompatible artifacts, and integration problems. This is therefore a real execution risk, not a cosmetic documentation issue.
- **P1** owns the entire data, feature, clustering, Hungarian alignment, and transition-metric pipeline up through `instability_volatility.parquet`.
- **P2** owns all forecasting models (calibration forecaster, global forecaster, and per-cluster forecaster), forecast-error standardization, the calibration-derived extreme-failure threshold, research table construction, statistical modeling, and holdout evaluation. Per-cluster forecasting is capstone-only and strictly isolated from P2's research table (enforced via static import check).
- **P3** focuses exclusively on anomaly detection, synthetic injection benchmarks, and SHAP explainability.
- **P4** owns the application layer: backend APIs, React UI, and RAG Copilot.

---

## 2. Ownership Matrix

| Component | Owner | Files | Inputs | Outputs | Consumers | Depends on | Acceptance test | Milestone |
|---|---|---|---|---|---|---|---|---|
| Ingestion | P1 | `pipeline/ingestion/to_parquet.py` | Raw Kaggle CSVs | `data/interim/*.parquet` | QC | raw download | Row/household counts match v4 §4 verified numbers | M0 |
| QC | P1 | `pipeline/quality/checks.py` | interim Parquet | `data_quality_report.json`, filtered set | sampling | Ingestion | 0 negatives; window usability determined by locked ≥95% expected-slot and ≤3-consecutive-day gap criteria (qualifying pool requires ≥6 usable windows; a >7-day gap does not by itself imply whole-household exclusion) | M0 |
| Sampling | P1 | `pipeline/sampling/stratified_sample.py` | filtered set | `households_sampled.parquet` | everyone | QC | 500–800 HH, fixed seed, Acorn_grouped strata | M0 |
| Windows/eligibility | P1 | `pipeline/windows/{calendar,eligibility}.py` | sampled HH | `window_eligibility.parquet` | calibration select | Sampling | 14 fixed windows; 95%/≤3-day rule applied | M1 |
| Calibration assignment | P1 | `pipeline/windows/calibration_select.py` | eligibility | `calibration_assignment.parquet` | features, clustering, calibration forecast | Windows | `n_analysis_windows≥4` for every HH | M1 |
| Behavioral features | P1 | `pipeline/features/behavioral.py` | eligibility + readings | `behavioral_features.parquet` (all usable windows, incl. calibration pair) | clustering, K-selection | Calibration assignment | No NaNs; computed from that window only | M2 |
| K selection | P1 | `pipeline/clustering/k_selection.py` | features (calibration windows only) | fixed `K` in `config/pipeline.yaml` | clustering | Behavioral features | Silhouette sweep k=3..8 documented | M3 |
| Clustering (all usable windows) | P1 | `pipeline/clustering/kmeans_fit.py` | features, fixed K | `cluster_assignments.parquet` (raw) | alignment | K selection | One fit per window, incl. calibration pair | M3 |
| Alignment | P1 | `pipeline/clustering/alignment.py` | raw clusters | `cluster_assignments.parquet` (aligned) | instability, frontend | Clustering | Chain starts at calibration_1; shuffled-label test passes | M3 |
| Instability / volatility | P1 | `pipeline/instability/metrics.py` | aligned clusters | `instability_volatility.parquet` (Analysis windows only) | research table | Alignment | First Analysis row has `n_transitions_observed==2` | M4 |
| Calibration forecasting | P2 | `pipeline/forecasting/calibration_forecast.py` | one HH's Cal-W1/Cal-W2 | `calibration_residuals.parquet`, `calibration_summary.parquet` | error standardization | Calibration assignment | Exactly 1 `household_id` per training call; no import of `global_forecaster.py` | M5 (parallel w/ M3) |
| Extreme-failure threshold | P2 | `pipeline/research/extreme_failure.py` | calibration StdError pool (from Cal-W2 residuals) | `extreme_failure_threshold.json` | research table labeling, statistics | Calibration forecasting and error standardization (M5) | Fixed once from pooled calibration StdErrors only; 90th fallback documented if needed. Computed BEFORE research table labeling. | M5/M7 |
| Global forecasting | P2 | `pipeline/forecasting/global_forecaster.py` | pooled features up to window w | `forecast_global.parquet` | research table | Behavioral features | `train_data.window<=w` assertion holds | M6 |
| Per-cluster forecasting (capstone-only) | P2 | `pipeline/forecasting/cluster_forecaster.py` | pooled features per cluster | `forecast_percluster.parquet` | frontend only | Behavioral features, Clustering | Never imported by `build_research_table.py` (static check) | M6 |
| Research table | P2 | `pipeline/research/build_research_table.py` | instability, global forecast, calibration summary, extreme-failure threshold | `research_table.parquet` | statistics, frontend | M4, M5, M6 | Adjacency + usability rules enforced (§8); labeled using fixed threshold; holdout predecessor rule enforced | M7 |
| Statistical model | P2 | `pipeline/research/statistical_model.py` | research table (Analysis rows) | `statistical_results.json` | write-up, frontend | M7 | Cluster-robust SE confirmed on fitted object | M8 |
| Holdout | P2 | `pipeline/research/holdout_eval.py` | fixed model/threshold + Holdout rows | `holdout_results.json` | write-up | M8 | Final usable window is holdout target; only evaluated if immediate calendar predecessor is usable; never substitute non-adjacent window; if predecessor unavailable, mark evaluation as ineligible; no `.fit()` call in this file | M8 (Day 19 only) |
| Anomaly detection | P3 | `pipeline/anomaly/{isolation_forest,synthetic_injection}.py` | features | `anomaly_flags.parquet` | frontend | Behavioral features | Precision/Recall/F1 on synthetic set reported | M9 |
| SHAP | P3 | `pipeline/explainability/shap_forecaster.py` | trained global forecaster | `shap_explanations.parquet` | frontend | M6 | Scoped to global forecaster only | M9 |
| Backend APIs | P4 | `backend/app/routers/*.py` | all artifacts | HTTP responses | frontend, RAG | M7 min. | All 6 endpoints tested (404s, schema) | M10 |
| Frontend | P4 | `frontend/src/*` | backend APIs | rendered UI | demo | Backend | E2E smoke passes on 4 pages | M11 |
| RAG Copilot | P4 | `backend/app/services/rag/*` | knowledge base + tool calls into backend | `/chat` responses | demo | Backend | 4 grounding tests pass (§14) | M12 |

---

## 3. Artifact Flow and Handoff Contracts

Raw → Parquet → QC → sampled HH → window eligibility → calibration assignment → behavioral features → (K selection → clustering → alignment) → instability/volatility → calibration residuals → calibration standardized-error distribution → fixed extreme-failure threshold → global forecast errors → standardized errors → extreme-failure labels → research table → statistical results → holdout results → (anomaly, SHAP) → API artifacts → frontend/RAG.

Every artifact below is **immutable once written** for a given `run_<timestamp>` — a bugfix means rerunning the pipeline into a new run directory, never editing a file in place.

| Handoff | Path | Key(s) | Required fields (see Blueprint v2 §C for full schema) | Grain | Validation |
|---|---|---|---|---|---|
| P1→P2/P3/P4 | `households_sampled.parquet` | `household_id` | acorn_grouped, n_usable_windows, sample_seed | 1/household | fixed seed logged |
| P1→P2 | `window_eligibility.parquet` | `household_id`,`window_id` | slot_fill_pct, max_gap_days, is_usable | 1/(HH,window) | 14 windows exactly |
| P1→P2 | `calibration_assignment.parquet` | `household_id` | calibration_window_1/2, first_analysis_window, last_usable_window, n_analysis_windows | 1/household | `n_analysis_windows>=4` |
| P1→P2/P3 | `behavioral_features.parquet` | `household_id`,`window_id` | 8 features (§Blueprint C.4) | 1/(HH, usable window incl. calibration) | no NaN |
| P1→P1/P2/P4 | `cluster_assignments.parquet` | `household_id`,`window_id` | `window_role`, raw_cluster_label, aligned_cluster_label | 1/(HH, usable window incl. calibration) | includes calibration_1/2 rows |
| P1→P2 | `instability_volatility.parquet` | `household_id`,`window_id` | instability, volatility_cv, n_transitions_observed | 1/(HH, Analysis window only) | first row has 2 transitions |
| P2→P2 | `calibration_summary.parquet` | `household_id` | calibration_median_ae, calibration_mad, mad_effective, mad_floor_triggered | 1/household | derived from Cal-W2 residuals only |
| P2→P2 | `extreme_failure_threshold.json` | n/a | threshold_std_error_95th, fallback_90th, n_calibration_errors | 1 object | fixed from calibration only; precedes research table labeling |
| P2→P2 | `forecast_global.parquet` | `household_id`,`window_id`,`timestamp` | predicted, actual, trained_up_to_window | 1/(HH, w+1, half-hour slot) | `trained_up_to_window < window_id` |
| P2→P4 | `forecast_percluster.parquet` | `household_id`,`window_id`,`timestamp` | predicted_percluster, actual | 1/(HH, w+1, half-hour slot) | capstone-only; never imported by research code |
| P2→P2 | `research_table.parquet` | `household_id`,`window_w` | instability, volatility_cv, ae, std_error, is_extreme_failure, is_holdout | 1/(HH, adjacent usable window-pair) | one `is_holdout=True` row/HH (if calendar predecessor usable) |
| P2→P4/write-up | `statistical_results.json`, `holdout_results.json` | n/a | see Blueprint v2 §C.12 | 1 object | no null once populated |
| P3→P4 | `anomaly_flags.parquet`, `shap_explanations.parquet` | `household_id` | is_anomaly, triggering_statistic / top features | 1/(HH, day or forecast point) | forecaster-only for SHAP |
| P1–P3→P4 | all of the above | — | — | — | P4 reads only from `data/artifacts/latest` |

---

## 4. Dependency Graph

```
A. Can start immediately (Day 1)
  P1: ingestion, QC, sampling, windows, calibration selection
  P4: backend/frontend scaffolding against MOCKED artifacts matching §3 schemas
  P3: anomaly module skeleton + synthetic-injection design (needs only shared schema, not real data)
  P2: calibration forecaster module skeleton & methodology setup

B. Requires another teammate's artifact
  P1: K-selection/clustering/alignment/instability/volatility    internal to P1 once behavioral features are complete
  P2: calibration forecasting                                   needs P1's calibration_assignment.parquet ONLY (runs in parallel with P1 clustering)
  P2: extreme-failure threshold                                 needs P2's calibration residuals/summary ONLY (computed before research table)
  P2: global forecasting                                        needs P1's behavioral_features.parquet
  P2: per-cluster forecasting                                   needs P1's behavioral_features.parquet + cluster_assignments.parquet (capstone-only)
  P2: research table                                            needs P1's instability/volatility + P2's global forecast + P2's calibration summary + P2's fixed extreme-failure threshold
  P3: SHAP                                                      needs P2's trained global forecaster
  P4: real integration (replacing mocks)                         needs P2's research_table.parquet and upstream artifacts (Day 12 gate)

C. Requires integration
  50-HH pilot (§5) — first point every module's real output is checked end-to-end together

D. Final validation
  Full 500–800 HH run → Holdout (once, Day 19) → demo rehearsal
```

Mocked development (P4, from Day 1) and production integration (Day 9 onward, real artifacts) are explicitly different phases — P4 must not block on P1/P2, and must not treat mock-based work as done until re-validated against real artifacts.

---

## 5. 50-Household Integration Gate (mandatory, before scaling to 500–800)

Run the **entire** pipeline end-to-end on a fixed 50-household pilot slice before the full run. Check:

| Check | Evidence required |
|---|---|
| Row counts | Pilot household count == 50 at every stage; no silent drops |
| Schema | Every artifact in §3 validates against its schema (pandera/pydantic) |
| Household IDs | Consistent `LCLid` across every table, no orphaned IDs |
| Chronological ordering | Window sequence per household strictly increasing |
| Calibration isolation | Each `calibrate_household()` call sees exactly 1 household |
| No future leakage | `forecast_global.parquet.trained_up_to_window < window_id` for every row |
| Cluster alignment | Aligned labels stable under a known synthetic shuffle test |
| Transition counting | First Analysis-window row has `n_transitions_observed==2` |
| Forecast target alignment | `window_w_plus_1` is always the literal calendar successor of `window_w` |
| Missing/non-adjacent window behavior | A pilot household with a deliberate gap produces no row for that pair (not a substituted one) |
| API responses | All 6 endpoints return valid schema for pilot households, 404 for unknown IDs |
| Frontend rendering | All 4 pages render pilot data without error |
| RAG grounding | All 4 grounding tests (Blueprint v2 §H) pass against pilot artifacts |

**PASS:** every row above has evidence and no leakage/schema/adjacency check fails. **FAIL:** any single check fails → pipeline is fixed and the pilot is rerun before touching the full 500–800 sample. Scaling up on a failing pilot is not permitted.

---

## 6. Git Workflow

- **`main`** — always deployable/demoable; protected, no direct pushes.
- **Feature branches** — one per module, named `p<n>/<module>` (e.g., `p2/global-forecaster`). Short-lived.
- **PRs required** for every merge to `main`; reviewed by any other teammate (not necessarily the module owner).
- **Merge requires:** the module's own tests green, plus any leakage/schema tests it touches (§7).
- **Rebase on `main`** before opening a PR if `main` has moved; resolve conflicts locally, never in the PR UI blind.
- **Raw data and artifacts are gitignored** (`data/raw/`, `data/artifacts/`) — only code, config, and small fixtures (e.g., the 50-HH pilot fixture) are committed.
- **Conflicts on generated files** (schemas, configs) resolved by the file's owner, not by whoever hit the conflict first.

---

## 7. Handoff Protocol (paste into PR description)

```
MODULE:
IMPLEMENTED: <what was built>
FILES CHANGED:
INPUT CONTRACT: <artifact(s) consumed, path>
OUTPUT ARTIFACT: <path, format>
SCHEMA: <link to §3 row or note if new>
TESTS EXECUTED: <list>
TEST RESULTS: PASSED / TESTED / VERIFIED (see §9 definitions — do not overstate)
KNOWN LIMITATIONS:
EXAMPLE COMMAND: <make target or CLI call>
DOWNSTREAM CONSUMER: <who reads this next>
NOTES FOR NEXT TEAMMATE:
DEVIATIONS FROM v4: NONE  (or: describe + flag OPEN per §11)
```

---

## 8. Research Integrity Gates

| Gate | Checks | Who checks | Evidence | On failure |
|---|---|---|---|---|
| G1 Dataset correctness | Counts match v4 §4 verified numbers | P1 | printed counts vs. table | Stop, re-run ingestion/QC |
| G2 Calibration correctness | Per-household, isolated, `n_analysis_windows>=4` | P2 | unit test output | Stop, fix `calibration_select`/`calibration_forecast` |
| G3 Clustering/alignment correctness | K fixed once; alignment chain includes calibration pair | P1 | silhouette log + shuffled-label test | Stop, do not proceed to instability |
| G4 Forecasting chronology | `train_data.window<=w` for every model | P2 | leakage-audit script | Stop, fix training loop |
| G5 Research-table correctness | Adjacency + usability rules; holdout evaluated only if immediate calendar predecessor is usable; one holdout row/HH | P2 | integrity test suite | Stop, fix `build_research_table.py` |
| G6 Statistical analysis | Cluster-robust SE; positive-event rate checked | P2 | `statistical_results.json` inspection | Apply 90th-pct fallback per v4 if rate too low; never invent a different fix |
| G7 Holdout evaluation | Run exactly once, forward-only, no `.fit()`, immediate predecessor usability required | P2 + one reviewer | code review + no re-run after first pass | If a bug is found, this is a `BLOCKED` incident — escalate, do not quietly rerun |
| G8 Application integration | 50-HH gate (§5) passed before full-scale run | P4 + P1/P2 | §5 checklist | Do not scale until fixed |

A green test suite is not proof of scientific validity (e.g., G6/G7 require a human reading the actual numbers, not just "tests passed").

---

## 9. Definition of Done

- **P1:** all artifacts through `instability_volatility.parquet` schema-valid on the full sample; G1, G3 passed; no known leakage.
- **P2:** calibration, global, and per-cluster forecasters, `research_table.parquet`, `extreme_failure_threshold.json`, `statistical_results.json`, `holdout_results.json` complete on the full sample; G2, G4–G7 passed.
- **P3:** anomaly + SHAP artifacts complete; per-cluster forecaster confirmed never imported by research code.
- **P4:** all 6 endpoints + 4 pages + RAG working against the full-sample `latest` artifact directory; local-only and offline-Copilot fallbacks tested.
- **Shared integration:** 50-HH gate passed (§5); full-sample run passed the same checklist.
- **Final project:** demo runs end-to-end twice without manual intervention; write-up cites `statistical_results.json`/`holdout_results.json` values, not invented ones.

`TESTED` = automated suite green. `VERIFIED` = a human additionally inspected a real (non-synthetic) example and confirmed it looks sane. Do not report `VERIFIED` from test output alone; do not report `IMPLEMENTED` without a runnable command that produces the artifact.

---

## 10. Testing Ownership

| Test | Type | Owner |
|---|---|---|
| Schema validation (all artifacts) | Unit/contract | Artifact's producing owner |
| Calibration isolation (single-HH, no cross-import) | Unit + static check | P2 |
| Alignment chain includes calibration pair | Unit | P1 |
| First-Analysis transition count == 2 | Unit | P1 |
| Non-adjacent pair dropped | Unit | P2 |
| Forecast lag-window usability required | Unit | P2 |
| Holdout immediate calendar predecessor usability | Unit + research integrity | P2 |
| No future predictors (`train_data.window<=w`) | Research integrity | P2 |
| Holdout untouched until final pass (no `.fit()`) | Research integrity | P2 + reviewer |
| Threshold fixed from calibration only | Research integrity | P2 |
| API schema + error codes | Integration | P4 |
| Frontend renders all pages on pilot data | Integration | P4 |
| RAG grounding (4 cases, Blueprint v2 §H) | Integration | P4 |
| 50-HH end-to-end | End-to-end | Whole team, coordinated by P1 |
| Full-sample end-to-end + demo rehearsal | End-to-end | Whole team |

---

## 11. Conflict / Change Protocol

If implementation reveals a genuine conflict with v4:
1. **Stop** the affected pipeline stage.
2. **Document** the conflict in writing (what v4 says, what's actually happening).
3. **Identify** the exact conflicting assumption.
4. **Do not** silently modify methodology to make it work.
5. **Escalate** to the full team.
6. **Record** the team's approved decision (in this file or a dated addendum).
7. **Update** the affected artifact contract/ownership row in §2–3.

Minor implementation details not specified by v4 (e.g., a variable name, which library implements a lightweight model) may be chosen by the responsible developer without escalation — mark as `DERIVED` in code comments/PR description.

---

## 12. 20-Day Checkpoints (execution view of the locked schedule — no new dates)

| Days | Expected output | Owner | Gate |
|---|---|---|---|
| 1–2 | Sampled dataset on disk | P1 | G1 |
| 3–4 | QC + calibration pairs assigned | P1 | G1 |
| 5–6 | K fixed (P1); calibration residuals computed (P2) | P1/P2 (parallel) | G2, part of G3 |
| 7 | First clustering pass sane | P1 | G3 (partial) |
| 8–9 | Aligned trajectories, all households | P1 | G3 |
| 10 | Instability/volatility computed (P1); extreme-failure threshold fixed (P2) | P1 / P2 | G3 |
| 11–12 | Standardized errors for every pair; research table assembled and labeled; deploy skeleton up | P2 / P4 | G4 |
| 13–14 | Primary H1/H0 result | P2 | G5, G6 |
| 15 | Robustness + write-up start | P2 | — |
| 16 | Anomaly detection working | P3 | — |
| 17 | SHAP scoped correctly | P3 | — |
| 18 | RAG + full integration | P4 | G8 (50-HH gate should already be passed by here) |
| 19 | Bug bash, Holdout run once | Whole team | G7, G8 |
| 20 | Demo + write-up complete | Whole team | — |

---

## 13. Final Integration Checklist

**DATA:** [ ] dataset loads [ ] sample fixed (seed logged) [ ] windows valid (14, common-calendar) [ ] calibration valid (per-household, isolated)

**ML:** [ ] clustering valid (incl. calibration windows) [ ] alignment valid (chain from calibration_1) [ ] instability valid (first row = 2 transitions) [ ] volatility valid [ ] forecasting valid (global only feeds research) [ ] threshold fixed (calibration-only, 95th w/ 90th fallback)

**RESEARCH:** [ ] research table valid (adjacency + usability rules) [ ] leakage tests pass [ ] statistical model runs (cluster-robust SE) [ ] robustness attempted [ ] holdout evaluated exactly once (immediate calendar predecessor verified)

**ANOMALY:** [ ] anomaly detector works [ ] synthetic evaluation works [ ] SHAP scoped to global forecaster only

**APPLICATION:** [ ] backend works [ ] frontend works [ ] APIs return correct artifacts [ ] RAG retrieves correct documents [ ] numeric claims grounded

**INTEGRATION:** [ ] all four modules integrated [ ] 50-HH pilot passes (§5) [ ] full-sample run passes [ ] final demo path works twice, unassisted

---

### Execution Contract Readiness

- Team ownership: **READY**
- Artifact contracts: **READY**
- Dependencies: **READY**
- Testing: **READY**
- Integration: **READY**
- 50-HH pilot: **READY** (defined, not yet run — becomes `TESTED`/`VERIFIED` once actually executed)

### Remaining OPEN Items

1. UI reliability-indicator bucketing thresholds (display-only, cosmetic — needs a one-line team confirmation it's never cited in the write-up; carried over from Blueprint v2).
2. Forecaster ownership reconciled to P2: P2 owns all forecasters (calibration, global, per-cluster). Per-cluster forecaster is capstone-only and strictly isolated from research outputs (enforced by static check).

No methodological conflicts with v4 were found during this audit.
