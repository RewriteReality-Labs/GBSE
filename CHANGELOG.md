# Changelog

## Unreleased

### Fixed
- Exposed the BridgeLayer-facing `runPipeline()` stagnation contract by returning `diagnostics.iterationCount`, `diagnostics.stagnated`, and `diagnostics.stagnationTags`.

## [1.2.1] -- 2026-06-06

### Fixed
- Replaced `process.stdout.write` with `console.log` in `bin/gbse.js` for Windows PowerShell package execution compatibility
- Restored README encoding to clean UTF-8 -- removed BOM and repaired mojibake introduced during PR #37 PowerShell file writes
- Corrected `cli.test.js` missing from README Repository Structure
- Clarified structural test description in Repository Structure section

### Added
- `docs/cases/GBSE_REAL_WORLD_CASE_002.md` -- EC-04 Confident Confabulation case: GBSE blocked an internal false-premise diagnosis before an unnecessary structural fix shipped
- `docs/cases/GBSE_REAL_WORLD_CASE_001.md` -- real-world COD reconciliation audit case
- Category G added to CATEGORY_DESCRIPTIONS in suite.js for EC-25 stale-state reasoning

## [1.2.0] -- 2026-06-05

### Added
- `bin/gbse.js` -- quick-run CLI entry point
- Package `bin` field mapping `gbse` command to `bin/gbse.js`
- `tests/cli.test.js` -- 4 CLI smoke tests, zero API calls
- `.npmignore` -- runtime-only package boundary for npm publish
- Published as `@rewriterealitylabs/gbse` on npm registry

### Fixed
- Renamed package from `gbse` to `@rewriterealitylabs/gbse` -- npm rejected unscoped name as too similar to existing packages
- Corrected `bin` path from `./bin/gbse.js` to `bin/gbse.js` for npm publish validation

### Changed
- README Quickstart updated to reflect published npm package path
- Repository Structure updated to include `bin/` and `cli.test.js`

## [1.2.0] — 2026-05-14

### Fixed
- **Spec sync:** Updated all stale "47 tests" references to 48 across `CONTRIBUTING.md`, `ISSUE_TEMPLATE.md`, `tests/suite.js`, and `tests/pipeline.test.js` header comments.

### Added
- **Iteration ceiling enforcement:** `MAX_ITERATIONS` is now hard-clamped to 10 in both `src/index.js` (`Math.min`) and `gbse.py` (`min()`). Previously the env var was documented as max 10 but never enforced — any integer was accepted.
- **Wall-clock timeout:** `GBSE_TIMEOUT_MS` (default 120 000 ms). Implemented via `AbortController` + `setTimeout` in `src/index.js` and `threading.Event` in `gbse.py`. Set to `0` to disable. Logs `[TIMEOUT]` and aborts the current loop iteration when the deadline fires.
- **`GBSE_TIMEOUT_MS` env var** documented in `.env.example` and README configuration table.
- **Clamp note** added to `GBSE_MAX_ITERATIONS` description in README and `.env.example`.

### Spec (`docs/SPECIFICATION.md`)
- §2.1: Documented the Solver's exactly-3 failure modes rule (previously only in the prompt file).
- §2.2: Clarified that `[UNVERIFIED]` alone does not block `[PASS]` — only `[HALLUCINATION]`, `[FLUFF]`, and `[GAP]` are critical failures.
- §4.1: Added silent-clamp note to `GBSE_MAX_ITERATIONS`.
- §4.5 (new): Wall-clock timeout — env var, default, disable flag, implementation references.

## [1.1.0] — 2026-05-14

### Fixed
- **Critical:** Raised `max_tokens` on Reconstructor from 1024 → 4096 (default). Previous value caused silent truncation of `[FINAL VERDICT]` blocks on complex queries, producing corrupt output that the loop would then retry with the same broken budget. All three roles now have separate, configurable token budgets via env vars.
- **Critical:** Updated `@anthropic-ai/sdk` from `^0.24.0` to `^0.51.0` to match current message format.
- **Critical:** Fixed Jest test script for Windows compatibility. Changed from `node_modules/.bin/jest` (shell script, fails on Windows) to `node --experimental-vm-modules node_modules/jest/bin/jest.js`. Added `--detectOpenHandles` flag.
- **Critical:** Removed junk directory `{src,tests,prompts,docs,scripts,examples}` from repository root.
- **High:** Moved Anthropic client instantiation from inside `runPipeline()` to module level in both `src/index.js` and `gbse.py`. Previous code instantiated a new client on every pipeline call (47 clients during benchmark runs).
- **High:** Moved `import re` from inside functions to module level in `gbse.py`.

### Added
- **Stagnation detection:** The Solver→Auditor loop now breaks early if two consecutive iterations produce identical flag sets. Logs `[STAGNATION DETECTED]`. Implemented in both `src/index.js` and `gbse.py`.
- **Versioned prompts directory:** `prompts/v1/` — prompts moved from flat `prompts/` to `prompts/v1/`. All source files updated to reference new path.
- **`prompts/RFC/`:** Directory for proposed prompt changes under the RFC process.
- **`docs/` directory:** Added `SPECIFICATION.md`, `HALLUCINATION_TAXONOMY.md`, `BENCHMARK_METHODOLOGY.md`.
- **`LICENSE` file:** MIT license text (previously only declared in `package.json`; GitHub requires a file to display the badge).
- **GitHub Actions CI:** `.github/workflows/test.yml` runs `npm test` on push/PR across Ubuntu, Windows, and macOS, on Node 18, 20, and 22.
- **Category F test parity:** Added `F08` — recursive Auditor contradiction scenario. All six categories now have exactly 8 tests each (48 total).
- **Per-role token budget env vars:** `GBSE_MAX_TOKENS_SOLVER`, `GBSE_MAX_TOKENS_AUDITOR`, `GBSE_MAX_TOKENS_RECONSTRUCTOR`.
- **Test suite disclaimer:** `tests/pipeline.test.js` now clearly states these are structural tests with no API calls.
- **Real output example** in README showing a full pipeline run.
- **Configuration table** in README documenting all env vars.

### Changed
- `TOTAL_TESTS` constant updated from 47 → 48.
- Test assertions updated to expect 48 tests and Category F parity of 8.

## [1.0.0] — 2026-05-14

Initial release.
