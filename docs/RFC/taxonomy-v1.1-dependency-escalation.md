# RFC: Taxonomy v1.1 - Dependency Escalation

Status: Proposed / RFC
Target file if adopted later: docs/HALLUCINATION_TAXONOMY.md
Active benchmark law changed now: No
Applies retroactively to ATTA_GBSE_BENCHMARK_002: No

## Summary

This RFC proposes a new hallucination and audit-failure class:

Dependency Escalation

Dependency Escalation occurs when a claim is evaluated as locally plausible while relying on an upstream claim, source, assumption, or transformation that remains unresolved, unsupported, contradicted, or unverified.

The core failure is not merely that one claim is wrong. The failure is that unresolved dependency state is allowed to flow downstream without being escalated.

## Why This RFC Exists

A benchmark can correctly catch direct hallucinations while still missing dependency-based failures.

Example structure:

- Claim A: unsupported or unresolved
- Claim B: depends on Claim A
- Claim B: appears correct when viewed alone
- Auditor: passes Claim B because it does not inspect unresolved parent state

This creates a false sense of verification. The child claim may look clean, but its foundation is unstable.

## Proposed Escape Class

### Dependency Escalation

A claim, conclusion, verdict, score, or reconstruction output is passed or softened despite relying on an unresolved upstream dependency.

## Detection Rule

If a claim depends on another claim that is unresolved, unsupported, contradicted, missing, or weakly matched, then the dependent claim cannot receive a clean pass.

The dependent claim must be tagged as one of:

- DEPENDENCY_UNRESOLVED
- DEPENDENCY_ESCALATION
- MANUAL_REVIEW_REQUIRED

## Minimum Auditor Behavior

The Auditor should ask:

1. What upstream claim does this claim rely on?
2. Has that upstream claim been verified?
3. If not verified, was the uncertainty escalated?
4. Did the Reconstructor preserve the unresolved state, or did it smooth it into a confident conclusion?

If the unresolved state is smoothed into confidence, the output fails.

## Proposed Tag

[DEPENDENCY_ESCALATION]

## Example

Input claim set:

- C1: Invoice total is reconciled.
- C2: Cheque settlement confirms invoice payment.
- C3: All delivered orders are settled.

If C1 is unresolved, then C2 and C3 cannot pass cleanly even if their local arithmetic appears plausible.

Correct verdict:

- C1: UNRESOLVED
- C2: DEPENDENCY_ESCALATION
- C3: DEPENDENCY_ESCALATION

Incorrect verdict:

- C1: UNRESOLVED
- C2: PASS
- C3: PASS

## Non-Retroactive Rule

This RFC must not be inserted into docs/HALLUCINATION_TAXONOMY.md until it is explicitly promoted.

Promotion requires:

1. implementation in the Auditor
2. benchmark cases covering dependency escalation
3. passing tests
4. a new benchmark run under the updated taxonomy
5. clear versioning that separates v1.0 benchmark results from v1.1 benchmark results

## Integrity Boundary

ATTA_GBSE_BENCHMARK_002 remains evaluated under the active taxonomy that existed during its execution.

This RFC documents proposed future law. It does not rewrite past law.
