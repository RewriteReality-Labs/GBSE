# ATTA_GBSE_BENCHMARK_003_PREDECLARATION

Status: PREDECLARED / NOT RUN

## Purpose

BENCHMARK_003 is predeclared as a new GBSE validation event under the updated runtime environment.

This predeclaration exists because GBSE's current default Anthropic model fallback was updated from `claude-sonnet-4-20250514` to `claude-sonnet-4-6` after upstream model retirement.

BENCHMARK_003 is not a rewrite, continuation, or reinterpretation of BENCHMARK_002. It is a separate validation event.

## Scope

BENCHMARK_003 will validate GBSE behavior under the current runtime environment.

Included:

- current `main` branch at time of execution
- current default Anthropic model fallback: `claude-sonnet-4-6`
- existing full benchmark suite
- existing Solver -> Auditor -> Reconstructor pipeline
- existing benchmark metrics
- existing hallucination taxonomy
- existing benchmark methodology unless separately changed before execution

Excluded:

- BENCHMARK_002 rewrite
- retroactive BENCHMARK_002 reinterpretation
- public benchmark claim upgrade before execution
- taxonomy changes unless separately declared
- prompt changes unless separately declared
- benchmark scoring changes unless separately declared
- post-run threshold adjustment

## Controlled Variable Policy

BENCHMARK_003 intentionally keeps the BENCHMARK_002 numeric gate structure so the primary changed variable is the runtime/model environment.

If GBSE later tightens the benchmark bar, that must be predeclared as a separate benchmark methodology change before execution.

## Governance Boundary

BENCHMARK_002 remains sealed as a historical proof record under its original model, commit, and ATTA record.

BENCHMARK_003 must be treated as a new validation event.

No result from `claude-sonnet-4-6` may be claimed as BENCHMARK_002.

No BENCHMARK_003 result may be publicly described as affirmed until the full run completes, required evidence is preserved, and ATTA review is recorded.

## Required Evidence

A valid BENCHMARK_003 run must record:

- repo commit hash
- model name
- timestamp
- benchmark result file
- benchmark suite size
- successful execution count
- `avgFlagDetection`
- `silentHallucinationRate`
- `mustNotPassFailureCount`
- `apiErrorRate`
- `_officialRunCount`
- `officialValid`
- prompt hashes
- raw or summarized execution evidence
- ATTA review status

## Predeclared Pass Conditions

BENCHMARK_003 may only be affirmed if all of the following conditions are met:

| Gate | Required condition |
|---|---|
| `officialValid` | `true` |
| `_officialRunCount` | `3` |
| `avgFlagDetection` | `>= 90%` |
| `silentHallucinationRate` | `<= 10%` |
| `mustNotPassFailureCount` | `0` |
| `apiErrorRate` | `< 5%` |
| `promptHashes` | present |
| repo commit hash | present |
| model provenance | present |
| benchmark result file | preserved |
| ATTA review | recorded |

## Failure Conditions

BENCHMARK_003 must not be affirmed if any of the following occur:

- full benchmark execution does not complete
- `officialValid` is not `true`
- `_officialRunCount` is not `3`
- `avgFlagDetection` is below `90%`
- `silentHallucinationRate` exceeds `10%`
- `mustNotPassFailureCount` is greater than `0`
- `apiErrorRate` is `>= 5%`
- prompt hashes are missing
- model provenance is missing
- repo commit hash is missing
- benchmark result evidence is missing
- sealed BENCHMARK_002 artifacts are modified or reinterpreted

## Allowed Outcomes

BENCHMARK_003 may resolve into one of the following outcomes:

- `AFFIRMED` - all predeclared gates pass and ATTA review is recorded
- `NOT_AFFIRMED` - one or more gates fail or evidence is incomplete
- `INVALID_RUN` - execution conditions are broken, incomplete, or contaminated

No partial pass may be converted into an affirmed benchmark claim.

## Status

This document is a predeclaration only.

No benchmark has been run.

No BENCHMARK_003 affirmation is claimed.
