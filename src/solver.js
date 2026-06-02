import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOLVER_PROMPT = readFileSync(
  join(__dirname, "../prompts/RFC/solver_v2_2.txt"),  // rfc: candidate prompt
  "utf8"
);

/**
 * GBSE Solver — generates a best-possible answer with self-labeled uncertainty.
 *
 * @param {Anthropic} client - Anthropic SDK instance
 * @param {string} query - The user's query
 * @param {string|null} auditCritique - Previous audit output for recursive correction (null on first run)
 * @returns {Promise<{answer: string, failureModes: string[], raw: string}>}
 */
export async function runSolver(client, query, auditCritique = null) {
  const maxTokens = parseInt(process.env.GBSE_MAX_TOKENS_SOLVER || "1024", 10);

  const userMessage = auditCritique
    ? `Query: ${query}\n\nPrevious Auditor critique (address every flagged item):\n${auditCritique}`
    : `Query: ${query}`;

  const message = await client.messages.create({
    model: process.env.GBSE_MODEL || "claude-sonnet-4-20250514",
    max_tokens: maxTokens,
    system: SOLVER_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const raw = message.content[0].text;

  // Parse structured output
  const answerMatch = raw.match(/ANSWER:\s*([\s\S]*?)(?=FAILURE_MODES:|$)/);
  const failureMatch = raw.match(/FAILURE_MODES:\s*([\s\S]*?)$/);

  const answer = answerMatch ? answerMatch[1].trim() : raw;
  const failureModes = failureMatch
    ? failureMatch[1]
        .trim()
        .split(/\n\d+\.\s+/)
        .filter(Boolean)
        .map((s) => s.trim())
    : [];

  return { answer, failureModes, raw };
}
