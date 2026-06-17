# ATTA_GBSE_ALMA_LEDGER_001
## Predeclaration: ALMA Ledger Implementation

**Status:** PREDECLARED
**Predeclared:** 2026-06-17
**Governing milestone:** M-18 / A6 gap closure
**Scope:** src/alma.js stub and tests

### Intended functions
- recordUnknownClass
- getUnknownClassCount
- shouldEscalateToCandidateLaw
- writeAlmaLedgerEntry

### Gate conditions for implementation
- Four named functions present and exportable
- shouldEscalateToCandidateLaw returns false below count 3
- shouldEscalateToCandidateLaw returns true at count >= 3
- writeAlmaLedgerEntry appends to docs/atta/ALMA_LEDGER.md with timestamp
- LAW 52 three-occurrence counter is the only escalation trigger
- No law is marked active by alma.js
- Escalation produces a candidate entry only

### Hard limits
- alma.js does not modify prompts/v1/
- alma.js does not activate LAW 13-52
- alma.js does not activate EC-28 through EC-38
- alma.js does not change canonical Auditor tags
- Implementation is complete only after npm test passes with alma.js present

### Benchmark dependency
BENCHMARK_003 does not test alma.js directly.
alma.js must exist and pass npm test before BENCHMARK_003 runs.
