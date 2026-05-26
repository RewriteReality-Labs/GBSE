import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { runSolver } from "./solver.js";
import { runAuditor } from "./auditor.js";
import { runReconstructor } from "./reconstructor.js";

// Ceiling is hard-capped at 10 — values above 10 are silently clamped.
const MAX_ITERATIONS = Math.min(parseInt(process.env.GBSE_MAX_ITERATIONS || "3", 10), 10);
const LOG_LEVEL = process.env.GBSE_LOG_LEVEL || "normal";
// Wall-clock timeout per pipeline run (ms). 0 = disabled. Default: 120 000 ms.
const TIMEOUT_MS = parseInt(process.env.GBSE_TIMEOUT_MS || "120000", 10);

// Instantiate the client once at module level — not per pipeline call.
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function log(level, ...args) {
  if (level === "silent") return;
  if (level === "verbose" && LOG_LEVEL !== "verbose") return;
  console.log(...args);
}

/**
 * Run the full GBSE pipeline on a query.
 *
 * @param {string} query - The query to verify
 * @param {object} options - Optional overrides
 * @returns {Promise<GBSEResult>}
 */
export async function runPipeline(query, options = {}) {
  const maxIter = Math.min(options.maxIterations || MAX_ITERATIONS, 10);
  const timeoutMs = options.timeoutMs ?? TIMEOUT_MS;

  // Wall-clock timeout — AbortController fires after timeoutMs (if > 0).
  let timeoutId = null;
  const controller = new AbortController();
  if (timeoutMs > 0) {
    timeoutId = setTimeout(() => {
      controller.abort();
      log("normal", `\n  → [TIMEOUT] Pipeline exceeded ${timeoutMs} ms — aborting.\n`);
    }, timeoutMs);
  }

  let iterations = 0;
  let solverResult = null;
  let auditResult = null;
  let passed = false;
  let previousFlags = null; // for stagnation detection

  log("normal", "\n─── GBSE PIPELINE START ───────────────────────────────────");
  log("normal", `Query: ${query}\n`);

  // ── Solver → Auditor loop ─────────────────────────────────────────────────
  while (iterations < maxIter) {
    if (controller.signal.aborted) break;
    iterations++;
    log("normal", `[ITERATION ${iterations}/${maxIter}]`);

    // Solver
    log("normal", "  → Solver running…");
    solverResult = await runSolver(
      client,
      query,
      iterations > 1 ? auditResult?.raw : null
    );
    log("verbose", "\nSOLVER OUTPUT:\n", solverResult.raw);

    // Auditor
    log("normal", "  → Auditor running…");
    auditResult = await runAuditor(client, solverResult.raw);
    log("verbose", "\nAUDITOR OUTPUT:\n", auditResult.raw);

    passed = auditResult.passed;
    log(
      "normal",
      `  → Audit verdict: ${passed ? "✓ [PASS]" : "✗ [FAIL]"} — ${auditResult.findings.length} finding(s)\n`
    );

    if (passed) break;

    // ── Stagnation detection ──────────────────────────────────────────────
    // If this iteration produced the exact same flag set as the previous one,
    // further iterations will not improve the output — break early.
    function normalizeFindingText(text = "") {
  return text.toLowerCase().replace(/\s+/g, " ").slice(0, 120);
}
const currentFlags = auditResult.findings
  .map((f) => f.tag + ":" + normalizeFindingText(f.text || f.raw || ""))
  .sort()
  .join("|");
    if (previousFlags !== null && currentFlags === previousFlags) {
      log("normal", "  → [STAGNATION DETECTED] Identical flags on consecutive iterations — breaking loop early.\n");
      break;
    }
    previousFlags = currentFlags;
  }

  // Clear timeout — pipeline completed before the deadline (or timeout was disabled).
  if (timeoutId !== null) clearTimeout(timeoutId);

  // ── Reconstructor ─────────────────────────────────────────────────────────
  log("normal", "  → Reconstructor running…");
  const finalResult = await runReconstructor(
    client,
    query,
    solverResult.raw,
    auditResult.raw,
    iterations,
    passed
  );

  log("normal", "\n─── FINAL OUTPUT ───────────────────────────────────────────");
  log("normal", finalResult.raw);
  log("normal", "────────────────────────────────────────────────────────────\n");

  return {
    query,
    finalVerdict: finalResult.finalVerdict,
    correctionLog: finalResult.correctionLog,
    diagnostics: {
      iterations,
      passed,
      findingsCount: auditResult.findings.length,
      model: process.env.GBSE_MODEL || "claude-sonnet-4-20250514",
    },
    raw: {
      solver: solverResult.raw,
      auditor: auditResult.raw,
      reconstructor: finalResult.raw,
    },
  };
}

// ── CLI entry point ───────────────────────────────────────────────────────────
if (process.argv[1]?.endsWith("index.js")) {
  const query = process.argv.slice(2).join(" ");
  if (!query) {
    console.error("Usage: node src/index.js <your query here>");
    process.exit(1);
  }
  runPipeline(query).catch(console.error);
}
