import json, re, sys
with open('benchmark-results.json', 'r') as f:
    data = json.load(f)
results = data['results']
total = len(results)
passed = 0
failures = []
for res in results:
    verdict = res.get('finalVerdict', "")
    expected = res.get('flagsExpected', 0)
    debatable = len(re.findall(r'\[DEBATABLE\]', verdict))
    raw_flags = any(f in verdict for f in ["[HALLUCINATION]","[FACTUAL_ERROR]","[FALSE_PREMISE]"])
    ok = (not raw_flags) and (debatable >= expected)
    if ok: passed += 1
    else: failures.append({"id": res['id'], "debatable": debatable, "expected": expected})
print(f"Integrity Score: {(passed/total)*100:.2f}%")
print(f"Passed: {passed}/{total}")
print("\nFailures:")
for f in failures[:5]: print(f)

if (passed / total) < 0.90:
    print(f"Failing benchmark: Integrity score is below the 90% threshold.")
    sys.exit(1)
