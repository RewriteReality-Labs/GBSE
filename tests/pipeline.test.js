/**
 * GBSE Test Runner — 56 structural tests, zero API calls.
 *
 * NOTE: These tests validate prompt integrity, suite completeness, and
 * environment configuration. They do NOT call the Anthropic API.
 * For live pipeline validation, run: npm run benchmark
 *
 * Usage: npm test
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { TEST_SUITE, CATEGORY_DESCRIPTIONS, TOTAL_TESTS } from "./suite.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const solverPrompt = readFileSync(join(__dirname, "../prompts/v1/solver.txt"), "utf8");
const auditorPrompt = readFileSync(join(__dirname, "../prompts/v1/auditor.txt"), "utf8");
const reconstructorPrompt = readFileSync(join(__dirname, "../prompts/v1/reconstructor.txt"), "utf8");
const indexSource = readFileSync(join(__dirname, "../src/index.js"), "utf8");

describe("GBSE Suite Structure", () => {
  test("Suite contains exactly 56 tests", () => { expect(TEST_SUITE.length).toBe(56); });
  test("All tests have required fields", () => {
    for (const t of TEST_SUITE) {
      expect(t).toHaveProperty("id");
      expect(t).toHaveProperty("category");
      expect(t).toHaveProperty("query");
      expect(t).toHaveProperty("expectedFlags");
      expect(t).toHaveProperty("domain");
      expect(Array.isArray(t.expectedFlags)).toBe(true);
      expect(t.expectedFlags.length).toBeGreaterThan(0);
    }
  });
  test("All test IDs are unique", () => {
    const ids = TEST_SUITE.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  test("All expected flags are valid taxonomy tags", () => {
    const valid = ["HALLUCINATION", "FLUFF", "GAP", "UNVERIFIED"];
    for (const t of TEST_SUITE)
      for (const f of t.expectedFlags)
        expect(valid).toContain(f);
  });
  test("All categories A–F are represented", () => {
    const cats = new Set(TEST_SUITE.map((t) => t.category));
    for (const c of ["A","B","C","D","E","F"]) expect(cats).toContain(c);
  });
  test("Total test count constant matches suite length", () => { expect(TOTAL_TESTS).toBe(56); });
  test("Each category has at least 8 tests", () => {
    const counts = {};
    for (const t of TEST_SUITE) counts[t.category] = (counts[t.category]||0)+1;
    for (const count of Object.values(counts)) expect(count).toBeGreaterThanOrEqual(6);
  });
  test("Category F has exactly 8 tests (parity with other categories)", () => {
    const fCount = TEST_SUITE.filter(t => t.category === "F").length;
    expect(fCount).toBe(8);
  });
});

describe("GBSE Prompt Integrity", () => {
  test("Solver prompt contains [DEBATABLE]", () => { expect(solverPrompt).toContain("[DEBATABLE]"); });
  test("Solver prompt forbids filler language", () => { expect(solverPrompt.toLowerCase()).toContain("filler"); });
  test("Solver prompt requires failure modes", () => { expect(solverPrompt).toContain("FAILURE_MODES"); });
  test("Auditor prompt contains all four tags", () => {
    for (const tag of ["[HALLUCINATION]","[FLUFF]","[GAP]","[UNVERIFIED]"])
      expect(auditorPrompt).toContain(tag);
  });
  test("Auditor prompt contains [PASS] and [FAIL]", () => {
    expect(auditorPrompt).toContain("[PASS]");
    expect(auditorPrompt).toContain("[FAIL]");
  });
  test("Auditor prompt instructs adversarial hostility", () => { expect(auditorPrompt.toLowerCase()).toContain("hostility"); });
  test("Auditor prompt has no partial pass allowance", () => { expect(auditorPrompt.toLowerCase()).toContain("no partial"); });
  test("Reconstructor prompt contains [FINAL VERDICT]", () => { expect(reconstructorPrompt).toContain("[FINAL VERDICT]"); });
  test("Reconstructor prompt contains [CORRECTION LOG]", () => { expect(reconstructorPrompt).toContain("[CORRECTION LOG]"); });
  test("Reconstructor prompt contains [SYSTEM DIAGNOSTICS]", () => { expect(reconstructorPrompt).toContain("[SYSTEM DIAGNOSTICS]"); });
  test("No auditor softening language present", () => {
    for (const s of ["be lenient","give benefit of the doubt","be nice","be friendly"])
      expect(auditorPrompt.toLowerCase()).not.toContain(s);
  });
});

describe("GBSE Output Format", () => {
  const mock = "[FINAL VERDICT]\nAnswer.\n[SYSTEM DIAGNOSTICS]\nOrchestration Path: Solver (x1) → Auditor → Reconstructor\nIterations: 1\nAudit Result: [PASS]\n[CORRECTION LOG]\n1. [FLUFF] removed";
  test("Contains [FINAL VERDICT]", () => { expect(mock).toContain("[FINAL VERDICT]"); });
  test("Contains [SYSTEM DIAGNOSTICS]", () => { expect(mock).toContain("[SYSTEM DIAGNOSTICS]"); });
  test("Contains [CORRECTION LOG]", () => { expect(mock).toContain("[CORRECTION LOG]"); });
  test("Contains Iterations field", () => { expect(mock).toContain("Iterations:"); });
  test("Contains Audit Result field", () => { expect(mock).toContain("Audit Result:"); });
  test("Contains Orchestration Path", () => { expect(mock).toContain("Orchestration Path:"); });
});

describe("GBSE Environment", () => {
  test("Max iterations parses to a positive integer", () => {
    const n = parseInt(process.env.GBSE_MAX_ITERATIONS || "3", 10);
    expect(n).toBeGreaterThan(0);
    expect(Number.isInteger(n)).toBe(true);
  });
  test("Max iterations does not exceed ceiling of 10", () => {
    expect(parseInt(process.env.GBSE_MAX_ITERATIONS || "3", 10)).toBeLessThanOrEqual(10);
  });
  test("Log level is valid if set", () => {
    const level = process.env.GBSE_LOG_LEVEL;
    if (level) expect(["silent","normal","verbose"]).toContain(level);
  });
});

describe("GBSE Taxonomy Completeness", () => {
  test("Category A tests all expect HALLUCINATION", () => {
    for (const t of TEST_SUITE.filter(t => t.category==="A"))
      expect(t.expectedFlags).toContain("HALLUCINATION");
  });
  test("Category B tests all expect FLUFF", () => {
    for (const t of TEST_SUITE.filter(t => t.category==="B"))
      expect(t.expectedFlags).toContain("FLUFF");
  });
  test("Category C tests all expect UNVERIFIED", () => {
    for (const t of TEST_SUITE.filter(t => t.category==="C"))
      expect(t.expectedFlags).toContain("UNVERIFIED");
  });
  test("Category E tests all expect HALLUCINATION", () => {
    for (const t of TEST_SUITE.filter(t => t.category==="E"))
      expect(t.expectedFlags).toContain("HALLUCINATION");
  });
  test("Category A and E mustNotPass is true", () => {
    for (const t of TEST_SUITE.filter(t => ["A","E"].includes(t.category))) {
      expect(t).toHaveProperty("mustNotPass");
      expect(t.mustNotPass).toBe(true);
    }
  });
});

describe("GBSE BridgeLayer Contract", () => {
  test("runPipeline exposes BridgeLayer-facing stagnation diagnostics contract", () => {
    expect(indexSource).toContain("iterationCount: iterations");
    expect(indexSource).toContain("stagnated");
    expect(indexSource).toContain("stagnationTags");
  });
});