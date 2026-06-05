# GBSE Methodology Critique

Status: Critique Anchor
Applies to: ATTA_GBSE_BENCHMARK_002 signal launch
Active benchmark law changed: No
Active taxonomy changed: No

## Purpose

This document records known methodological limitations in the current GBSE benchmark pipeline without rewriting the benchmark state under which ATTA_GBSE_BENCHMARK_002 was executed.

The purpose is to preserve a clean separation between:

- the affirmed benchmark state
- the critique of that state
- proposed improvements staged for future evaluation

Known vulnerabilities are documented here so they are visible to reviewers without being silently treated as already-solved benchmark law.

## Non-Retroactive Boundary

ATTA_GBSE_BENCHMARK_002 was executed under the active taxonomy and methodology that existed at execution time.

This critique does not retroactively alter:

- docs/HALLUCINATION_TAXONOMY.md
- benchmark scoring rules
- benchmark pass/fail interpretation
- the semantic conditions under which BENCHMARK_002 was run

Any correction proposed after the benchmark must be staged as RFC and evaluated in a future run before it becomes active law.

## Known Methodological Vulnerabilities

### 1. Dependency Escalation Gap

Current claim evaluation can identify unsupported or hallucinated claims, but a downstream claim may still appear valid if its upstream dependency is not explicitly represented as part of the verification graph.

Failure pattern:

1. Claim A is unsupported, incomplete, or unresolved.
2. Claim B depends on Claim A.
3. Claim B is evaluated locally and appears structurally plausible.
4. The system passes Claim B without escalating the unresolved dependency.

This creates a risk where local correctness hides global dependency failure.

Required future direction:

- represent claim dependencies explicitly
- prevent dependent claims from passing clean while parent claims remain unresolved
- surface dependency failure as its own audit class

The proposed correction is staged in:

docs/RFC/taxonomy-v1.1-dependency-escalation.md

### 2. Iteration Loop Boundary Risk

The iteration controller must avoid a runtime race condition where the final loop attempts one additional solver/auditor cycle after the intended maximum iteration window.

The safer runtime pattern is:

MAX_ITERATIONS - 1

This keeps the final reconstruction pass inside the intended iteration budget and prevents off-by-one execution drift.

### 3. Proposed-State Contamination Risk

If proposed taxonomy changes are written directly into the active taxonomy file, then future readers may incorrectly believe the benchmark was executed under those later rules.

This would contaminate the proof chain.

Required discipline:

- active law remains in docs/HALLUCINATION_TAXONOMY.md
- proposed taxonomy changes live only in docs/RFC/
- no RFC is treated as benchmark law until explicitly promoted and re-tested

## Public Disclosure Posture

Known vulnerabilities are documented in docs/methodology-critique.md and proposed fixes are staged as RFC, not silently treated as proven benchmark law.

## Review Status

This document is a critique anchor, not an active scoring rule.

It may be cited in public launch discussion as evidence that GBSE preserves benchmark lineage instead of rewriting history to protect a score.
