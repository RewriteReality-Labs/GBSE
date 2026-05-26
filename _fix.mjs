import { readFileSync, writeFileSync } from 'fs';

// FIX 1 — suite.js: add validation block if missing
let suite = readFileSync('tests/suite.js', 'utf8');
if (!suite.includes('REQUIRED.forEach')) {
  suite += `
const TOTAL_TESTS = 48;
if (typeof TEST_SUITE !== 'undefined' && TEST_SUITE.length !== TOTAL_TESTS) {
  throw new Error("Suite length: expected " + TOTAL_TESTS + ", got " + TEST_SUITE.length);
}
if (typeof TEST_SUITE !== 'undefined') {
  const REQUIRED = ["id","category","domain","query","expectedFlags","mustNotPass","compositionType"];
  TEST_SUITE.forEach(t => {
    REQUIRED.forEach(f => {
      if (t[f] === undefined) throw new Error("Test " + t.id + " missing: " + f);
    });
  });
}`;
  writeFileSync('tests/suite.js', suite);
  console.log('FIXED: suite.js validation block');
}

// FIX 2 — auditor.txt: add FINDING THRESHOLD and verify ANTI-PEDANTRY
let auditor = readFileSync('prompts/v1/auditor.txt', 'utf8');
if (!auditor.includes('FINDING THRESHOLD')) {
  auditor += `

FINDING THRESHOLD:
Before issuing any tag, test: "Would a domain expert consider
this a genuine factual error or editorial preference?"
If editorial preference — do not tag.
If genuine factual error — tag with specific claim and reason.
This rule does not reduce adversarial intensity on factual
claims. It prevents noise from formatting and phrasing
judgments that inflate finding counts without improving accuracy.`;
  writeFileSync('prompts/v1/auditor.txt', auditor);
  console.log('FIXED: auditor.txt FINDING THRESHOLD');
}
if (!auditor.includes('ANTI-PEDANTRY')) {
  console.log('WARN: ANTI-PEDANTRY not found in auditor.txt — check manually');
}

// FIX 3 — benchmark.js: add provenance, runs support, local output path
let bench = readFileSync('scripts/benchmark.js', 'utf8');

if (!bench.includes('buildProvenance')) {
  const provenance = `
import { createHash } from 'crypto';
import { execSync } from 'child_process';

function hashFile(p) {
  try { return createHash('sha256').update(readFileSync(p)).digest('hex').slice(0,12); }
  catch { return 'unavailable'; }
}

function buildProvenance() {
  let repoCommit = 'unavailable';
  try { repoCommit = execSync('git rev-parse HEAD', {stdio:'pipe'}).toString().trim().slice(0,12); } catch {}
  return {
    repoCommit,
    suiteHash: hashFile('tests/suite.js'),
    auditorPromptHash: hashFile('prompts/v1/auditor.txt'),
    solverPromptHash: hashFile('prompts/v1/solver.txt'),
    reconstructorPromptHash: hashFile('prompts/v1/reconstructor.txt'),
    benchmarkScriptHash: hashFile('scripts/benchmark.js'),
    model: process.env.GBSE_MODEL || 'claude-sonnet-4-20250514',
    temperature: 0,
    maxIterations: parseInt(process.env.GBSE_MAX_ITERATIONS || '3'),
    runMode: process.env.GBSE_OFFICIAL ? 'official' : 'local',
  };
}
`;
  bench = bench.replace(
    'function safeDivide',
    provenance + '\nfunction safeDivide'
  );
  console.log('FIXED: benchmark.js provenance block');
}

if (!bench.includes('--runs=')) {
  bench = bench.replace(
    'const RESULTS_FILE = "benchmark-results.json";',
    `const RUNS = parseInt(process.argv.find(a => a.startsWith('--runs='))?.split('=')[1] || '1');
const IS_OFFICIAL = !!process.env.GBSE_OFFICIAL;
const RESULTS_FILE = IS_OFFICIAL ? 'benchmark-results.json' : 'benchmark-results.local.json';`
  );
  console.log('FIXED: benchmark.js runs support + local output path');
}

if (!bench.includes('provenance,')) {
  bench = bench.replace(
    '    results,\n  };',
    '    results,\n    provenance: buildProvenance(),\n  };'
  );
  console.log('FIXED: benchmark.js provenance in summary');
}

writeFileSync('scripts/benchmark.js', bench);

console.log('');
console.log('All fixes applied. Run npm test to verify.');