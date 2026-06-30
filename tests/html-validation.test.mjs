import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { initCommand, validateCommand } from "../src/cli/commands.mjs";

const runtimePath = "slidesls/registry/core/base/slide-runtime.js";

test("validate accepts module runtime script with type before src", async () => {
  const root = await deckWithHtml(`<script type="module" src="./${runtimePath}"></script>`);
  const result = await validateCommand([root]);
  assert.equal(result.data.valid, true);
});

test("validate accepts module runtime script with src before type", async () => {
  const root = await deckWithHtml(`<script src="./${runtimePath}" type="module"></script>`);
  const result = await validateCommand([root]);
  assert.equal(result.data.valid, true);
});

test("validate rejects non-module runtime script", async () => {
  const root = await deckWithHtml(`<script src="./${runtimePath}"></script>`);
  const result = await validateCommand([root]);
  assert.equal(result.data.valid, false);
  assert.ok(result.data.errors.some((error) => error.code === "missing_runtime"));
});

test("validate warns for data-lucide icons without Lucide script", async () => {
  const root = await deckWithHtml(
    `<script type="module" src="./${runtimePath}"></script>`,
    `<i data-lucide="copy"></i>`,
  );
  const result = await validateCommand([root]);
  assert.equal(result.data.valid, true);
  assert.ok(result.data.warnings.some((warning) => warning.code === "lucide_missing"));
});

test("validate does not warn when a Lucide script is present", async () => {
  const root = await deckWithHtml(
    `<script src="https://unpkg.com/lucide@latest"></script><script type="module" src="./${runtimePath}"></script>`,
    `<i data-lucide="copy"></i>`,
  );
  const result = await validateCommand([root]);
  assert.equal(result.data.valid, true);
  assert.ok(!result.data.warnings.some((warning) => warning.code === "lucide_missing"));
});

test("validate warns when utility classes are used without their registry item", async () => {
  const root = await deckWithHtml(
    `<script type="module" src="./${runtimePath}"></script>`,
    `<div class="ls-grid ls-grid--2"><p>One</p><p>Two</p></div>`,
  );
  const result = await validateCommand([root]);
  assert.equal(result.data.valid, true);
  assert.ok(
    result.data.warnings.some((warning) => warning.code === "missing_registry_item_for_class"),
  );
});

test("validate accepts percent-encoded local asset paths", async () => {
  const root = await deckWithHtml(
    `<script type="module" src="./${runtimePath}"></script>`,
    `<img src="assets/My%20Image.png?cache=1#hero" alt="" />`,
  );
  await mkdir(path.join(root, "assets"), { recursive: true });
  await writeFile(path.join(root, "assets", "My Image.png"), "image");
  const result = await validateCommand([root]);
  assert.equal(result.data.valid, true);
  assert.ok(!result.data.errors.some((error) => error.code === "missing_asset"));
});

test("validate rejects encoded traversal local asset paths", async () => {
  const root = await deckWithHtml(
    `<script type="module" src="./${runtimePath}"></script>`,
    `<img src="..%2fsecret.txt" alt="" />`,
  );
  const result = await validateCommand([root]);
  assert.equal(result.data.valid, false);
  assert.ok(result.data.errors.some((error) => error.code === "asset_outside_project"));
});

test("validate reports customized copied files separately from warnings", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "slidesls-drift-"));
  await initCommand([root, "--template", "blank"]);
  await writeFile(path.join(root, "slidesls", "registry", "core", "base", "tokens.css"), "custom");

  const result = await validateCommand([root]);
  assert.equal(result.data.valid, true);
  assert.equal(
    result.data.warnings.some((warning) => warning.code === "manifest_hash_drift"),
    false,
  );
  assert.ok(
    result.data.customizedFiles.some((file) =>
      file.targetPath.endsWith("registry/core/base/tokens.css"),
    ),
  );

  const strict = await validateCommand([root, "--strict"]);
  assert.equal(strict.data.valid, false);
  assert.ok(strict.data.errors.some((error) => error.code === "manifest_hash_drift"));
});

test("validate still errors when manifest files are missing", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "slidesls-missing-"));
  await initCommand([root, "--template", "blank"]);
  await rm(path.join(root, "slidesls", "registry", "core", "base", "tokens.css"));

  const result = await validateCommand([root]);
  assert.equal(result.data.valid, false);
  assert.ok(result.data.errors.some((error) => error.code === "manifest_missing_file"));
});

test("validate rejects unsafe config entry paths", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "slidesls-config-"));
  await writeFile(
    path.join(root, "slidesls.json"),
    JSON.stringify({ paths: { entry: "../outside.html" } }),
  );
  await assert.rejects(validateCommand([root]), (error) => {
    assert.equal(error.code, "invalid_config_path");
    return true;
  });
});

test("validate rejects removed layout classes", async () => {
  const root = await deckWithHtml(
    `<script type="module" src="./${runtimePath}"></script>`,
    `<div class="ls-layout-detail-split"></div>`,
  );
  const result = await validateCommand([root]);
  assert.equal(result.data.valid, false);
  assert.ok(result.data.errors.some((error) => error.code === "removed_layout_class"));
});

async function deckWithHtml(runtimeScript, slideContent = "") {
  const root = await mkdtemp(path.join(os.tmpdir(), "slidesls-validate-"));
  await writeFile(
    path.join(root, "slidesls.json"),
    JSON.stringify({ paths: { entry: "index.html", items: "slidesls" } }, null, 2),
  );
  await mkdir(path.join(root, path.dirname(runtimePath)), { recursive: true });
  await writeFile(path.join(root, runtimePath), "export {};\n");
  await writeFile(
    path.join(root, "index.html"),
    `<!doctype html>
<html>
<body class="ls-page">
  <main data-ls-deck class="ls-deck">
    <section class="ls-slide">${slideContent}</section>
  </main>
  ${runtimeScript}
</body>
</html>
`,
  );
  return root;
}
