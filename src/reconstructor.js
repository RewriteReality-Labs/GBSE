import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RECONSTRUCTOR_PROMPT = readFileSync(
  join(__dirname, "../prompts/RFC/reconstructor_v3_2.txt"),  // rfc: candidate prompt
  "utf8"
);

/**
 * GBSE Reconstructor — synthesizes verified final output from Solver draft + Auditor critique.
 *
 * @param {Anthropic} client - Anthropic SDK instance
 * @param {string} query - Original user query
 * @param {string} solverAnswer - Solver's final draft
 * @param {string} auditRaw - Full Auditor output
 * @param {number} iterations - Number of Solver→Auditor cycles completed
 * @param {boolean} passed - Whether the Auditor issued [PASS]
 * @returns {Promise<{finalVerdict: string, correctionLog: string[], diagnostics: object, raw: string}>}
 */
export async function runReconstructor(
  client,
  query,
  solverAnswer,
  auditRaw,
  iterations,
  passed
) {
  // Reconstructor receives full solver + auditor output — needs largest budget.
  // Configurable via GBSE_MAX_TOKENS_RECONSTRUCTOR; default 4096.
  const maxTokens = parseInt(process.env.GBSE_MAX_TOKENS_RECONSTRUCTOR || "4096", 10);

  const userMessage = `Original query: ${query}

Solver's final draft:
${solverAnswer}

Auditor's findings:
${auditRaw}

Iterations completed: ${iterations}
Audit result: ${passed ? "[PASS]" : "[FAIL — MAX ITERATIONS REACHED]"}`;

  const message = await client.messages.create({
    model: process.env.GBSE_MODEL || "claude-sonnet-4-20250514",
    max_tokens: maxTokens,
    system: RECONSTRUCTOR_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const raw = message.content[0].text;

  // Parse final verdict block
  const verdictMatch = raw.match(
    /\[FINAL VERDICT\]\s*([\s\S]*?)(?=\[SYSTEM DIAGNOSTICS\]|$)/
  );
  const finalVerdict = verdictMatch ? verdictMatch[1].trim() : raw;

  // Parse correction log
  const logMatch = raw.match(/\[CORRECTION LOG\]\s*([\s\S]*?)$/);
  const correctionLog = logMatch
    ? logMatch[1]
        .trim()
        .split(/\n\d+\.\s+/)
        .filter(Boolean)
        .map((s) => s.trim())
    : [];

  const diagnostics = {
    iterations,
    passed,
    model: process.env.GBSE_MODEL || "claude-sonnet-4-20250514",
  };

  return { finalVerdict, correctionLog, diagnostics, raw };
}
