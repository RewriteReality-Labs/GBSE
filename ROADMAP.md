# GBSE Roadmap

> Source of truth: this file and the live repo only. No social post, document, or conversation overrides repo state.
> Completion score updates only after: code merged + validation passes + benchmarks pass + docs updated + branch cleared + milestone AFFIRMED.

---

## Current State

| Item | Value |
|---|---|
| Active version | `1.2.1` |
| Benchmark | `ATTA_GBSE_BENCHMARK_002` — AFFIRMED |
| Flag detection | 90.5% |
| Silent hallucination rate | 1.8% |
| Must-not-pass failures | 0 |
| Proof commit | `5f62d2c` |
| Release tag | `v1.0.0-atta.affirmed` |
| npm | `@rewriterealitylabs/gbse` |
| Active tests | 56 (7 categories × 8) |
| Active laws | LAW 1–12 deployed |
| EC classes confirmed | EC-01 through EC-27 |
| Overall completion | ~65% |

---

## Phase Ledger

| Phase | Name | Status | Timing | Unlocks |
|---|---|---|---|---|
| 1 | **PROVE** | ✅ AFFIRMED | Complete | AFFIRMED status · tagged release `v1.0.0-atta.affirmed` |
| 2 | **SIGNAL** | ✅ AFFIRMED | Week 1 post-AFFIRMED | ATTA record public · GitHub Discussion #35 · X post live |
| 3 | **EARN** | 🔴 NOT STARTED | Weeks 2–3 post-AFFIRMED | Governance audit service · tooling release |
| 4 | **CLOSE** | 🔴 NOT STARTED | Month 2 post-AFFIRMED | Whitepaper gap closed · public launch |
| 5 | **V2** | 🔴 PROPOSED | Months 7–18 | Meta Governor + Solver A/B/C + Cross-Auditor |

---

## Milestone Ledger

| ID | Title | Status | PR | Completion % | ATTA Status | GBSE Verdict |
|---|---|---|---|---|---|---|
| M-01 | Core pipeline (Solver / Auditor / Reconstructor) | DONE | — | 15% | AFFIRMED | BUILD_CLEAR |
| M-02 | BENCHMARK_001 initial run (91.7%) | DONE | — | 5% | AFFIRMED | BUILD_CLEAR |
| M-03 | Regression documented + recovered | DONE | — | 3% | AFFIRMED | BUILD_CLEAR |
| M-04 | BENCHMARK_002 AFFIRMED (90.5% / 1.8% / 0 MNP) | DONE | #19–#20 | 15% | AFFIRMED | BUILD_CLEAR |
| M-05 | npm publish `@rewriterealitylabs/gbse` | DONE | #37–#43 | 5% | AFFIRMED | BUILD_CLEAR |
| M-06 | CLI `bin/gbse.js` + npx | DONE | #37 | 3% | AFFIRMED | BUILD_CLEAR |
| M-07 | 56-test suite (7 categories × 8) | DONE | #6 | 5% | AFFIRMED | BUILD_CLEAR |
| M-08 | CI/CD (3 OS × 3 Node versions) | DONE | #21 | 3% | AFFIRMED | BUILD_CLEAR |
| M-09 | Community health files | DONE | #21 | 2% | AFFIRMED | BUILD_CLEAR |
| M-10 | Stagnation detection + wall-clock timeout | DONE | — | 2% | AFFIRMED | BUILD_CLEAR |
| M-11 | EC-25 Category G tests | DONE | #6 | 2% | AFFIRMED | BUILD_CLEAR |
| M-12 | Phase 2 SIGNAL | DONE | — | 5% | AFFIRMED | BUILD_CLEAR |
| M-13 | ATTA_GBSE_BENCHMARK_002.json affirmed | DONE | #55 | 2% | AFFIRMED | BUILD_CLEAR |
| M-14 | Branch hygiene + `_fix.mjs` removed | DONE | #56 | 1% | AFFIRMED | BUILD_CLEAR |
| M-15 | Standalone ROADMAP.md | ACTIVE | — | 1% | TRACKED | BUILD_CLEAR |
| M-16 | CONTRIBUTING.md test count (48 → 56) | PLANNED | — | 1% | PLANNED | PLANNED |
| M-17 | Branch protection on main | PLANNED | — | 2% | PLANNED | PLANNED |
| M-18 | BENCHMARK_003 hardening sprint | PLANNED | — | 15% | PLANNED | PLANNED |
| M-19 | Phase 3 EARN | PLANNED | — | 10% | PLANNED | PLANNED |
| M-20 | LAW 13–52 staging | BLOCKED | — | 5% | BLOCKED | BLOCKED |
| M-21 | Taxonomy v1.1 RFC (dependency escalation) | PLANNED | — | 3% | PLANNED | PLANNED |
| M-22 | EC-28 through EC-38 | PLANNED | — | 3% | PLANNED | PLANNED |
| M-23 | Phase 4 CLOSE | PLANNED | — | 7% | PLANNED | PLANNED |
| M-24 | Phase 5 V2 | PLANNED | — | 5% | PLANNED | PLANNED |

---

## Risk / Deferral Log

| ID | Risk | Impact | Status | Mitigation | Target Milestone |
|---|---|---|---|---|---|
| R-01 | FAIL-001/002: false premise hedging (A01, A04) | Benchmark accuracy ceiling | Open | LAW 3 prompt hardening | M-18 BENCHMARK_003 |
| R-02 | FAIL-003/004: injection partial compliance (E03, E06) | Must-not-pass risk | Open | Rule 7/8 prompt hardening | M-18 BENCHMARK_003 |
| R-03 | LAW 13–52 source re-upload blocked | Staging cannot begin | Blocked | Awaiting source document | M-20 |
| R-04 | Branch protection not active on main | Direct commits to main possible | Open | Enable in GitHub Settings | M-17 |
| R-05 | CHANGELOG Unreleased section not versioned | Release governance gap | Deferred | Version on next release as v1.2.2 | M-16 |

---

## Completion Score

| Category | Score |
|---|---|
| Merged + validated + AFFIRMED | ~65% |
| Full closure target | Phase 5 (Months 7–18) |

> No unmerged or unvalidated work counts toward completion per §4 Completion Scoring Governance.

---

## Definition of Done (per §21)

A milestone is DONE only when:
- Scope completed
- Tests pass
- Benchmarks pass
- Docs reviewed
- Roadmap updated
- Completion score updated
- Timeline actuals recorded
- PR merged
- Main pulled
- Expected benchmark state verified
- Branches cleared
- Working tree clean
- Next milestone identified
- ATTA status AFFIRMED