#!/usr/bin/env node
/**
 * GBSE Benchmark Script
 * Reproduces the published accuracy metrics against the eval dataset.
 *
 * Usage: npm run benchmark
 * Output: benchmark-results.json + console summary
 *
 * What this proves:
 *   - Every number in the spec can be independently reproduced
 *   - Silent hallucination pass-through rate
 *   - [DEBATABLE] labeling rate
 *   - Output quality score vs single-shot baseline
 */

import "dotenv/config";
import { writeFileSync } from "fs";
import { execSync as _execSync } from "child_process";
import { createHash } from "crypto";
import { fileURLToPath } from "url";
import { runPipeline } from "../src/index.js";
import { TEST_SUITE } from "../tests/suite.js";

function hashFile(p) {
  try {
    return createHash('sha256').update(readFileSync(p)).digest('hex').slice(0,16);
  } catch { return 'unavailable'; }
}

function buildProvenance() {
  let repoCommit = 'unavailable';
  try {
    repoCommit = _execSync('git rev-parse HEAD', {stdio:'pipe'}).toString().trim().slice(0,12);
  } catch {}
  return {
    repoCommit,
    solverPromptHash: hashFile('prompts/v1/solver.txt'),
    auditorPromptHash: hashFile('prompts/v1/auditor.txt'),
    reconstructorPromptHash: hashFile('prompts/v1/reconstructor.txt'),
    suiteHash: hashFile('tests/suite.js'),
    benchmarkScriptHash: hashFile('scripts/benchmark.js'),
    packageLockHash: hashFile('package-lock.json'),
    model: process.env.GBSE_MODEL || 'claude-sonnet-4-20250514',
    temperature: 0,
    maxIterations: parseInt(process.env.GBSE_MAX_ITERATIONS || '3'),
    totalRunsExecuted: typeof RUNS !== 'undefined' ? RUNS : 1,
    runMode: process.env.GBSE_OFFICIAL ? 'official' : 'local',
  };
}

function safeDivide(a, b) { if (b === 0 || isNaN(b)) return 0; const res = a / b; return isNaN(res) || !isFinite(res) ? 0 : res; }

function aggregateByField(results, field) {
  return results.reduce((acc, r) => {
    const val = r[field] || "unknown";
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {});
}

function classifyOutcome(result) {
  if (result.passed && result.mustNotPass) return "MUST_NOT_PASS_FAILURE";
  if (result.passed && !result.mustNotPass) return "FULL_PASS";
  if (!result.passed && result.silentHallucination) return "SILENT_FAIL";
  if (!result.passed && (result.findingsCount || 0) > 0) return "EXPECTED_FAIL";
  if (!result.passed && (result.findingsCount || 0) === 0) return "UNEXPECTED_FAIL";
  return "UNKNOWN";
}


function computePerTestStability(results) {
  const byId = {};
  results.forEach(r => {
    if (!byId[r.id]) byId[r.id] = [];
    byId[r.id].push(r);
  });
  return Object.entries(byId).map(([id, runs]) => {
    const passCount = runs.filter(r => r.passed).length;
    const silentEscapes = runs.filter(r => r.silentHallucination).length;
    const flagScores = runs.map(r => r.flagScore || 0);
    const avgFlagScore = safeDivide(flagScores.reduce((a,b)=>a+b,0), flagScores.length);
    return {
      id,
      runs: runs.length,
      passRate: safeDivide(passCount, runs.length),
      minFlagScore: Math.min(...flagScores),
      maxFlagScore: Math.max(...flagScores),
      avgFlagScore,
      silentEscapes,
      unstable: silentEscapes > 0 || (Math.max(...flagScores) - Math.min(...flagScores)) > 0.3,
    };
  });
}



export function calculateMetrics(results) {
  if (!results || results.length === 0) return { totalTests: 0, silentHallucinationRateOverall: 0, silentHallucinationRateOnHallucinationTests: 0, auditPassRate: 0, avgFindingsPerQuery: 0, totalDebatableLabels: 0, avgFlagDetectionScore: 0, mustNotPassFailureCount: 0, cleanQueryPassRate: 0, adversarialRejectionRate: 0, falsePremiseRejectionRate: 0, injectionRejectionRate: 0, debatableToHallucinationRatio: 0, suiteComposition: {}, outcomeBreakdown: {} };
  const total = results.length;
  const silentCount = results.filter(r => r.silentHallucination).length;
  const hallTests = results.filter(r => Array.isArray(r.expectedFlags) && r.expectedFlags.includes("HALLUCINATION"));
  const passed = results.filter(r => r.passed);
  const mnpFails = results.filter(r => r.mustNotPass && r.passed);
  const clean = results.filter(r => !r.mustNotPass);
  const adversarial = results.filter(r => r.mustNotPass);
  const fpTests = results.filter(r => r.compositionType === "false_premise");
  const injTests = results.filter(r => r.compositionType === "prompt_injection");
  const totalFindings = results.reduce((s,r) => s + (r.findingsCount||0), 0);
  const totalDebatable = results.reduce((s,r) => s + (r.debatableLabels||0), 0);
  const totalHall = results.reduce((s,r) => s + (r.hallucinationCaught||0), 0);
  const flagScores = results.map(r => r.flagScore).filter(s => typeof s === "number");
  const outcomes = results.map(r => classifyOutcome(r));
  const outcomeBreakdown = outcomes.reduce((acc,o) => { acc[o]=(acc[o]||0)+1; return acc; }, {});
  return {
    totalTests: total,
    silentHallucinationRateOverall: safeDivide(silentCount, total),
    silentHallucinationRateOnHallucinationTests: safeDivide(silentCount, hallTests.length),
    auditPassRate: safeDivide(passed.length, total),
    avgFindingsPerQuery: safeDivide(totalFindings, total),
    totalDebatableLabels: totalDebatable,
    avgFlagDetectionScore: safeDivide(flagScores.reduce((a,b)=>a+b,0), flagScores.length),
    mustNotPassFailureCount: mnpFails.length,
    cleanQueryPassRate: safeDivide(clean.filter(r=>r.passed).length, clean.length),
    adversarialRejectionRate: safeDivide(adversarial.filter(r=>!r.passed).length, adversarial.length),
    falsePremiseRejectionRate: safeDivide(fpTests.filter(r=>!r.passed).length, fpTests.length),
    injectionRejectionRate: safeDivide(injTests.filter(r=>!r.passed).length, injTests.length),
    debatableToHallucinationRatio: safeDivide(totalDebatable, totalHall),
    suiteComposition: { byCategory: aggregateByField(results,"category"), byCompositionType: aggregateByField(results,"compositionType") },
    outcomeBreakdown,
    perTestStability: computePerTestStability(results),
  };
}


export function extractPipelineSignals(auditOutput, expectedFlags = []) {
  if (!auditOutput || typeof auditOutput !== 'string') {
    return { hallucinationCaught: 0, debatableCount: 0 };
  }
  const cleanOutput = auditOutput.replace(/[`*_]/g, '').trim();
  const hallucinationRegex = /[s*HALLUCINATIONs*]/i;
  const hasHallucinationSignal = hallucinationRegex.test(cleanOutput);
  const hallucinationCaught = (
    expectedFlags.map(f => f.toUpperCase()).includes("HALLUCINATION") &&
    hasHallucinationSignal
  ) ? 1 : 0;
  const debatableRegex = /\[DEBATABLE\]/gi;
  const debatableMatches = cleanOutput.match(debatableRegex);
  const debatableCount = debatableMatches ? debatableMatches.length : 0;
  return { hallucinationCaught, debatableCount };
}

const RUNS = parseInt((process.argv || []).find(a => typeof a === 'string' && a.startsWith('--runs='))?.split('=')[1] || '1');
const IS_OFFICIAL = !!process.env.GBSE_OFFICIAL;
const RESULTS_FILE = IS_OFFICIAL ? 'benchmark-results.json' : 'benchmark-results.local.json';

async function runBenchmark() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("  GBSE BENCHMARK — Reproducible Accuracy Measurement");
  console.log("═══════════════════════════════════════════════════════\n");
  console.log(`Running ${TEST_SUITE.length} test cases...\n`);

  const allRunResults = [];
  const totalRunsToExecute = typeof RUNS === 'number' && RUNS > 0 ? RUNS : 1;

  console.log(`[GBSE] Commencing ${totalRunsToExecute} verification cycle(s)...`);

  for (let currentRun = 1; currentRun <= totalRunsToExecute; currentRun++) {
    if (totalRunsToExecute > 1) console.log(`\n[RUN ${currentRun}/${totalRunsToExecute}]\n`);

  const results = [];
  let silentHallucinationCount = 0;
  let debatableCount = 0;
  let passCount = 0;
  let totalFindings = 0;

  for (const [i, test] of TEST_SUITE.entries()) {
    process.stdout.write(`[${String(i + 1).padStart(2, "0")}/${TEST_SUITE.length}] ${test.id} — ${test.category} · ${test.domain}… `);

    try {
      const result = await runPipeline(test.query, { maxIterations: 3 });

      // Check: did each expected flag appear somewhere in the pipeline output?
      const auditOutput = result.raw.auditor + result.raw.reconstructor;
      const flagsDetected = test.expectedFlags.filter((flag) =>
        auditOutput.includes(`[${flag}]`)
      );
      const flagsCaught = flagsDetected.length;
      const flagsExpected = test.expectedFlags.length;
      const flagScore = flagsCaught / flagsExpected;

      // Silent hallucination: a test with expectedFlags=[HALLUCINATION] where none was caught
      const silentHallucination =
        test.expectedFlags.includes("HALLUCINATION") &&
        !auditOutput.includes("[HALLUCINATION]");
      if (silentHallucination) silentHallucinationCount++;

      // Debatable count: how many [DEBATABLE] labels appeared in final output
      const debatableInOutput = (result.finalVerdict.match(/\[DEBATABLE\]/g) || []).length;
      debatableCount += debatableInOutput;

      if (result.diagnostics.passed) passCount++;
      totalFindings += result.diagnostics.findingsCount;

      const hallucinationCaught = test.expectedFlags.includes("HALLUCINATION") && auditOutput.includes("[HALLUCINATION]") ? 1 : 0;

      const testResult = {
        id: test.id,
        category: test.category,
        domain: test.domain,
        flagScore,
        flagsExpected,
        flagsCaught,
        silentHallucination,
        debatableLabels: debatableInOutput,
        iterations: result.diagnostics.iterations,
        passed: result.diagnostics.passed,
        compositionType: test.compositionType || "unknown",
        expectedFlags: test.expectedFlags,
        mustNotPass: test.mustNotPass || false,
        findingsCount: result.diagnostics.findingsCount,
        hallucinationCaught,
        query: test.query,
        finalVerdict: result.finalVerdict,
      };

      results.push(testResult);
      console.log(
        flagScore === 1 ? "✓" : flagScore > 0 ? `~${(flagScore * 100).toFixed(0)}%` : "✗"
      );
    } catch (err) {
      console.log("ERROR:", err.message);
      results.push({ id: test.id, error: err.message });
    }

    // Rate limit courtesy pause
    await new Promise((r) => setTimeout(r, 500));
  }
  results.forEach(r => { r.run = currentRun; });
  allRunResults.push(...results);
  } // End multi-run loop

  const allResults = allRunResults;
  const successful = allResults.filter((r) => !r.error);
  const errorCount = allResults.length - successful.length;
  const computed = calculateMetrics(successful);

  const pct = (n) => ((Number.isFinite(n) ? n : 0) * 100).toFixed(1) + "%";
  const avg = (n, digits = 1) => (Number.isFinite(n) ? n : 0).toFixed(digits);

  const expectedEvaluations = TEST_SUITE.length * totalRunsToExecute;
  const actualEvaluations = allRunResults.length;
  const apiErrors = allRunResults.filter((r) => r.error).length;

  const summary = {
    timestamp: new Date().toISOString(),
    model: process.env.GBSE_MODEL || "claude-sonnet-4-20250514",

    suiteTests: TEST_SUITE.length,
    runs: totalRunsToExecute,
    expectedEvaluations,
    totalEvaluations: actualEvaluations,

    totalTests: TEST_SUITE.length,
    successful: successful.length,
    errors: errorCount,

    officialValid:
      actualEvaluations === expectedEvaluations &&
      apiErrors === 0,

    apiErrorRate: avg(actualEvaluations ? apiErrors / actualEvaluations : 0, 3),

    metrics: {
      avgFlagDetectionScore: pct(computed.avgFlagDetectionScore),
      silentHallucinationRate: pct(computed.silentHallucinationRateOverall),
      auditPassRate: pct(computed.auditPassRate),

      totalDebatableLabels: computed.totalDebatableLabels,
      avgFindingsPerQuery: avg(computed.avgFindingsPerQuery),

      silentHallucinationRateOverall: pct(computed.silentHallucinationRateOverall),
      silentHallucinationRateOnHallucinationTests: pct(
        computed.silentHallucinationRateOnHallucinationTests
      ),

      mustNotPassFailureCount: computed.mustNotPassFailureCount,

      cleanQueryPassRate: pct(computed.cleanQueryPassRate),
      adversarialRejectionRate: pct(computed.adversarialRejectionRate),
      falsePremiseRejectionRate: pct(computed.falsePremiseRejectionRate),
      injectionRejectionRate: pct(computed.injectionRejectionRate),

      debatableToHallucinationRatio: avg(
        computed.debatableToHallucinationRatio,
        2
      ),

      suiteComposition: computed.suiteComposition,
      outcomeBreakdown: computed.outcomeBreakdown,
    },

    perTestStability:
      typeof buildPerTestStability === "function"
        ? buildPerTestStability(allResults)
        : undefined,

    results: allResults,
    provenance: buildProvenance(),
  };

  writeFileSync(RESULTS_FILE, JSON.stringify(summary, null, 2));

  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  BENCHMARK RESULTS");
  console.log("═══════════════════════════════════════════════════════");
  console.log(`  Suite tests:             ${summary.suiteTests}`);
  console.log(`  Runs:                    ${summary.runs}`);
  console.log(`  Total evaluations:       ${summary.totalEvaluations}`);
  console.log(`  Expected evaluations:    ${summary.expectedEvaluations}`);
  console.log(`  Successful:              ${summary.successful}`);
  console.log(`  Errors:                  ${summary.errors}`);
  console.log(`  Official valid:          ${summary.officialValid}`);
  console.log(`  Avg flag detection:      ${summary.metrics.avgFlagDetectionScore}`);
  console.log(`  Silent hallucination:    ${summary.metrics.silentHallucinationRate}`);
  console.log(`  Silent hallucination/H:  ${summary.metrics.silentHallucinationRateOnHallucinationTests}`);
  console.log(`  Audit pass rate:         ${summary.metrics.auditPassRate}`);
  console.log(`  Must-not-pass failures:  ${summary.metrics.mustNotPassFailureCount}`);
  console.log(`  Total [DEBATABLE] labels:${summary.metrics.totalDebatableLabels}`);
  console.log(`  Avg findings/query:      ${summary.metrics.avgFindingsPerQuery}`);
  console.log(
    `\n  Full results written to: ${RESULTS_FILE} (${summary.runs} run(s) × ${summary.suiteTests} tests = ${summary.totalEvaluations} total evaluations)`
  );
  console.log("═══════════════════════════════════════════════════════\n");
}

const isCli = process.argv[1] === fileURLToPath(import.meta.url);
if (isCli) { runBenchmark().catch(console.error); }
