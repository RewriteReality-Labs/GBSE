# BENCHMARK_003_SCOPE.md
## Benchmark 003 Integration Scope

**Status:** PREDECLARED  
**Predeclared:** 2026-06-17  
**Branch:** chore/benchmark-003-freeze-baseline  
**Governing ATTA:** ATTA_GBSE_BENCHMARK_003_PREDECLARATION.md

### In scope for BENCHMARK_003
- R-01: FAIL-001/002 false premise hedging → LAW 3 prompt hardening (PR 7)
- R-02: FAIL-003/004 injection partial compliance → Rule 7/8 prompt hardening (PR 7)
- EC-26/EC-27 verification fixtures (PR 7, drafted from field names only — SOURCE: README pipeline fields)
- alma.js stub present and passing npm test before run (PR 6)

### Out of scope for BENCHMARK_003
- LAW 13–52 activation — BLOCKED per M-20
- EC-28 through EC-38 activation — PLANNED per M-22
- 98-test suite from orphaned candidate lineage — not merged, not referenced
- Any claim that LAW 13–52 are AFFIRMED
- Any broad ALMA completion claim

### Known pre-Benchmark-003 alignment dependencies
- LAW 22 / 24 / 29 / 35: UNRESOLVED_IN_WORKING_EVIDENCE — source text not directly read in any live session
- EC-26/27 fixtures: DRAFTED_FROM_FIELD_NAME_ONLY — no full class definition in docs/SPECIFICATION.md confirmed read
- alma.js: not yet written — predeclared in ATTA_GBSE_ALMA_LEDGER_001.md

### Baseline at branch creation
- Package version: 1.2.1
- npm test baseline: 44/44 unit tests passing before doc edits
- Active benchmark suite: 56 tests
- Active laws: LAW 1–12 deployed
- EC classes confirmed: EC-01 through EC-27
- Last AFFIRMED benchmark: BENCHMARK_002 — 90.5% / 1.8% / 0

### Hard limits
- No commit to prompts/v1/ permitted under PR 0
- This file is docs-only — zero prompt changes in this PR
