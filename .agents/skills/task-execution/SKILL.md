---
name: task-execution
description: >
  Practical execution skill for AI coding agents working on GridVision.
  Guides implementing the smallest correct change, respecting contracts,
  and updating living documents.
---

# GridVision — Task Execution Skill

## Purpose

Guides an AI coding agent through implementing a specific task on GridVision.
Ensures work is correct, minimal, well-tested, and properly reported.

## Execution Workflow

### 1. Understand the Task

- What exactly needs to be built or changed?
- Which pipeline stage / module does this belong to?
- Which team role owns this? (See Team Execution Contract §1)

### 2. Read Relevant Master References

Depending on the task, read the appropriate sections:

- **Data/pipeline work:** Blueprint v2 §C (schemas), §D (module contracts), §E (pipeline sequence)
- **API work:** Blueprint v2 §F (API contracts)
- **Frontend work:** Blueprint v2 §G, Handoff §12
- **Research/statistics work:** v4 §8 (methodology), Handoff §9
- **RAG work:** Blueprint v2 §H, Handoff §11

### 3. Read Current Project State

Before coding:
```
Read: docs/current_status/PROJECT_STATE.md
Read: docs/current_status/TASKS.md
Read: docs/current_status/DECISIONS.md
```

### 4. Inspect Existing Code

- Check what already exists in the target directory.
- Read existing files before overwriting.
- Understand existing interfaces and data contracts.

### 5. Identify Dependencies

From Team Execution Contract §2 (Ownership Matrix):
- What artifacts does this module consume?
- Do those artifacts actually exist in the repository?
- What artifacts does this module produce?
- Who consumes those artifacts downstream?

### 6. Implement the Smallest Correct Change

- Follow the module contract from Blueprint v2 §D.
- Use the exact schema from Blueprint v2 §C.
- Respect the locked pipeline sequence from Blueprint v2 §E.
- Do NOT refactor unrelated modules.
- Do NOT change interfaces that downstream consumers depend on.
- Use fixed seeds where reproducibility is required.
- Include input/output validation per the artifact contract.

### 7. Run Appropriate Tests

- Run the module's own tests.
- Run any leakage/schema tests the module touches.
- Check the test ownership table in Team Execution Contract §10.
- Do NOT claim TESTED without actually running tests.
- Do NOT claim VERIFIED without human inspection of real (non-synthetic) data.

### 8. Report Actual Results

Use the progress report format from Handoff §24:

```
STATUS:
COMPLETED:
FILES / CODE CHANGED:
COMMANDS / TESTS RUN:
RESULTS:
ERRORS / BLOCKERS:
DECISIONS MADE:
NEXT STEP:
DEVIATIONS FROM MASTER PLAN: NONE (or describe)
```

### 9. Update Living Documents

- Update `docs/current_status/TASKS.md` — mark completed items.
- Update `docs/current_status/PROJECT_STATE.md` — only if material state changed.
- Record in `docs/current_status/DECISIONS.md` — only if an actual project decision occurred.

## Prohibitions

1. **Do NOT pretend code was tested.** If tests weren't run, say so.
2. **Do NOT claim implementation without evidence.** An artifact must be producible.
3. **Do NOT silently change methodology.** Follow Team Execution Contract §11.
4. **Do NOT rewrite unrelated modules.** Keep changes minimal and focused.
5. **Do NOT perform unnecessary refactoring.** The 20-day timeline is tight.
6. **Do NOT invent results or statistics.** Real numbers come from executed artifacts only.
7. **Do NOT fabricate test output.** Report actual pass/fail.
8. **Do NOT add technologies outside the locked scope.** See Handoff §16.

## Common Pitfalls

- Forgetting to check if upstream artifacts exist before implementing a downstream module.
- Using the wrong forecaster (per-cluster instead of global) for research output.
- Substituting a household's "next usable window" for the calendar successor w+1.
- Including calibration windows in instability scoring (they contribute to transition counts but don't get scored rows).
- Training the calibration forecaster on pooled data instead of single-household data.
- Re-computing the extreme-failure threshold from analysis data instead of calibration data.
- Forgetting the MAD floor (0.05 × calibration median AE).
