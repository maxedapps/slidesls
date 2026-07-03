import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { analyzeVisualQa } from "../src/validation/visual-rhythm.mjs";
import { validateDesignComposition } from "../src/validation/design-lint.mjs";

// End-to-end regression for the eve-deck failure: sparse card grids under
// pre-0.5 copied CSS produced tall stretched cards with top-pinned copy.
// The geometry fixtures are real collected payloads (see their sibling
// .html fixture and examples/composition/index.html); they go stale when the
// registry CSS changes — scripts/visual-gate.mjs re-measures live.

async function fixture(name) {
  return JSON.parse(await readFile(path.resolve("tests/fixtures", name), "utf8"));
}

test("eve-legacy geometry (0.3 CSS) fires measured composition warnings on both slides", async () => {
  const analysis = analyzeVisualQa(await fixture("eve-legacy-visual-qa.json"));
  const codes = new Set(analysis.warnings.map((warning) => warning.code));
  assert.ok(codes.has("equal_cards_sparse"));
  assert.ok(codes.has("card_low_fill"));
  assert.deepEqual(analysis.summary.slidesToInspect, [1, 2]);
});

test("composition example geometry (0.5 CSS) is clean", async () => {
  const analysis = analyzeVisualQa(await fixture("composition-visual-qa.json"));
  assert.deepEqual(
    analysis.warnings.filter((warning) =>
      ["card_low_fill", "equal_cards_sparse", "body_text_small"].includes(warning.code),
    ),
    [],
  );
  assert.deepEqual(analysis.summary.slidesToInspect, []);
});

test("eve-style markup with a 0.3 manifest fires the static design lint", async () => {
  const html = await readFile(path.resolve("tests/fixtures/eve-legacy.html"), "utf8");
  const warnings = [];
  validateDesignComposition({ html, manifest: { cliVersion: "0.3.0" }, warnings });
  const codes = new Set(warnings.map((warning) => warning.code));
  assert.ok(codes.has("many_cards_in_grid"), "6 wrapped cards must be flagged");
  assert.ok(codes.has("stretched_grid_with_cards"), "legacy plain grids count as stretched");
  assert.ok(codes.has("card_grid_check_density"));
  assert.ok(
    warnings.every((warning) => !warning.hint || !/ls-grid--fill/.test(warning.message)),
    "legacy hints must not lead with classes the deck lacks",
  );
});

test("the recommended icon-grid/feature-rows rewrite passes the static design lint", async () => {
  const html = await readFile(path.resolve("examples/composition/index.html"), "utf8");
  const warnings = [];
  validateDesignComposition({ html, manifest: { cliVersion: "0.5.0" }, warnings });
  const codes = warnings.map((warning) => warning.code);
  assert.ok(!codes.includes("many_cards_in_grid"));
  assert.ok(!codes.includes("stretched_grid_with_cards"));
});
