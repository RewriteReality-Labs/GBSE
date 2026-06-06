# GBSE_REAL_WORLD_CASE_002

**Case title:** npx Silent Output — GBSE Self-Audit  
**Date:** 2026-06-06  
**Status:** CLOSED — Root cause confirmed, fix applied  
**Author:** RewriteReality Labs  
**ATTA record:** Not applicable — documentation case, no benchmark run required  

---

## Case Summary

GBSE was used to audit its own bug hypothesis. A claim about the root cause of a silent output failure in `npx @rewriterealitylabs/gbse` was submitted to the pipeline. The Auditor correctly flagged the claim as a false premise. The verified root cause was entirely different from the original hypothesis.

This case demonstrates GBSE operating against its own engineering team's assumptions — the primary use case the architecture was designed for.

---

## The Symptom

After publishing `@rewriterealitylabs/gbse@1.2.0` to npm, the following command produced no output on Windows PowerShell:

```
npx @rewriterealitylabs/gbse --help
```

Exit code: `0`  
Stdout: empty  
Stderr: empty  

The same command executed correctly when called directly:

```
node bin/gbse.js --help
```

Output: full help text, exit 0.

---

## The Initial Hypothesis

Based on prior debugging attempts across multiple sessions, the working hypothesis was:

> `process.stdout.write` is silently dropped by npm's `.cmd` wrapper when executing ESM bin scripts on Windows PowerShell.

Several fix attempts were made based on this hypothesis:

1. Wrapped top-level `await` in an async IIFE — no effect
2. Replaced `process.stdout.write` with `console.log` — no effect
3. Removed BOM from `bin/gbse.js` — fixed a separate syntax error, did not fix silent output
4. Attempted `pathToFileURL` for dynamic import path — not implemented, hypothesis rejected first

---

## The GBSE Audit

Before implementing the `pathToFileURL` fix, the hypothesis was submitted to the GBSE pipeline as a claim:

**Claim submitted:**
```
npx @rewriterealitylabs/gbse produces no output on Windows PowerShell 
because process.stdout.write is silently dropped by npm's .cmd wrapper 
when executing ESM bin scripts
```

**Pipeline execution:**
```
[ITERATION 1/3]
  → Solver running…
  → Auditor running…
  → Audit verdict: ✓ [PASS] — 2 finding(s)
  → Reconstructor running…
```

**GBSE verdict:**
```
[HALLUCINATION] — "process.stdout.write is silently dropped by npm's 
.cmd wrapper when executing ESM bin scripts" — correctly identified 
as false premise and rejected

[UNVERIFIED] — Technical claims about npm wrapper implementation and 
ESM behavior — appropriately labeled as requiring verification
```

**Reconstructor output:**
```
The specific claim that process.stdout.write is silently dropped by 
npm's .cmd wrapper when executing ESM bin scripts cannot be verified 
without examining the actual package behavior, npm wrapper 
implementation, and testing the specific interaction.

Verification required:
1. Execute the package with output capture to confirm the behavior
2. Examine the npm-generated .cmd wrapper and the bin script
3. Test on different shells and operating systems
```

---

## The Verification Steps — Prescribed by GBSE

Following the Reconstructor's output exactly:

**Step 1 — Output capture from within repo directory:**
```
npx @rewriterealitylabs/gbse@1.2.1 --help 2>&1 | Out-File npx-output-capture.txt
```
Result: empty file, exit 0.

**Step 2 — Examine .cmd wrapper:**
```
Get-Content "$env:APPDATA\npm\gbse.cmd"
```
Result: file not found — no global .cmd wrapper exists.

**Step 3 — Check npx cache:**
```
Get-ChildItem "$env:LOCALAPPDATA\npm-cache\_npx" -Recurse -Filter "gbse.js"
```
Result: empty — npx cache has nothing.

**Step 4 — Test from outside the repo directory:**
```
cd C:\Users\ATTA\Desktop
npx @rewriterealitylabs/gbse@1.2.1 --help
```
Result:
```
Need to install the following packages:
@rewriterealitylabs/gbse@1.2.1
Ok to proceed? (y) y

GBSE Quick Run - Adversarial AI Verification
Usage:
  node bin/gbse.js "<claim>"
...
exit: 0
```

**Package works correctly from outside the repo directory.**

---

## Root Cause — Confirmed

**Local package resolution interference.**

When `npx` is executed from inside the repository directory, npm's resolution layer detects a local `package.json` with the name `@rewriterealitylabs/gbse`. It resolves the package locally rather than fetching from the registry. The local execution path produces no output due to the resolution context conflict.

This is not a `process.stdout.write` issue.  
This is not a `.cmd` wrapper issue.  
This is not an ESM issue.  
This is not a BOM issue.

It is a local package name collision between the repo's own `package.json` and the npx invocation target.

---

## EC Classification

**EC-04: Confident Confabulation**

The engineering team diagnosed from assumption rather than verified source. Multiple fix attempts were made against an unverified hypothesis. GBSE caught this before the final incorrect fix (`pathToFileURL`) was implemented and published.

This is operationally significant — GBSE prevented a wasted PR and a publish of a structural change that would not have fixed the actual problem.

---

## Fix Applied

**Documentation only.** No code change required.

The correct usage instruction for developers running from inside the repo:

```bash
# From outside the repo directory
npx @rewriterealitylabs/gbse "your claim here"

# Or from inside the repo, use node directly
node bin/gbse.js "your claim here"
```

---

## Correction Log

| # | Tag | Claim | Action |
|---|---|---|---|
| 1 | `[HALLUCINATION]` | `process.stdout.write` silently dropped by `.cmd` wrapper | Rejected — false premise, no evidence |
| 2 | `[UNVERIFIED]` | npm wrapper + ESM interaction as root cause | Labeled DEBATABLE — required direct testing |

---

## Lessons

**1. GBSE's prescribed verification steps were correct.**  
The Reconstructor output told the team exactly what to test. Following those steps led directly to the root cause in four diagnostic commands.

**2. The hypothesis was wrong before the first fix attempt.**  
`console.log` vs `process.stdout.write` is irrelevant when the process is not being executed from the registry at all.

**3. The pipeline prevented a wasted structural change.**  
`pathToFileURL` was about to be implemented and published as `1.2.2`. That fix would have had zero effect on the actual problem. GBSE stopped it.

**4. Self-auditing works.**  
Submitting the engineering team's own hypothesis to GBSE produced a cleaner diagnosis than any manual debugging session.

---

## Data Integrity

- Zero proprietary data published
- No user data involved
- All commands run against public npm registry
- API key exposed during session — rotated immediately after each exposure

---

*RewriteReality Labs · GBSE · github.com/RewriteReality-Labs/GBSE*
