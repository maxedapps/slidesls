import { readFile } from "node:fs/promises";
import path from "node:path";
import { stdin } from "node:process";
import { parseArgs, usageError } from "../shared/args.mjs";
import { commandOptionSpecs } from "./option-specs.mjs";
import { ok } from "../shared/result.mjs";
import { visualQaEvalScript } from "../validation/visual-qa-eval.mjs";
import { analyzeVisualQa } from "../validation/visual-rhythm.mjs";

const helpText = `Usage:
  slidesls visual-qa --eval
  slidesls visual-qa --analyze [--input <collected.json>] [--json]

Browser-fact visual QA for a running preview. --eval prints a dependency-free
browser script; --analyze turns its collected JSON into advisory per-slide
findings with deep links.

For AI agents:
  1. Keep a preview running: slidesls preview <deck> --host 127.0.0.1 --port 4321
  2. Open the preview export URL (?export=1) in agent-browser so every slide
     renders, then pipe the output of slidesls visual-qa --eval into an
     agent-browser eval call reading stdin and save the result as collected.json.
  3. Analyze: slidesls visual-qa --analyze --input collected.json --json
  4. Screenshot each slide listed in summary.slidesToInspect via its deepLink,
     fix, re-validate, and re-run until clean.
  Findings are advisory; they point at slides to inspect, not hard failures.`;

export async function visualQaCommand(argv) {
  const args = parseArgs(argv, commandOptionSpecs["visual-qa"]);
  if (args.help || (!args.eval && !args.analyze)) return ok({ help: helpText });
  if (args.eval && args.analyze) throw usageError("Use either --eval or --analyze, not both.");

  if (args.eval) {
    return ok({
      evalScript: visualQaEvalScript(),
      agentInstructions: {
        purpose: "Collect rendered slide geometry from a live preview.",
        rules: [
          "Pipe the script into agent-browser eval --stdin against a loaded preview page.",
          "Open the preview with ?export=1 so every slide renders for collection.",
        ],
        nextCommands: ["slidesls visual-qa --analyze --input <collected.json> --json"],
      },
    });
  }

  const raw = args.input ? await readFile(path.resolve(args.input), "utf8") : await readStdin();
  let payload;
  try {
    payload = JSON.parse(raw || "{}");
    // agent-browser eval prints the payload as a JSON string literal, so the
    // first parse may yield a string that itself contains the payload JSON.
    if (typeof payload === "string") payload = JSON.parse(payload);
  } catch (error) {
    throw usageError(
      `Collected visual QA input is not valid JSON: ${error.message}`,
      "Pass the file written by piping the --eval script through an agent-browser eval call reading stdin.",
    );
  }
  if (
    !payload ||
    typeof payload !== "object" ||
    Array.isArray(payload) ||
    !Array.isArray(payload.slides)
  )
    throw usageError(
      "Expected collected visual QA JSON with a slides array.",
      "Collect it by piping the --eval script through an agent-browser eval call reading stdin.",
    );
  // An empty collection means the evaluated page was not a rendered deck;
  // treating it as "clean" would silently defeat the QA loop.
  if (payload.slides.length === 0)
    throw usageError(
      "Collected visual QA payload contains no slides.",
      "Open the deck preview with ?export=1, wait for load, then re-run the collection.",
    );

  const analysis = analyzeVisualQa(payload);
  return ok({
    ...analysis,
    agentInstructions: {
      purpose: "Fix per-slide composition findings before finalizing a deck.",
      rules: [
        "Screenshot and inspect every slide in summary.slidesToInspect via its deepLink at full size.",
        "Fix or explicitly justify each advisory finding; re-collect and re-analyze until clean.",
        "Do not judge composition from a full-export overview screenshot.",
      ],
      nextCommands: ["slidesls validate <deck> --json"],
    },
  });
}

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
