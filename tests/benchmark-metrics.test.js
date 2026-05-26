import { calculateMetrics } from "../scripts/benchmark.js";

describe("benchmark metric calculations", () => {

  test("silent hallucination denominator uses hallucination-expected tests only", () => {
    const r = [
      { id: "A01", expectedFlags: ["HALLUCINATION"], silentHallucination: true, passed: true },
      { id: "B01", expectedFlags: ["FLUFF"], silentHallucination: false, passed: false },
    ];
    const m = calculateMetrics(r);
    expect(m.silentHallucinationRateOnHallucinationTests).toBe(1.0);
    expect(m.silentHallucinationRateOverall).toBe(0.5);
  });

  test("mustNotPass failures counted correctly", () => {
    const r = [
      { id: "A01", mustNotPass: true, passed: true },
      { id: "A02", mustNotPass: true, passed: false },
      { id: "B01", mustNotPass: false, passed: true },
    ];
    expect(calculateMetrics(r).mustNotPassFailureCount).toBe(1);
  });

  test("zero division does not crash", () => {
    const m = calculateMetrics([]);
    expect(m.totalTests).toBe(0);
    expect(m.silentHallucinationRateOverall).toBe(0);
    expect(m.silentHallucinationRateOnHallucinationTests).toBe(0);
  });

  test("debatableToHallucinationRatio is correct", () => {
    const r = [{ debatableLabels: 6, hallucinationCaught: 2 }];
    expect(calculateMetrics(r).debatableToHallucinationRatio).toBe(3.0);
  });

  test("suite composition aggregates correctly", () => {
    const r = [
      { category: "A", compositionType: "false_premise" },
      { category: "A", compositionType: "false_premise" },
      { category: "E", compositionType: "prompt_injection" },
    ];
    const m = calculateMetrics(r);
    expect(m.suiteComposition.byCategory.A).toBe(2);
    expect(m.suiteComposition.byCompositionType.false_premise).toBe(2);
  });

  test("outcome breakdown identifies all types", () => {
    const r = [
      { passed: true, mustNotPass: true },
      { passed: true, mustNotPass: false },
      { passed: false, silentHallucination: true },
      { passed: false, findingsCount: 2 },
      { passed: false, findingsCount: 0 },
    ];
    const m = calculateMetrics(r);
    expect(m.outcomeBreakdown.MUST_NOT_PASS_FAILURE).toBe(1);
    expect(m.outcomeBreakdown.FULL_PASS).toBe(1);
    expect(m.outcomeBreakdown.SILENT_FAIL).toBe(1);
    expect(m.outcomeBreakdown.EXPECTED_FAIL).toBe(1);
    expect(m.outcomeBreakdown.UNEXPECTED_FAIL).toBe(1);
  });

});