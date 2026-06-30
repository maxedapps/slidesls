import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { validateRegistry } from "../src/validation/registry.mjs";
import { validateExamples } from "../src/validation/examples.mjs";

async function minimalRegistry() {
  const root = await mkdtemp(path.join(os.tmpdir(), "slidesls-authoring-"));
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
    JSON.stringify(
      {
        name: "components/demo",
        type: "ls:component",
        description: "Demo component.",
        files: [{ path: "registry/components/demo/demo.css", type: "registry:style" }],
        registryDependencies: [],
        dependencies: [],
        devDependencies: [],
        docs: "registry/components/demo/README.md",
        authoring: { classGroups: [{ base: "ls-demo" }] },
        snippets: [{ label: "Basic", path: "registry/components/demo/snippets/basic.html" }],
      },
      null,
      2,
    ),
  );
  await writeFile(path.join(root, "registry", "components", "demo", "README.md"), "# demo\n");
  return root;
}

test("registry validation catches authoring classes missing from CSS", async () => {
  const root = await minimalRegistry();
  const itemPath = path.join(root, "registry", "components", "demo", "registry-item.json");
  const metadata = JSON.parse(await readFile(itemPath, "utf8"));
  metadata.authoring.classGroups[0].modifiers = ["ls-demo--missing"];
  await writeFile(itemPath, JSON.stringify(metadata, null, 2));

  const result = await validateRegistry({ registryRoot: root });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.code === "authoring_class_missing_css"));
});

test("example validation fails unsupported real slidesls classes", async () => {
  const root = await minimalRegistry();
  await mkdir(path.join(root, "examples", "bad"), { recursive: true });
  await writeFile(
    path.join(root, "examples", "bad", "index.html"),
    '<main class="ls-demo ls-demo--typo"></main>\n',
  );

  const result = await validateExamples({ root });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.code === "unknown_ls_class"));
});
