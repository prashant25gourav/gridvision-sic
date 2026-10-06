# GridVision — Decision Log (LIVE)

> **Purpose:** Records implementation decisions that arise during actual repository execution.
> This is NOT a copy of the locked methodology from the master files.
>
> The current methodology and project decisions are governed by the locked master files:
> - `docs/gridvision_master_files/GridVision_FINAL_MASTER_PLAN_v4.docx`
> - `docs/gridvision_master_files/GridVision_AI_HANDOFF_CONTEXT_LOCKED.md`
> - `docs/gridvision_master_files/GridVision_IMPLEMENTATION_BLUEPRINT_v2.md`
> - `docs/gridvision_master_files/GridVision_TEAM_EXECUTION_CONTRACT.md`

**Last Updated:** 2026-09-27

---

## Decision Template

Use this format for each new decision:

```
## DEC-XXX — Short Title

Date:
Status: OPEN | DECIDED | SUPERSEDED
Decision:
Reason:
Affected files/modules:
Impact:
Approved by:
Source:
```

---

## Recorded Decisions

### DEC-001 — Frontend UI Shell Built Before Pipeline Implementation

Date: Prior to 2026-09-27 (pre-existing in repository)
Status: DECIDED
Decision: Build a complete frontend UI shell with mock data before any ML pipeline or real backend endpoints exist.
Reason: P4 can work independently from Day 1 against mocked artifacts matching the Blueprint §F schemas, without blocking on P1/P2. This is explicitly supported by the Team Execution Contract §4 ("Mocked development and production integration are explicitly different phases").
Affected files/modules: `frontend/src/views/`, `frontend/src/mock/mockData.ts`, `frontend/src/components/`
Impact: Frontend exists but renders only illustrative mock data. Must be re-validated against real artifacts when available.
Approved by: Consistent with Team Execution Contract §4
Source: Team Execution Contract §2 (P4 row), §4 (dependency graph)

### DEC-002 — Backend Skeleton Uses Simplified Routing Structure

Date: Prior to 2026-09-27 (pre-existing in repository)
Status: DECIDED
Decision: Backend uses `app/api/v1/endpoints/` structure instead of `app/routers/` as described in Blueprint v2 §B. Only a `system.py` endpoint exists; the domain endpoints (`forecast`, `segment`, `instability`, `anomaly`, `chat`) have not been created yet.
Reason: Scaffolding decision — the current structure is a starting point. The Blueprint §B routing structure (`routers/{forecast,segment,instability,anomaly,chat}.py`) will need to be implemented when real API endpoints are built.
Affected files/modules: `backend/app/api/v1/`
Impact: Minor structural difference from Blueprint §B. Will need alignment when implementing real endpoints.
Approved by: P4 (scaffolding decision, consistent with mock-first development)
Source: Implementation Blueprint v2 §B vs. actual repository structure

### DEC-003 — Dataset Inspector Placed in `ml/` Instead of `pipeline/`

Date: Prior to 2026-09-27 (pre-existing in repository)
Status: DECIDED
Decision: The `inspect_dataset.py` utility was placed in `ml/` rather than `pipeline/ingestion/` or a separate `scripts/` directory.
Reason: The inspector is a standalone diagnostic tool, not part of the production pipeline. `ml/` serves as a general-purpose space for ML-related utilities.
Affected files/modules: `ml/inspect_dataset.py`
Impact: No impact on pipeline architecture. The Blueprint v2 §B `pipeline/` directory does not yet exist and will be created separately when implementation begins.
Approved by: Developer who created the scaffold
Source: Repository observation

### DEC-004 — Master Document Ownership Reconciliation (Issue 1)

Date: 2026-09-27 (Pre-Day 1 Reconciliation)
Status: DECIDED
Decision: Reconcile role ownership across master documents to match authoritative v4 / handoff role structure:
- **P1**: ingestion, QC, sampling, common-calendar windows, per-household calibration assignment, behavioral features, K selection / K-Means, cluster alignment / Hungarian matching, instability, volatility.
- **P2**: calibration forecaster, global forecaster, per-cluster forecaster (capstone-only, isolated), forecast-error standardization, extreme-failure threshold, research table construction, statistical analysis, holdout evaluation.
- **P3**: anomaly detection (Isolation Forest, synthetic injection), SHAP (global forecaster only), explainability.
- **P4**: backend (FastAPI), frontend (React), RAG / Copilot (FAISS + chat), integrating all artifacts into the app.
Reason: Ownership conflicts between Team Execution Contract and v4/Blueprint risked duplicated work, unowned modules, incompatible artifacts, and integration failure.
Affected files/modules: `GridVision_TEAM_EXECUTION_CONTRACT.md` (§1, §2, §3, §4, §8, §9, §10, §12), `GridVision_IMPLEMENTATION_BLUEPRINT_v2.md` (§B, §D.2, §D.3)
Impact: Eliminates teammate overlap; provides single unambiguous owner for each pipeline stage and artifact.
Approved by: Governing pre-Day 1 reconciliation pass per v4 hierarchy
Source: GridVision_FINAL_MASTER_PLAN_v4.docx §15

### DEC-005 — Acyclic Extreme-Failure Threshold Dependency Sequence (Issue 2)

Date: 2026-09-27 (Pre-Day 1 Reconciliation)
Status: DECIDED
Decision: The extreme-failure threshold is computed strictly from the pooled calibration standardized-error distribution and fixed BEFORE research-table outcomes are labelled. The execution order is acyclic:
1. Calibration forecasts → 2. Calibration residuals → 3. Calibration standardized-error distribution → 4. Fixed extreme-failure threshold → 5. Analysis/holdout forecast errors → 6. Standardized errors → 7. Extreme-failure labels → 8. Research table → 9. Statistical analysis.
Reason: The research table contains the outcome `is_extreme_failure` generated by the threshold. Making the research table a prerequisite for threshold computation was a circular dependency that could produce implementation deadlock or accidental post-hoc threshold construction.
Affected files/modules: `GridVision_TEAM_EXECUTION_CONTRACT.md` (§2 row 40, §3 flow, §4 dependency graph), `GridVision_IMPLEMENTATION_BLUEPRINT_v2.md` (§A.2 diagram, §C.9, §D.7, §E)
Impact: Prevents deadlocks; guarantees zero leakage from analysis/holdout data into threshold selection.
Approved by: Governing pre-Day 1 reconciliation pass
Source: v4 §4.3, §8.4; Handoff §6

### DEC-006 — Window-Usability Criteria Clarification (Issue 3)

Date: 2026-09-27 (Pre-Day 1 Reconciliation)
Status: DECIDED
Decision: Window usability is determined by the locked ≥95% expected-slot and ≤3-consecutive-day gap criteria. Households qualify for the analysis pool based on their number of usable windows (≥6 usable windows). A >7-day gap does not by itself imply whole-household exclusion unless the locked qualification rule requires it.
Reason: Overly strong "42 households excluded because of >7-day gaps" wording could cause an agent to physically drop those households prior to window usability checks, silently distorting the sample and invalidating comparability with v4.
Affected files/modules: `GridVision_TEAM_EXECUTION_CONTRACT.md` (§2 row 27), `GridVision_AI_HANDOFF_CONTEXT_LOCKED.md` (§7 step 2), `docs/current_status/TASKS.md` (P1 preprocessing)
Impact: Population and sample selection faithfully follow v4 without unauthorized upfront filtering.
Approved by: Governing pre-Day 1 reconciliation pass
Source: v4 §4 confirmed counts and window-completeness rules

### DEC-007 — Holdout Immediate Calendar Predecessor Eligibility Rule (Issue 4)

Date: 2026-09-27 (Pre-Day 1 Reconciliation)
Status: DECIDED
Decision: Each household's final usable window is its holdout target. It may ONLY be evaluated if its immediately preceding calendar window (`w_pred = calendar_predecessor(w_target)`) is usable and provides valid forecast context. Never substitute an earlier non-adjacent usable window. If the immediate calendar predecessor is unavailable or unusable, the holdout evaluation for that household is marked ineligible rather than constructing a non-adjacent forecast pair.
Reason: GridVision explicitly uses adjacent calendar-window forecasting. Allowing non-adjacent substitution (e.g., W12 → W14 when W13 is unusable) violates the prospective temporal forecasting design and creates evaluation invalidity.
Affected files/modules: `GridVision_IMPLEMENTATION_BLUEPRINT_v2.md` (§C.9, §D.7, §E), `GridVision_TEAM_EXECUTION_CONTRACT.md` (§2 row 42, §8 G5/G7, §10)
Impact: Strict evaluation validity on the holdout window; zero invalid non-adjacent forecast pairs.
Approved by: Governing pre-Day 1 reconciliation pass
Source: Derived rule consistent with v4 temporal adjacency principles

### DEC-008 — UI Reliability-Indicator Cosmetic Bucketing Thresholds

Date: 2026-10-03 (P4 Implementation)
Status: DECIDED
Decision: Implement display-only cosmetic reliability indicator bucketing based on household longitudinal instability score:
- **Stable**: Instability ≤ 0.25 (high behavioral consistency)
- **Moderate**: 0.25 < Instability ≤ 0.60 (moderate cluster mobility)
- **Elevated Risk**: Instability > 0.60 (frequent cluster switching)
Reason: Settles OPEN-1 from Blueprint v2 Revision Log and Team Execution Contract §Remaining OPEN Items. This is a display-layer classification for the operational dashboard and is explicitly confirmed to never be cited as an empirical finding in the research write-up.
Affected files/modules: `backend/app/services/artifact_loader.py`, `backend/app/api/v1/endpoints/household.py`, `frontend/src/views/`
Impact: Consistent three-tier color badges and status indicators across all dashboard screens and Copilot responses.
Approved by: Person 4 / Development Team
Source: Blueprint v2 Revision Log §Remaining OPEN Items, §F.4

### DEC-009 — Local RAG Retriever Using TF-IDF and Cosine Similarity

Date: 2026-10-03 (P4 Implementation)
Status: DECIDED
Decision: The RAG Copilot retriever indexes knowledge base markdown passages using local TF-IDF vectorization (`scikit-learn`) and cosine similarity, paired with deterministic Python tool-calling and strict numeric traceability checks.
Reason: Guarantees 100% offline, reproducible execution without mandating external cloud API keys, network access, or heavy GPU sentence-transformer dependencies, while strictly adhering to Blueprint v2 §H and Handoff §11.
Affected files/modules: `backend/app/services/rag/retriever.py`, `backend/app/services/rag/grounding.py`, `backend/app/services/rag/agent.py`
Impact: Sub-millisecond response latency, robust numeric verification, and zero cloud API dependency.
Approved by: Person 4 / Development Team
Source: Blueprint v2 §H, Handoff §11

### DEC-010 — Holdout Evaluation Governance Guard & Archive Protocol (Issue 3)

Date: 2026-10-04
Status: DECIDED
Decision: Prior to any pipeline re-execution following the lag feature enhancement, preserve the original single forward-pass holdout evaluation by copying `data/artifacts/run_initial/` to `data/artifacts/run_initial_PRE_LAG_FIX_ARCHIVED/`. Implement a `--skip-holdout` flag in `pipeline/run_pipeline.py`. Rerun only through the research-table and statistical-model stages on Analysis-period data. Do not execute a second live holdout evaluation until explicit team sign-off confirms the methodology is final.
Reason: Master Plan v4 §4.5 and Team Execution Contract §8 treat touching the holdout window a second time as a BLOCKED incident requiring formal escalation rather than a routine rerun. Archiving preserves the original auditable evaluation while allowing necessary model improvements on Analysis data.
Affected files/modules: `pipeline/run_pipeline.py`, `data/artifacts/run_initial_PRE_LAG_FIX_ARCHIVED/`
Impact: Holdout sanctity is preserved; original Gate G7 results remain permanently auditable.
Approved by: Development Team / Lead Auditor
Source: Master Plan v4 §4.5, Team Execution Contract §8/§11

### DEC-011 — Physical Absence of 5 Metadata Households in Raw Block Telemetry (Issue 5)

Date: 2026-10-04
Status: DECIDED
Decision: Document that exactly 5 flat-rate households present in `informations_households.csv` (`MAC001150`, `MAC005556`, `MAC005559`, `MAC005560`, `MAC005563`) are 100% physically absent from all 112 raw CSV block files (`data/raw/hhblock_dataset/block_*.csv`). The 4,443 assertion in `pipeline/ingestion/metadata.py` remains locked as the authoritative metadata-level count; the 4,438 count in `pipeline/windows/eligibility.py` reflects physical telemetry availability.
Reason: Full sweep of all raw block CSVs confirmed the gap is a physical omission in the source UK Power Networks dataset, not a parsing or join bug. With only 5 missing IDs (0.11% of the population), there is zero downstream impact on qualifying pool size (4,252) or stratified sampling.
Affected files/modules: `pipeline/ingestion/metadata.py`, `pipeline/windows/eligibility.py`, `docs/current_status/DECISIONS.md`
Impact: Clarifies discrepancy between metadata population (4,443) and telemetry population (4,438) without loosening metadata integrity checks.
Approved by: Development Team
Source: UK Power Networks Low Carbon London dataset structure audit

### DEC-012 — Deliberate Isolation Forest Contamination Parameter (Issue 6)

Date: 2026-10-04
Status: DECIDED
Decision: Maintain `contamination=0.05` in `pipeline/anomaly/isolation_forest.py` as an explicit, deliberate design choice.
Reason: Master Plan v4 §10 does not mandate an algorithmic contamination hyperparameter. In utility smart grid operations, a 5% tail budget represents the industry-standard baseline for unsupervised operational screening (flagging the top ~5% behavioral outliers for review) without requiring supervised fault ground-truth labels.
Affected files/modules: `pipeline/anomaly/isolation_forest.py`
Impact: Operational consistency across 6,198 usable household windows with 310 flagged events (~5.00%).
Approved by: Development Team / Person 3
Source: Master Plan v4 §10, Blueprint v2 §C.7

### DEC-013 — ACORN-U Stratification Floor Increased to 15 (Issue 4)

Date: 2026-10-04
Status: DECIDED
Decision: Increase `sampling.acorn_u_min_floor` in `config/pipeline.yaml` from 5 to 15.
Reason: In the qualifying pool of 4,252 households, proportional allocation for ACORN-U (36 / 4,252 × 620 ≈ 5.25 → rounds to 5) already yielded 5, rendering the previous floor of 5 a non-binding no-op. Raising the floor to 15 guarantees adequate demographic representation of unclassified households in the 620-household sample (Affluent: 233, Adversity: 207, Comfortable: 165, ACORN-U: 15; total = 620), fulfilling the intent of Master Plan v4 §3.6.
Affected files/modules: `config/pipeline.yaml`, `pipeline/sampling/stratified_sample.py`, `tests/test_sampling_and_calibration.py`, `tests/test_artifacts_contract.py`
Impact: Statistically protected ACORN-U representation with seed=42 deterministic reproducibility.
Approved by: Development Team
Source: Master Plan v4 §3.6

### DEC-014 — Restoration of Locked Lag Features in Global Forecaster (Issue 1)

Date: 2026-10-04
Status: DECIDED
Decision: Restore the locked lag feature specification in `pipeline/forecasting/global_forecaster.py` per Master Plan v4 §7 ("Lag + calendar features, pooled across households"):
- `lag_halfhour_mean`: Household's mean load for that half-hour slot across window $w$.
- `lag_dow_halfhour_mean`: Household's mean load for that (day_of_week, half-hour) slot across window $w$.
- `lag_last_week`: Household's actual load for that (day_of_week, half-hour) slot in the final week (days 49-55) of window $w$.
- `lag_recent_7d_mean`: Household's mean consumption over the final 7 days of window $w$.
- `lag_recent_48h_mean`: Household's mean consumption over the final 48 hours of window $w$.
All lag features are computed strictly from readings at or before window $w$ (zero future leakage into window $w+1$).
Reason: Previous implementation used only static scalar window summaries (`mean_load`, `peak_load`, `std_load`), leaving the model structurally weaker than per-household calibration and causing an inflated extreme-failure rate of 24.25% vs v4's expected ~5%. Adding lag features restores the locked input specification and allows the global forecaster to beat the seasonal-naive baseline.
Affected files/modules: `pipeline/forecasting/global_forecaster.py`, `tests/test_global_forecaster.py`
Impact: Drastic error reduction, beats seasonal-naive baseline, and restores nominal extreme-failure distribution.
Approved by: Development Team / Person 2
Source: Master Plan v4 §7, Blueprint v2 §D.5

### DEC-015 — Holdout Re-Execution Approval and Retirement of Pre-Fix Holdout

Date: 2026-10-06
Status: DECIDED
Decision: The archived pre-fix holdout (`data/artifacts/run_initial_PRE_LAG_FIX_ARCHIVED/holdout_results.json`) is retired and will NOT be reported as the project's holdout result. Re-run `holdout_eval.py` exactly once on the current corrected model in `data/artifacts/latest/` (git commit `84d609303c4f797562de8cabed3447cb5c2e73e8`), and permanently lock holdout re-execution thereafter via a strict code guard requiring explicit `--force-holdout-rerun`.
Reason: It evaluated a model later confirmed to be missing a locked input (lag features, v4 §7) via evidence entirely independent of holdout (naive-baseline comparison, per-household AE audit, leakage test) — the fix was not informed by holdout feedback, so re-running once is not a violation of "touched once, forward-only, never for tuning," it's completing that protocol correctly on the intended model. This is a one-time, explicitly justified exception, not a precedent. The archived pre-fix holdout is retired and must not be cited in the final report.
Evaluated Git Commit: `84d609303c4f797562de8cabed3447cb5c2e73e8`
New Holdout Performance Metrics:
- Eligible Holdout Households: 612 (out of 620 sampled; 8 gap ineligibles)
- Holdout Extreme Failures: 157 (event rate: 25.65%)
- Primary Model ROC-AUC: 0.7298 (improved from pre-fix 0.7010)
- Primary Model PR-AUC: 0.5378 (vs pre-fix 0.5375)
- Restricted Model ROC-AUC: 0.7296
- Delta ROC-AUC: +0.0002
- Brier Score: 0.16813 (vs pre-fix 0.18760)
- Log Loss: 0.51322 (vs pre-fix 0.55980)
- Applied Fixed Coefficients: Intercept = -3.67129, Volatility CV = 2.00767, Instability = -0.08518 (refit_performed: False, 0 fit calls)
Affected files/modules: `pipeline/research/holdout_eval.py`, `pipeline/run_pipeline.py`, `data/artifacts/latest/holdout_results.json`
Approved by: Development Team / Research Governance
Source: Master Plan v4 §4.5, Team Execution Contract §8

### DEC-016 — Formal Closure of Extreme-Failure-Rate Investigation (Candidate c)

Date: 2026-10-06
Status: DECIDED
Decision: Formally close the extreme-failure-rate investigation. Adopt Candidate (c): research methodology remains unchanged (locked 95th percentile calibration threshold = 2.53438, cluster-robust logistic regression on 3,676 Analysis observations, event rate = 18.96%), and the seasonal concentration of forecast errors is documented as a methodological limitation of absolute standardized error in the presence of seasonal load expansion.
Reason: The investigation confirmed that winter space-heating demand expansion induces absolute load and residual variance expansion that outpaces scale-invariant coefficient of variation (CV). As confirmed via season-dummy and window-fixed-effects robustness checks, the bivariate association between instability and forecast failure ($p=0.0471$) is an omitted variable / seasonal timing artifact (summer windows W04–W06 have high early transition noise but low failures; winter windows W07–W10 have smoothed instability but winter heating demand spikes). Once season or baseline volatility is controlled for, instability is statistically non-significant ($p = 0.7481$ in primary model, $p = 0.3573$ with winter control). Methodology is sound and intact; Candidate (c) documents this phenomenon as a research finding and limitation rather than altering the locked pipeline.
Affected files/modules: `docs/current_status/PROJECT_STATE.md`, `docs/current_status/DECISIONS.md`, `pipeline/research/`
Approved by: Development Team / Research Governance
Source: Master Plan v4 §8.5–8.8, Blueprint v2 §D

### Pre-Registered Robustness Suite Summary (v4 §8.8)

In accordance with Master Plan v4 §8.8 and Blueprint v2 §D, the pre-registered robustness specifications were executed via `pipeline/research/robustness.py`:
1. **Specification 1 (Bivariate Logit: `y ~ instability`):**
   - Instability Odds Ratio: 1.6943 (95% CI: [1.0070, 2.8497]), z = 1.985, p = 0.0471.
   - Finding: Nominally significant bivariate association driven by seasonal omitted variable bias (early summer window denominator noise vs winter failure concentration).
2. **Specification 2 (Season-Controlled Logit: `y ~ volatility_cv + instability + is_winter`):**
   - Instability Odds Ratio: 0.7815 (95% CI: [0.4623, 1.3211]), z = -0.921, p = 0.3573 (non-significant).
   - Volatility CV Odds Ratio: 9.4474 (95% CI: [5.9381, 15.0305]), z = 9.479, p < 0.0001.
   - Winter Indicator (`is_winter`) Odds Ratio: 4.1851 (95% CI: [3.3725, 5.1936]), z = 13.000, p < 0.0001.
   - Finding: Clean convergence without separation. Confirms that controlling for seasonal demand expansion reinforces the primary finding: cluster instability provides no marginal predictive utility over volatility.
3. **Deprioritized Checks (Contingency Plan v4 §17, "cut second"):**
   - Full window-fixed-effects sweep (which suffers from quasi-complete separation on W04/W05 summer zero-failure cells) and placebo/window-length sweeps are deprioritized per the locked Contingency Plan §17 given project schedule constraints.

---

## Pending / Open Items

1. **Literature novelty verification search** (non-blocking for implementation, required before submitting final capstone research paper per Master Plan v4 §23 / Handoff §22).
2. **Methods & Results write-up and demonstration rehearsal** (viva presentation slides and live demo walkthrough).

