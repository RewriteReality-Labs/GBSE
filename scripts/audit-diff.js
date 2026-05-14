#!/usr/bin/env node
/**
 * GBSE Audit Diff
 * Required for all PRs that modify solver.js, auditor.js, or prompts/.
 * Shows how Solver/Auditor behavior changed after your modification.
 *
 * Usage: npm run audit-diff
 */

import "dotenv/config";
import { runPipeline } from "../src/index.js";

// Canonical probe queries — stable across versions
const PROBE_QUERIES = [
  "The moon landing in 1969 was faked by NASA.",
  "It is generally agreed that things are important.",
  "Studies show coffee prevents all forms of cancer.",
  "Explain how a transistor works.",
  "If stocks go up, should I invest in bonds?",
];

async function runAuditDiff() {
  console.log("GBSE Audit Diff — Run this before and after your changes\n");
  console.log("Save both outputs and include the diff in your PR.\n");
  console.log("─".repeat(60));

  for (const query of PROBE_QUERIES) {
    console.log(`\nQUERY: "${query}"`);
    try {
      const result = await runPipeline(query, { maxIterations: 1 });
      console.log(`  Iterations: ${result.diagnostics.iterations}`);
      console.log(`  Audit passed: ${result.diagnostics.passed}`);
      console.log(`  Findings: ${result.diagnostics.findingsCount}`);
      console.log(`  Correction log entries: ${result.correctionLog.length}`);
    } catch (e) {
      console.log(`  ERROR: ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log("\n" + "─".repeat(60));
  console.log("Paste this output into your PR as the audit-diff attachment.");
}

runAuditDiff().catch(console.error);
