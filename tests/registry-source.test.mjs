import assert from "node:assert/strict";
import { createServer } from "node:http";
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

test("RegistrySource times out slow remote reads", async () => {
  const server = createServer((_request, response) => {
    setTimeout(() => {
      response.end("{}\n");
    }, 200);
  });
  await listen(server);
  try {
    const { port } = server.address();
    const source = new RegistrySource({
      registryUrl: `http://127.0.0.1:${port}`,
      fetchTimeoutMs: 50,
    });
    await assert.rejects(source.readJson("registry.json"), /Timed out fetching .* after 50ms/);
  } finally {
    await close(server);
  }
});

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}
