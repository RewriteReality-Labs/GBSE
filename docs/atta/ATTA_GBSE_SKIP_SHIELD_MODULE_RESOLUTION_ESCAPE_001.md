# ATTA_GBSE_SKIP_SHIELD_MODULE_RESOLUTION_ESCAPE_001

## Status

PROPOSED

## Date

2026-06-07

## Flag

GBSE_SKIP_SHIELD_MODULE_RESOLUTION_ESCAPE

## Summary

Skipped tests hid a second failure. BridgeLayer first showed `39 passed · 4 skipped · 0 failed`, so the visible blocker appeared to be only the missing GBSE stagnation return contract.

After GBSE exposed `stagnated`, `stagnationTags`, and `iterationCount`, the skipped BridgeLayer tests were unskipped and a second issue appeared:

`Cannot find module '../src/index.js'`

The test was trying to mock a GBSE module path that did not physically exist inside BridgeLayer.

## Root Cause

GBSE did not flag this earlier because the failing path was hidden behind `it.skip()`.

Skipped test bodies were not audited deeply enough for missing mocked module paths, unresolved imports, or impossible test setup.

## Corrective Rule

When GBSE sees `it.skip`, `test.skip`, or `describe.skip`, it must inspect the skipped block body before allowing a repo to score above 92-94.

If a skipped test contains `jest.doMock()` for a module path that may not exist, GBSE must flag:

`MOCKED_MODULE_RESOLUTION_UNCONFIRMED`

## Scoring Rule

Skipped tests present: max score `92-94`.

Skipped tests explained but body not audited: verdict `BUILD_WITH_RISKS`.

Skipped tests unskipped and passing cleanly: verdict may advance to `BUILD_CLEAR`.

## Final Lesson

The first visible blocker was the GBSE return contract.

The hidden blocker was the BridgeLayer Jest module-resolution boundary.

Both had to be fixed before BridgeLayer could honestly move to:

`43 passed · 0 skipped · 0 failed`

## Verdict

AFFIRMED FOR INTERNAL GBSE CORRECTION LOG

This record should later become a benchmark test.
