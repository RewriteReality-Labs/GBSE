# Security Policy

## Supported versions

| Version | Supported |
|---|---|
| `v1.0.0-atta.affirmed` | Active |
| `main` | Active |

## Reporting a vulnerability

Do not open a public GitHub issue for security vulnerabilities.

Report privately via GitHub Security Advisories:
https://github.com/RewriteReality-Labs/GBSE/security/advisories/new

Response target: 72 hours for acknowledgement.
Resolution target: 14 days for confirmed vulnerabilities.

## Scope

In scope:
- Pipeline logic errors that produce incorrect `PASS` verdicts
- Benchmark scoring manipulation via crafted inputs
- Prompt injection paths that bypass audit controls
- Output-schema manipulation that hides failure tags
- Benchmark-result tampering
- Secrets exposure
- Dependency vulnerabilities in `package.json` or `requirements.txt`

Out of scope:
- Theoretical attacks with no practical reproduction path
- Rate limiting or quota issues on the Anthropic API
- Requests to weaken benchmark gates or bypass ATTA governance

## Benchmark governance

Security fixes must not silently alter benchmark scoring, prompt behavior, taxonomy tags, or ATTA gate conditions. If a security fix changes benchmark behavior, the change must be documented and validated.
