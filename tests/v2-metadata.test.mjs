import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { validateRegistry } from "../src/validation/registry.mjs";

async function minimalRegistry() {
  const root = await mkdtemp(path.join(os.tmpdir(), "slidesls-v2-meta-"));
  await mkdir(path.join(root, "registry", "components", "demo", "snippets"), { recursive: true });
  await writeFile(
    path.join(root, "registry.json"),
    JSON.stringify({ items: ["registry/components/demo/registry-item.json"] }, null, 2),
  );
  await writeFile(
    path.join(root, "registry", "components", "demo", "demo.css"),
    ".ls-demo { color: red; }\n",
  );
  await writeFile(
    path.join(root, "registry", "components", "demo", "snippets", "basic.html"),
    '<div class="ls-demo"></div>\n',
  );
  await writeFile(
    path.join(root, "registry", "components", "demo", "registry-item.json"),
    JSON.stringify({
      name: "components/demo",
      type: "ls:component",
      description: "Demo component.",
      files: [{ path: "registry/components/demo/demo.css", type: "registry:style" }],
      registryDependencies: [],
      dependencies: [],
      devDependencies: [],
      docs: "registry/components/demo/README.md",
      agentLevel: "recommended",
      authoring: { classGroups: [{ base: "ls-demo" }] },
      snippets: [{ label: "Basic", path: "registry/components/demo/snippets/basic.html" }],
    }),
  );
  await writeFile(path.join(root, "registry", "components", "demo", "README.md"), "# demo\n");
  return root;
}

async function mutateAndValidate(mutate) {
  const root = await minimalRegistry();
  const itemPath = path.join(root, "registry", "components", "demo", "registry-item.json");
  const metadata = JSON.parse(await readFile(itemPath, "utf8"));
  mutate(metadata);
  await writeFile(itemPath, JSON.stringify(metadata));
  return validateRegistry({ registryRoot: root });
}

test("schema v2 metadata shapes are validated", async () => {
  for (const [mutate, code] of [
    [(item) => (item.status = "beta"), "invalid_status"],
    [(item) => (item.intent = ["persuade"]), "invalid_intent"],
    [(item) => (item.intent = "open"), "invalid_intent"],
    [(item) => (item.styles = ["styles/editorial"]), "invalid_styles"],
    [(item) => (item.styles = { "styles/unknown": "works" }), "unknown_style_note"],
    [(item) => (item.contract = { steps: { minimum: 3 } }), "invalid_contract"],
    [(item) => (item.contract = { steps: { min: 5, max: 3 } }), "invalid_contract"],
    [(item) => (item.contract = { steps: { minWords: -1 } }), "invalid_contract"],
    [(item) => (item.motion = { kind: "fade" }), "invalid_motion"],
    [(item) => (item.motion = { default: 3 }), "invalid_motion"],
    [(item) => (item.icons = { suggested: "zap" }), "invalid_icons"],
    [(item) => (item.styleAttribute = 4), "invalid_style_attribute"],
    [(item) => (item.pairsWith = ["components/missing"]), "unknown_pairing"],
  ]) {
    const result = await mutateAndValidate(mutate);
    assert.equal(result.valid, false, code);
    assert.ok(
      result.errors.some((error) => error.code === code),
      `${code}: got ${JSON.stringify(result.errors.map((error) => error.code))}`,
    );
  }
});

test("valid v2 metadata passes", async () => {
  const result = await mutateAndValidate((item) => {
    item.status = "preview";
    item.intent = ["open", "prove"];
    item.contract = { steps: { min: 3, max: 5 }, stepTitle: { maxWords: 4 } };
    item.motion = { default: "fade", notes: "settle in" };
    item.icons = { guidance: "sparse", suggested: ["zap"] };
    item.composition = { useWhen: ["opening a narrative"] };
  });
  assert.deepEqual(result.errors, []);
  assert.equal(result.valid, true);
});

test("preview items are hidden from catalog output but stay resolvable", async () => {
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const run = promisify(execFile);
  const bin = path.resolve("bin/slidesls.mjs");

  // The shipped v2 registry currently has no preview items, so exercise the
  // preview gating against a temp registry with one preview-status item.
  const registryRoot = await minimalRegistry();
  await mkdir(path.join(registryRoot, "registry", "components", "sneak"), { recursive: true });
  await writeFile(
    path.join(registryRoot, "registry.json"),
    JSON.stringify(
      {
        items: [
          "registry/components/demo/registry-item.json",
          "registry/components/sneak/registry-item.json",
        ],
      },
      null,
      2,
    ),
  );
  await writeFile(
    path.join(registryRoot, "registry", "components", "sneak", "sneak.css"),
    ".ls-sneak { color: blue; }\n",
  );
  await writeFile(
    path.join(registryRoot, "registry", "components", "sneak", "registry-item.json"),
    JSON.stringify({
      name: "components/sneak",
      type: "ls:component",
      description: "Preview component.",
      status: "preview",
      files: [{ path: "registry/components/sneak/sneak.css", type: "registry:style" }],
      registryDependencies: [],
      dependencies: [],
      devDependencies: [],
      agentLevel: "recommended",
    }),
  );

  const registryArgs = ["--registry-root", registryRoot, "--json"];
  const byDefault = JSON.parse(
    (await run(process.execPath, [bin, "catalog", ...registryArgs])).stdout,
  );
  assert.ok(!byDefault.data.items.some((item) => item.status === "preview"));
  assert.ok(!byDefault.data.items.some((item) => item.name === "components/sneak"));

  const withPreview = JSON.parse(
    (await run(process.execPath, [bin, "catalog", "--preview", ...registryArgs])).stdout,
  );
  assert.ok(withPreview.data.items.some((item) => item.name === "components/sneak"));
  assert.ok(withPreview.data.count > byDefault.data.count);

  const inspect = JSON.parse(
    (await run(process.execPath, [bin, "inspect", "components/sneak", ...registryArgs])).stdout,
  );
  assert.equal(
    inspect.data.items.find((item) => item.name === "components/sneak").name,
    "components/sneak",
  );
});
