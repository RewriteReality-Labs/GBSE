---
name: GBSE Issue Template
about: Required before any PR. Takes 3 minutes. Prevents 90% of PR rejections.
title: "[CATEGORY] Short description of what you want to change"
labels: ""
assignees: ""
---

## What do you want to change?
<!-- Be specific. "Improve the Auditor" is not specific. "Reduce false [FLUFF] flags on technical jargon" is. -->

## Why does it need to change?
<!-- Describe the observed behavior and why it's wrong. Include an example query that demonstrates the issue. -->

**Example query:**
```
paste your example query here
```

**Current behavior:**
<!-- What does the pipeline currently output? -->

**Expected behavior:**
<!-- What should it output instead? -->

## What category does this fall under?
- [ ] Solver prompt / behavior
- [ ] Auditor prompt / behavior (requires extra scrutiny — No Prompt Softening Rule applies)
- [ ] Reconstructor prompt / behavior
- [ ] Test suite (additions only — never deletions)
- [ ] Infrastructure / scripts
- [ ] Documentation

## Have you run the full test suite?
- [ ] Yes — all 48 tests pass locally

## Does this change affect Auditor hostility?
- [ ] No
- [ ] Yes — I understand this requires explicit justification and a maintainer will review carefully

## Additional context
<!-- Anything else the reviewer should know? Links to related issues? -->
