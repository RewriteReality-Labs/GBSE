import { readFileSync, writeFileSync } from 'fs';

let b = readFileSync('scripts/benchmark.js', 'utf8');
b = b.replace('results,\r\n  };', 'results,\r\n    provenance: buildProvenance(),\r\n  };');
writeFileSync('scripts/benchmark.js', b);

const check = readFileSync('scripts/benchmark.js', 'utf8');
console.log('provenance in summary:', check.includes('provenance: buildProvenance()'));
