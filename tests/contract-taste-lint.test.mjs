import assert from "node:assert/strict";
import test from "node:test";
import { validateContracts } from "../src/validation/contract-lint.mjs";
import { validateTaste } from "../src/validation/taste-lint.mjs";

const registryData = {
  byName: new Map([
    [
      "archetypes/process-flow",
      {
        contract: {
          steps: { min: 3, max: 5 },
          stepTitle: { maxWords: 4 },
          stepBody: { minWords: 6, maxWords: 16 },
        },
      },
    ],
    ["archetypes/statement", { contract: { claim: { min: 1, max: 1, maxWords: 14 } } }],
  ]),
};

function flowSlide(
  steps,
  { title = "Build", body = "CI compiles, tests, and signs the image." } = {},
) {
  const step = `<div class="ls-flow__step"><h3 class="ls-flow__title">${title}</h3><p class="ls-flow__text">${body}</p></div>`;
  return `<section class="ls-slide" data-ls-archetype="process-flow" aria-label="Flow">
    <div class="ls-slide__body"><div class="ls-flow">${step.repeat(steps)}</div></div>
  </section>`;
}

function contractWarnings(html) {
  const warnings = [];
  validateContracts({ html, registryData, warnings });
  return warnings.map((warning) => warning.code);
}

test("contract_slot_count fires below min and above max", () => {
  assert.ok(contractWarnings(flowSlide(2)).includes("contract_slot_count"));
  assert.ok(contractWarnings(flowSlide(6)).includes("contract_slot_count"));
  assert.deepEqual(contractWarnings(flowSlide(4)), []);
});

test("contract_copy_length fires on over-long titles and under-long bodies", () => {
  assert.ok(
    contractWarnings(flowSlide(3, { title: "A very long five word title" })).includes(
      "contract_copy_length",
    ),
  );
  assert.ok(
    contractWarnings(flowSlide(3, { body: "Too short." })).includes("contract_copy_length"),
  );
});

test("contract lint respects data-ls-lint=off and unknown archetypes", () => {
  const suppressed = flowSlide(9).replace(
    'data-ls-archetype="process-flow"',
    'data-ls-archetype="process-flow" data-ls-lint="off"',
  );
  assert.deepEqual(contractWarnings(suppressed), []);
  const unknown = flowSlide(3).replace("process-flow", "made-up");
  assert.ok(contractWarnings(unknown).includes("contract_unknown_archetype"));
});

function deck(slides) {
  return `<main class="ls-deck" data-ls-deck>${slides.join("\n")}</main>`;
}

function archetypeSlide(name, body = "") {
  return `<section class="ls-slide" data-ls-archetype="${name}" aria-label="${name}">
    <div class="ls-slide__body">${body}</div></section>`;
}

function tasteWarnings(html) {
  const warnings = [];
  validateTaste({ html, warnings });
  return warnings;
}

test("archetype_monotony fires on majority share and consecutive runs", () => {
  const majority = deck([
    archetypeSlide("comparison"),
    archetypeSlide("statement"),
    archetypeSlide("comparison"),
    archetypeSlide("big-stat"),
    archetypeSlide("comparison"),
  ]);
  assert.ok(tasteWarnings(majority).some((warning) => warning.code === "archetype_monotony"));

  const runs = deck([
    archetypeSlide("dashboard"),
    archetypeSlide("dashboard"),
    archetypeSlide("dashboard"),
  ]);
  assert.ok(tasteWarnings(runs).some((warning) => warning.code === "archetype_monotony"));

  const varied = deck([
    archetypeSlide("comparison"),
    archetypeSlide("statement"),
    archetypeSlide("big-stat"),
    archetypeSlide("evidence"),
  ]);
  assert.ok(!tasteWarnings(varied).some((warning) => warning.code === "archetype_monotony"));
});

test("placeholder_echo fires on echoes and phrase-list hits, passes real captions", () => {
  const echo = deck([
    `<section class="ls-slide" aria-label="Echo"><div class="ls-slide__body">
      <span class="ls-badge">Learning design</span>
      <div class="ls-surface"><p class="ls-surface__text">Learning design</p></div>
    </div></section>`,
  ]);
  assert.ok(tasteWarnings(echo).some((warning) => warning.code === "placeholder_echo"));

  const phrase = deck([
    `<section class="ls-slide" aria-label="Phrase"><div class="ls-slide__body">
      <figure class="ls-figure"><div class="ls-figure__media">Diagram or visual anchor</div></figure>
    </div></section>`,
  ]);
  assert.ok(tasteWarnings(phrase).some((warning) => warning.code === "placeholder_echo"));

  const real = deck([
    `<section class="ls-slide" aria-label="Real"><div class="ls-slide__body">
      <span class="ls-badge">Rollout</span>
      <div class="ls-surface"><p class="ls-surface__text">Every release ships to 5% of traffic for one hour before the fleet-wide rollout begins.</p></div>
    </div></section>`,
  ]);
  assert.ok(!tasteWarnings(real).some((warning) => warning.code === "placeholder_echo"));
});

test("icon_mix fires whenever sprite icons and emoji slots coexist", () => {
  const mixed = deck([
    `<section class="ls-slide" aria-label="Mixed"><div class="ls-slide__body">
      <svg class="ls-icon"><use href="#ls-i-zap"/></svg>
      <span class="ls-icon-badge"><span>🛟</span></span>
    </div></section>`,
  ]);
  // Fires even with the emoji opt-in: the opt-in legitimizes emoji ALONE.
  assert.ok(tasteWarnings(mixed).some((warning) => warning.code === "icon_mix"));
  const optedIn = mixed.replace("data-ls-deck", 'data-ls-deck data-ls-icons="emoji"');
  assert.ok(tasteWarnings(optedIn).some((warning) => warning.code === "icon_mix"));
  // Emoji alone (no sprite references) is not a mix.
  const emojiOnly = deck([
    `<section class="ls-slide" aria-label="E"><div class="ls-slide__body"><span class="ls-icon-badge">🛟</span></div></section>`,
  ]);
  assert.ok(!tasteWarnings(emojiOnly).some((warning) => warning.code === "icon_mix"));
});

test("archetype_monotony skips data-ls-lint=off slides", () => {
  const runs = deck([
    archetypeSlide("dashboard"),
    `<section class="ls-slide" data-ls-archetype="dashboard" data-ls-lint="off" aria-label="x"><div class="ls-slide__body"></div></section>`,
    archetypeSlide("dashboard"),
  ]);
  assert.ok(!tasteWarnings(runs).some((warning) => warning.code === "archetype_monotony"));
});

test("motion_absent surfaces the deck-wide kill switch", () => {
  const off = `<main class="ls-deck" data-ls-deck data-ls-motion="none"><section class="ls-slide"></section></main>`;
  assert.ok(tasteWarnings(off).some((warning) => warning.code === "motion_absent"));
  const on = `<main class="ls-deck" data-ls-deck><section class="ls-slide"></section></main>`;
  assert.ok(!tasteWarnings(on).some((warning) => warning.code === "motion_absent"));
});

test("low_contrast fires on washed-out pairs and passes strong ones", async () => {
  const { analyzeVisualQa, contrastRatio } = await import("../src/validation/visual-rhythm.mjs");
  assert.ok(contrastRatio([255, 255, 255], [0, 0, 0]) > 20);
  const payload = {
    deck: { export: "true" },
    slides: [
      {
        index: 1,
        collected: true,
        rect: { height: 900 },
        colorPairs: [
          {
            selector: "p.ls-surface__text",
            fontSize: 22,
            fontWeight: "400",
            color: [150, 150, 150],
            background: [120, 120, 120],
          },
          {
            selector: "h2.ls-title",
            fontSize: 82,
            fontWeight: "780",
            color: [245, 247, 251],
            background: [17, 19, 24],
          },
        ],
      },
    ],
  };
  const analysis = analyzeVisualQa(payload);
  const contrast = analysis.warnings.filter((warning) => warning.code === "low_contrast");
  assert.equal(contrast.length, 1);
  assert.match(contrast[0].message, /ls-surface__text/);
});

test("all archetype contract slots have lint mappings (registry guard)", async () => {
  const { ARCHETYPE_SLOTS } = await import("../src/validation/contract-lint.mjs");
  const { readFile } = await import("node:fs/promises");
  const registry = JSON.parse(await readFile("registry.json", "utf8"));
  for (const itemPath of registry.items.filter((p) => p.includes("/archetypes/"))) {
    const item = JSON.parse(await readFile(itemPath, "utf8"));
    const slots = ARCHETYPE_SLOTS[item.name.split("/").at(-1)] || {};
    for (const slot of Object.keys(item.contract || {})) {
      assert.ok(slots[slot], `${item.name} contract slot "${slot}" has no lint mapping`);
    }
  }
});

test("section number and big-stat context contracts actually fire", () => {
  const data = {
    byName: new Map([
      ["archetypes/section", { contract: { number: { min: 1, max: 1 } } }],
      ["archetypes/big-stat", { contract: { context: { min: 0, max: 1, maxWords: 16 } } }],
    ]),
  };
  const warnings = [];
  validateContracts({
    html: `<section class="ls-slide" data-ls-archetype="section"><div class="ls-statement"><p class="ls-statement__text">No number</p></div></section>
      <section class="ls-slide" data-ls-archetype="big-stat"><p class="ls-layout__text">${"word ".repeat(20)}</p></section>`,
    registryData: data,
    warnings,
  });
  assert.ok(warnings.some((w) => w.code === "contract_slot_count"));
  assert.ok(warnings.some((w) => w.code === "contract_copy_length"));
});

test("placeholder_echo catches a badge echo despite a long title", () => {
  const html = `<main class="ls-deck" data-ls-deck><section class="ls-slide"><div class="ls-slide__body">
    <span class="ls-badge">AI</span>
    <h2 class="ls-title">A considerably longer title with many additional words diluting the union</h2>
    <div class="ls-surface"><p class="ls-surface__text">AI</p></div>
  </div></section></main>`;
  const warnings = [];
  validateTaste({ html, warnings });
  assert.ok(warnings.some((w) => w.code === "placeholder_echo"));
});

test("chart_a11y fires for charts and flows without role/aria-label", async () => {
  const { validateAccessibility } = await import("../src/validation/accessibility.mjs");
  const errors = [];
  const warnings = [];
  validateAccessibility({
    html: `<main class="ls-deck" data-ls-deck aria-label="d"><section class="ls-slide">
      <div class="ls-chart"><div class="ls-chart__row"></div></div>
      <div class="ls-flow" role="img" aria-label="three steps"></div>
    </section></main>`,
    errors,
    warnings,
  });
  const findings = warnings.filter((w) => w.code === "chart_a11y");
  assert.equal(findings.length, 1);
  // strict promotes it
  const strictErrors = [];
  validateAccessibility({
    html: '<div class="ls-chart"></div>',
    strict: true,
    errors: strictErrors,
    warnings: [],
  });
  assert.ok(strictErrors.some((e) => e.code === "chart_a11y"));
});
