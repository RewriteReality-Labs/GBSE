#!/usr/bin/env node

import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config as loadEnv } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));

if (process.env.GBSE_DISABLE_DOTENV !== '1') {
  loadEnv({ path: resolve(__dirname, '..', '.env') });
}

const HELP = `
GBSE Quick Run — Adversarial AI Verification

Usage:
  node bin/gbse.js "<claim>"
  npx github:RewriteReality-Labs/GBSE "<claim>"

Options:
  --help    Show this message

Example:
  node bin/gbse.js "The Eiffel Tower was built in 1952 and stands in Berlin."

Note:
  Quick-run output is not an ATTA benchmark affirmation.
  Requires ANTHROPIC_API_KEY in environment or .env file.
`;

const args = process.argv.slice(2);

if (args.length === 0) {
  process.stderr.write(HELP + '\n');
  process.exit(1);
}

if (args[0] === '--help') {
  process.stdout.write(HELP + '\n');
  process.exit(0);
}

if (!process.env.ANTHROPIC_API_KEY) {
  process.stderr.write('\nError: ANTHROPIC_API_KEY is not set.\n\n');
  process.stderr.write('Set it before running:\n\n');
  process.stderr.write('  Linux/macOS:  export ANTHROPIC_API_KEY="your_key_here"\n');
  process.stderr.write('  PowerShell:   $env:ANTHROPIC_API_KEY="your_key_here"\n');
  process.stderr.write('  .env file:    ANTHROPIC_API_KEY=your_key_here\n\n');
  process.exit(1);
}

const claim = args.join(' ');

process.stdout.write('\n─── GBSE Quick Run ─────────────────────────────────────────\n');
process.stdout.write('\nInput claim:\n' + claim + '\n\n');

(async () => {
try {
  const { runPipeline } = await import('../src/index.js');
  const result = await runPipeline(claim);

  const verdict    = result.diagnostics?.auditVerdict  ?? 'UNKNOWN';
  const iterations = result.diagnostics?.iterations    ?? '?';
  const findings   = result.diagnostics?.findingsCount ?? '?';

  process.stdout.write('\nAudit verdict:  ' + verdict + '\n');
  process.stdout.write('Iterations:     ' + iterations + '\n');
  process.stdout.write('Findings:       ' + findings + '\n');
  process.stdout.write('\n────────────────────────────────────────────────────────────\n');
  process.stdout.write('Quick-run output is not an ATTA benchmark affirmation.\n\n');
  process.exit(0);

} catch (err) {
  process.stderr.write('\nPipeline error: ' + (err?.message ?? err) + '\n');
  process.exit(2);
}
})();

