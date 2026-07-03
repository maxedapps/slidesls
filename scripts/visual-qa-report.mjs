#!/usr/bin/env node

// Back-compat delegate. The canonical entry point is `slidesls visual-qa`;
// this script keeps the pre-0.5 repo-path CLI surface working.
import { stdin, stdout } from "node:process";
import { visualQaEvalScript } from "../src/validation/visual-qa-eval.mjs";
import { analyzeVisualQa } from "../src/validation/visual-rhythm.mjs";

const help = `Usage:
  node scripts/visual-qa-report.mjs --eval
  node scripts/visual-qa-report.mjs --analyze < collected.json

Deprecated in favor of: slidesls visual-qa --eval | --analyze [--input <file>]

Prints a dependency-free browser evaluation payload for agent-browser, or analyzes
collected JSON for advisory per-slide composition and rhythm warnings.
`;

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  stdout.write(help);
  process.exit(0);
}

if (process.argv.includes("--analyze")) {
  const input = await readStdin();
  // agent-browser eval prints the payload as a JSON string literal, so the
  // first parse may yield a string that itself contains the payload JSON.
  let payload = JSON.parse(input || "{}");
  if (typeof payload === "string") payload = JSON.parse(payload);
  if (
    !payload ||
    typeof payload !== "object" ||
    Array.isArray(payload) ||
    !Array.isArray(payload.slides)
  ) {
    process.stderr.write("Expected collected visual QA JSON with a slides array on stdin.\n");
    process.exit(1);
  }
  // An empty collection means the evaluated page was not a rendered deck;
  // treating it as "clean" would silently defeat the QA loop.
  if (payload.slides.length === 0) {
    process.stderr.write(
      "Collected visual QA payload contains no slides. Open the deck preview with ?export=1, wait for load, then re-run the collection.\n",
    );
    process.exit(1);
  }
  stdout.write(`${JSON.stringify(analyzeVisualQa(payload), null, 2)}\n`);
  process.exit(0);
}

if (!process.argv.includes("--eval")) {
  stdout.write(help);
  process.exit(1);
}

stdout.write(visualQaEvalScript());

function readStdin() {
  return new Promise((resolve, reject) => {
    let data = "";
    stdin.setEncoding("utf8");
    stdin.on("data", (chunk) => {
      data += chunk;
    });
    stdin.on("end", () => resolve(data));
    stdin.on("error", reject);
  });
}
