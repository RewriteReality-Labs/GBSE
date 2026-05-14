# Contributing to GBSE

Thank you for contributing. These rules exist to protect the pipeline's integrity. Read them once — they prevent 90% of PR rejections.

---

## The Inviolable Rule

**No PR that reduces the Auditor's adversarial intensity will ever be merged.**

This is not negotiable. If your change makes the Auditor more lenient, more friendly, or less likely to issue [FAIL], it will be rejected without review. This rule has no exceptions.

---

## Before You Write Code

1. **Open an issue first.** Use `ISSUE_TEMPLATE.md`. Takes 3 minutes.
2. **Confirm the issue exists.** Run the relevant test case and paste the output.
3. **Check existing issues.** Your problem may already be tracked.

---

## Pull Request Gates

All four gates must pass before requesting review:

| Gate | Requirement |
|------|-------------|
| **1 — Tests** | All 48 tests pass locally (`npm test`). CI must also be green. A red CI is an automatic [FAIL]. |
| **2 — Audit Diff** | Run `npm run audit-diff` before and after your change. Attach both outputs showing what changed. |
| **3 — No Prompt Softening** | If you modified `prompts/auditor.txt`, explain why the change does not reduce audit severity. |
| **4 — Changelog** | Update `CHANGELOG.md` with what your change catches differently. |

---

## Commit Format

```
type(scope): short description

Types: feat, fix, test, docs, refactor, chore
Scopes: solver, auditor, reconstructor, prompts, tests, scripts, docs

Examples:
  feat(solver): add domain detection for legal queries
  fix(auditor): correct [GAP] detection for multi-step reasoning
  test(suite): add 3 new Category E injection attempts
  docs(readme): clarify benchmark methodology
```

---

## RFC Process

The following changes require a written RFC with a 7-day public comment period before merge:

- Adding or removing a tag from the Hallucination Taxonomy
- Changing the Universal Output Format
- Modifying the Recursive Correction Protocol defaults
- Any change to the iteration ceiling logic

To open an RFC: create an issue titled `[RFC] Your proposal` and label it `rfc`.

---

## Review SLA

- Issues: initial response within 48 hours
- PRs: full review within 7 days

This is a contract with contributors, not a goal.

---

## Questions

Open an issue. Do not email directly for code questions — public issues help everyone.
