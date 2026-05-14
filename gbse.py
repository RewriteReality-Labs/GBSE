"""
GBSE — Great Bifurcation Synthesis Engine
Python Implementation (mirrors src/index.js)

Usage:
    python gbse.py "Your query here"

Requirements:
    pip install anthropic python-dotenv
"""

import os
import re
import sys
import threading
from pathlib import Path
from dataclasses import dataclass
from typing import Optional
import anthropic
from dotenv import load_dotenv

load_dotenv()

ROOT = Path(__file__).parent
PROMPTS = ROOT / "prompts" / "v1"


def load_prompt(name: str) -> str:
    return (PROMPTS / f"{name}.txt").read_text()


SOLVER_PROMPT = load_prompt("solver")
AUDITOR_PROMPT = load_prompt("auditor")
RECONSTRUCTOR_PROMPT = load_prompt("reconstructor")

MODEL = os.getenv("GBSE_MODEL", "claude-sonnet-4-20250514")
# Ceiling is hard-capped at 10 — values above 10 are silently clamped.
MAX_ITERATIONS = min(int(os.getenv("GBSE_MAX_ITERATIONS", "3")), 10)
LOG_LEVEL = os.getenv("GBSE_LOG_LEVEL", "normal")
# Wall-clock timeout per pipeline run (seconds). 0 = disabled. Default: 120 s.
TIMEOUT_SECONDS = int(os.getenv("GBSE_TIMEOUT_MS", "120000")) / 1000

MAX_TOKENS_SOLVER = int(os.getenv("GBSE_MAX_TOKENS_SOLVER", "1024"))
MAX_TOKENS_AUDITOR = int(os.getenv("GBSE_MAX_TOKENS_AUDITOR", "2048"))
MAX_TOKENS_RECONSTRUCTOR = int(os.getenv("GBSE_MAX_TOKENS_RECONSTRUCTOR", "4096"))

# Instantiate client once at module level — not per call.
_client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


@dataclass
class SolverResult:
    answer: str
    failure_modes: list[str]
    raw: str


@dataclass
class AuditResult:
    passed: bool
    findings: list[dict]
    reasoning: str
    raw: str


@dataclass
class FinalResult:
    final_verdict: str
    correction_log: list[str]
    diagnostics: dict
    raw: str


def log(level: str, *args):
    if LOG_LEVEL == "silent":
        return
    if level == "verbose" and LOG_LEVEL != "verbose":
        return
    print(*args)


def call_claude(system_prompt: str, user_message: str, max_tokens: int) -> str:
    message = _client.messages.create(
        model=MODEL,
        max_tokens=max_tokens,
        system=system_prompt,
        messages=[{"role": "user", "content": user_message}],
    )
    return message.content[0].text


def run_solver(query: str, audit_critique: Optional[str] = None) -> SolverResult:
    user_message = (
        f"Query: {query}\n\nPrevious Auditor critique (address every flagged item):\n{audit_critique}"
        if audit_critique
        else f"Query: {query}"
    )
    raw = call_claude(SOLVER_PROMPT, user_message, MAX_TOKENS_SOLVER)

    answer_match = re.search(r"ANSWER:\s*([\s\S]*?)(?=FAILURE_MODES:|$)", raw)
    failure_match = re.search(r"FAILURE_MODES:\s*([\s\S]*?)$", raw)

    answer = answer_match.group(1).strip() if answer_match else raw
    failure_modes = []
    if failure_match:
        failure_modes = [
            m.strip()
            for m in re.split(r"\n\d+\.\s+", failure_match.group(1).strip())
            if m.strip()
        ]

    return SolverResult(answer=answer, failure_modes=failure_modes, raw=raw)


def run_auditor(solver_answer: str) -> AuditResult:
    raw = call_claude(AUDITOR_PROMPT, f"Solver's answer to audit:\n\n{solver_answer}", MAX_TOKENS_AUDITOR)

    passed = "VERDICT: [PASS]" in raw

    findings_match = re.search(r"AUDIT_FINDINGS:\s*([\s\S]*?)(?=VERDICT:|$)", raw)
    findings_raw = findings_match.group(1).strip() if findings_match else ""
    findings = []
    for line in findings_raw.split("\n"):
        if line.strip():
            tag_match = re.search(r"\[(HALLUCINATION|FLUFF|GAP|UNVERIFIED)\]", line)
            findings.append({
                "tag": tag_match.group(1) if tag_match else "UNKNOWN",
                "text": line.strip(),
            })

    reasoning_match = re.search(r"REASONING:\s*([\s\S]*?)$", raw)
    reasoning = reasoning_match.group(1).strip() if reasoning_match else ""

    return AuditResult(passed=passed, findings=findings, reasoning=reasoning, raw=raw)


def run_reconstructor(
    query: str,
    solver_raw: str,
    audit_raw: str,
    iterations: int,
    passed: bool,
) -> FinalResult:
    user_message = (
        f"Original query: {query}\n\n"
        f"Solver's final draft:\n{solver_raw}\n\n"
        f"Auditor's findings:\n{audit_raw}\n\n"
        f"Iterations completed: {iterations}\n"
        f"Audit result: {'[PASS]' if passed else '[FAIL — MAX ITERATIONS REACHED]'}"
    )
    raw = call_claude(RECONSTRUCTOR_PROMPT, user_message, MAX_TOKENS_RECONSTRUCTOR)

    verdict_match = re.search(
        r"\[FINAL VERDICT\]\s*([\s\S]*?)(?=\[SYSTEM DIAGNOSTICS\]|$)", raw
    )
    final_verdict = verdict_match.group(1).strip() if verdict_match else raw

    log_match = re.search(r"\[CORRECTION LOG\]\s*([\s\S]*?)$", raw)
    correction_log = []
    if log_match:
        correction_log = [
            m.strip()
            for m in re.split(r"\n\d+\.\s+", log_match.group(1).strip())
            if m.strip()
        ]

    return FinalResult(
        final_verdict=final_verdict,
        correction_log=correction_log,
        diagnostics={"iterations": iterations, "passed": passed, "model": MODEL},
        raw=raw,
    )


def run_pipeline(query: str, max_iterations: int = MAX_ITERATIONS) -> dict:
    max_iterations = min(max_iterations, 10)  # hard ceiling

    log("normal", "\n─── GBSE PIPELINE START ───────────────────────────────────")
    log("normal", f"Query: {query}\n")

    iterations = 0
    solver_result = None
    audit_result = None
    passed = False
    previous_flags = None  # for stagnation detection
    timed_out = False

    # Wall-clock timeout — a daemon thread fires the flag after TIMEOUT_SECONDS (if > 0).
    _stop_event = threading.Event()
    def _timeout_handler():
        if not _stop_event.wait(timeout=TIMEOUT_SECONDS if TIMEOUT_SECONDS > 0 else None):
            nonlocal timed_out
            timed_out = True
            log("normal", f"\n  → [TIMEOUT] Pipeline exceeded {int(TIMEOUT_SECONDS)} s — aborting.\n")
    if TIMEOUT_SECONDS > 0:
        _timer = threading.Thread(target=_timeout_handler, daemon=True)
        _timer.start()

    while iterations < max_iterations:
        if timed_out:
            break
        iterations += 1
        log("normal", f"[ITERATION {iterations}/{max_iterations}]")

        log("normal", "  → Solver running…")
        solver_result = run_solver(
            query,
            audit_critique=audit_result.raw if (iterations > 1 and audit_result) else None,
        )

        log("normal", "  → Auditor running…")
        audit_result = run_auditor(solver_result.raw)

        passed = audit_result.passed
        log(
            "normal",
            f"  → Audit verdict: {'✓ [PASS]' if passed else '✗ [FAIL]'} — {len(audit_result.findings)} finding(s)\n",
        )

        if passed:
            break

        # Stagnation detection: identical flags on consecutive iterations → break early
        current_flags = ",".join(sorted(f["tag"] for f in audit_result.findings))
        if previous_flags is not None and current_flags == previous_flags:
            log("normal", "  → [STAGNATION DETECTED] Identical flags on consecutive iterations — breaking loop early.\n")
            break
        previous_flags = current_flags

    # Signal timeout thread to stop — pipeline finished before the deadline.
    _stop_event.set()

    log("normal", "  → Reconstructor running…")
    final = run_reconstructor(
        query, solver_result.raw, audit_result.raw, iterations, passed
    )

    log("normal", "\n─── FINAL OUTPUT ───────────────────────────────────────────")
    log("normal", final.raw)
    log("normal", "────────────────────────────────────────────────────────────\n")

    return {
        "query": query,
        "final_verdict": final.final_verdict,
        "correction_log": final.correction_log,
        "diagnostics": {
            "iterations": iterations,
            "passed": passed,
            "findings_count": len(audit_result.findings),
            "model": MODEL,
        },
        "raw": {
            "solver": solver_result.raw,
            "auditor": audit_result.raw,
            "reconstructor": final.raw,
        },
    }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python gbse.py <your query here>")
        sys.exit(1)
    query = " ".join(sys.argv[1:])
    run_pipeline(query)
