import assert from "node:assert/strict";
import test from "node:test";
import { resolveItems } from "../src/registry/source.mjs";

test("resolveItems returns dependencies before requested items", () => {
  const registry = registryData([
    { name: "core/base" },
    { name: "components/card", registryDependencies: ["core/base"] },
  ]);

  assert.deepEqual(
    resolveItems(registry, ["components/card"]).map((item) => item.name),
    ["core/base", "components/card"],
  );
});

test("resolveItems rejects unknown items", () => {
  assert.throws(() => resolveItems(registryData([]), ["missing/item"]), /Unknown registry item/);
});

test("resolveItems rejects dependency cycles", () => {
  const registry = registryData([
    { name: "a", registryDependencies: ["b"] },
    { name: "b", registryDependencies: ["a"] },
  ]);

  assert.throws(() => resolveItems(registry, ["a"]), /Circular registry dependency/);
});

function registryData(items) {
  return { byName: new Map(items.map((item) => [item.name, item])) };
}
