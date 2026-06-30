import assert from "node:assert/strict";
import test from "node:test";
import { groupName, renderCatalog } from "../src/registry/catalog-doc.mjs";

test("groupName supports current ls-prefixed registry types", () => {
  assert.equal(groupName("ls:core"), "Core");
  assert.equal(groupName("ls:layout"), "Layouts");
  assert.equal(groupName("ls:component"), "Components");
  assert.equal(groupName("ls:animation"), "Animations");
  assert.equal(groupName("ls:preset"), "Presets");
});

test("groupName keeps compatibility with bare historical types", () => {
  assert.equal(groupName("core"), "Core");
  assert.equal(groupName("layout"), "Layouts");
  assert.equal(groupName("component"), "Components");
  assert.equal(groupName("animation"), "Animations");
  assert.equal(groupName("preset/font"), "Presets");
});

test("renderCatalog emits typed sections for ls-prefixed items", () => {
  const markdown = renderCatalog({
    items: [
      item("core/base", "ls:core"),
      item("layouts/title", "ls:layout"),
      item("components/card", "ls:component"),
      item("animations/reveal", "ls:animation"),
      item("presets/dark", "ls:preset"),
    ],
  });

  for (const heading of ["Core", "Layouts", "Components", "Animations", "Presets"]) {
    assert.match(markdown, new RegExp(`^## ${heading}$`, "m"));
  }
  assert.doesNotMatch(markdown, /^## Other$/m);
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
  };
}
