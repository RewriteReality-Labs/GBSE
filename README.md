# GBSE — Great Bifurcation Synthesis Engine

**The Zero-Hallucination AI Verification Standard**

Every AI system answers without accountability. It can be wrong, fluffy, or confidently hallucinated — and the user has no way to know. GBSE introduces a three-phase adversarial pipeline that treats every answer as a hypothesis to be disproved before delivery.

```
Query → [Solver] → [Hostile Auditor] → [Reconstructor] → Verified Output
                        ↑                    |
                        └──── [FAIL] loop ───┘
```

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-green)](package.json)
[![Python](https://img.shields.io/badge/python-%3E%3D3.10-blue)](requirements.txt)
[![CI](https://github.com/RewriteReality-Labs/gbse/actions/workflows/test.yml/badge.svg)](../../actions/workflows/test.yml)

---

## How It Works

| Component | Role | Pass Criterion |
|-----------|------|----------------|
| **Solver** | Generates best-possible answer; self-labels uncertainty as `[DEBATABLE]` | Draft produced |
| **Auditor** | Actively disproves the Solver — tags every flaw | `[PASS]` token issued |
| **Reconstructor** | Removes flagged content; fills gaps; produces verified final output | All flags resolved |

The Auditor classifies flaws using exactly four tags:

| Tag | Meaning | Action |
|-----|---------|--------|
| `[HALLUCINATION]` | Unverifiable factual claim | Remove entirely |
| `[FLUFF]` | Generic filler with no informational value | Remove entirely |
| `[GAP]` | Logical leap or missing reasoning step | Fill with specifics |
| `[UNVERIFIED]` | May be correct but not confirmable | Label `[DEBATABLE]` |

If the Auditor issues `[FAIL]`, the pipeline loops — the Solver receives the full critique and must correct its draft. This repeats until `[PASS]` or the iteration ceiling (default: 3) is reached. A stagnation detector breaks the loop early if two consecutive audits produce identical flags.

---

## Quickstart

**Node.js:**
```bash
gh repo fork RewriteReality-Labs/gbse --clone
cd gbse
npm install
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env
npm test                          # 48 structural tests must pass (no API key needed)
node src/index.js "Your query"    # Run the pipeline
```

**Python:**
```bash
pip install -r requirements.txt
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env
python gbse.py "Your query"
```

---

## Real Output Example

```
─── GBSE PIPELINE START ───────────────────────────────────
Query: What is the boiling point of water at 8,848m altitude?

[ITERATION 1/3]
  → Solver running…
  → Auditor running…
  → Audit verdict: ✗ [FAIL] — 2 finding(s)

[ITERATION 2/3]
  → Solver running…
  → Auditor running…
  → Audit verdict: ✓ [PASS] — 0 finding(s)

  → Reconstructor running…

─── FINAL OUTPUT ───────────────────────────────────────────
[FINAL VERDICT]
At 8,848m (Mount Everest summit), atmospheric pressure is approximately 33.7 kPa
(roughly one-third of sea-level pressure). At this pressure, water boils at
approximately 70°C (158°F), compared to 100°C at sea level.

[SYSTEM DIAGNOSTICS]
Orchestration Path: Solver (x2) → Auditor → Reconstructor
Iterations: 2
Audit Result: [PASS]

[CORRECTION LOG]
1. [HALLUCINATION] — removed claim that water boils at "68°C" (correct value is ~70°C)
2. [GAP] — added atmospheric pressure value (33.7 kPa) that supports the boiling point claim
────────────────────────────────────────────────────────────
```

---

## Output Format

Every GBSE run produces output in this canonical format:

```
[FINAL VERDICT]
Clean, verified, hallucination-free answer. Any uncertain claims are labeled [DEBATABLE].

[SYSTEM DIAGNOSTICS]
Orchestration Path: Solver (x2) → Auditor → Reconstructor
Iterations: 2
Audit Result: [PASS]

[CORRECTION LOG]
1. [HALLUCINATION] — removed claim about X (unverifiable)
2. [FLUFF] — removed "it is important to note"
3. [GAP] — added missing step between Y and Z
```

---

## Benchmarks

Measured against a 48-item adversarial test suite spanning 6 domains.
Run `npm run benchmark` with your API key to reproduce.

| Metric | Result |
|--------|--------|
| Avg flag detection score | Run `npm run benchmark` |
| Silent hallucination rate | Run `npm run benchmark` |
| Audit pass rate | Run `npm run benchmark` |

```bash
npm run benchmark   # writes benchmark-results.json
```

See `docs/BENCHMARK_METHODOLOGY.md` for metric definitions.

---

## Testing

```bash
npm test
```

Runs 48 **structural tests** — no API key required. These validate:
- Prompt files contain required strings and format markers
- The test suite has correct shape (48 scenarios, unique IDs, valid tags)
- Environment variables parse correctly

> **Note:** `npm test` does not call the Anthropic API and does not validate pipeline behavior.
> For live pipeline validation, run `npm run benchmark`.

---

## Configuration

| Env var | Default | Description |
|---------|---------|-------------|
| `ANTHROPIC_API_KEY` | — | Required for pipeline runs |
| `GBSE_MODEL` | `claude-sonnet-4-20250514` | Model for all three roles |
| `GBSE_MAX_ITERATIONS` | `3` | Solver→Auditor loop ceiling (max 10; values above 10 clamped) |
| `GBSE_LOG_LEVEL` | `normal` | `silent` \| `normal` \| `verbose` |
| `GBSE_MAX_TOKENS_SOLVER` | `1024` | Token budget for Solver |
| `GBSE_MAX_TOKENS_AUDITOR` | `2048` | Token budget for Auditor |
| `GBSE_MAX_TOKENS_RECONSTRUCTOR` | `4096` | Token budget for Reconstructor |
| `GBSE_TIMEOUT_MS` | `120000` | Wall-clock timeout per run in ms; `0` = disabled |

---

## Repository Structure

```
src/
  index.js            — Pipeline orchestrator (entry point)
  solver.js           — Solver role and API call logic
  auditor.js          — Hostile Auditor — do not soften its prompt
  reconstructor.js    — Final synthesis and correction log
prompts/
  v1/                 — Current versioned prompts
    solver.txt
    auditor.txt       — Hardened — do not soften
    reconstructor.txt
  RFC/                — Proposed changes under public comment
tests/
  suite.js            — 48 adversarial test scenarios
  pipeline.test.js    — Jest structural test runner (no API calls)
scripts/
  benchmark.js        — Reproducible accuracy measurement
  audit-diff.js       — Required for PRs that modify prompts
  demo.js             — Three hand-picked demo queries
docs/
  SPECIFICATION.md    — Full pipeline specification
  HALLUCINATION_TAXONOMY.md
  BENCHMARK_METHODOLOGY.md
.github/
  workflows/
    test.yml          — CI: runs npm test on push/PR
gbse.py               — Python implementation (mirrors src/)
```

---

## Contributing

Read `CONTRIBUTING.md` before opening a PR. The short version:

1. Open an issue using `ISSUE_TEMPLATE.md`
2. All 48 tests must pass before submitting (`npm test`)
3. CI must be green — a red CI is an automatic reject
4. Attach `npm run audit-diff` output showing behavioral change
5. **Never reduce the Auditor's adversarial intensity** — PRs that do are rejected immediately

RFC required for: taxonomy changes, output format changes, iteration ceiling logic.

---

## The Core Guarantee

No claim exits the pipeline without being challenged by a model whose only job is to disprove it. If it cannot be verified at 100% confidence, it is labeled `[DEBATABLE]` or removed. This is enforced at the prompt level on every single call.

---

## License

MIT — fork it, improve it, open a PR.

Built by [RewriteReality Labs](mailto:attaullahfayyaz4u@gmail.com) · Pakistan
