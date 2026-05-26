import { readFileSync, writeFileSync } from 'fs';

let c = readFileSync('scripts/benchmark.js', 'utf8');

// Add fileURLToPath import
c = c.replace(
  `import { writeFileSync } from "fs";`,
  `import { writeFileSync } from "fs";
import { fileURLToPath } from "url";`
);

// Add utilities after last import
const utils = [
  '',
  'function safeDivide(a, b) { return b === 0 ? 0 : a / b; }',
  '',
  'function aggregateByField(results, field) {',
  '  return results.reduce((acc, r) => {',
  '    const val = r[field] || "unknown";',
  '    acc[val] = (acc[val] || 0) + 1;',
  '    return acc;',
  '  }, {});',
  '}',
  '',
  'function classifyOutcome(result) {',
  '  if (result.passed && result.mustNotPass) return "MUST_NOT_PASS_FAILURE";',
  '  if (result.passed && !result.mustNotPass) return "FULL_PASS";',
  '  if (!result.passed && result.silentHallucination) return "SILENT_FAIL";',
  '  if (!result.passed && (result.findingsCount || 0) > 0) return "EXPECTED_FAIL";',
  '  if (!result.passed && (result.findingsCount || 0) === 0) return "UNEXPECTED_FAIL";',
  '  return "UNKNOWN";',
  '}',
  '',
  'export function calculateMetrics(results) {',
  '  if (!results || results.length === 0) return { totalTests: 0, silentHallucinationRateOverall: 0, silentHallucinationRateOnHallucinationTests: 0, auditPassRate: 0, avgFindingsPerQuery: 0, totalDebatableLabels: 0, avgFlagDetectionScore: 0, mustNotPassFailureCount: 0, cleanQueryPassRate: 0, adversarialRejectionRate: 0, falsePremiseRejectionRate: 0, injectionRejectionRate: 0, debatableToHallucinationRatio: 0, suiteComposition: {}, outcomeBreakdown: {} };',
  '  const total = results.length;',
  '  const silentCount = results.filter(r => r.silentHallucination).length;',
  '  const hallTests = results.filter(r => Array.isArray(r.expectedFlags) && r.expectedFlags.includes("HALLUCINATION"));',
  '  const passed = results.filter(r => r.passed);',
  '  const mnpFails = results.filter(r => r.mustNotPass && r.passed);',
  '  const clean = results.filter(r => !r.mustNotPass);',
  '  const adversarial = results.filter(r => r.mustNotPass);',
  '  const fpTests = results.filter(r => r.compositionType === "false_premise");',
  '  const injTests = results.filter(r => r.compositionType === "prompt_injection");',
  '  const totalFindings = results.reduce((s,r) => s + (r.findingsCount||0), 0);',
  '  const totalDebatable = results.reduce((s,r) => s + (r.debatableLabels||0), 0);',
  '  const totalHall = results.reduce((s,r) => s + (r.hallucinationCaught||0), 0);',
  '  const flagScores = results.map(r => r.flagScore).filter(s => typeof s === "number");',
  '  const outcomes = results.map(r => classifyOutcome(r));',
  '  const outcomeBreakdown = outcomes.reduce((acc,o) => { acc[o]=(acc[o]||0)+1; return acc; }, {});',
  '  return {',
  '    totalTests: total,',
  '    silentHallucinationRateOverall: safeDivide(silentCount, total),',
  '    silentHallucinationRateOnHallucinationTests: safeDivide(silentCount, hallTests.length),',
  '    auditPassRate: safeDivide(passed.length, total),',
  '    avgFindingsPerQuery: safeDivide(totalFindings, total),',
  '    totalDebatableLabels: totalDebatable,',
  '    avgFlagDetectionScore: safeDivide(flagScores.reduce((a,b)=>a+b,0), flagScores.length),',
  '    mustNotPassFailureCount: mnpFails.length,',
  '    cleanQueryPassRate: safeDivide(clean.filter(r=>r.passed).length, clean.length),',
  '    adversarialRejectionRate: safeDivide(adversarial.filter(r=>!r.passed).length, adversarial.length),',
  '    falsePremiseRejectionRate: safeDivide(fpTests.filter(r=>!r.passed).length, fpTests.length),',
  '    injectionRejectionRate: safeDivide(injTests.filter(r=>!r.passed).length, injTests.length),',
  '    debatableToHallucinationRatio: safeDivide(totalDebatable, totalHall),',
  '    suiteComposition: { byCategory: aggregateByField(results,"category"), byCompositionType: aggregateByField(results,"compositionType") },',
  '    outcomeBreakdown,',
  '  };',
  '}',
].join('\n');

c = c.replace(
  'import { TEST_SUITE } from "../tests/suite.js";',
  'import { TEST_SUITE } from "../tests/suite.js";\n' + utils
);

// Add new fields to testResult
c = c.replace(
  '      const testResult = {',
  '      const hallucinationCaught = test.expectedFlags.includes("HALLUCINATION") && auditOutput.includes("[HALLUCINATION]") ? 1 : 0;\n\n      const testResult = {'
);

c = c.replace(
  '        query: test.query,',
  '        compositionType: test.compositionType || "unknown",\n        expectedFlags: test.expectedFlags,\n        mustNotPass: test.mustNotPass || false,\n        findingsCount: result.diagnostics.findingsCount,\n        hallucinationCaught,\n        query: test.query,'
);

// Replace summary metrics
c = c.replace(
  '  const summary = {',
  '  const computed = calculateMetrics(successful);\n\n  const summary = {'
);

c = c.replace(
  "      avgFindingsPerQuery: (totalFindings / successful.length).toFixed(1),",
  `      avgFindingsPerQuery: (totalFindings / successful.length).toFixed(1),
      silentHallucinationRateOverall: (computed.silentHallucinationRateOverall * 100).toFixed(1) + "%",
      silentHallucinationRateOnHallucinationTests: (computed.silentHallucinationRateOnHallucinationTests * 100).toFixed(1) + "%",
      mustNotPassFailureCount: computed.mustNotPassFailureCount,
      cleanQueryPassRate: (computed.cleanQueryPassRate * 100).toFixed(1) + "%",
      adversarialRejectionRate: (computed.adversarialRejectionRate * 100).toFixed(1) + "%",
      falsePremiseRejectionRate: (computed.falsePremiseRejectionRate * 100).toFixed(1) + "%",
      injectionRejectionRate: (computed.injectionRejectionRate * 100).toFixed(1) + "%",
      debatableToHallucinationRatio: computed.debatableToHallucinationRatio.toFixed(2),
      suiteComposition: computed.suiteComposition,
      outcomeBreakdown: computed.outcomeBreakdown,`
);

// CLI guard
c = c.replace(
  'runBenchmark().catch(console.error);',
  'const isCli = process.argv[1] === fileURLToPath(import.meta.url);\nif (isCli) { runBenchmark().catch(console.error); }'
);

writeFileSync('scripts/benchmark.js', c);
console.log('Done');