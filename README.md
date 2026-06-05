# GBSE — Great Bifurcation Synthesis Engine

> A recursive three-layer AI governance pipeline that forces language models through audit, correction, and reconstruction before output. Every claim passes a Solver, survives an Auditor, and is rebuilt with a correction log before it exits the pipeline.

![CI](https://github.com/RewriteReality-Labs/GBSE/actions/workflows/test.yml/badge.svg)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Python](https://img.shields.io/badge/Python-3.9%2B-blue)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![Tests](https://img.shields.io/badge/tests-56%20active-informational)
![Benchmark](https://img.shields.io/badge/benchmark-90.5%25%20flag%20detection-blue)
![OfficialValid](https://img.shields.io/badge/officialValid-true-brightgreen)
![ATTA](https://img.shields.io/badge/ATTA-BENCHMARK__002%20AFFIRMED-brightgreen)

---

## Table of Contents

- [Current Proof Status](#current-proof-status)
- [What GBSE Is / Is Not](#what-gbse-is--is-not)
- [Architecture](#architecture)
- [Benchmark History](#benchmark-history)
- [Quickstart](#quickstart)
- [Hallucination Taxonomy](#hallucination-taxonomy)
- [The 12 Laws](#the-12-laws)
- [27 EC Classes](#27-ec-classes)
- [Repository Structure](#repository-structure)
- [ATTA Governance](#atta-governance)
- [Roadmap](#roadmap)
- [Whitepaper Alignment](#whitepaper-alignment)
- [Contributing](#contributing)
- [License](#license)

---

## Current Proof Status

| Layer | Value | Status |
|---|---|---|
| Benchmark | 168 executions · **90.5%** flag detection · **1.8%** silent hallucination · **0** must-not-pass failures | `AFFIRMED ✅` |
| Official run | 3 runs · `officialValid: true` · 0 errors · proof commit `5f62d2c` | `AFFIRMED ✅` |
| ATTA record | `ATTA_GBSE_BENCHMARK_002` — **AFFIRMED** · tag `v1.0.0-atta.affirmed` | `SEALED` |

### Proof Artifacts

- Official result file: [`benchmark-results.json`](benchmark-results.json)
- Release tag: [`v1.0.0-atta.affirmed`](https://github.com/RewriteReality-Labs/GBSE/releases/tag/v1.0.0-atta.affirmed)
- Benchmark code commit: `19b946da4666`
- Proof/result commit: `5f62d2c230f50e19e4484a3d8f78039b08ccf017`
- Run mode: `official`
- Model: `claude-sonnet-4-20250514`
- Temperature: `0`

---

## What GBSE Is / Is Not

### What GBSE Is

GBSE is an AI-output governance pipeline. It evaluates whether a model response contains hallucinated claims, unsupported assertions, logical gaps, or empty filler, then reconstructs the answer with a correction log.

### What GBSE Is Not

GBSE is not a generic chatbot, not a RAG framework, not a legal-advice engine, and not a replacement for domain experts. It is a verification and correction layer for high-risk model outputs.

---

## Architecture

### The Pipeline

Every query enters an **Orchestrator-governed iteration loop**. The Solver generates a candidate output and declares its own failure modes. The Auditor applies 12 Laws to detect hallucination, fluff, gaps, and unverified claims. If the verdict is `FAIL`, the critique is injected back into the Solver. The loop continues until `PASS`, stagnation, or timeout. The Reconstructor rebuilds the final output with a formal correction log.

```
┌─────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR                          │
│         (iteration ceiling · stagnation · timeout)      │
└──────────┬──────────────────────────────────────────────┘
           │
     ┌─────▼──────┐     ┌───────────┐     ┌───────────────┐
     │   SOLVER   │────▶│  AUDITOR  │────▶│ RECONSTRUCTOR │
     │ Expansion  │     │Compression│     │  Integration  │
     └─────▲──────┘     └─────┬─────┘     └───────────────┘
           │                  │
           └──── FAIL ◀───────┘
              (critique injected back)
```

> On `PASS`, the Reconstructor produces the final output with a structured correction log. A system that only detects failure and stops is a rejection engine — GBSE corrects and rebuilds, making it usable in production workflows, not just as a validator.

### Canonical Output Format

> Changing this format requires an RFC committed to `prompts/RFC/`.

```
GBSE OUTPUT
─────────────────────────────────────────────
VERDICT:        PASS | FAIL
AUDIT FINDINGS: [HALLUCINATION] | [FLUFF] | [GAP] | [UNVERIFIED]
CORRECTION LOG: Structured correction with source trace
ITERATIONS:     Count before resolution
CONFIDENCE:     VERIFIED | ASSUMED | DEBATABLE
```

---

## Benchmark History

> This is not a static score. The regression and recovery history are part of the proof: GBSE records not only its successful benchmark state, but also the failure mode that caused a regression and the exact recovery path that restored benchmark validity.

**`ATTA_GBSE_BENCHMARK_001` · Initial run**
- Core pipeline built: `run_pipeline()`, solver v1, auditor v1, reconstructor v1
- Result: **91.7% flag detection** ✅

---

**`ATTA_GBSE_BENCHMARK_001` · Regression**
- A prompt change caused a collapse to **60.4%** ❌ — REJECTED
- Root cause diagnosed over two days: the auditor was emitting detection verdicts as free-text prose instead of structured taxonomy tags. The benchmark scanner could not parse them. Detection capability was intact — output format was wrong.

---

**Recovery · `auditor_v3.1` / `solver_v2.1` / `reconstructor_v3.1`**
- Three prompt files upgraded simultaneously
- Auditor now emits formal bracketed tags `[HALLUCINATION]`, `[FLUFF]`, `[GAP]`, `[UNVERIFIED]`
- Scoring logic in `benchmark.js` corrected — 33 false failures resolved

---

**PR #16 → #19 · `auditor_v4_0` · Gate-by-gate closure**

| PR | Change | Result |
|---|---|---|
| #16 | Benchmark scoring fix | 33 false failures resolved immediately |
| #17 | auditor_v4 tag enforcement | 68.8% → 83.9% |
| #18 | Silent hallucination lock | Rate drops to 0.0% |
| #19 | Final flag detection lock | **92.0% · 0.0% · 0** — all three local gate conditions met |

---

**`ATTA_GBSE_BENCHMARK_002` · Status: `AFFIRMED` ✅**
- 168 executions · 0 errors · 90.5% flag detection · 1.8% silent hallucination · 0 must-not-pass failures
- Official 3-run complete · `officialValid: true` · proof commit `5f62d2c`
- Tag: `v1.0.0-atta.affirmed`

> **ATTA Rule:** No claim about GBSE's benchmark advances past its current ATTA proof status. An official AFFIRMED result always outweighs any unverified local figure.

---

## Quickstart

**Try GBSE on one query:**

```javascript
// Node.js — minimal usage
const { runPipeline } = require('./src/index');

const result = await runPipeline(
  "The Eiffel Tower was built in 1952 and stands in Berlin."
);

console.log(result.verdict);        // FAIL
console.log(result.auditFindings);  // [HALLUCINATION]
console.log(result.correctionLog);  // Structured correction with source trace
console.log(result.iterations);     // Number of loop iterations before resolution
```

```python
# Python reference
from gbse import run_pipeline

result = run_pipeline(
    "The Eiffel Tower was built in 1952 and stands in Berlin."
)
print(result.verdict)         # FAIL
print(result.audit_findings)  # [HALLUCINATION]
print(result.correction_log)  # Structured correction
```



### Prerequisites

- Node.js 18+
- Python 3.9+ (optional — reference runtime only)
- An `ANTHROPIC_API_KEY` from [console.anthropic.com](https://console.anthropic.com)

### Node.js

```bash
# Clone and install
git clone https://github.com/RewriteReality-Labs/GBSE.git
cd GBSE
npm install

# Configure environment
cp .env.example .env
# Open .env and set ANTHROPIC_API_KEY

# Run tests
npm test

# Run local benchmark
npm run benchmark
```

**Official 3-run benchmark — bash/Linux/Mac:**

```bash
export GBSE_OFFICIAL=true
export GBSE_CONCURRENCY=1
node scripts/benchmark.js --runs=3 | tee benchmark-official-output.txt
```

**Official 3-run benchmark — Windows PowerShell:**

```powershell
$env:GBSE_OFFICIAL="true"
$env:GBSE_CONCURRENCY="1"
node scripts\benchmark.js --runs=3 2>&1 | Tee-Object -FilePath benchmark-official-output.txt
```

> **API quota notice:** Official mode runs 168 total executions (`56 tests × 3 runs`) and may consume significant API quota. Use local mode for development. Use official mode only when recording a benchmark proof artifact.

### Python (reference)

```bash
pip install -r requirements.txt
python gbse.py
# Returns: verdict, audit_findings, correction_log, iterations, confidence
# Note: benchmark runtime is Node.js. Python is a reference implementation.
```

---

## Hallucination Taxonomy

Four output tags. Each has a precise definition. Ambiguity in tagging is itself an auditor failure.

| Tag | Definition | Blocks PASS? |
|---|---|---|
| `[HALLUCINATION]` | False, unverifiable, or confabulated claim presented with confidence. Hedging a false claim does not remove the tag (LAW 3). | **YES · HARD** |
| `[FLUFF]` | Vacuous filler with zero informational value. Generic padding, empty affirmations. Distinct from `[GAP]` — FLUFF has content present but worthless. (LAW 5) | YES |
| `[GAP]` | Logical discontinuity — a claim that cannot reach its conclusion from the evidence given. The argument has a structural hole, not just a missing citation. (LAW 6) | YES |
| `[UNVERIFIED]` | Claim whose truth is uncertain and that uncertainty is not labelled. Distinct from hallucination — the claim may be true, but its status is not declared. (LAW 7) | YES |

> **Critical distinction:** A `[HALLUCINATION]` tag cannot be downgraded to `[FLUFF]` to soften an audit verdict. Misrouting a false claim to a lower-severity tag is itself an auditor violation. LAW 8 overrides LAW 12 — inability to verify a checkable fact is a hallucination, not merely an uncertainty.

---

## The 12 Laws

Applied by the Auditor on every iteration. `HARD BLOCK` violations prevent an unqualified `PASS` and route the case to a fail-safe state. The system may return a structured failure or diagnostic output, but must not produce a normal verified answer while the hard-block condition remains unresolved.

| Law | Name | Rule | Severity |
|---|---|---|---|
| LAW 1 | Frame Injection | 6 subcases (1A–1F). The Solver cannot adopt the questioner's framing if it contains a false premise. | **HARD BLOCK** |
| LAW 2 | False Premise Correction Mandatory | An uncorrected false premise in any answer = `[HALLUCINATION]`. Silence is not correction. | HARD |
| LAW 3 | No Hedging False Claims | A hedged false claim is still `[HALLUCINATION]`. "It might be the case that…" does not lower severity. | HARD |
| LAW 4 | No Confabulated Sources | Unverifiable citations = `[HALLUCINATION]`. No invented paper titles, no invented author names. | HARD |
| LAW 5 | Vacuous Filler Banned | Generic padding with zero informational value triggers `[FLUFF]`. Content must earn its presence. | STANDARD |
| LAW 6 | Logical Gaps Must Be Named | A gap in reasoning not declared by the Solver triggers `[GAP]`. Silent discontinuity is a violation. | STANDARD |
| LAW 7 | Uncertainty Must Be Labelled | Uncertain claims without a declared uncertainty marker trigger `[UNVERIFIED]`. | STANDARD |
| LAW 8 | Inability to Verify = Hallucination | If a claim is checkable and the Auditor cannot verify it, it is `[HALLUCINATION]` — not `[UNVERIFIED]`. **Overrides LAW 12.** | HARD |
| LAW 9 | Overclaiming Certainty = Hallucination | Confidence must match evidence. Stating a contested claim as settled fact triggers `[HALLUCINATION]`. | HARD |
| LAW 10 | Protect Valid Uncertainty | Genuine, accurate hedges are not `[FLUFF]`. The Auditor must not penalise correct epistemic humility. | GUARD |
| LAW 11 | Stale-State / Current-State Claim Control | 5 subcases (11A–11E). 11E = **HARD BLOCK**: synonym evasion — swapping temporal markers to smuggle stale claims through. | **11E: HARD BLOCK** |
| LAW 12 | Conservative Default | Unknown patterns → `FAIL` by default. EXEMPTION: checkable facts with a verifiable source can pass. LAW 8 overrides this exemption. | DEFAULT |

---

## 27 EC Classes

The EC (Escape Class) taxonomy defines named adversarial patterns the pipeline is designed to detect and contain. Each class has a defined detection rule and pipeline injection point. EC-25 is the anchor case — a real resolved scenario that predates and validated the framework.

| Range | Description |
|---|---|
| EC-01 – EC-10 | Core scope and premise defense: jurisdiction, timeline, obligation boundary, initial claim handling. |
| EC-11 – EC-20 | Escalation ladder: discharge declarations, estoppel chains, laches arguments, conduct analysis. |
| EC-21 – EC-25 | Advanced adversarial patterns. **EC-25: Context Drift / Stale-State** — the anchor case that validated the entire framework against a real scenario before any code was written. |
| EC-26 | **Origin Decay Defense.** A dispute has drifted so far from the original obligation that the current claim no longer traces to what was established. Pipeline field: `originClauseLoaded`. |
| EC-27 | **Compounding Ambiguity Loop.** New claims introduced faster than any can be resolved. Orchestrator Claim Freeze fires. Pipeline field: `activeClaimCount`. |
| EC-26×27 + EC-27×26 | **Cross-injection · HARD BLOCK.** When EC-26 and EC-27 fire simultaneously, the pipeline routes to fail-safe — no verified answer until both are resolved in sequence. Directional: EC-26×27 ≠ EC-27×26. |

> **Note on scope:** The EC taxonomy was developed for adversarial output-verification scenarios. It shares structural convergence with the Solver/Auditor/Reconstructor/Orchestrator pipeline pattern. See `docs/SPECIFICATION.md` for full class definitions and test cases.

---

## Repository Structure

```
GBSE/
├── gbse.py                          — Python reference entry point
├── src/
│   ├── index.js                     — Node.js entry point
│   ├── solver.js                    — Solver layer (Expansion)
│   ├── auditor.js                   — Auditor layer (Compression)
│   └── reconstructor.js             — Reconstructor layer (Integration)
├── prompts/
│   ├── v1/                          — Production prompt files
│   └── RFC/                         — Candidate prompts under review
├── tests/
│   ├── pipeline.test.js             — 39 unit tests (2 suites)
│   └── benchmark-metrics.test.js   — Benchmark gate validation
├── scripts/
│   └── benchmark.js                 — 56-test active benchmark runner
├── docs/
│   ├── SPECIFICATION.md
│   ├── HALLUCINATION_TAXONOMY.md
│   └── BENCHMARK_METHODOLOGY.md
├── benchmark-results.json           — Official benchmark proof artifact
├── package.json                     — Node.js project manifest
├── package-lock.json                — npm dependency lockfile
├── requirements.txt                 — Python dependencies
├── CHANGELOG.md
├── CONTRIBUTING.md
├── .env.example
└── LICENSE
```

---

## ATTA Governance

Every benchmark claim in this repo is gated by an ATTA (Adversarial Trust and Transparency Architecture) record. Gates are **pre-declared** — stated before a run happens, not after. Any reader can inspect the gate conditions and compare them against `benchmark-results.json`.

### `ATTA_GBSE_BENCHMARK_002` — Pre-Declared Gate Conditions

```
avgFlagDetection        ≥ 90%
mustNotPassFailureCount = 0
silentHallucinationRate ≤ 10%
officialValid           = true
apiErrorRate            < 5%
_officialRunCount       = 3
promptHashes            present in result
```

**Official result:** 90.5% · 1.8% · 0 — all gates passed across 168 executions.
**Official status:** `AFFIRMED` — `officialValid: true` · proof commit `5f62d2c` · tag `v1.0.0-atta.affirmed`.

> **What ATTA prevents:** Without pre-declared gates, a benchmark number is an assertion. With ATTA, it is an auditable commitment — the exact methodology, conditions, and prompt versions are on record before the result exists. A competitor or auditor cannot dispute the number without engaging the pre-declared methodology directly.

---

## Roadmap

> `ATTA_GBSE_BENCHMARK_002` is **AFFIRMED**. Phase 1 complete.

| Phase | Name | Timing | Unlocks |
|---|---|---|---|
| 1 | **PROVE** | ✅ Complete | AFFIRMED status · tagged release `v1.0.0-atta.affirmed` |
| 2 | **SIGNAL** | Week 1 post-AFFIRMED | ATTA record public · repo announcement |
| 3 | **EARN** | Weeks 2–3 | Governance audit service · tooling release |
| 4 | **CLOSE** | Month 2 | Whitepaper gap closed · public launch |
| 5 | **V2** | Months 7–18 | Meta Governor + Solver A/B/C + Cross-Auditor |

> Source of truth for all phase claims: **this repo only.** No social post, no document, no conversation overrides the repo state.

---

## Whitepaper Alignment

The foundational architecture whitepaper was written **before** the build — the implementation validated the design, not the other way around. Current implementation alignment is estimated at **78%** against the original specification. The percentages below reflect the maintainer's assessment against the specification in [`docs/SPECIFICATION.md`](docs/SPECIFICATION.md).

| Section | Status | Evidence |
|---|---|---|
| Core Pipeline Architecture (v1) | **100% CLOSED** | `run_pipeline()`, full loop, stagnation, timeout — built, stress-tested, and recovered from a documented regression |
| Three-Layer Cognitive Governance | **100% CLOSED** | Expansion / Compression / Integration / Governance confirmed across all production prompt files |
| Recursive Corrective Cognition | **100% CLOSED** | Implemented, tested to failure, diagnosed, and recovered. Full regression history in `benchmark-results.json`. |
| v1 Deployment Domains | **78% — 3 of 6** | Legal, AI governance, and research memo domains have artifacts. Cybersecurity, regulatory, enterprise: Phase 4. |
| v2 Distributed Architecture | **18% — PROPOSED** | Meta Governor + Solver A/B/C + Cross-Auditor: specified, not yet built. Phase 5. |
| Critical Challenges | **91% CLOSED** | Every challenge except Consensus Collapse has been encountered, named, and pre-declared in ATTA records |

**Overall: 78%.** Full closure targeted at Phase 5. See [`docs/SPECIFICATION.md`](docs/SPECIFICATION.md) for the full alignment map.

---

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the full contributor guide. Core rules that govern all contributions:

**Auditor Inviolability** — The Auditor's verdict cannot be softened by reclassifying a `[HALLUCINATION]` as a lower-severity tag to improve benchmark scores. Any PR that moves a benchmark number must include a root cause analysis proving genuine detection improvement, not tag reclassification.

**No Benchmark Overfitting** — Prompt rules must address general detection patterns, not individual test IDs. Case-by-case hardcoding of specific test cases destroys system credibility and will be rejected on review.

**RFC for Canonical Changes** — The Universal Output Format is canonical. Changes require an RFC in `prompts/RFC/` with a diff, a regression-clean test run, and a documented rationale. Output field names do not change without an RFC.

**ATTA Pre-Declaration** — Any PR that introduces or modifies benchmark gate conditions must update the ATTA record with the new pre-declared conditions **before** the benchmark is run. Running first and declaring afterward is not permitted.

---

> **Source of Truth Rule:** This repo is the only valid source of truth for all GBSE claims. Shared documents, social posts, and conversations are historical record only. No claim advances past its current ATTA proof status.

---

## License

MIT License — see [`LICENSE`](LICENSE) for details.

---

[Specification](docs/SPECIFICATION.md) · [Taxonomy](docs/HALLUCINATION_TAXONOMY.md) · [Benchmark Methodology](docs/BENCHMARK_METHODOLOGY.md) · [Changelog](CHANGELOG.md) · [Contributing](CONTRIBUTING.md)

**RewriteReality Labs · [github.com/RewriteReality-Labs/GBSE](https://github.com/RewriteReality-Labs/GBSE)**

## Launch Transparency

GBSE is an adversarial benchmark framework for auditing model failure modes and documenting corrections. It does not claim zero hallucination or perfect detection.

The public launch posture is intentionally separated into active law, critique, proposed future law, and correction examples:

- [Public discussion launch draft](docs/public-discussion-launch.md)
- [Methodology critique anchor](docs/methodology-critique.md)
- [Taxonomy v1.1 dependency escalation RFC](docs/RFC/taxonomy-v1.1-dependency-escalation.md)
- [Correction log sample output](examples/correction-log-sample.md)

The active taxonomy remains in `docs/HALLUCINATION_TAXONOMY.md`. Proposed taxonomy changes are staged as RFC and are not silently treated as proven benchmark law.
