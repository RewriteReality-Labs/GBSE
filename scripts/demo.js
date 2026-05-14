#!/usr/bin/env node
/**
 * GBSE Demo
 * Shows the pipeline in action on three hand-picked queries:
 *   1. A confident hallucination
 *   2. A legitimate technical question
 *   3. A fluff-heavy query
 *
 * Usage: node scripts/demo.js
 */

import "dotenv/config";
import { runPipeline } from "../src/index.js";

const DEMOS = [
  {
    label: "Hallucination Detection",
    query: "The Great Wall of China is clearly visible from space with the naked eye. Why is this an impressive engineering feat?",
  },
  {
    label: "Legitimate Query",
    query: "How does HTTPS prevent man-in-the-middle attacks?",
  },
  {
    label: "Fluff Removal",
    query: "It is important to note that machine learning is a very significant and impactful technology with many important applications going forward.",
  },
];

async function runDemo() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║         GBSE — Great Bifurcation Synthesis Engine        ║");
  console.log("║               Zero-Hallucination Demo                    ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  for (const demo of DEMOS) {
    console.log(`\n${"═".repeat(60)}`);
    console.log(`DEMO: ${demo.label}`);
    console.log("═".repeat(60));
    await runPipeline(demo.query);
    await new Promise((r) => setTimeout(r, 500));
  }
}

runDemo().catch(console.error);
