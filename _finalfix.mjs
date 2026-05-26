import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

// Fix package.json
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
pkg.scripts['benchmark:official'] = 'GBSE_OFFICIAL=true node scripts/benchmark.js --runs=3';
writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('FIXED: package.json');

// Fix auditor.txt
let a = readFileSync('prompts/v1/auditor.txt', 'utf8');
if (!a.includes('FINDING THRESHOLD')) {
  a += `

FINDING THRESHOLD:
Before issuing any tag, test: "Would a domain expert consider
this a genuine factual error or editorial preference?"
If editorial preference — do not tag.
If genuine factual error — tag with specific claim and reason.
This rule does not reduce adversarial intensity on factual
claims. It prevents noise from formatting and phrasing
judgments that inflate finding counts without improving accuracy.`;
  writeFileSync('prompts/v1/auditor.txt', a);
  console.log('FIXED: auditor.txt');
}

// Fix benchmark.js
let b = readFileSync('scripts/benchmark.js', 'utf8');

if (!b.includes('buildProvenance')) {
  b = b.replace(
    'function safeDivide',
    `function buildProvenance() {
  let repoCommit = 'unavailable';
  try {
    const { execSync } = await import('child_process');
    repoCommit = execSync('git rev-parse HEAD', {stdio:'pipe'}).toString().trim().slice(0,12);
  } catch {}
  return {
    repoCommit,
    model: process.env.GBSE_MODEL || 'claude-sonnet-4-20250514',
    temperature: 0,
    runMode: process.env.GBSE_OFFICIAL ? 'official' : 'local',
  };
}

function safeDivide`
  );
  console.log('FIXED: benchmark.js provenance');
}

if (!b.includes('--runs=')) {
  b = b.replace(
    'const RESULTS_FILE = "benchmark-results.json";',
    `const RUNS = parseInt(process.argv.find(a => a.startsWith('--runs='))?.split('=')[1] || '1');
const IS_OFFICIAL = !!process.env.GBSE_OFFICIAL;
const RESULTS_FILE = IS_OFFICIAL ? 'benchmark-results.json' : 'benchmark-results.local.json';`
  );
  console.log('FIXED: benchmark.js runs + local output');
}

if (!b.includes('provenance: buildProvenance')) {
  b = b.replace(
    '    results,\n  };',
    '    results,\n    provenance: buildProvenance(),\n  };'
  );
  console.log('FIXED: benchmark.js provenance in summary');
}

writeFileSync('scripts/benchmark.js', b);
console.log('All done.');