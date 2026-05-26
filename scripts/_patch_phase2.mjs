import { readFileSync, writeFileSync } from 'fs';

// 1. Add benchmark:official to package.json
let pkg = JSON.parse(readFileSync('package.json', 'utf8'));
pkg.scripts['benchmark:official'] = 'GBSE_OFFICIAL=true node scripts/benchmark.js --runs=3';
writeFileSync('package.json', JSON.stringify(pkg, null, 2));

// 2. Add provenance + runs support to benchmark.js
let b = readFileSync('scripts/benchmark.js', 'utf8');

const provenanceCode = `
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

b = b.replace(
  'import { fileURLToPath } from "url";',
  'import { fileURLToPath } from "url";\nimport { createHash } from "crypto";\nimport { execSync } from "child_process";'
);

b = b.replace(
  'function safeDivide',
  provenanceCode + '\nfunction safeDivide'
);

// Add provenance to summary
b = b.replace(
  '  const computed = calculateMetrics(successful);',
  '  const computed = calculateMetrics(successful);\n  const provenance = buildProvenance();'
);

b = b.replace(
  '    results,\n  };',
  '    results,\n    provenance,\n  };'
);

// Add --runs support
const runsSupport = `
const RUNS = parseInt(process.argv.find(a => a.startsWith('--runs='))?.split('=')[1] || '1');
const IS_OFFICIAL = !!process.env.GBSE_OFFICIAL;
const OUTPUT_FILE = IS_OFFICIAL ? 'benchmark-results.json' : 'benchmark-results.local.json';
`;

b = b.replace(
  'const RESULTS_FILE = "benchmark-results.json";',
  runsSupport + '\nconst RESULTS_FILE = IS_OFFICIAL ? "benchmark-results.json" : "benchmark-results.local.json";'
);

writeFileSync('scripts/benchmark.js', b);
console.log('Done');