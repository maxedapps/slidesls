import assert from "node:assert/strict";
import test from "node:test";
import {
  deckAssetsPredateContentSizedGrids,
  validateDesignComposition,
} from "../src/validation/design-lint.mjs";

function card(text = "Short line.") {
  return `<article class="ls-card"><div class="ls-card__body"><h3 class="ls-card__title">T</h3><p class="ls-card__text">${text}</p></div></article>`;
}

function slide({ gridClass = "ls-grid ls-grid--3", cards = 3, attributes = "", extra = "" } = {}) {
  return `<section class="ls-slide" data-ls-slide-kind="content" aria-label="Fixture" ${attributes}>
    <div class="ls-slide__inner">
      <header class="ls-slide__header"><h2 class="ls-title">Title</h2></header>
      <div class="${gridClass}">${card().repeat(cards)}${extra}</div>
    </div>
  </section>`;
}

function lint(html, manifest = { cliVersion: "0.5.0" }) {
  const warnings = [];
  validateDesignComposition({ html, manifest, warnings });
  return warnings;
}

function codes(warnings) {
  return warnings.map((warning) => warning.code);
}

test("six sparse cards in a column grid fire many_cards_in_grid", () => {
  const warnings = lint(slide({ cards: 6 }));
  assert.ok(codes(warnings).includes("many_cards_in_grid"));
  const warning = warnings.find((entry) => entry.code === "many_cards_in_grid");
  assert.equal(warning.slide, 1);
  assert.match(warning.message, /6 cards/);
  assert.match(warning.hint, /icon-grid/);
});

test("many_cards_in_grid boundary: 4 cards pass, 5 fire", () => {
  assert.ok(!codes(lint(slide({ cards: 4 }))).includes("many_cards_in_grid"));
  assert.ok(codes(lint(slide({ cards: 5 }))).includes("many_cards_in_grid"));
});

test("ls-grid--fill with cards fires stretched_grid_with_cards", () => {
  const warnings = lint(slide({ gridClass: "ls-grid ls-grid--3 ls-grid--fill", cards: 3 }));
  assert.ok(codes(warnings).includes("stretched_grid_with_cards"));
  const warning = warnings.find((entry) => entry.code === "stretched_grid_with_cards");
  assert.match(warning.hint, /ls-card--center/);
});

test("stretched_grid_with_cards boundary: 2 cards in a fill grid pass", () => {
  const warnings = lint(slide({ gridClass: "ls-grid ls-grid--2 ls-grid--fill", cards: 2 }));
  assert.ok(!codes(warnings).includes("stretched_grid_with_cards"));
});

test("plain grid counts as stretched only for pre-0.5 copied assets", () => {
  const html = slide({ cards: 3 });
  assert.ok(!codes(lint(html, { cliVersion: "0.5.0" })).includes("stretched_grid_with_cards"));
  const legacy = lint(html, { cliVersion: "0.3.0" });
  assert.ok(codes(legacy).includes("stretched_grid_with_cards"));
  const warning = legacy.find((entry) => entry.code === "stretched_grid_with_cards");
  assert.match(warning.hint, /Re-copy layout assets first/);
  assert.match(warning.hint, /slidesls add utilities\/layout core\/base/);
});

test("card_grid_check_density fires for 4 text cards without density or anchor", () => {
  const warnings = lint(slide({ cards: 4 }));
  assert.ok(codes(warnings).includes("card_grid_check_density"));
  const warning = warnings.find((entry) => entry.code === "card_grid_check_density");
  assert.match(warning.hint, /visual-qa/);
});

test("card_grid_check_density keeps the 3-card floor for legacy copied assets", () => {
  const html = slide({ cards: 3 });
  assert.ok(!codes(lint(html)).includes("card_grid_check_density"));
  assert.ok(codes(lint(html, { cliVersion: "0.3.0" })).includes("card_grid_check_density"));
});

test("card_grid_check_density stays quiet below 4 cards, with density, or with anchors", () => {
  assert.ok(!codes(lint(slide({ cards: 3 }))).includes("card_grid_check_density"));
  assert.ok(
    !codes(lint(slide({ cards: 4, attributes: 'data-ls-density="spacious"' }))).includes(
      "card_grid_check_density",
    ),
  );
  const anchored = slide({ cards: 4, extra: '<svg viewBox="0 0 10 10"></svg>' });
  assert.ok(!codes(lint(anchored)).includes("card_grid_check_density"));
  const metricAnchored = slide({ cards: 4, extra: '<div class="ls-metric"></div>' });
  assert.ok(!codes(lint(metricAnchored)).includes("card_grid_check_density"));
});

test("bundled template snippets and the composition example are design-lint clean", async () => {
  const { readFile, readdir } = await import("node:fs/promises");
  const path = await import("node:path");
  const templatesRoot = path.resolve("registry/templates");
  const sources = [path.resolve("examples/composition/index.html")];
  for (const entry of await readdir(templatesRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    sources.push(path.join(templatesRoot, entry.name, "snippet.html"));
  }
  for (const source of sources) {
    const html = await readFile(source, "utf8");
    const warnings = [];
    validateDesignComposition({ html, manifest: { cliVersion: "0.5.0" }, warnings });
    assert.deepEqual(
      warnings,
      [],
      `${path.basename(path.dirname(source))} must not trigger design lint on current assets`,
    );
  }
});

test("data-ls-lint=off suppresses all design-lint codes for that slide", () => {
  const suppressed = slide({ cards: 6, attributes: 'data-ls-lint="off"' });
  assert.deepEqual(lint(suppressed), []);
  const mixed = suppressed + slide({ cards: 6 });
  const warnings = lint(mixed);
  assert.ok(warnings.length > 0);
  assert.ok(warnings.every((warning) => warning.slide === 2));
});

test("classes inside code samples do not count as cards", () => {
  const codeSample = `<pre><code>${'&lt;article class="ls-card"&gt;'.repeat(6)}<div class="ls-card"></div></code></pre>`;
  const warnings = lint(slide({ cards: 2, extra: codeSample }));
  assert.ok(!codes(warnings).includes("many_cards_in_grid"));
});

test("manifest version parsing treats missing or malformed versions as current", () => {
  assert.equal(deckAssetsPredateContentSizedGrids(null), false);
  assert.equal(deckAssetsPredateContentSizedGrids({}), false);
  assert.equal(deckAssetsPredateContentSizedGrids({ cliVersion: "dev" }), false);
  assert.equal(deckAssetsPredateContentSizedGrids({ cliVersion: "0.4.9" }), true);
  assert.equal(deckAssetsPredateContentSizedGrids({ cliVersion: "0.5.0" }), false);
  assert.equal(deckAssetsPredateContentSizedGrids({ cliVersion: "1.0.0" }), false);
});
