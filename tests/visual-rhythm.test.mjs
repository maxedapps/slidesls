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
