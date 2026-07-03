import assert from "node:assert/strict";
import test from "node:test";
import { groupName, renderCatalog } from "../src/registry/catalog-doc.mjs";

test("groupName supports current ls-prefixed registry types", () => {
  assert.equal(groupName("ls:core"), "Core");
  assert.equal(groupName("ls:utility"), "Utilities");
  assert.equal(groupName("ls:component"), "Components");
  assert.equal(groupName("ls:animation"), "Animations");
  assert.equal(groupName("ls:preset"), "Presets");
  assert.equal(groupName("ls:template"), "Templates");
});

test("groupName keeps compatibility with bare internal types", () => {
  assert.equal(groupName("core"), "Core");
  assert.equal(groupName("utility"), "Utilities");
  assert.equal(groupName("component"), "Components");
  assert.equal(groupName("animation"), "Animations");
  assert.equal(groupName("preset/font"), "Presets");
  assert.equal(groupName("template"), "Templates");
});

test("renderCatalog emits typed sections for current item types", () => {
  const markdown = renderCatalog({
    items: [
      item("core/base", "ls:core"),
      item("utilities/layout", "ls:utility"),
      item("components/card", "ls:component"),
      item("animations/reveal", "ls:animation"),
      item("presets/dark", "ls:preset"),
      item("templates/split", "ls:template"),
    ],
  });

  for (const heading of ["Core", "Utilities", "Components", "Animations", "Presets", "Templates"]) {
    assert.match(markdown, new RegExp(`^## ${heading}$`, "m"));
  }
  assert.match(markdown, /Deep reference/);
  assert.match(markdown, /- Agent level: recommended/);
  assert.match(markdown, /- Class groups:/);
  assert.match(markdown, /`ls-grid--4`/);
  assert.match(markdown, /`ls-slide-fill`: scope `direct-child-of-slide-inner`, safe anywhere no/);
  assert.match(markdown, /- Data attributes: `data-ls-tone=success\|warning`/);
  assert.doesNotMatch(markdown, /^## Layouts$/m);
  assert.doesNotMatch(markdown, /^## Other$/m);
});

test("renderCatalog emits composition blocks and enriched CSS variables", () => {
  const enriched = {
    ...item("templates/three-cards", "ls:template"),
    composition: {
      contentDensity: ["balanced"],
      layoutBehavior: "content-sized",
      itemCountGuidance: "3 cards; for 4-6 short items use templates/icon-grid.",
      copyGuidance: "2-4 sentences per card.",
      avoidWhen: ["each card has only a one-liner"],
      alternatives: [{ when: "4-6 short items", use: "templates/icon-grid" }],
    },
    authoring: {
      cssVariables: [
        "--ls-legacy-var",
        { name: "--ls-card-padding", default: "24px", overrideSafe: true },
        { name: "--ls-slide-width", default: "1600px", overrideSafe: false },
      ],
    },
  };
  const markdown = renderCatalog({ items: [enriched] });
  assert.match(markdown, /- Composition:/);
  assert.match(markdown, /- Content density: balanced/);
  assert.match(markdown, /- Layout behavior: content-sized/);
  assert.match(markdown, /- Avoid when:/);
  assert.match(markdown, /each card has only a one-liner/);
  assert.match(markdown, /4-6 short items: `templates\/icon-grid`/);
  assert.match(markdown, /`--ls-legacy-var`/);
  assert.match(markdown, /`--ls-card-padding` \(default 24px, override-safe\)/);
  assert.match(markdown, /`--ls-slide-width` \(default 1600px, not override-safe\)/);
});

test("renderCatalog omits the composition block for items without one", () => {
  const markdown = renderCatalog({ items: [item("components/card", "ls:component")] });
  assert.doesNotMatch(markdown, /- Composition:/);
});

function item(name, type) {
  return {
    name,
    label: name,
    title: name,
    type,
    description: "test item",
    tags: [],
    files: [],
    authoring:
      name === "utilities/layout"
        ? {
            classGroups: [{ base: "ls-grid", modifiers: ["ls-grid--4"] }],
            classes: ["ls-slide-fill"],
            classMetadata: {
              "ls-slide-fill": {
                scopeType: "direct-child-of-slide-inner",
                safeAnywhere: false,
                description: "Full-slide layout.",
              },
            },
            usage: ["Use one grid modifier."],
          }
        : name === "components/card"
          ? { dataAttributes: [{ name: "data-ls-tone", values: ["success", "warning"] }] }
          : null,
    agentLevel: "recommended",
    agentRecommended: true,
    safeAnywhere: true,
    snippets: [],
  };
}
