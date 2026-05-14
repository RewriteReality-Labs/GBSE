import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const AUDITOR_PROMPT = readFileSync(
  join(__dirname, "../prompts/v1/auditor.txt"),
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
 * @returns {Promise<{passed: boolean, findings: Array, reasoning: string, raw: string}>}
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

  // Parse verdict
  const passed = raw.includes("VERDICT: [PASS]");

  // Parse findings
  const findingsMatch = raw.match(/AUDIT_FINDINGS:\s*([\s\S]*?)(?=VERDICT:|$)/);
  const findingsRaw = findingsMatch ? findingsMatch[1].trim() : "";
  const findings = parseFinding(findingsRaw);

  // Parse reasoning
  const reasoningMatch = raw.match(/REASONING:\s*([\s\S]*?)$/);
  const reasoning = reasoningMatch ? reasoningMatch[1].trim() : "";

  return { passed, findings, reasoning, raw };
}

/**
 * Parse the Auditor's findings block into structured objects.
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
