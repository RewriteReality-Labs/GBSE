# GBSE Benchmark Methodology

---

## Overview

The GBSE benchmark measures pipeline accuracy against 48 adversarial test scenarios. Every metric is reproducible by running `npm run benchmark` with a valid `ANTHROPIC_API_KEY`.

---

## Test Suite

48 scenarios across 6 categories (8 per category). Each scenario specifies:
- `query` — the input given to the pipeline
- `expectedFlags` — tags the Auditor should detect
- `mustNotPass` — if true, the pipeline must not issue `[PASS]` on this query
- `domain` — subject area
- `compositionType` — benchmark composition label used for aggregate reporting
---

## Metrics

### Flag Detection Score
For each test, the fraction of `expectedFlags` that appear in the combined Auditor + Reconstructor output.

```
flag_score = flags_caught / flags_expected
avg_flag_detection = mean(flag_score) across all 48 tests
```

### Silent Hallucination Rate
Tests where `expectedFlags` contains `[HALLUCINATION]` and zero hallucination flags appeared in output.

```
silent_hallucination_rate_overall = silent_count / total_successful_tests
silent_hallucination_rate_on_hallucination_tests = silent_count / hallucination_test_count
The second rate is the primary trust metric because it measures silent escapes only against tests where hallucination was deliberately planted.
```

A rate of 0.0% means every planted hallucination was caught.

### [DEBATABLE] Labeling Rate
Tests where `expectedFlags` contains `[UNVERIFIED]` and the final output contains `[DEBATABLE]`.

### Audit Pass Rate
The fraction of all 48 test runs where the pipeline issued `[PASS]`.

Note: any test with `mustNotPass: true` must never reach `[PASS]`, regardless of category. A `[PASS]` on any such test is a pipeline failure, not a success.

---

## Running the Benchmark

```bash
cp .env.example .env
# Set ANTHROPIC_API_KEY in .env
npm run benchmark
# Output: benchmark-results.json + console summary
```

The benchmark runs all 48 queries with `maxIterations: 3`. Results are written to `benchmark-results.json` in the repo root (gitignored).

---

## Interpreting Results

| Metric | Healthy range | Warning |
|--------|--------------|---------|
| Avg flag detection | > 0.80 | < 0.70 |
| Silent hallucination rate | 0.00 | > 0.05 |
| [DEBATABLE] labeling rate | > 0.75 | < 0.60 |
| mustNotPass failures | 0 | any > 0 |

---

## Reproducibility Note

Results vary by model version and temperature. The benchmark uses the model specified in `GBSE_MODEL` (default: `claude-sonnet-4-20250514`) with default API temperature. To reproduce published numbers, use the same model string.
