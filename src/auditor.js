import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const AUDITOR_PROMPT = readFileSync(
  join(__dirname, "../prompts/RFC/auditor_v3_2_candidate.txt"),  // rfc: candidate prompt
  "utf8"
);

/**
 * Flag types the Auditor may issue.
 */
export const FLAGS = {
  HALLUCINATION: "HALLUCINATION",
  FLUFF: "FLUFF",
  GAP: "GAP",
  UNVERIFIED: "UNVERIFIED",
};

/**
 * GBSE Hostile Auditor — adversarially reviews the Solver's answer.
 *
 * @param {Anthropic} client - Anthropic SDK instance
 * @param {string} solverAnswer - The Solver's raw output
 * @returns {Promise<{passed: boolean, partialPass: boolean, hardBlock: boolean, findings: Array, reasoning: string, raw: string}>}
 */
export async function runAuditor(client, solverAnswer) {
  const maxTokens = parseInt(process.env.GBSE_MAX_TOKENS_AUDITOR || "2048", 10);

  const message = await client.messages.create({
    model: process.env.GBSE_MODEL || "claude-sonnet-4-20250514",
    max_tokens: maxTokens,
    system: AUDITOR_PROMPT,
    messages: [
      {
        role: "user",
        content: `Solver's answer to audit:\n\n${solverAnswer}`,
      },
    ],
  });

  const raw = message.content[0].text;

  // ── Verdict parsing ───────────────────────────────────────────────────────
  //
  // v1 format:  VERDICT: [PASS] or VERDICT: [FAIL]
  // v3.2 format adds: VERDICT: [PARTIAL_PASS] and VERDICT: [HARD BLOCK]
  //
  // ^\s* tolerates harmless leading whitespace the model may emit before
  // the header — without it, two spaces before VERDICT: silently breaks parsing.
  //
  // Line-anchored (^, multiline flag) prevents false positives from VERDICT
  // tokens appearing anywhere in reasoning body text.
  //
  // Backward compatible: v1 prompts only emit [PASS]/[FAIL], both still match.

  const verdictLineMatch = raw.match(/^\s*VERDICT:\s*\[([^\]]+)\]/m);
  const verdictToken = verdictLineMatch ? verdictLineMatch[1] : "";

  const passed      = verdictToken === "PASS";
  const partialPass = verdictToken === "PARTIAL_PASS";
  const hardBlock   = verdictToken === "HARD BLOCK";

  // ── Findings parsing ──────────────────────────────────────────────────────
  //
  // v1 format:  AUDIT_FINDINGS: (underscore, VERDICT comes after findings)
  // v3.2 format: AUDIT FINDINGS: (space, VERDICT comes before — verdict-first mandate)
  //
  // Strategy: try v3.2 pattern first (space header, terminate at REASONING:
  // or end of input). Fall back to v1 pattern (underscore, terminate at VERDICT:).
  //
  // ^\s* on both the section header and the lookahead terminator tolerates
  // leading whitespace without changing match semantics.
  //
  // (?![\s\S]) is the correct JS idiom for end-of-input (\Z is not valid in JS).

  let findingsRaw = "";

  const findingsV32 = raw.match(/^\s*AUDIT FINDINGS:\s*([\s\S]*?)(?=^\s*REASONING:|(?![\s\S]))/m);
  if (findingsV32) {
    findingsRaw = findingsV32[1].trim();
  } else {
    const findingsV1 = raw.match(/AUDIT_FINDINGS:\s*([\s\S]*?)(?=VERDICT:|$)/);
    if (findingsV1) {
      findingsRaw = findingsV1[1].trim();
    }
  }

  const findings = parseFinding(findingsRaw);

  // ── Reasoning parsing ─────────────────────────────────────────────────────
  //
  // ^\s* tolerates leading whitespace before REASONING: header.
  // Greedy ([\s\S]*) captures the full block to end of string.
  // Non-greedy + multiline $ would stop at the first line break.

  const reasoningMatch = raw.match(/^\s*REASONING:\s*([\s\S]*)/m);
  const reasoning = reasoningMatch ? reasoningMatch[1].trim() : "";

  return { passed, partialPass, hardBlock, findings, reasoning, raw };
}

/**
 * Parse the Auditor's findings block into structured objects.
 *
 * Recognizes the four audit tags used by both v1 and v3.2 prompts:
 * HALLUCINATION, FLUFF, GAP, UNVERIFIED.
 *
 * Note: [DEBATABLE] is a Reconstructor output label, not an Auditor finding
 * tag — it does not appear in AUDIT FINDINGS and is not included here.
 */
function parseFinding(raw) {
  const lines = raw.split("\n").filter((l) => l.trim());
  return lines.map((line) => {
    const tagMatch = line.match(/\[(HALLUCINATION|FLUFF|GAP|UNVERIFIED)\]/);
    return {
      tag: tagMatch ? tagMatch[1] : "UNKNOWN",
      text: line.trim(),
    };
  });
}

/**
 * Count findings by tag type.
 */
export function countFindings(findings) {
  return findings.reduce((acc, f) => {
    acc[f.tag] = (acc[f.tag] || 0) + 1;
    return acc;
  }, {});
}
