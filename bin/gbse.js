#!/usr/bin/env node

import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config as loadEnv } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));

if (process.env.GBSE_DISABLE_DOTENV !== '1') {
  loadEnv({ path: resolve(__dirname, '..', '.env') });
}

const HELP = [
  '',
  'GBSE Quick Run - Adversarial AI Verification',
  '',
  'Usage:',
  '  node bin/gbse.js "<claim>"',
  '  npm exec --package "github:RewriteReality-Labs/GBSE" -- gbse "<claim>"',
  '',
  'Options:',
  '  --help, -h    Show this message',
  '',
  'Example:',
  '  node bin/gbse.js "The Eiffel Tower was built in 1952 and stands in Berlin."',
  '',
  'Note:',
  '  Quick-run output is not an ATTA benchmark affirmation.',
  '  Requires ANTHROPIC_API_KEY in environment or .env file.',
  ''
].join('\n');

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(HELP);
  process.exit(0);
}

if (args.length === 0) {
  process.stderr.write(HELP + "\n");
  process.exit(1);
}

if (!process.env.ANTHROPIC_API_KEY) {
  process.stderr.write("\nError: ANTHROPIC_API_KEY is not set.\n\n");
  process.stderr.write("Set it before running:\n\n");
  process.stderr.write("  Linux/macOS:  export ANTHROPIC_API_KEY=\"your_key_here\"\n");
  process.stderr.write("  PowerShell:   set ANTHROPIC_API_KEY in your environment\n");
  process.stderr.write("  .env file:    ANTHROPIC_API_KEY=your_key_here\n\n");
  process.exit(1);
}

const claim = args.join(' ');

console.log('\n--- GBSE Quick Run -----------------------------------------');
console.log('\nInput claim:\n' + claim);

(async () => {
  try {
    const { runPipeline } = await import('../src/index.js');
    const result = await runPipeline(claim);

    const diagnostics = result?.diagnostics ?? {};
    const verdict = diagnostics.auditVerdict ?? diagnostics.verdict ?? 'UNKNOWN';
    const iterations = diagnostics.iterations ?? '?';
    const findings = diagnostics.findingsCount ?? diagnostics.findings?.length ?? '?';

    console.log("\n--- Result -------------------------------------------------\n");
    console.log("\nAudit verdict:  " + verdict + "\n");
    console.log("Iterations:     " + iterations + "\n");
    console.log("Findings:       " + findings + "\n");
    console.log("\n------------------------------------------------------------\n");
    console.log("Quick-run output is not an ATTA benchmark affirmation.\n\n");
    process.exit(0);
  } catch (err) {
    process.stderr.write("\nPipeline error: " + (err?.message ?? err) + "\n");
    process.exit(2);
  }
})();
