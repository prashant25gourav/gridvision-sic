# GridVision — AI / Team Handoff Context (LOCKED)

> **Purpose of this file:** let any teammate or AI tool (Gemini Pro / Antigravity, ChatGPT, Claude, Copilot, or anyone else) pick up GridVision and continue implementation without needing prior conversation history.
>
> **This file does not redesign, improve, summarize-with-opinions, or critique the project.** It packages the current locked state of the project for portability. It is an execution reference, not a planning document.

---

## 1. PROJECT IDENTITY

| Field | Value |
|---|---|
| **Project name** | GridVision |
| **Capstone title** | GridVision — Smart Energy Analytics & AI Copilot: Multi-Task Electricity Demand Forecasting, Anomaly Detection, and Consumption Segmentation with a RAG-Powered Operations Copilot |
| **Research study title** | Temporal Cluster Instability as a Predictor of Extreme Household Load-Forecast Failure |
| **Research question** | Does temporal instability in household behavioral-cluster assignments predict subsequent extreme load-forecast errors, after controlling for intrinsic consumption volatility? |
| **Current project status** | Planning and dataset verification complete. FINAL MASTER PLAN v4 is LOCKED. Implementation (Days 1–20) has not yet started as of this handoff, unless a teammate's own progress report (see §24) says otherwise. |

**What GridVision does (one paragraph):** GridVision is a 4-person, 20-day capstone that is both a working AI application and an embedded research study on the same dataset. The application forecasts household electricity demand, segments households into behavioral clusters, detects consumption anomalies, and answers operator questions through a RAG-grounded chat copilot. Underneath the segmentation feature sits the research study: it tracks how stable each household's cluster assignment is over time and tests whether that instability predicts extreme forecast failures in the following period, independent of how naturally volatile the household's consumption already is.

Design: prospective / associational, **not causal**. Predictor: instability. Outcome: extreme forecast failure. Control: volatility. Time order: window `w` predicts window `w+1`. Population: flat-rate Low Carbon London (LCL) households.

---

## 2. LOCKED SOURCE OF TRUTH

- **GridVision FINAL MASTER PLAN v4** is the authoritative, locked specification for this project. It followed two rounds of empirical dataset verification against the actual downloaded Kaggle LCL files, and one full methodological audit (v2 → v3) that closed every open specification gap.
- **This handoff file does not replace the master plan.** It is a portable summary of it, written so a new AI or teammate doesn't have to reconstruct context from a long conversation history. If this file and the master plan ever appear to disagree, **the master plan wins** — treat any such disagreement as an error in this handoff file, not license to reinterpret the plan.
- v4 is locked. That specifically means: the research question, the dataset, the methodology, the calibration design, and the statistical design are **not open for revision**. See §23 for explicit AI execution rules.

---

## 3. CURRENT PROJECT STATE

### Already verified (empirically, against the real downloaded dataset)
- Exact tariff field, values, and household counts (§4).
- ACORN field coverage and category counts (§4).
- Data quality: missingness, negative readings, gap lengths (§4).
- Usable 8-week window counts per household (§4).
- Achievability of the 500–800 stratified household sample (§4).
- Storage footprint and conversion runtime (§10, hardware).
- Pipeline runtime on a 50-household pilot (§10, hardware).
- **The single biggest finding:** the originally planned fixed Windows 1–2 Calibration Period only worked for 0.5% of qualifying households, due to rolling trial enrollment. This forced a locked redesign — see §5.

### Already decided (methodological / locked)
- Per-household calibration design (§5).
- Global forecaster is the sole source of the research outcome; per-cluster forecaster is capstone-only (§8).
- AE aggregation rule, MAD floor, 95th-percentile threshold with a documented fallback to 90th (§9).
- K-Means as primary clustering method, Hungarian alignment for cluster identity across windows (§9).
- Cluster-robust logistic regression as the primary statistical model (§9).
- Full 20-day schedule and 4-person role division (§14, §15).

### Already implemented
- **Nothing has been confirmed as implemented in code yet**, as of this handoff. Only the verification scripts/queries used to check dataset assumptions (Rounds 1 and 2) have been run. Do not assume any application code, pipeline code, or model has been built unless a teammate's own progress report (format in §24) says so explicitly.

### What remains to be executed
- All 20 days of the schedule in §14, starting from Day 1 (raw-to-Parquet conversion and household sampling).

### The one remaining non-implementation item
- **Literature novelty verification** (§22). The claim that no existing study combines consumer-level instability, tail-event forecast-failure outcomes, an explicit volatility control, and an intervention test has **not yet been verified** through a documented, systematic literature search. This does not block implementation. It only blocks the specific sentences in the eventual research paper that claim a literature gap.

---

## 4. DATASET (verified facts — do not re-derive or re-question these)

| Fact | Value |
|---|---|
| Source | Low Carbon London (LCL) smart meter dataset, Kaggle mirror. No registration required. |
| Total raw size | 10.27 GB |
| Total households (metadata) | 5,566 |
| Flat-rate households (`stdorToU == 'Std'`) | **4,443** |
| dToU households (`stdorToU == 'ToU'`) | **1,123** |
| Primary readings file | `hhblock_dataset/block_*.csv` — wide format, columns `LCLid`, `day`, `hh_0`...`hh_47` (float64) |
| Rejected readings file | `halfhourly_dataset/block_*.csv` — long format; `energy(kWh/hh)` reads as int64/all-zero in this mirror. Not used. |
| Metadata file | `informations_households.csv` — columns `LCLid`, `stdorToU`, `Acorn`, `Acorn_grouped`, `file` |
| Join key | `LCLid` (single key) |
| ACORN coverage (flat-rate households) | 100%, 0 nulls |
| Acorn_grouped counts (flat-rate) | Affluent: 1,702 · Adversity: 1,518 · Comfortable: 1,184 · ACORN-U: 39 |
| Primary stratification variable | `Acorn_grouped` (fine-grained `Acorn` is NOT used — some categories too small, e.g. ACORN-B = 21) |
| Negative readings | 0 households |
| ">10x median spike" rule | **Rejected as a data-quality filter** — 85.1% of households trigger it; this is normal appliance behavior, not corruption. Used only as an input to anomaly-detection thresholding later, never for sample filtering. |
| Households with gap >7 consecutive days | 42 (0.9%) — excluded via the window-completeness rule |
| Median per-household missingness | 0.71% (95% of households under 2%) |
| Window length | 8 weeks (56 days), 14 fixed non-overlapping windows, common-calendar-aligned across ALL households |
| Window usability rule | ≥95% of expected half-hourly slots present, no single gap >3 consecutive days |
| Households with ≥6 usable windows | **4,252** (primary qualifying pool) |
| Households with ≥10 usable windows | **2,974** |
| Median usable windows per household | 10 |
| Target sample | Fixed, stratified (by `Acorn_grouped`) random sample of **500–800** households, drawn once with a fixed random seed |
| Qualifying subset Parquet size | 197 MB |
| Full dataset span | 2011-11-24 to 2014-02-27 |

### Fixed Window Schedule (locked)

| Window | Start | End | | Window | Start | End |
|---|---|---|---|---|---|---|
| W01 | 2011-11-24 | 2012-01-18 | | W08 | 2012-12-20 | 2013-02-13 |
| W02 | 2012-01-19 | 2012-03-14 | | W09 | 2013-02-14 | 2013-04-10 |
| W03 | 2012-03-15 | 2012-05-09 | | W10 | 2013-04-11 | 2013-06-05 |
| W04 | 2012-05-10 | 2012-07-04 | | W11 | 2013-06-06 | 2013-07-31 |
| W05 | 2012-07-05 | 2012-08-29 | | W12 | 2013-08-01 | 2013-09-25 |
| W06 | 2012-08-30 | 2012-10-24 | | W13 | 2013-09-26 | 2013-11-20 |
| W07 | 2012-10-25 | 2012-12-19 | | W14 | 2013-11-21 | 2014-01-15 |

---

## 5. CRITICAL CALIBRATION DESIGN — LOCKED

> ⚠️ **This is the single most important non-obvious decision in the project. Do not casually "simplify" it back to a fixed calendar Calibration Period.**

**Why the original fixed W01–W02 Calibration Period was rejected:**
The LCL trial enrolled households on a rolling basis through 2012–2013, not all on day one. Direct verification against the real data found:
- Only **23 of 4,252** qualifying households (**0.5%**) had usable data in **both** fixed Window 1 and fixed Window 2.
- This means a globally fixed Calibration Period would have discarded **99.5%** of the qualifying household pool — making the original design unworkable.

**The locked fix (per-household calibration):**
- Window **boundaries** stay common-calendar-aligned across all households (still needed for pooled forecasting — see §6).
- What changes: each household's **Calibration Period is its own first 2 usable windows**, in chronological order, using the shared window calendar — **not** literally global Window 1 and Window 2.
- **Calibration pair:** a household's own first 2 usable windows. Used only to (a) build that household's calibration residual distribution and (b) contribute to the pooled silhouette sweep that fixes K.
- **Analysis Period:** every usable window that household has after its own calibration pair, up to (but not including) its own last usable window.
- **Holdout:** each household's own last usable window — touched once, forward-only, at the very end.
- **Why this preserves the qualifying pool:** confirmed empirically that every household in the ≥6-window pool retains ≥4 Analysis Period windows after removing its own first two for calibration (30.1% retain 4–7, 69.9% retain 8+); every household in the ≥10-window pool retains ≥8. **Zero households are lost** by this redesign.
- **Known trade-off (documented as a limitation, not fixed):** per-household calibration timing varies by enrollment date, which correlates weakly with `Acorn_grouped` (Affluent households enrolled earliest at 91.6% early-enrollment; Comfortable households latest at 78.5%; a 13-percentage-point spread). This is disclosed in §18, not corrected for.

---

## 6. TEMPORAL / LEAKAGE RULES — LOCKED

**Golden rule: nothing may use information from after the point it's supposed to be known.** Everything below follows the "known at time t" table:

| Variable | Computed from | Time available ("known at") |
|---|---|---|
| Behavioral features (clustering) | Window w's own half-hourly readings | By end of window w |
| Cluster assignment for window w | Behavioral features of window w, fixed global K | By end of window w |
| Cluster trajectory / instability score | Aligned cluster assignments across that household's own usable windows 1..w (its calibration pair + its Analysis Period so far) | By end of window w — this IS "t" |
| Volatility (CV) | That household's own load readings across its usable windows 1..w (past data only) | By end of window w |
| Forecast for window w+1 | Global forecaster trained on pooled household data up to end of window w | Predicted at t; resolved in the future |
| Forecast error / extreme-failure label (the outcome) | Actual half-hourly readings in window w+1 vs. the window w+1 forecast | Only known once window w+1 is over |

Additional non-negotiable rules:
- **Chronological forecasting only.** No random train/test splits anywhere in the research pipeline.
- **The extreme-failure threshold is fixed from calibration data only**, then applied forward, unchanged, to every Analysis Period and Holdout window. It is never re-derived from Analysis or Holdout data.
- **The global forecaster for predicting window w+1 only trains on pooled data up to the end of calendar window w.** Never later.
- **K (number of clusters) is fixed once**, from a silhouette sweep on behavioral features pooled from everyone's own calibration windows. It is never re-selected later in the pipeline.
- **Each household's Holdout window is used exactly once, forward-only, at the very end.** It is never used for tuning, threshold-setting, or model selection of any kind.

---

## 7. COMPLETE ML / RESEARCH PIPELINE — LOCKED

1. Raw `hhblock` data → Parquet (flat-rate subsample only, per §4's sampling protocol).
2. **Data quality control**: confirm no negative readings. Window usability is determined by the locked ≥95% expected-slot and ≤3-consecutive-day gap criteria; households qualify for the analysis pool based on minimum history (≥6 usable windows). A >7-day gap does not by itself imply whole-household exclusion unless the locked qualification rule requires it.
3. **Per-household calibration**: for each household, identify its own first 2 usable windows. Train a forecaster on the household's calibration Window 1; predict its calibration Window 2 at half-hourly resolution. The resulting half-hourly errors form that household's calibration residual distribution (median/MAD).
4. **K selection**: run a silhouette sweep (k=3..8) on behavioral features pooled across every household's own calibration windows. Fix K once, globally.
5. For each household, for each later usable window w (its own Analysis Period, in chronological order):
   a. Compute behavioral features from window w only.
   b. Run **K-Means** (K fixed) on those features.
   c. **Hungarian algorithm** aligns window w's cluster labels to that household's own previous usable window, by standardized centroid distance.
   d. Update **instability** and **volatility (CV)** using that household's own windows 1..w.
   e. **Global forecaster** (trained on pooled data across all households, up to end of calendar window w) predicts window w+1. The per-cluster forecaster trains in parallel but **never** feeds this step (capstone-only, §8).
   f. **AE(h, w+1)** = mean absolute error across all half-hourly predictions in window w+1.
   g. **Standardize**: StdError = (AE − household's calibration median AE) / MAD_effective, where MAD_effective = max(MAD, 0.05 × calibration median AE).
   h. **Extreme-failure label**: StdError > the fixed, pooled, calibration-derived 95th-percentile threshold.
6. Store one row per household per window-pair → pooled analysis dataset.
7. **Statistical analysis**: cluster-robust (by `household_id`) logistic regression, volatility-only model vs. volatility+instability model.
8. **Holdout**: each household's own last usable window, run once, forward-only, as a final check — never used to retune anything.

---

## 8. CAPSTONE VS. RESEARCH BOUNDARY — LOCKED

| Component | Capstone | Research | Required? |
|---|---|---|---|
| **Forecasting — GLOBAL (LightGBM)** | Baseline demand prediction in UI | **Sole source of the H1/H0 research outcome** | YES |
| **Forecasting — PER-CLUSTER (LightGBM)** | Segmentation-aware forecast shown in UI, compared to global | **NEVER used for the research outcome** — capstone/engineering only | YES — capstone only |
| K-Means clustering | Consumption segmentation feature | Builds the behavioral cluster trajectories | YES |
| Cluster identity alignment (Hungarian) | Keeps segment labels/colors stable in UI | Stops label swaps from faking instability | YES |
| Temporal instability metric | Behavioral risk indicator per consumer | Primary independent variable (H1) | YES |
| Intrinsic volatility metric (CV) | Feeds the same risk indicator | The confound H1 is tested against | YES |
| Standardized extreme-failure labeling | Forecast-reliability insight in UI | Primary outcome variable | YES |
| Cluster-robust statistical comparison | Not shown directly | The primary research experiment (H1 vs. H0) | YES |
| Anomaly detection (Isolation Forest) | Operational anomaly monitoring | Not central to the research question | YES — capstone |
| SHAP explainability (forecaster only) | Explains forecasts to the user | Supporting interpretability only | YES |
| RAG Energy Copilot | Natural-language operational assistant | Not central to the research question | YES — capstone |

> **Do not merge the global and per-cluster forecasters, and do not let the per-cluster forecaster's output feed the research outcome under any circumstance.** This separation exists specifically to prevent a mechanical link between cluster reassignment (the independent variable) and the model scoring its own error.

---

## 9. RESEARCH METHODOLOGY — LOCKED

**Hypotheses:**
- **H1 (primary, must complete):** households with more unstable cluster assignments have a higher probability of an extreme forecast failure in the following window, even controlling for volatility.
- **H0 (null, must complete):** after controlling for volatility, instability adds no significant additional predictive power.
- **H2** (GMM membership uncertainty) — optional, only if time permits.
- **H4** (fallback-routing intervention) — optional, only if time permits.
- H3 (incremental predictive information) is answered directly by the nested-model comparison below — not a separate experiment.

**Behavioral features** (per household, per window, from that window's own readings only): mean load, peak load, peak-to-average ratio, standard deviation, ramp-rate statistics, day/night ratio, weekday/weekend contrast, peak timing.

**Clustering:** K-Means primary; GMM optional/H2-only. K fixed once (silhouette sweep, k=3..8, on pooled calibration-window features).

**Cluster alignment:** Hungarian algorithm, matching window w's labels to that household's own previous usable window, by standardized centroid distance.

**Instability formula:**
- Persistence(h) = 1 − (cluster changes across h's own usable windows so far) / (transitions observed for h)
- Instability(h, w) = 1 − Persistence(h), using only h's own windows up to w

**Volatility:** coefficient of variation (CV) of household h's load across h's own usable windows 1..w.

**AE:** AE(h, w+1) = mean absolute error across all half-hourly predictions in window w+1, from the **global forecaster only**.

**Calibration median/MAD:** computed per household from the half-hourly errors within that household's own second calibration window.

**MAD floor:** MAD_effective = max(MAD, 0.05 × calibration median AE) — prevents divide-by-near-zero for very stable households.

**Extreme-failure threshold:** StdError > 95th percentile of the pooled, cross-household calibration StdError distribution, fixed once, applied prospectively. **Documented fallback: drop to the 90th percentile if the realized positive-event rate on real data is too low for stable estimation.**

**Statistical model:**
- Primary: logistic regression, `Failure ~ Volatility + Instability`, standard errors clustered by `household_id`.
- Robustness (if time permits): mixed-effects logistic regression, random intercept per household.
- Nested-model comparison (H3): likelihood-ratio test (LRT), restricted (volatility-only) vs. full (volatility+instability) model — report Δlog-likelihood, p-value, incremental PR-AUC/ROC-AUC.
- Effect size: instability coefficient reported as an **odds ratio with 95% CI**.

**Baselines:** seasonal-naive forecaster (sanity floor); global vs. per-cluster forecaster (capstone-only comparison, excluded from primary research claims); volatility-only risk model (key baseline); random risk-tier assignment.

**Robustness checks** (attempted in this order, time permitting):
1. Drop volatility, rerun `Failure ~ Instability` alone.
2. Repeat once at 6-week windows, once at 10-week windows.
3. Randomized-shuffle placebo test.
4. Exclude each household's first 1–2 Analysis windows; confirm H1 direction/significance holds.
5. Mixed-effects re-fit as final robustness confirmation.

---

## 10. SYSTEM ARCHITECTURE — LOCKED

- **Frontend:** React + TypeScript + Vite, styled with Tailwind CSS, charts via Recharts.
- **Backend:** FastAPI (Python), REST/JSON.
- **ML stack:** LightGBM (global + per-cluster forecasters), K-Means (segmentation), Isolation Forest (anomaly detection), SHAP (forecaster explainability only).
- **AI layer:** FAISS (local vector store) + LLM with tool-calling.

**API endpoints:**
| Endpoint | Purpose |
|---|---|
| `/forecast` | Global LightGBM forecaster (feeds research outcome) + per-cluster LightGBM forecaster (capstone comparison only) |
| `/segment` | Current K-Means cluster + trajectory history |
| `/instability` | Persistence score, volatility (CV), reliability indicator — computed on that household's own window sequence |
| `/anomaly` | Isolation Forest flag + feature-based explanation (NOT SHAP) |
| `/chat` | LLM call with tools bound to the endpoints above + RAG retriever |

**Offline precomputation model:** per-household calibration, longitudinal clustering, cluster alignment, instability metrics, and the global forecaster's statistical comparison are all computed **once, offline, during the build**. The deployed app only serves these precomputed outputs live — it never re-runs the longitudinal research pipeline on demand.

**Hardware/storage (verified):**
| Resource | Value |
|---|---|
| CPU | Required; sufficient for all components (no GPU needed) |
| RAM | 8GB required / 16GB recommended |
| Storage — peak (transient) | ~10.7GB (raw 10.27GB + both Parquet outputs coexisting briefly) |
| Storage — steady-state | ~250–500MB (raw CSVs deleted post-conversion) |
| Conversion time | ~37s (subset) / ~49s (full) — measured |
| Full pipeline runtime (800 households) | Under 2 minutes — measured on a 50-household pilot, extrapolated |
| External API | One LLM provider key required |
| Cloud | Hugging Face Spaces free tier is sufficient |

---

## 11. RAG COPILOT — LOCKED

- **Knowledge base:** 5–10 short, team-written markdown documents — an anomaly-response procedure, a load-shedding/demand-response policy summary, and a glossary (including plain-language definitions of "cluster instability" and "forecast reliability").
- **Retrieval:** top-k cosine similarity, local FAISS index, local sentence-embedding model.
- **Tools:** `get_forecast(household_id)`, `get_segment(household_id)`, `get_instability(household_id)`, `get_anomaly(household_id)`.
- **Grounding:** every numeric claim must trace back to a tool call or a retrieved passage, enforced via system prompt + a numeric-traceability check against a golden Q&A set.
- **What the LLM IS allowed to do:** retrieve, call tools, and report numbers/results that already exist.
- **What the LLM is NOT allowed to do:** compute a forecast, a cluster assignment, an instability score, or a statistical result. It only reports precomputed values.

---

## 12. UI / SCREENS — LOCKED

- **Overview:** portfolio summary, active anomaly count, cluster distribution.
- **Household Explorer:** forecast-vs-actual chart with a SHAP explanation panel (forecaster only), plus an anomaly flag with its own separate, feature-based explanation (not SHAP).
- **Behavioral Trajectory:** timeline of each household's own cluster assignments, its persistence score, and a plain-language reliability indicator — the capstone/research crossover screen.
- **Copilot:** chat interface with tool-calling and RAG grounding for procedural questions.

No other screens are in scope (no What-If Simulator, no standalone PCA screen, no multi-agent view).

---

## 13. EVALUATION — LOCKED

| Component | Metric | Baseline / Comparison |
|---|---|---|
| Forecasting (global, research) | MAE, RMSE per household | Naive-seasonal |
| Forecasting (per-cluster, capstone) | MAE, RMSE per cluster | Global forecaster |
| Extreme forecast failure (research outcome) | AE above 95th percentile; extreme-error rate | N/A — this is the outcome variable |
| Instability signal quality (H1) | PR-AUC, ROC-AUC, Brier score of volatility+instability model | Volatility-only model |
| Confound control | Instability's coefficient/significance controlling for volatility | Instability-only model |
| Anomaly detection | Precision/Recall/F1 on synthetic-injection test | Rolling mean ± k·std |
| RAG Copilot | Retrieval Recall@3, groundedness rate on golden Q&A set | N/A |

**Power note (locked):** ~4,252 qualifying households, 500–800 sampled, ~8–13 analysis windows each → expected a few thousand observations, ~5% positive rate at the 95th percentile. Confirm the real positive-event count around Day 10–11; documented fallback to 90th percentile if too low.

---

## 14. 20-DAY EXECUTION PLAN — LOCKED (do not invent a different schedule)

| Days | Phase | Engineering Tasks | Research Tasks | Milestone |
|---|---|---|---|---|
| 1–2 | Setup | Convert raw to Parquet (~37s), delete raw after; draw fixed stratified 500–800 sample | Apply tariff/ACORN filters (already verified) | Subsample dataset ready |
| 3–4 | Preprocessing | Data-quality pipeline: exclude long gaps (>7 days), check negatives, minimum-history filter | Assign each household its own first-2-usable-windows calibration pair | Clean dataset with calibration pairs assigned |
| 5–6 | Calibration processing | Behavioral feature pipeline | Silhouette sweep (pooled calibration windows) to fix K; train global forecaster on each household's calibration Window 1, predict Window 2 → calibration residual distributions | K fixed; calibration residuals computed |
| 7 | First clustering pass | Wire K-Means into app (segmentation v1) using fixed K | Sanity-check one window's clustering | Clean cluster solution |
| 8–9 | Clustering + alignment (critical path) | — | K-Means across every household's own Analysis Period windows; Hungarian alignment across each household's own consecutive windows. Person 2 available to pair if this slips. | Aligned cluster trajectories per household |
| 10 | Instability + volatility | Wire scores into app data model | Compute persistence/CV per household per window; check realized 95th-percentile positive rate (fallback to 90th if needed) | Scores computed and sanity-checked |
| 11–12 | Forecasting + error standardization | Global forecaster (pooled, per calendar window w); per-cluster forecaster in parallel (capstone-only). Person 4 stands up Docker/HF Spaces skeleton. | Chronological forecasting w→w+1 via global forecaster only; AE + StdError with MAD floor | Standardized errors exist for every household/window-pair |
| 13–14 | Primary experiment (critical path) | — | Apply fixed extreme-failure threshold; fit cluster-robust logistic regression | Primary H1/H0 result obtained and reported honestly |
| 15 | Robustness + write-up start | — | Attempt 1–2 items from §9 robustness checks; begin drafting methods/early-results sections | ≥1 robustness check done; write-up underway |
| 16 | Anomaly module | Isolation Forest + synthetic injection evaluation (multivariate threshold, not the >10x rule) | — | Anomaly detection working |
| 17 | SHAP | SHAP on global forecaster only; anomaly explanation built as separate feature-based mechanism | — | Explanation panels correctly scoped |
| 18 | RAG + integration | FAISS index, tool-calling, all screens wired to real outputs | — | App functional end-to-end |
| 19 | Testing + Holdout | Full team bug bash; redeploy real artifacts to existing skeleton | Run each household's own Holdout window once, forward-only | Deployed app stable; Holdout recorded, not used to retune |
| 20 | Demo + docs | Rehearse demo | Finalize write-up (drafting underway since Day 15) | Demo rehearsed twice; write-up complete |

---

## 15. TEAM ROLES — LOCKED

- **Person 1 (Data + Research Pipeline Lead):** preprocessing, per-household calibration assignment, cluster alignment, instability metrics. Critical path through Day 10.
- **Person 2 (Forecasting + Statistics):** starts forecasting pipeline ~Day 5 against calibration data; available to pair with Person 1 on Days 8–9; owns the H1/H0 statistical comparison from Day 11.
- **Person 3 (Anomaly + Explainability):** Isolation Forest and SHAP; can start once Person 1's clean feature table exists.
- **Person 4 (Frontend/Backend/RAG):** independent from Day 1 against mocked outputs; stands up Docker/HF Spaces skeleton by ~Day 12; wires in real results from Day 9 onward, including the Behavioral Trajectory screen.

---

## 16. OUT OF SCOPE — LOCKED (do not build any of these)

- Multi-agent / 7-agent architecture
- MCP
- GAN/VAE anomaly generation
- Any deep-learning model added solely to demonstrate deep learning
- Transformer models
- Time-series foundation models
- Kubernetes
- Airflow
- CI/CD pipelines
- A model registry
- Automated retraining
- Heavy MLOps / cloud infrastructure
- A second dataset as part of the core project
- Unrelated research questions
- Unrelated AI technologies
- A second application
- Any future mini-project, Phase 2, or extended version

---

## 17. CONTINGENCY RULES — LOCKED (priority order preserved)

- **Cut first:** H2, H4, and any robustness check beyond the volatility-removed comparison.
- **Cut second:** the randomized-shuffle placebo test, the window-length sensitivity check, the early-window exclusion check.
- **Never cut:** the H1/H0 test itself, leakage-safe chronological splitting, honest reporting of whatever the result turns out to be.
- If cluster alignment proves harder than expected: fall back to simple nearest-centroid matching.
- If the main result is null or weak: report it as a complete, honest finding — not a failure.
- If the LLM/API fails during the demo: disable the Copilot only — no other screen depends on it.
- If the Day 12 deployment skeleton isn't ready: fall back to a local-only demo rather than delaying core research work.

---

## 18. LIMITATIONS — LOCKED (documented, not to be "fixed" silently)

- Primary analysis uses a stratified sample of 500–800 flat-rate households from a confirmed pool of 4,252 — not the full 5,566-household dataset.
- dToU tariff-trial households are excluded from the primary analysis; whether the instability-failure relationship holds under an active price intervention is untested.
- Dataset spans Nov 2011 – Feb 2014 in London — findings may not generalize to other geographies, climates, tariff structures, or more recent smart-meter behavior.
- The 95th-percentile extreme-failure threshold is one defensible choice; alternatives (90th/99th) are not exhaustively tested, though a fallback rule is pre-specified.
- Any observed relationship between instability and forecast failure is associational, not causally proven.
- K is fixed once from pooled calibration-window data; if true behavioral archetypes shift materially over the 27-month span, a fixed K may under- or over-segment later windows — accepted deliberately.
- Instability estimates at a household's earliest Analysis Period windows rest on very few observed transitions and are noisier than later-window estimates.
- **Per-household calibration timing varies by enrollment date**, which is unevenly distributed across ACORN groups (Affluent 91.6% early-enrollment vs. Comfortable 78.5%, a 13-percentage-point spread) — a mild seasonal confound in calibration baselines, disclosed rather than corrected for.

---

## 19. EXHIBITION / DEMO — LOCKED

- **30-second pitch:** "GridVision forecasts household electricity demand and segments consumers by behavior — and we discovered that when a household's behavioral segment becomes unstable over time, that instability itself predicts when the forecast is about to fail badly, even accounting for how naturally volatile that household is."
- **2-minute demo:** Behavioral Trajectory screen for a household with visible cluster drift, next to a stable household's confident reliability indicator.
- **5-minute full demo:** add the primary research result chart, the anomaly/SHAP explanation, and a live Copilot question pulling a household's instability score via a tool call.

---

## 20. VIVA CONTEXT — LOCKED

| Question | Intended Answer |
|---|---|
| Why is instability different from just volatility? | Volatility is static, about raw consumption. Instability is whether the behavioral category itself changes over time. H1 tests instability on top of volatility, not as a replacement. |
| How did you stop cluster-label swaps from faking instability? | Hungarian-algorithm alignment across each household's own consecutive windows, before computing persistence. |
| How did you avoid leakage? | Clustering/forecasting for any window use only data available up to that window; forecasts evaluated strictly out-of-sample; chronological order throughout. |
| Why per-household calibration instead of a fixed calendar period? | Only 0.5% of qualifying households had usable data in fixed Windows 1–2, due to rolling trial enrollment. Per-household calibration (each household's own first two usable windows) retains 100% of the qualifying pool — confirmed empirically before implementation. |
| Doesn't per-household calibration introduce a seasonal bias? | A mild one — enrollment timing varies ~13 percentage points across ACORN groups. Disclosed explicitly as a limitation; not strong enough to be a likely confound of the primary effect. |
| Which forecaster produced your research result — global or per-cluster? | The global forecaster only. The per-cluster forecaster is capstone-only and never touches the research outcome, avoiding a mechanical coupling between cluster reassignment and the model scoring its own error. |
| How did you turn thousands of half-hourly errors into one label per household per window? | AE = mean absolute error across all half-hourly predictions in that window; standardized against the household's own calibration residual distribution; compared to a fixed 95th-percentile threshold. |
| Why 95th percentile? | Standard tail-event convention, expected to yield an adequate positive-event count at this sample size; confirmed on real data around Day 10, with a documented fallback to 90th percentile. |
| What if the result is null? | Reported as such — a legitimate, honestly-reported scientific result, not a failed capstone. |
| Why not deep learning / more agents / a second dataset? | None are required to answer the research question or fulfill the capstone title; each was evaluated and explicitly excluded (§16). |

---

## 21. DEFINITION OF DONE

**Capstone completion criteria:**
- Application works end-to-end on the verified LCL subsample.
- Forecasting works (global + per-cluster) vs. naive-seasonal baseline.
- Segmentation visible in the UI.
- Anomaly detection works with a feature-based (non-SHAP) explanation.
- SHAP scoped to the forecaster only.
- RAG Copilot works and passes the numeric-traceability check.
- React UI includes the Behavioral Trajectory screen.
- FastAPI backend works.
- Demo executes reliably, with an offline Copilot fallback and a local-only deployment fallback.

**Research completion criteria:**
- Research question stated explicitly in the final report.
- Literature-verification pass performed and documented.
- Longitudinal clustering works across each household's own usable windows.
- Cluster identities aligned across windows.
- Instability measured without temporal leakage, per household's own calibration pair.
- Forecast errors computed out-of-sample, chronologically, via the global forecaster only.
- Extreme failures defined and labeled (one AE value per household per window-pair).
- Volatility measured and used as an explicit control.
- Primary statistical comparison (H1 vs. H0) performed.
- At least one robustness/ablation check attempted.
- Results reported honestly, whatever they show.
- Limitations documented explicitly, including the enrollment-timing/ACORN spread and early-window instability noise.

---

## 22. OPEN ITEMS

**Implementation blockers:** none currently identified. Dataset verification is complete; the methodology is fully specified.

**Non-blocking items:**
- Realized 95th-percentile positive-event rate must be confirmed on real StdError values around Day 10 (fallback to 90th percentile pre-specified if needed).
- MAD-floor trigger frequency should be checked once real calibration data exists.

**Literature novelty search (the one open non-implementation item):** whether any existing study combines consumer-level instability, tail-event forecast-failure outcomes, an explicit volatility control, and an intervention test has **not yet been verified** via a documented, systematic search. Do not assume novelty. Do not state a novelty claim in any report or paper section until this search is performed and documented (search terms, databases, inclusion/exclusion criteria, papers screened).

---

## 23. AI EXECUTION RULES

**You are an execution agent working under a locked project specification.**

- Read this file (and the FINAL MASTER PLAN v4 it summarizes) before proposing any change.
- Follow v4 exactly. This file is a portable summary of v4, not a substitute for exercising judgment about it — when in doubt, defer to v4's actual text.
- Do not redesign GridVision.
- Do not add technologies merely to make the project look more advanced.
- Do not introduce deep learning, transformers, additional agents, MCP, or extra datasets.
- Do not change the research question.
- Do not use future information anywhere in the pipeline (no leakage — see §6).
- Do not change the statistical threshold (95th percentile) to chase significance. The only sanctioned fallback is to the pre-specified 90th percentile, and only if the realized positive-event rate is genuinely too low for stable estimation.
- Do not use the Holdout window for tuning, threshold-setting, or model selection of any kind.
- Do not replace Hungarian alignment casually — it is locked as the cluster-identity-alignment method; the only pre-approved fallback is nearest-centroid matching, and only under the contingency conditions in §17.
- Do not merge the capstone (per-cluster) and research (global) forecasters, or let per-cluster output feed the research outcome.
- Do not invent missing results. If something hasn't been run yet, say so.
- Clearly report actual results and failures — including null or weak results, which are valid outcomes, not problems to be hidden.
- When implementing, prefer the smallest change consistent with the locked plan.
- **If a genuine conflict with the locked plan appears — something in v4 turns out to be impossible, contradictory, or based on a wrong assumption once you're actually implementing it — STOP and report the conflict. Do not silently reinterpret or "fix" the methodology yourself.**

---

## 24. PROGRESS REPORT FORMAT

Use this exact format when reporting work back to the team or to another AI/teammate:

```
STATUS:
COMPLETED:
FILES / CODE CHANGED:
COMMANDS / TESTS RUN:
RESULTS:
ERRORS / BLOCKERS:
DECISIONS MADE:
NEXT STEP:
DEVIATIONS FROM MASTER PLAN:
```

**"DEVIATIONS FROM MASTER PLAN" must explicitly say `NONE` when there are none.** Do not leave it blank, and do not describe a deviation there without also flagging it under §23's "STOP and report the conflict" rule.
