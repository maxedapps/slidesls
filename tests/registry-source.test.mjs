import assert from "node:assert/strict";
import test from "node:test";
import { RegistrySource } from "../src/registry/source.mjs";

test("RegistrySource describes remote URL sources", () => {
  const source = new RegistrySource({ registryUrl: "https://example.com/registry" });
  assert.deepEqual(source.describe(), { mode: "remote", url: "https://example.com/registry" });
});

test("RegistrySource describes explicit local root sources", () => {
  const source = new RegistrySource({ registryRoot: "." });
  assert.equal(source.describe().mode, "local");
  assert.ok(source.describe().root.endsWith("ls_slides"));
});

test("RegistrySource prefers explicit local root over URL", () => {
  const source = new RegistrySource({ registryRoot: ".", registryUrl: "https://example.com" });
  assert.equal(source.describe().mode, "local");
});
