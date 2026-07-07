#!/usr/bin/env node

// Release-path acceptance gate for rendered composition AND motion quality.
//
// With a browser driver available, this script:
//   1. serves the repo and renders examples/composition plus every generated
//      gallery page (all snippets × styles × densities via `slidesls gallery`),
//      collecting real geometry with the visual-qa eval payload;
//   2. captures a still of each gallery combo into .gallery-review/<combo>.png
//      for the human rubric review;
//   3. runs the motion check (timed entrance burst, stagger paint-in
//      distinctness, key-spam interrupt run) on generated motion pages —
//      single frames cannot see motion, so this is scripted in-page sampling.
//
// Measured defect codes fail the gate on default-density pages; density
// variants are reported but advisory until the v2 threshold recalibration
// (plan task 1.7). Motion failures always fail the gate.
//
// Drivers: agent-browser (default) or playwright-core when resolvable
// (SLIDESLS_VISUAL_GATE_BROWSER overrides the agent-browser binary).
// Without any driver: skips with a notice — except in the release flow
// (SLIDESLS_RELEASE=1, set by pack:check), where missing browser = failure,
// so the taste/motion gate can never silently no-op on a release.

import { spawn, spawnSync } from "node:child_process";
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { visualQaEvalScript } from "../src/validation/visual-qa-eval.mjs";
import { analyzeVisualQa } from "../src/validation/visual-rhythm.mjs";
import { analyzeMotion, motionCheckScript } from "../src/validation/motion-check.mjs";
import { galleryCommand } from "../src/cli/gallery-command.mjs";

const MEASURED_CODES = new Set([
  "card_low_fill",
  "equal_cards_sparse",
  "body_text_small",
  "low_contrast",
  "collection_incomplete",
]);
const EXPECTED_MIN_COMPOSITION_CONTAINERS = 3; // v2 composition deck is mostly unboxed; 3 dashboard surfaces are always measured
const root = path.resolve(import.meta.dirname, "..");
const bin = path.join(root, "bin", "slidesls.mjs");
const releaseMode = process.env.SLIDESLS_RELEASE === "1";
const motionFileFor = (name) => `.visual-gate-motion-${name}.html`;

// --- drivers ---------------------------------------------------------------

function agentBrowserDriver() {
  const override = process.env.SLIDESLS_VISUAL_GATE_BROWSER;
  const base = override ? override.split(" ") : ["agent-browser"];
  if (!override) {
    const probe = spawnSync("agent-browser", ["--version"], { encoding: "utf8" });
    if (probe.error || probe.status !== 0) return null;
  }
  const session = `slidesls-visual-gate-${process.pid}`;
  const run = (args, input) => {
    const [command, ...prefix] = base;
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
  };
  return {
    name: "agent-browser",
    async open(url) {
      run(["open", url]);
      run(["set", "viewport", "1600", "900"]);
      run(["wait", "--load", "networkidle"]);
    },
    async eval(script) {
      return run(["eval", "--stdin"], script);
    },
    async screenshot(file) {
      try {
        run(["screenshot", file]);
        return true;
      } catch {
        return false;
      }
    },
    async close() {
      try {
        run(["close"]);
      } catch {
        // Session cleanup is best-effort.
      }
    },
  };
}

async function playwrightDriver() {
  let chromium;
  try {
    ({ chromium } = await import("playwright-core"));
  } catch {
    return null;
  }
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch {
    // Fall back to a headless shell from the shared playwright cache.
    const { readdirSync } = await import("node:fs");
    const os = await import("node:os");
    const cache = path.join(os.homedir(), "Library", "Caches", "ms-playwright");
    try {
      const shell = readdirSync(cache)
        .filter((dir) => dir.startsWith("chromium_headless_shell-"))
        .sort()
        .at(-1);
      const executablePath = path.join(
        cache,
        shell,
        "chrome-headless-shell-mac-arm64",
        "chrome-headless-shell",
      );
      browser = await chromium.launch({ executablePath, headless: true });
    } catch {
      return null;
    }
  }
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  return {
    name: "playwright-core",
    async open(url) {
      await page.goto(url, { waitUntil: "networkidle" });
    },
    async eval(script) {
      return page.evaluate(script);
    },
    async screenshot(file) {
      // Gallery pages render in export mode (all slides stacked), so review
      // stills must capture the full page, not the first viewport.
      await page.screenshot({ path: file, fullPage: true });
      return true;
    },
    async close() {
      await browser.close();
    },
  };
}

// --- helpers ----------------------------------------------------------------

function startPreview() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [bin, "preview", root, "--port", "0", "--json"], {
      cwd: root,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
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
  let payload = typeof stdout === "string" ? JSON.parse(stdout.trim()) : stdout;
  if (typeof payload === "string") payload = JSON.parse(payload);
  return payload;
}

// A small known deck exercising transitions, stagger, and steps — the motion
// check needs predictable structure, not real content.
function motionDeckHtml({ styleAttribute = null, styleLinks = [] } = {}) {
  const slides = [1, 2, 3]
    .map(
      (
        index,
      ) => `      <section class="ls-slide" data-ls-slide-kind="content" aria-label="Motion ${index}">
        <div class="ls-slide__inner">
          <header class="ls-slide__header">
            <p class="ls-eyebrow">Motion</p>
            <h2 class="ls-title">Slide ${index}</h2>
          </header>
          <div class="ls-slide__body">
            <div class="ls-grid ls-grid--3">
              <div class="ls-surface"><p class="ls-surface__text">Unit one</p></div>
              <div class="ls-surface"><p class="ls-surface__text">Unit two</p></div>
              <div class="ls-surface"><p class="ls-surface__text">Unit three</p></div>
            </div>
          </div>
        </div>
      </section>`,
    )
    .join("\n");
  return `<!doctype html>
<html lang="en"${styleAttribute ? ` data-ls-style="${styleAttribute}"` : ""}>
  <head>
    <meta charset="utf-8" />
    <title>slidesls visual gate motion page</title>
    <link rel="stylesheet" href="registry/core/base/reset.css" />
    <link rel="stylesheet" href="registry/core/base/tokens.css" />
    <link rel="stylesheet" href="registry/core/base/slide.css" />
    <link rel="stylesheet" href="registry/core/base/icons.css" />
    <link rel="stylesheet" href="registry/core/base/motion.css" />
    <link rel="stylesheet" href="registry/layouts/core/layout.css" />
    <link rel="stylesheet" href="registry/layouts/core/utilities.css" />
    <link rel="stylesheet" href="registry/components/surface/surface.css" />
    ${styleLinks.map((href) => `<link rel="stylesheet" href="${href}" />`).join("\n    ")}
    <script defer src="registry/core/base/slide-runtime.js"></script>
  </head>
  <body class="ls-page">
    <main class="ls-deck" data-ls-deck aria-label="Motion check">
${slides}
    </main>
  </body>
</html>
`;
}

function checkPage({ name, analysis, expectedMinContainers, enforceMeasured }) {
  const failures = [];
  const notices = [];
  const containerCount = analysis.slides.reduce(
    (sum, slide) => sum + (slide.containers?.length || 0),
    0,
  );
  if (analysis.summary.collectedSlideCount !== analysis.summary.slideCount)
    failures.push(
      `${name}: only ${analysis.summary.collectedSlideCount}/${analysis.summary.slideCount} slides rendered during collection.`,
    );
  if (expectedMinContainers !== undefined && containerCount < expectedMinContainers)
    failures.push(`${name}: collection looks broken — only ${containerCount} containers measured.`);
  const measured = analysis.warnings.filter((entry) => MEASURED_CODES.has(entry.code));
  for (const warning of measured) {
    const line = `${name}: ${warning.code}: ${warning.message}`;
    if (enforceMeasured) failures.push(line);
    else notices.push(line);
  }
  if (!failures.length)
    console.log(
      `visual-gate: ${name} ok — ${analysis.summary.slideCount} slides, ${containerCount} containers${notices.length ? `, ${notices.length} advisory finding(s)` : ""}.`,
    );
  for (const notice of notices) console.log(`visual-gate: advisory — ${notice}`);
  return failures;
}

// --- main -------------------------------------------------------------------

const driver = agentBrowserDriver() || (await playwrightDriver());
if (!driver) {
  if (releaseMode) {
    console.error(
      "visual-gate: FAILED — no browser driver available in the release flow. " +
        "Install agent-browser (or playwright-core) so composition and motion are gated before release.",
    );
    process.exit(1);
  }
  console.log(
    "visual-gate: SKIPPED — no browser driver found. Install agent-browser (or set " +
      "SLIDESLS_VISUAL_GATE_BROWSER) to gate rendered composition and motion.",
  );
  process.exit(0);
}

let child = null;
const failures = [];
const generatedFiles = [];
try {
  // Gallery pages (registry × style × density).
  const gallery = await galleryCommand(["--out", path.join(root, ".gallery"), "--json"]);
  const galleryPages = (await readdir(path.join(root, ".gallery")))
    .filter((file) => file.endsWith(".html") && file !== "index.html")
    .sort();

  // Motion pages: default tokens + every style in the gallery lineup.
  const motionPages = [{ name: "default", file: motionFileFor("default") }];
  await writeFile(path.join(root, motionFileFor("default")), motionDeckHtml());
  generatedFiles.push(motionFileFor("default"));
  for (const styleName of gallery.data.styles.filter((name) => name !== "default")) {
    const attribute = styleName.split("/").at(-1);
    const file = motionFileFor(attribute);
    // Style CSS is enough for motion (fonts affect paint, not the checks).
    await writeFile(
      path.join(root, file),
      motionDeckHtml({
        styleAttribute: attribute,
        styleLinks: [`registry/styles/${attribute}/style.css`],
      }),
    );
    generatedFiles.push(file);
    motionPages.push({ name: attribute, file });
  }

  const preview = await startPreview();
  child = preview.child;
  const url = preview.url;

  await mkdir(path.join(root, ".gallery-review"), { recursive: true });

  // 1. Composition example (long-standing calibrated deck).
  await driver.open(`${url}examples/composition/index.html?export=1`);
  failures.push(
    ...checkPage({
      name: "examples/composition",
      analysis: analyzeVisualQa(parseCollected(await driver.eval(visualQaEvalScript()))),
      expectedMinContainers: EXPECTED_MIN_COMPOSITION_CONTAINERS,
      enforceMeasured: true,
    }),
  );

  // 2. Gallery matrix: geometry + stills for the human review.
  for (const page of galleryPages) {
    const combo = page.replace(/\.html$/, "");
    await driver.open(`${url}.gallery/${page}?export=1`);
    failures.push(
      ...checkPage({
        name: `gallery/${combo}`,
        analysis: analyzeVisualQa(parseCollected(await driver.eval(visualQaEvalScript()))),
        enforceMeasured: combo.endsWith("--default"),
      }),
    );
    const shot = await driver.screenshot(path.join(root, ".gallery-review", `${combo}.png`));
    if (!shot) console.log(`visual-gate: screenshot unavailable for ${combo} (driver limitation).`);
  }

  // 3. Motion checks (never advisory: motion is the headline feature).
  for (const page of motionPages) {
    await driver.open(`${url}${page.file}`);
    const collected = parseCollected(await driver.eval(motionCheckScript()));
    const verdict = analyzeMotion(collected, { name: `motion/${page.name}` });
    if (verdict.skipped) failures.push(`motion/${page.name}: check skipped: ${verdict.skipped}`);
    failures.push(...verdict.failures);
    if (!verdict.failures.length && !verdict.skipped)
      console.log(
        `visual-gate: motion/${page.name} ok — entrance, stagger, and key-spam checks passed.`,
      );
  }
} finally {
  await driver.close();
  if (child) child.kill("SIGTERM");
  for (const file of generatedFiles) await rm(path.join(root, file), { force: true });
}

for (const failure of failures) console.error(`visual-gate: FAILED — ${failure}`);
if (!failures.length) console.log("visual-gate: ok — no composition or motion regressions.");
process.exit(failures.length ? 1 : 0);
