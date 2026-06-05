# Correction Log Sample Output

Status: Public-safe illustrative sample
Contains proprietary data: No
Contains customer/order/cheque identifiers: No

## Purpose

This file shows the expected shape of a GBSE correction log without exposing private operational data.

It demonstrates the key behavioral proof pattern:

1. claim is extracted
2. auditor rejects or flags the claim
3. correction is applied
4. pipeline is re-run
5. final verdict is issued only after correction

A pipeline that only passes is not a verification system. A pipeline that blocks plausible-but-wrong claims before affirmation is.

## Sample Correction Log

GBSE_CORRECTION_LOG_SAMPLE_001

Domain:
Financial reconciliation workbook

Claim count:
30

First run:
Score: 90.0%
Claims verified: 27 / 30
Formula errors: 0
Silent escapes: 0

Flags:

C10 - Integer precision laundering
Stated: 1,533,126
Source-computed: 1,533,125
Gap: 1

C11 - Integer precision laundering
Stated: 1,534,314
Source-computed: 1,534,313
Gap: 1

C18 - Float display escape
Stated: 300
Source-computed: 299.96
Gap: 0.04

Correction:
Rounded display values were replaced with source-exact values across all affected workbook locations.

Second run:
Score: 100.0%
Claims verified: 30 / 30
Formula errors: 0
Silent escapes: 0

Final verdict:
AFFIRMED

## Interpretation

The important signal is not that the final score reached 100%.

The important signal is that the system first refused to affirm plausible but technically wrong claims, required correction, and only then passed the artifact.

## Disclosure Boundary

This sample is intentionally synthetic and public-safe.

Do not include:

- customer names
- order IDs
- tracking numbers
- invoice identifiers
- cheque identifiers
- bank references
- raw COD amounts from live business files
- proprietary ledger rows
