# Prompts RFC Directory

This directory holds proposed prompt changes that are under the 7-day public comment period required by the RFC process (see CONTRIBUTING.md and docs/SPECIFICATION.md §7).

## Naming Convention

```
RFC-{number}-{scope}-{short-description}.txt
```

Example: `RFC-001-auditor-add-circular-reasoning-detection.txt`

## What Requires an RFC

- Any change to `prompts/v1/auditor.txt` that alters detection behavior
- Any change to the Universal Output Format
- Adding or removing a taxonomy tag
- Modifying iteration ceiling defaults

## What Does NOT Require an RFC

- Typo fixes in prompts (open a normal PR)
- Documentation-only changes

## Process

1. Open an issue titled `[RFC] Your proposal` with the `rfc` label
2. Place your proposed prompt file here as a draft
3. 7-day comment period begins when the issue is opened
4. After comment period, maintainer merges or closes with reasoning
