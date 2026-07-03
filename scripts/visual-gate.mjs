#!/usr/bin/env node

// Release-path acceptance gate for rendered composition quality.
//
// When a browser driver (agent-browser) is available, this script serves the
// repo, renders two pages — examples/composition and a generated gallery
// containing every bundled template snippet — collects real geometry with the
// visual-qa eval payload, and fails loudly if any measured composition
// warning fires (card_low_fill, equal_cards_sparse, body_text_small,
// collection_incomplete) or collection looks broken. A future layout.css
// edit that reintroduces stretched sparse cards fails the release check
// instead of relying on manual review.
//
// Without a browser driver it skips with a visible notice: the base tool
// stays dependency-free (PROJECT.md), so this runs in `pnpm pack:check` and
// standalone, not in default `pnpm check`.
//
// Override the driver binary with SLIDESLS_VISUAL_GATE_BROWSER
// (e.g. "npx -y agent-browser").

import { spawn, spawnSync } from "node:child_process";
import { rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { RegistrySource, loadRegistry } from "../src/registry/source.mjs";
import { visualQaEvalScript } from "../src/validation/visual-qa-eval.mjs";
import { analyzeVisualQa } from "../src/validation/visual-rhythm.mjs";

const MEASURED_CODES = new Set([
  "card_low_fill",
  "equal_cards_sparse",
  "body_text_small",
  "collection_incomplete",
]);
const EXPECTED_MIN_COMPOSITION_CONTAINERS = 15; // composition deck has 18+ measured boxes
const root = path.resolve(import.meta.dirname, "..");
const bin = path.join(root, "bin", "slidesls.mjs");
const galleryFile = ".visual-gate-gallery.html";
const session = `slidesls-visual-gate-${process.pid}`;

function browserCommand() {
  const override = process.env.SLIDESLS_VISUAL_GATE_BROWSER;
  if (override) return override.split(" ");
  const probe = spawnSync("agent-browser", ["--version"], { encoding: "utf8" });
  if (probe.error || probe.status !== 0) return null;
  return ["agent-browser"];
}

function runBrowser(baseCommand, args, input) {
  const [command, ...prefix] = baseCommand;
  const result = spawnSync(command, [...prefix, "--session", session, ...args], {
    encoding: "utf8",
    input,
    timeout: 120000,
  });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(
      `agent-browser ${args.join(" ")} failed (${result.status}): ${result.stderr || result.stdout}`,
    );
  return result.stdout;
}

function startPreview() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [bin, "preview", root, "--port", "0", "--json"], {
      cwd: root,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    // The child never escapes a failed startup: kill it before rejecting so
    // the caller's cleanup does not need a handle it never received.
    function fail(error) {
      clearTimeout(timeout);
      child.kill("SIGTERM");
      reject(error);
    }
    const timeout = setTimeout(() => fail(new Error(`preview did not start: ${stderr}`)), 10000);
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
      try {
        const parsed = JSON.parse(stdout);
        clearTimeout(timeout);
        resolve({ child, url: parsed.data.url });
      } catch {
        // JSON not complete yet.
      }
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", (error) => fail(error));
  });
}

function parseCollected(stdout) {
  let payload = JSON.parse(stdout.trim());
  if (typeof payload === "string") payload = JSON.parse(payload);
  return payload;
}

// One deck containing every bundled template snippet, linking live registry
// assets, so any template whose composition regresses is measured directly.
async function buildTemplateGallery() {
  const source = new RegistrySource({ registryRoot: root });
  const data = await loadRegistry(source);
  const links = [];
  const scripts = [];
  for (const item of data.items) {
    if (item.name.startsWith("presets/")) continue;
    for (const file of item.files || []) {
      if (file.path.endsWith(".css")) links.push(`<link rel="stylesheet" href="${file.path}" />`);
      if (file.path.endsWith(".js"))
        scripts.push(`<script type="module" src="${file.path}"></script>`);
    }
  }
  const sections = [];
  for (const item of data.items) {
    if (item.type !== "ls:template") continue;
    for (const snippet of item.snippets || []) {
      sections.push(await source.readText(snippet.path));
    }
  }
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>slidesls visual gate template gallery</title>
    ${[...new Set(links)].join("\n    ")}
    ${[...new Set(scripts)].join("\n    ")}
  </head>
  <body class="ls-page">
    <main class="ls-deck" data-ls-deck aria-label="Visual gate template gallery">
      ${sections.join("\n")}
    </main>
  </body>
</html>
`;
  await writeFile(path.join(root, galleryFile), html);
  return sections.length;
}

function checkPage({ name, analysis, expectedSlides, expectedMinContainers }) {
  const failures = [];
  const containerCount = analysis.slides.reduce(
    (sum, slide) => sum + (slide.containers?.length || 0),
    0,
  );
  if (expectedSlides !== undefined && analysis.summary.slideCount !== expectedSlides)
    failures.push(
      `${name}: expected ${expectedSlides} slides, collected ${analysis.summary.slideCount}.`,
    );
  if (analysis.summary.collectedSlideCount !== analysis.summary.slideCount)
    failures.push(
      `${name}: only ${analysis.summary.collectedSlideCount}/${analysis.summary.slideCount} slides rendered during collection.`,
    );
  if (expectedMinContainers !== undefined && containerCount < expectedMinContainers)
    failures.push(`${name}: collection looks broken — only ${containerCount} containers measured.`);
  for (const warning of analysis.warnings.filter((entry) => MEASURED_CODES.has(entry.code)))
    failures.push(`${name}: ${warning.code}: ${warning.message}`);
  if (!failures.length)
    console.log(
      `visual-gate: ${name} ok — ${analysis.summary.slideCount} slides, ${containerCount} containers measured.`,
    );
  return failures;
}

const browser = browserCommand();
if (!browser) {
  console.log(
    "visual-gate: SKIPPED — agent-browser not found. Install it (or set " +
      "SLIDESLS_VISUAL_GATE_BROWSER) to gate rendered composition before release.",
  );
  process.exit(0);
}

let child = null;
const failures = [];
try {
  // The gallery file is written before the preview starts, so cleanup must
  // cover preview-startup failures too — everything lives in one try/finally.
  const templateSlideCount = await buildTemplateGallery();
  const preview = await startPreview();
  child = preview.child;
  const url = preview.url;
  const pages = [
    {
      name: "examples/composition",
      path: "examples/composition/index.html",
      expectedMinContainers: EXPECTED_MIN_COMPOSITION_CONTAINERS,
    },
    {
      name: "template gallery",
      path: galleryFile,
      expectedSlides: templateSlideCount,
    },
  ];
  for (const page of pages) {
    runBrowser(browser, ["open", `${url}${page.path}?export=1`]);
    runBrowser(browser, ["set", "viewport", "1600", "900"]);
    runBrowser(browser, ["wait", "--load", "networkidle"]);
    const collected = parseCollected(
      runBrowser(browser, ["eval", "--stdin"], visualQaEvalScript()),
    );
    failures.push(
      ...checkPage({
        name: page.name,
        analysis: analyzeVisualQa(collected),
        expectedSlides: page.expectedSlides,
        expectedMinContainers: page.expectedMinContainers,
      }),
    );
  }
} finally {
  try {
    runBrowser(browser, ["close"]);
  } catch {
    // Session cleanup is best-effort.
  }
  if (child) child.kill("SIGTERM");
  await rm(path.join(root, galleryFile), { force: true });
}

for (const failure of failures) console.error(`visual-gate: FAILED — ${failure}`);
if (!failures.length) console.log("visual-gate: ok — no composition regressions.");
process.exit(failures.length ? 1 : 0);
