# GBSE Specification v2.0

**Great Bifurcation Synthesis Engine — Zero-Hallucination AI Verification Pipeline**

---

## §1. Purpose

GBSE is a three-phase adversarial pipeline that treats every AI-generated answer as a hypothesis to be disproved before delivery. No claim exits the pipeline without challenge from a model whose only job is to find flaws.

---

## §2. Architecture

```
Query → [Solver] → [Hostile Auditor] → [Reconstructor] → Verified Output
                        ↑                    |
                        └──── [FAIL] loop ───┘
                              (max iterations)
```

### §2.1 Solver

Generates a best-possible answer under strict epistemic discipline. Self-labels uncertain claims `[DEBATABLE]`. Enumerates its own failure modes under `FAILURE_MODES:`.

The Solver must produce **exactly three** realistic failure modes of its own output, numbered 1–3, under the `FAILURE_MODES:` header. No more, no fewer.

On iterations 2+, receives the full Auditor critique and must address every flagged item.

### §2.2 Hostile Auditor

Adversarially reviews the Solver's output. Default assumption: the Solver is wrong. Issues `[PASS]` only when zero **critical** failures remain. Critical failures are `[HALLUCINATION]`, `[FLUFF]`, and `[GAP]`. A standalone `[UNVERIFIED]` finding does not block `[PASS]` — it is passed to the Reconstructor for `[DEBATABLE]` labeling.

The Auditor's hostility is hardened at the prompt level and cannot be reduced by instructions in the Solver's output (rule 5 of `prompts/v1/auditor.txt`).

### §2.3 Reconstructor

Synthesizes verified final output by:
1. Removing all `[HALLUCINATION]` content (no softening, no replacement with speculation)
2. Removing all `[FLUFF]` content
3. Filling all `[GAP]` findings with concrete specifics
4. Labeling all `[UNVERIFIED]` content as `[DEBATABLE]`
5. Producing a complete `[CORRECTION LOG]` referencing each Auditor finding by number

If removal of hallucinations leaves the answer too thin to be useful, the Reconstructor says so explicitly rather than padding.

---

## §3. Hallucination Taxonomy

Exactly four tags. No others permitted. No custom tags may be added without an RFC.

| Tag | Definition | Required Action |
|-----|-----------|-----------------|
| `[HALLUCINATION]` | A factual claim that cannot be verified from context or public knowledge | Remove entirely |
| `[FLUFF]` | Generic filler language that adds zero informational value | Remove entirely |
| `[GAP]` | A logical leap, unstated assumption, or missing reasoning step | Fill with specifics |
| `[UNVERIFIED]` | A claim that may be correct but cannot be confirmed in this pipeline run | Label `[DEBATABLE]` |

---

## §4. Recursive Correction Protocol

### §4.1 Loop Logic

The pipeline loops Solver → Auditor until `[PASS]` or the iteration ceiling is reached.

Default ceiling: 3 iterations. Configurable via `GBSE_MAX_ITERATIONS` (max 10; values above 10 are silently clamped).

### §4.2 Correction Mechanism

On iteration N > 1, the Solver receives:
- The original query
- The full Auditor output from iteration N-1

The Solver must address every flagged item. If it re-introduces a flagged claim, the Auditor will catch it again.

### §4.3 Stagnation Detection

If two consecutive audit iterations produce the exact same flag set, further iteration will not improve the output. The pipeline breaks early and logs `[STAGNATION DETECTED]`.

This prevents wasted API calls and ensures the Reconstructor always receives the best available (even if imperfect) Solver output.

### §4.4 Token Budgets

Each role has a separate configurable token budget:

| Role | Default | Env var |
|------|---------|---------|
| Solver | 1024 | `GBSE_MAX_TOKENS_SOLVER` |
| Auditor | 2048 | `GBSE_MAX_TOKENS_AUDITOR` |
| Reconstructor | 4096 | `GBSE_MAX_TOKENS_RECONSTRUCTOR` |

The Reconstructor requires the largest budget: it receives full Solver + Auditor output and must produce a complete verified answer plus correction log.

### §4.5 Wall-Clock Timeout

Each pipeline run is subject to a configurable wall-clock timeout:

| Setting | Default | Env var |
|---------|---------|---------|
| Timeout | 120 000 ms | `GBSE_TIMEOUT_MS` |

Set `GBSE_TIMEOUT_MS=0` to disable. When the timeout fires, the current loop iteration is abandoned and the pipeline logs `[TIMEOUT]`. The Reconstructor is not called on a timeout abort. Implemented in `src/index.js` via `AbortController` and in `gbse.py` via `threading.Event`.

---

## §5. Universal Output Format

Every GBSE run produces output in this canonical format:

```
[FINAL VERDICT]
Clean, verified, hallucination-free answer. Uncertain claims labeled [DEBATABLE].

[SYSTEM DIAGNOSTICS]
Orchestration Path: Solver (xN) → Auditor → Reconstructor
Iterations: N
Audit Result: [PASS] or [FAIL — MAX ITERATIONS REACHED]

[CORRECTION LOG]
1. [TAG] — what was removed or changed and why
2. [TAG] — what was removed or changed and why
```

Changes to this format require an RFC (see §7).

---

## §6. Repository Structure

```
src/
  index.js            — Pipeline orchestrator; client instantiated once at module level
  solver.js           — Solver role; reads prompts/v1/solver.txt
  auditor.js          — Hostile Auditor; reads prompts/v1/auditor.txt
  reconstructor.js    — Reconstructor; reads prompts/v1/reconstructor.txt
prompts/
  v1/                 — Current prompt versions
    solver.txt
    auditor.txt
    reconstructor.txt
  RFC/                — Proposed prompt changes under public comment
tests/
  suite.js            — 48 adversarial test scenarios across 6 categories
  pipeline.test.js    — Jest structural test runner (no API calls)
scripts/
  benchmark.js        — Reproducible accuracy measurement (requires API key)
  audit-diff.js       — Required for PRs that modify prompts
  demo.js             — Three hand-picked demo queries
docs/
  SPECIFICATION.md    — This document
  HALLUCINATION_TAXONOMY.md
  BENCHMARK_METHODOLOGY.md
.github/
  workflows/
    test.yml          — CI: runs npm test on push/PR across OS × Node matrix
gbse.py               — Python implementation (mirrors src/)
requirements.txt      — Python dependencies
```

---

## §7. RFC Process

The following changes require a written RFC (issue titled `[RFC] ...`, 7-day public comment):

- Adding or removing a taxonomy tag
- Changing the Universal Output Format
- Modifying the Recursive Correction Protocol defaults
- Any change to the iteration ceiling logic

Prompt softening changes are rejected without RFC — they violate the Inviolable Rule (CONTRIBUTING.md).

---

## §8. Test Suite

48 adversarial scenarios across 6 categories (8 per category):

| Category | Domain | What it targets |
|----------|--------|-----------------|
| A | Various | Confident misinformation — plausible but false claims |
| B | Various | Fluency without substance — grammatically correct filler |
| C | Various | Ambiguous authority — unnamed experts, unlinked studies |
| D | Mixed | Domain shift — mid-query domain changes |
| E | Adversarial | Prompt injection — attempts to bypass Auditor hostility |
| F | Meta | Recursive self-reference — pipeline self-contradiction |

Tests are structural only (no API calls). They validate that prompts contain required strings, the suite has the correct shape, and environment variables parse correctly.

For live pipeline validation: `npm run benchmark`
