import assert from "node:assert/strict";
import test from "node:test";
import { deckUsesV1Vocabulary, validateDesignComposition } from "../src/validation/design-lint.mjs";

function surface(text = "Short line.") {
  return `<div class="ls-surface"><h3 class="ls-surface__title">T</h3><p class="ls-surface__text">${text}</p></div>`;
}

function card(text = "Short line.") {
  return `<article class="ls-card"><div class="ls-card__body"><h3 class="ls-card__title">T</h3><p class="ls-card__text">${text}</p></div></article>`;
}

function slide({
  gridClass = "ls-grid ls-grid--3",
  boxes = 3,
  box = surface,
  attributes = "",
  extra = "",
} = {}) {
  return `<section class="ls-slide" data-ls-slide-kind="content" aria-label="Fixture" ${attributes}>
    <div class="ls-slide__inner">
      <header class="ls-slide__header"><h2 class="ls-title">Title</h2></header>
      <div class="${gridClass}">${box().repeat(boxes)}${extra}</div>
    </div>
  </section>`;
}

function lint(html, manifest = { cliVersion: "0.7.0" }) {
  const warnings = [];
  validateDesignComposition({ html, manifest, warnings });
  return warnings;
}

function codes(warnings) {
  return warnings.map((warning) => warning.code);
}

test("six surfaces in a column grid fire many_surfaces_in_grid", () => {
  const warnings = lint(slide({ boxes: 6 }));
  assert.ok(codes(warnings).includes("many_surfaces_in_grid"));
  const warning = warnings.find((entry) => entry.code === "many_surfaces_in_grid");
  assert.equal(warning.slide, 1);
  assert.match(warning.message, /6 surfaces/);
  assert.match(warning.hint, /components\/list/);
});

test("many_surfaces_in_grid boundary: 4 pass, 5 fire", () => {
  assert.ok(
    !codes(lint(slide({ boxes: 4, extra: '<div class="ls-stat"></div>' }))).includes(
      "many_surfaces_in_grid",
    ),
  );
  assert.ok(codes(lint(slide({ boxes: 5 }))).includes("many_surfaces_in_grid"));
});

test("surface_only_slide fires for all-box bodies and passes with unboxed content", () => {
  assert.ok(codes(lint(slide({ boxes: 3 }))).includes("surface_only_slide"));
  const mixed = lint(
    slide({ boxes: 3, extra: '<div class="ls-stat"><span class="ls-stat__value">42</span></div>' }),
  );
  assert.ok(!codes(mixed).includes("surface_only_slide"));
  assert.ok(!codes(lint(slide({ boxes: 2 }))).includes("surface_only_slide"));
});

test("data-ls-lint=off suppresses advisory findings for one slide", () => {
  assert.deepEqual(codes(lint(slide({ boxes: 6, attributes: 'data-ls-lint="off"' }))), []);
});

test("v1 decks route to the frozen legacy rules with a notice", () => {
  const html = slide({ boxes: 6, box: card });
  const legacy = lint(html, { cliVersion: "0.5.0" });
  assert.ok(codes(legacy).includes("many_cards_in_grid"));
  assert.ok(codes(legacy).includes("legacy_deck_rules"));
  // v2 decks never see legacy codes.
  assert.ok(!codes(lint(html)).includes("many_cards_in_grid"));
});

test("deckUsesV1Vocabulary keys off manifest cliVersion", () => {
  assert.equal(deckUsesV1Vocabulary(null), false);
  assert.equal(deckUsesV1Vocabulary({}), false);
  assert.equal(deckUsesV1Vocabulary({ cliVersion: "dev" }), false);
  assert.equal(deckUsesV1Vocabulary({ cliVersion: "0.5.9" }), true);
  assert.equal(deckUsesV1Vocabulary({ cliVersion: "0.6.0" }), false);
  assert.equal(deckUsesV1Vocabulary({ cliVersion: "1.0.0" }), false);
});
