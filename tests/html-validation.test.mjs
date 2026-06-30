import assert from "node:assert/strict";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { validateCommand } from "../src/cli/commands.mjs";

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
