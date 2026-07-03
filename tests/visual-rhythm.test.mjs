import assert from "node:assert/strict";
import { execFile, spawnSync } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";
import { analyzeVisualRhythm } from "../src/validation/visual-rhythm.mjs";

const execFileAsync = promisify(execFile);
const script = path.resolve("scripts/visual-qa-report.mjs");

test("visual rhythm accepts consistent content offsets", () => {
  const result = analyzeVisualRhythm({ slides: [content(1, 96), content(2, 98), content(3, 100)] });
  assert.equal(result.warnings.length, 0);
});

test("visual rhythm warns for one deviant content slide", () => {
  const result = analyzeVisualRhythm({
    slides: [content(1, 96), content(2, 180), content(3, 100)],
  });
  assert.ok(result.warnings.some((warning) => warning.slide === 2));
});

test("visual rhythm catches all-centered content decks with absolute rule", () => {
  const result = analyzeVisualRhythm({ slides: [content(1, 340), content(2, 342)] });
  assert.ok(result.warnings.some((warning) => warning.code === "content_header_too_low"));
});

test("visual rhythm exempts hero and section slides", () => {
  const result = analyzeVisualRhythm({
    slides: [
      { ...content(1, 360), slideKind: "hero", kind: "hero" },
      { ...content(2, 380), slideKind: "section", kind: "section" },
    ],
  });
  assert.equal(result.warnings.length, 0);
});

test("visual rhythm explicit kind overrides inference and median skips below three content slides", () => {
  const result = analyzeVisualRhythm({
    slides: [
      { ...content(1, 96), hasSlideFill: true, centerInFill: true, slideKind: "content" },
      content(2, 98),
    ],
  });
  assert.equal(result.summary.contentSlideCount, 2);
  assert.equal(
    result.warnings.some((warning) => warning.code === "content_header_median_deviation"),
    false,
  );
});

test("visual rhythm falls back to innerOffsetTop when expectedHeaderOffsetTop is absent", () => {
  const slide = { ...content(1, 200), expectedHeaderOffsetTop: undefined, innerOffsetTop: 96 };
  const result = analyzeVisualRhythm({ slides: [slide] });
  assert.ok(result.warnings.some((warning) => warning.code === "content_header_offset"));
});

test("visual rhythm honors the raw slide-kind attribute when no resolved kind exists", () => {
  const heroWithoutResolvedKind = { ...content(1, 360), kind: undefined, slideKind: "hero" };
  const result = analyzeVisualRhythm({ slides: [heroWithoutResolvedKind] });
  assert.equal(result.warnings.length, 0);
  assert.equal(result.slides[0].inferredKind, "hero");
});

test("visual qa --analyze reads stdin and --eval exposes collection fields", async () => {
  const analyzed = spawnSync(process.execPath, [script, "--analyze"], {
    input: JSON.stringify({ slides: [content(1, 96)] }),
    cwd: path.resolve("."),
    encoding: "utf8",
  });
  assert.equal(analyzed.status, 0, analyzed.stderr);
  assert.equal(JSON.parse(analyzed.stdout).summary.slideCount, 1);

  const stringWrapped = spawnSync(process.execPath, [script, "--analyze"], {
    input: JSON.stringify(JSON.stringify({ slides: [content(1, 96)] })),
    cwd: path.resolve("."),
    encoding: "utf8",
  });
  assert.equal(stringWrapped.status, 0, stringWrapped.stderr);
  assert.equal(
    JSON.parse(stringWrapped.stdout).summary.slideCount,
    1,
    "agent-browser string-wrapped payloads must analyze the inner JSON",
  );

  const evalPayload = (
    await execFileAsync(process.execPath, [script, "--eval"], { cwd: path.resolve(".") })
  ).stdout;
  assert.match(evalPayload, /data-ls-slide-kind|lsSlideKind/);
  assert.match(evalPayload, /headerOffsetTop/);
  assert.match(evalPayload, /centerStartInFill/);
});

test("visual qa --help works", async () => {
  const { stdout } = await execFileAsync(process.execPath, [script, "--help"], {
    cwd: path.resolve("."),
  });
  assert.match(stdout, /--analyze/);
});

test("card_low_fill fires for tall low-fill containers and skips content-sized cards", () => {
  const result = analyzeVisualRhythm({
    slides: [
      {
        ...content(1, 96),
        containers: [
          {
            selector: "article.ls-card",
            height: 550,
            innerHeight: 502,
            contentHeight: 120,
            contentFillRatio: 0.24,
          },
          {
            selector: "article.ls-card.ls-card--fine",
            height: 180,
            innerHeight: 132,
            contentHeight: 120,
            contentFillRatio: 0.91,
          },
        ],
      },
    ],
  });
  const warning = result.warnings.find((entry) => entry.code === "card_low_fill");
  assert.ok(warning);
  assert.match(warning.message, /1 tall container/);
  assert.match(warning.message, /article\.ls-card/);
});

test("equal_cards_sparse fires for grids of tall sparse boxes only", () => {
  const sparseGrid = {
    selector: "div.ls-grid.ls-grid--3",
    childCount: 3,
    children: [
      { height: 420, textLength: 60 },
      { height: 420, textLength: 55 },
      { height: 420, textLength: 70 },
    ],
  };
  const flagged = analyzeVisualRhythm({ slides: [{ ...content(1, 96), grids: [sparseGrid] }] });
  assert.ok(flagged.warnings.some((entry) => entry.code === "equal_cards_sparse"));

  const contentSized = {
    ...sparseGrid,
    children: sparseGrid.children.map((child) => ({ ...child, height: 160 })),
  };
  const compact = analyzeVisualRhythm({ slides: [{ ...content(1, 96), grids: [contentSized] }] });
  assert.ok(!compact.warnings.some((entry) => entry.code === "equal_cards_sparse"));

  const richCopy = {
    ...sparseGrid,
    children: sparseGrid.children.map((child) => ({ ...child, textLength: 260 })),
  };
  const rich = analyzeVisualRhythm({ slides: [{ ...content(1, 96), grids: [richCopy] }] });
  assert.ok(!rich.warnings.some((entry) => entry.code === "equal_cards_sparse"));
});

test("body_text_small fires below the legibility floor", () => {
  const small = analyzeVisualRhythm({ slides: [{ ...content(1, 96), minBodyFontSize: 16 }] });
  assert.ok(small.warnings.some((entry) => entry.code === "body_text_small"));
  const fine = analyzeVisualRhythm({ slides: [{ ...content(1, 96), minBodyFontSize: 21 }] });
  assert.ok(!fine.warnings.some((entry) => entry.code === "body_text_small"));
});

test("uncollected slides skip measured checks", () => {
  const result = analyzeVisualRhythm({
    slides: [
      {
        ...content(1, 96),
        collected: false,
        minBodyFontSize: 12,
        containers: [{ selector: "x", height: 900, contentFillRatio: 0 }],
      },
    ],
  });
  assert.ok(!result.warnings.some((entry) => entry.code === "body_text_small"));
  assert.ok(!result.warnings.some((entry) => entry.code === "card_low_fill"));
});

test("analyze emits per-slide findings with deep links", () => {
  const result = analyzeVisualRhythm({
    url: "http://127.0.0.1:4321/?export=1",
    deck: { export: "true" },
    slides: [
      { ...content(1, 96), label: "Fine slide" },
      { ...content(2, 96), label: "Sparse slide", minBodyFontSize: 14 },
    ],
  });
  assert.equal(result.perSlide.length, 2);
  const [fine, sparse] = result.perSlide;
  assert.equal(fine.inspect, false);
  assert.equal(sparse.inspect, true);
  assert.equal(sparse.label, "Sparse slide");
  assert.equal(sparse.deepLink, "http://127.0.0.1:4321/#slide=2");
  assert.deepEqual(result.summary.slidesToInspect, [2]);
  assert.equal(result.summary.collectedInExportMode, true);
});

test("new collector fields are present in the eval payload", async () => {
  const evalPayload = (
    await execFileAsync(process.execPath, [script, "--eval"], { cwd: path.resolve(".") })
  ).stdout;
  assert.match(evalPayload, /contentFillRatio/);
  assert.match(evalPayload, /minBodyFontSize/);
  assert.match(evalPayload, /gridMetrics|grids:/);
});

function content(index, headerOffsetTop) {
  return {
    index,
    kind: "content",
    slideKind: "content",
    innerOffsetTop: 0,
    expectedHeaderOffsetTop: 96,
    headerOffsetTop,
    rect: { height: 900 },
  };
}
