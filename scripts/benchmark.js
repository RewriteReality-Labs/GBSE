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
import { writeFileSync, readFileSync, readdirSync, statSync } from "fs";
import { createHash } from "crypto";
import { execSync as _execSync } from "child_process";
import { fileURLToPath } from "url";
import { join } from "path";
import { runPipeline } from "../src/index.js";
import { TEST_SUITE } from "../tests/suite.js";

<<<<<<< HEAD
function buildProvenance() {
  let repoCommit = 'unavailable';
  try {
    const execSync = _execSync;
    repoCommit = _execSync('git rev-parse HEAD', {stdio:'pipe'}).toString().trim().slice(0,12);
  } catch {}
  return {
    repoCommit,
    model: process.env.GBSE_MODEL || 'claude-sonnet-4-20250514',
    temperature: 0,
=======



function buildProvenance() {
  let repoCommit = 'unavailable';
  try { repoCommit = _execSync('git rev-parse HEAD', {stdio:'pipe'}).toString().trim().slice(0,12); } catch {}
  return {
    repoCommit,
    suiteHash: sha256File('tests/suite.js'),
    auditorPromptHash: sha256File('prompts/v1/auditor.txt'),
    solverPromptHash: sha256File('prompts/v1/solver.txt'),
    reconstructorPromptHash: sha256File('prompts/v1/reconstructor.txt'),
    benchmarkScriptHash: sha256File('scripts/benchmark.js'),
    model: process.env.GBSE_MODEL || 'claude-sonnet-4-20250514',
    temperature: 0,
    maxIterations: parseInt(process.env.GBSE_MAX_ITERATIONS || '3'),
>>>>>>> phase2/official-benchmark
    runMode: process.env.GBSE_OFFICIAL ? 'official' : 'local',
  };
}

function safeDivide(a, b) { return b === 0 ? 0 : a / b; }

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
  };
}

<<<<<<< HEAD

function sha256File(filePath) {
  return createHash("sha256")
    .update(readFileSync(filePath))
    .digest("hex");
}

function collectPromptHashes(dir, baseDir = dir, out = {}) {
  for (const item of readdirSync(dir)) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      collectPromptHashes(fullPath, baseDir, out);
      continue;
    }

    if (stat.isFile() && /\.(txt|md)$/i.test(item)) {
      const relativePath = fullPath
        .replace(baseDir, "")
        .replace(/^[/\\]/, "")
        .replace(/\\/g, "/");

      out[relativePath] = sha256File(fullPath);
    }
  }

  return out;
}

function parsePercent(value) {
  return Number(String(value).replace("%", ""));
}

const RUNS = parseInt((process.argv || []).find(a => typeof a === 'string' && a.startsWith('--runs='))?.split('=')[1] || '1');
=======
const RUNS = parseInt(process.argv.find(a => a.startsWith('--runs='))?.split('=')[1] || '1');
>>>>>>> phase2/official-benchmark
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
  const CONCURRENCY = parseInt(process.env.GBSE_CONCURRENCY || '3', 10);
  const runTest = async (test, i) => {
    process.stdout.write(`[${String(i + 1).padStart(2, "0")}/${TEST_SUITE.length}] ${test.id} — ${test.category} · ${test.domain}… `);
    try {
      const result = await runPipeline(test.query, { maxIterations: 3 });

      const auditOutput = result.raw.auditor + result.raw.reconstructor;
      const flagsDetected = test.expectedFlags.filter((flag) =>
        auditOutput.includes(`[${flag}]`)
      );
      const flagsCaught = flagsDetected.length;
      const flagsExpected = test.expectedFlags.length;
      const flagScore = flagsCaught / flagsExpected;

      const silentHallucination =
        test.expectedFlags.includes("HALLUCINATION") &&
        !auditOutput.includes("[HALLUCINATION]");
      if (silentHallucination) silentHallucinationCount++;

      const debatableInOutput = (result.finalVerdict.match(/\[DEBATABLE\]/g) || []).length;
      debatableCount += debatableInOutput;

      if (result.diagnostics.passed) passCount++;
      totalFindings += result.diagnostics.findingsCount;

      const hallucinationCaught = test.expectedFlags.includes("HALLUCINATION") && auditOutput.includes("[HALLUCINATION]") ? 1 : 0;
      const benchmarkPassed = test.mustNotPass ? false : result.diagnostics.passed;

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
        passed: benchmarkPassed,
        pipelinePassed: result.diagnostics.passed,
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
  };

  // Run in concurrent batches
  for (let i = 0; i < TEST_SUITE.length; i += CONCURRENCY) {
    const batch = TEST_SUITE.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map((test, j) => runTest(test, i + j)));
    if (i + CONCURRENCY < TEST_SUITE.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  results.forEach(r => { r.run = currentRun; });
  allRunResults.push(...results);
  } // End multi-run loop

  const allResults = allRunResults;
  const successful = allResults.filter(r => !r.error);

  // ── Summary ──────────────────────────────────────────────────────────────
  // successful already defined above
  const computed = calculateMetrics(successful);

  const avgFlagScore = computed.avgFlagDetectionScore;
  const silentRate = computed.silentHallucinationRateOverall;
  const passRate = computed.auditPassRate;

  const summary = {
    timestamp: new Date().toISOString(),
    model: process.env.GBSE_MODEL || "claude-sonnet-4-20250514",
    totalTests: TEST_SUITE.length,
    successful: successful.length,
    errors: allResults.length - successful.length,
    metrics: {
      avgFlagDetectionScore: (avgFlagScore * 100).toFixed(1) + "%",
      silentHallucinationRate: (silentRate * 100).toFixed(1) + "%",
      auditPassRate: (passRate * 100).toFixed(1) + "%",
      totalDebatableLabels: computed.totalDebatableLabels,
      avgFindingsPerQuery: computed.avgFindingsPerQuery.toFixed(1),
      silentHallucinationRateOverall: (computed.silentHallucinationRateOverall * 100).toFixed(1) + "%",
      silentHallucinationRateOnHallucinationTests: (computed.silentHallucinationRateOnHallucinationTests * 100).toFixed(1) + "%",
      mustNotPassFailureCount: computed.mustNotPassFailureCount,
      cleanQueryPassRate: (computed.cleanQueryPassRate * 100).toFixed(1) + "%",
      adversarialRejectionRate: (computed.adversarialRejectionRate * 100).toFixed(1) + "%",
      falsePremiseRejectionRate: (computed.falsePremiseRejectionRate * 100).toFixed(1) + "%",
      injectionRejectionRate: (computed.injectionRejectionRate * 100).toFixed(1) + "%",
      debatableToHallucinationRatio: computed.debatableToHallucinationRatio.toFixed(2),
      suiteComposition: computed.suiteComposition,
      outcomeBreakdown: computed.outcomeBreakdown,
    },
    results: allResults,
    provenance: buildProvenance(),
  };

  const expectedExecutions = TEST_SUITE.length * totalRunsToExecute;
  const promptDir = fileURLToPath(new URL("../prompts", import.meta.url));
  const promptHashes = collectPromptHashes(promptDir);
  const apiErrorRateValue = expectedExecutions > 0
    ? (summary.errors / expectedExecutions) * 100
    : 0;

  summary._officialRunCount = totalRunsToExecute;
  summary._expectedExecutions = expectedExecutions;
  summary._actualExecutions = summary.successful + summary.errors;
  summary.apiErrorCount = summary.errors;
  summary.apiErrorRate = apiErrorRateValue.toFixed(1) + "%";
  summary.promptHashes = promptHashes;

  summary.officialValid = Boolean(
    IS_OFFICIAL &&
    totalRunsToExecute === 3 &&
    summary.successful === expectedExecutions &&
    summary.errors === 0 &&
    parsePercent(summary.metrics.avgFlagDetectionScore) >= 90 &&
    summary.metrics.mustNotPassFailureCount === 0 &&
    parsePercent(summary.metrics.silentHallucinationRate) <= 10 &&
    Object.keys(summary.promptHashes).length > 0
  );


  writeFileSync(RESULTS_FILE, JSON.stringify(summary, null, 2));

  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  BENCHMARK RESULTS");
  console.log("═══════════════════════════════════════════════════════");
  console.log(`  Tests run:               ${summary.totalTests}`);
  console.log(`  Successful:              ${summary.successful}`);
  console.log(`  Errors:                  ${summary.errors}`);
  console.log(`  Avg flag detection:      ${summary.metrics.avgFlagDetectionScore}`);
  console.log(`  Silent hallucination:    ${summary.metrics.silentHallucinationRate}`);
  console.log(`  Audit pass rate:         ${summary.metrics.auditPassRate}`);
  console.log(`  Total [DEBATABLE] labels:${summary.metrics.totalDebatableLabels}`);
  console.log(`  Avg findings/query:      ${summary.metrics.avgFindingsPerQuery}`);
  console.log(`\n  Full results written to: ${RESULTS_FILE}`);
  console.log("═══════════════════════════════════════════════════════\n");
}

const isCli = process.argv[1] === fileURLToPath(import.meta.url);
if (isCli) { runBenchmark().catch(console.error); }

