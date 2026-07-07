import assert from "node:assert/strict";
import test from "node:test";
import { validateStyles } from "../src/validation/styles.mjs";
import { analyzeMotion } from "../src/validation/motion-check.mjs";

function deck({ attr = null, links = [] } = {}) {
  return `<!doctype html>
<html lang="en"${attr ? ` data-ls-style="${attr}"` : ""}><head>
${links.map((name) => `<link rel="stylesheet" href="./slidesls/registry/styles/${name}/style.css" />`).join("\n")}
</head><body class="ls-page"></body></html>`;
}

test("style lints: conflict, linked-but-inactive, active-but-unlinked, clean", () => {
  const conflict = [];
  validateStyles({
    html: deck({ attr: "editorial", links: ["editorial", "pop"] }),
    errors: conflict,
  });
  assert.ok(conflict.some((error) => error.code === "style_conflict"));

  const inactive = [];
  validateStyles({ html: deck({ links: ["editorial"] }), errors: inactive });
  assert.equal(inactive[0]?.code, "style_missing");

  const mismatched = [];
  validateStyles({ html: deck({ attr: "pop", links: ["editorial"] }), errors: mismatched });
  assert.ok(mismatched.some((error) => error.code === "style_missing"));

  const unlinked = [];
  validateStyles({ html: deck({ attr: "editorial" }), errors: unlinked });
  assert.equal(unlinked[0]?.code, "style_missing");

  const clean = [];
  validateStyles({ html: deck({ attr: "editorial", links: ["editorial"] }), errors: clean });
  assert.deepEqual(clean, []);

  // v1 decks without any style linkage stay clean during the transition.
  const v1 = [];
  validateStyles({ html: deck({}), errors: v1 });
  assert.deepEqual(v1, []);

  // An active style must load its font dependencies.
  const registryData = {
    byName: new Map([
      [
        "styles/editorial",
        { registryDependencies: ["core/base", "fonts/fraunces", "fonts/newsreader"] },
      ],
    ]),
  };
  const noFonts = [];
  validateStyles({
    html: deck({ attr: "editorial", links: ["editorial"] }),
    errors: noFonts,
    registryData,
  });
  assert.equal(noFonts[0]?.code, "style_fonts_missing");

  const withFonts = [];
  const htmlWithFonts = deck({ attr: "editorial", links: ["editorial"] }).replace(
    "</head>",
    '<link rel="stylesheet" href="./slidesls/registry/fonts/fraunces/font.css" /><link rel="stylesheet" href="./slidesls/registry/fonts/newsreader/font.css" /></head>',
  );
  validateStyles({ html: htmlWithFonts, errors: withFonts, registryData });
  assert.deepEqual(withFonts, []);
});

const healthyMotion = {
  slideCount: 3,
  entranceBurst: [
    { at: 0, enteringOpacity: 0, leavingDisplay: "block", leavingTransit: "out" },
    { at: 120, enteringOpacity: 0.4, leavingDisplay: "block", leavingTransit: "out" },
    { at: 300, enteringOpacity: 0.8, leavingDisplay: "block", leavingTransit: "out" },
    { at: 600, enteringOpacity: 1, leavingDisplay: "none", leavingTransit: null },
  ],
  afterEntrance: { activeCount: 1, transitCount: 0, runningAnimations: 0, leavingDisplay: "none" },
  staggerSample: [
    { index: "0", opacity: 0.9 },
    { index: "1", opacity: 0.5 },
    { index: "2", opacity: 0.1 },
  ],
  staggerSettled: [1, 1, 1],
  afterSpam: { current: "2", activeCount: 1, transitCount: 0, runningAnimations: 0 },
  afterSpamDisplayedSlides: 1,
};

test("analyzeMotion passes healthy collections and fires on each defect", () => {
  assert.deepEqual(analyzeMotion(healthyMotion).failures, []);

  const defects = [
    [
      { entranceBurst: healthyMotion.entranceBurst.map((s) => ({ ...s, enteringOpacity: 0.5 })) },
      /no opacity ramp/,
    ],
    [
      {
        entranceBurst: [
          { at: 0, enteringOpacity: 0.9 },
          { at: 120, enteringOpacity: 0.3 },
          { at: 300, enteringOpacity: 0.95 },
          { at: 600, enteringOpacity: 1 },
        ],
      },
      /not monotonically increasing/,
    ],
    [
      { afterEntrance: { ...healthyMotion.afterEntrance, leavingDisplay: "block" } },
      /still displayed/,
    ],
    [{ afterEntrance: { ...healthyMotion.afterEntrance, transitCount: 1 } }, /left behind/],
    [
      {
        staggerSample: [
          { index: "0", opacity: 0.5 },
          { index: "1", opacity: 0.5 },
          { index: "2", opacity: 0.5 },
        ],
      },
      /lockstep/,
    ],
    [{ staggerSettled: [1, 0.4, 1] }, /did not settle/],
    [{ afterSpam: { ...healthyMotion.afterSpam, activeCount: 2 } }, /active slides/],
    [{ afterSpam: { ...healthyMotion.afterSpam, transitCount: 1 } }, /orphaned/],
    [{ afterSpam: { ...healthyMotion.afterSpam, runningAnimations: 1 } }, /running animations/],
    [{ afterSpamDisplayedSlides: 2 }, /slides displayed after key-spam/],
  ];
  for (const [patch, pattern] of defects) {
    const verdict = analyzeMotion({ ...healthyMotion, ...patch });
    assert.ok(
      verdict.failures.some((failure) => pattern.test(failure)),
      `${pattern} — got ${JSON.stringify(verdict.failures)}`,
    );
  }

  assert.equal(analyzeMotion({ skipped: "needs >=2 slides" }).skipped, "needs >=2 slides");
});
