## Summary

<!-- One sentence: what does this PR change? -->

## Type of change

- [ ] Bug fix
- [ ] Feature / new capability
- [ ] Prompt change: solver / auditor / reconstructor
- [ ] Benchmark or scoring change
- [ ] Documentation only
- [ ] Dependency update

## ATTA impact

**Does this PR affect benchmark gate conditions?** YES / NO

If YES:
- Gates affected:
- New pre-declared conditions committed to ATTA record before this run: YES / NO
- Link to updated ATTA record commit:

## Test evidence

<!-- Paste npm test output confirming no regression -->

## Prompt version affected

<!-- solver / auditor / reconstructor / none -->

## Checklist

- [ ] `npm test` passes clean
- [ ] No benchmark overfitting: no test-case-specific rules added to prompts
- [ ] If benchmark gates changed: ATTA record updated before run
- [ ] If output format changed: RFC committed to `prompts/RFC/`
- [ ] Affirmed release tags were not moved or recreated