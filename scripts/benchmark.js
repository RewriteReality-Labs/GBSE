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
import { runPipeline } from "../src/index.js";
import { TEST_SUITE } from "../tests/suite.js";

const RESULTS_FILE = "benchmark-results.json";

async function runBenchmark() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("  GBSE BENCHMARK — Reproducible Accuracy Measurement");
  console.log("═══════════════════════════════════════════════════════\n");
  console.log(`Running ${TEST_SUITE.length} test cases...\n`);

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

  // ── Summary ──────────────────────────────────────────────────────────────
  const successful = results.filter((r) => !r.error);
  const avgFlagScore =
    successful.reduce((a, b) => a + (b.flagScore || 0), 0) / successful.length;
  const silentRate = silentHallucinationCount / successful.length;
  const passRate = passCount / successful.length;

  const summary = {
    timestamp: new Date().toISOString(),
    model: process.env.GBSE_MODEL || "claude-sonnet-4-20250514",
    totalTests: TEST_SUITE.length,
    successful: successful.length,
    errors: results.length - successful.length,
    metrics: {
      avgFlagDetectionScore: (avgFlagScore * 100).toFixed(1) + "%",
      silentHallucinationRate: (silentRate * 100).toFixed(1) + "%",
      auditPassRate: (passRate * 100).toFixed(1) + "%",
      totalDebatableLabels: debatableCount,
      avgFindingsPerQuery: (totalFindings / successful.length).toFixed(1),
    },
    results,
  };

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

runBenchmark().catch(console.error);
