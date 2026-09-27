---
name: project-checkpoint
description: >
  GridVision context and safety skill. Read this before any substantial work
  on the GridVision repository. Ensures agents understand the project state,
  respect the locked methodology, and update living documents correctly.
---

# GridVision — Project Checkpoint Skill

## Purpose

This skill ensures any AI agent or human contributor working on GridVision:
1. Understands the project's locked specifications before making changes.
2. Knows where authoritative information lives.
3. Distinguishes between what is PLANNED vs. IMPLEMENTED vs. TESTED.
4. Does not silently modify the locked methodology.

## Before Starting Any Substantial Work

### Step 1: Read the relevant master file(s)

The four locked master files live at `docs/gridvision_master_files/`:

| File | Authority For |
|---|---|
| `GridVision_FINAL_MASTER_PLAN_v4.docx` | Research question, methodology, dataset, calibration, statistical design. **Highest authority.** |
| `GridVision_AI_HANDOFF_CONTEXT_LOCKED.md` | Portable project context, key decisions, constraints. |
| `GridVision_IMPLEMENTATION_BLUEPRINT_v2.md` | Technical architecture, repository structure, data/artifact contracts, module contracts, API contracts. |
| `GridVision_TEAM_EXECUTION_CONTRACT.md` | Team ownership, dependencies, handoffs, Git workflow, integration gates, Definition of Done. |

**Conflict rule:** If any conflict between these files → v4 wins. Do NOT silently resolve; record as OPEN.

**Do NOT modify these files under any circumstance.**

### Step 2: Read the live status documents

Located at `docs/current_status/`:

| File | Contains |
|---|---|
| `PROJECT_STATE.md` | What the repository ACTUALLY contains right now. |
| `TASKS.md` | The team's live execution task list. |
| `DECISIONS.md` | Implementation decisions made during execution. |

### Step 3: Inspect existing implementation

Before modifying any code:
- Check what files actually exist in the relevant directory.
- Read existing code before overwriting or restructuring.
- Identify what is scaffolding vs. functional implementation.

### Step 4: Identify the correct team owner

From the Team Execution Contract §1:

| Role | Owns |
|---|---|
| **P1** | Ingestion, QC, sampling, common-calendar windows, per-household calibration assignment, behavioral features, K selection / K-Means, cluster alignment / Hungarian matching, instability, volatility |
| **P2** | Calibration forecaster, global forecaster, per-cluster forecaster, forecast-error standardization, extreme-failure threshold, research table construction, statistical analysis, holdout evaluation |
| **P3** | Anomaly detection (Isolation Forest, synthetic injection), SHAP (global forecaster only), explainability |
| **P4** | Backend (FastAPI), frontend (React), RAG / Copilot (FAISS + chat), integration |

If your task crosses ownership boundaries, flag the dependency.

## Source Hierarchy

```
v4 Master Plan (HIGHEST)
  └── AI Handoff Context (portable summary of v4)
  └── Implementation Blueprint v2 (technical specification)
  └── Team Execution Contract (operational execution)
  └── docs/current_status/* (live repository state)
  └── Actual code in the repository (ground truth for implementation)
```

## Status Labels — Use Consistently

| Label | Meaning |
|---|---|
| LOCKED | Fixed by v4; not open for revision |
| VERIFIED | Empirically confirmed against real data |
| DERIVED | Only implementation consistent with v4's text; not a free choice |
| IMPLEMENTED | Code exists and produces output |
| TESTED | Automated test suite passes |
| INTEGRATED | Verified end-to-end with upstream/downstream |
| OPEN | Genuine ambiguity not settled by v4 |
| BLOCKED | Cannot proceed without resolving a dependency |

**Critical distinction:** Do NOT mark something IMPLEMENTED when it is only PLANNED or DESIGNED.

## Mandatory Rules

1. **Do not modify the locked methodology.** If you find a genuine conflict, STOP and report it per Team Execution Contract §11.
2. **Do not invent results.** If something hasn't been run, say so.
3. **Do not add technologies outside the locked scope.** See Handoff §16 for the explicit exclusion list.
4. **Do not use future information in the pipeline.** See Handoff §6 for leakage rules.
5. **Do not merge the global and per-cluster forecasters.**
6. **Do not use the holdout for tuning, threshold-setting, or model selection.**
7. **Report actual results honestly**, including null or weak results.

## After Meaningful Work

1. Update `docs/current_status/TASKS.md` — check off completed items, note blockers.
2. Update `docs/current_status/PROJECT_STATE.md` — only when the repository state materially changed.
3. Record a decision in `docs/current_status/DECISIONS.md` — only when an actual project decision occurred (not routine coding).
4. Use the progress report format from Handoff §24 when reporting to the team.

## When to Stop and Escalate

- A genuine conflict with v4 appears.
- You discover a leakage path in the pipeline.
- The methodology needs modification to work.
- A dependency is broken and you can't proceed.
- Results seem implausible or fabricated.
- You're about to change something outside your team role's ownership.
