import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { initCommand, validateCommand } from "../src/cli/commands.mjs";

const runtimePath = "slidesls/registry/core/base/slide-runtime.js";

test("fresh minimal init validates without missing reveal animation warning", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "slidesls-minimal-valid-"));
  await initCommand([root, "--template", "minimal"]);
  const result = await validateCommand([root]);
  assert.equal(result.data.valid, true);
  assert.equal(
    result.data.warnings.some(
      (entry) =>
        entry.code === "missing_registry_item_for_class" && /animations\/reveal/.test(entry.hint),
    ),
    false,
  );
});

test("validate warns for slide-kind layout misuse", async () => {
  const root = await deckWithHtml(
    `<script type="module" src="./${runtimePath}"></script>`,
    `<div class="ls-slide__inner"><div class="ls-slide-fill"><p>Centered content</p></div></div>`,
    `data-ls-slide-kind="content"`,
  );
  const result = await validateCommand([root]);
  assert.equal(result.data.valid, true);
  assert.ok(
    result.data.warnings.some((warning) => warning.code === "content_slide_full_height_layout"),
  );
});

test("validate warns for unmarked full-slide centered layouts", async () => {
  const root = await deckWithHtml(
    `<script type="module" src="./${runtimePath}"></script>`,
    `<div class="ls-slide__inner"><div class="ls-center ls-slide-fill"><p>Section</p></div></div>`,
  );
  const result = await validateCommand([root]);
  assert.equal(result.data.valid, true);
  assert.ok(result.data.warnings.some((warning) => warning.code === "missing_slide_kind"));
});

test("validate warns for invalid slide kind and ignores plain unmarked slides", async () => {
  const invalid = await deckWithHtml(
    `<script type="module" src="./${runtimePath}"></script>`,
    `<div class="ls-slide__inner"><header class="ls-slide__header"><h1 class="ls-title">Title</h1></header></div>`,
    `data-ls-slide-kind="intro"`,
  );
  const invalidResult = await validateCommand([invalid]);
  assert.ok(invalidResult.data.warnings.some((warning) => warning.code === "invalid_slide_kind"));

  const plain = await deckWithHtml(
    `<script type="module" src="./${runtimePath}"></script>`,
    `<div class="ls-slide__inner"><header class="ls-slide__header"><h1 class="ls-title">Title</h1></header></div>`,
  );
  const plainResult = await validateCommand([plain]);
  assert.equal(
    plainResult.data.warnings.some((warning) => warning.code === "missing_slide_kind"),
    false,
  );
});

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
  const warning = result.data.warnings.find(
    (entry) => entry.code === "missing_registry_item_for_class",
  );
  assert.ok(warning);
  assert.match(warning.hint, /slidesls add utilities\/layout/);
  assert.match(warning.command, /--dry-run --json/);
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

test("validate warns for unknown slidesls classes and strict mode errors", async () => {
  const root = await deckWithHtml(
    `<script type="module" src="./${runtimePath}"></script>`,
    `<div class="ls-grdi" data-ls-theme="ls-not-a-class"><code>&lt;div class=&quot;ls-also-not-real&quot;&gt;</code></div>`,
  );
  const result = await validateCommand([root]);
  assert.equal(result.data.valid, true);
  const unknownWarning = result.data.warnings.find(
    (warning) => warning.code === "unknown_ls_class",
  );
  assert.ok(unknownWarning);
  assert.match(unknownWarning.hint, /slidesls catalog --api --json/);
  assert.ok(result.data.warnings.some((warning) => warning.className === "ls-grdi"));
  assert.ok(!result.data.warnings.some((warning) => warning.className === "ls-not-a-class"));
  assert.ok(!result.data.warnings.some((warning) => warning.className === "ls-also-not-real"));

  const strict = await validateCommand([root, "--strict"]);
  assert.equal(strict.data.valid, false);
  assert.ok(strict.data.errors.some((error) => error.code === "unknown_ls_class"));
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

test("validate warns for broken progress structure and strict mode errors", async () => {
  const root = await deckWithHtml(
    `<script type="module" src="./${runtimePath}"></script>`,
    `<div class="ls-progress" style="--ls-progress-value: 60%"><span class="ls-progress__label">Progress</span></div>`,
  );
  const result = await validateCommand([root]);
  assert.equal(result.data.valid, true);
  assert.ok(result.data.warnings.some((warning) => warning.code === "progress_structure"));

  const strict = await validateCommand([root, "--strict"]);
  assert.equal(strict.data.valid, false);
  assert.ok(strict.data.errors.some((error) => error.code === "progress_structure"));
});

test("validate still checks broken custom progress when native progress also exists", async () => {
  const root = await deckWithHtml(
    `<script type="module" src="./${runtimePath}"></script>`,
    `<progress class="ls-progress" value="50" max="100"></progress><div class="ls-progress"><span class="ls-progress__label">Broken</span></div>`,
  );
  const result = await validateCommand([root]);
  assert.equal(result.data.valid, true);
  assert.ok(result.data.warnings.some((warning) => warning.code === "progress_structure"));
});

test("validate warns for raw timeline shorthand", async () => {
  const root = await deckWithHtml(
    `<script type="module" src="./${runtimePath}"></script>`,
    `<ol class="ls-timeline"><li class="ls-timeline__item"><strong>Plan</strong><span>Choose.</span></li></ol>`,
  );
  const result = await validateCommand([root]);
  assert.equal(result.data.valid, true);
  assert.ok(result.data.warnings.some((warning) => warning.code === "timeline_structure"));
});

test("validate warns for invalid reveal animation combinations", async () => {
  const root = await deckWithHtml(
    `<script type="module" src="./${runtimePath}"></script>`,
    `<p class="ls-reveal-highlight" data-step="1">Highlight</p><p class="ls-reveal-fade" data-step="2">Missing base</p><p class="ls-reveal ls-reveal-fade ls-reveal-slide-up" data-step="3">Too many</p>`,
  );
  const result = await validateCommand([root]);
  assert.equal(result.data.valid, true);
  assert.ok(
    result.data.warnings.some((warning) => warning.code === "reveal_highlight_without_reveal"),
  );
  assert.ok(
    result.data.warnings.some((warning) => warning.code === "reveal_variant_without_reveal"),
  );
  assert.ok(
    result.data.warnings.some((warning) => warning.code === "multiple_reveal_transform_variants"),
  );
});

test("validate checks srcset, poster, inline style URLs, and stylesheet URLs", async () => {
  const root = await deckWithHtml(
    `<link rel="stylesheet" href="./styles/main.css" /><script type="module" src="./${runtimePath}"></script>`,
    `<img srcset="assets/missing-small.png 1x, https://example.com/remote.png 2x" alt="" />
     <video poster="assets/missing-poster.png"></video>
     <div style="background-image: url('assets/missing-bg.png')"></div>`,
  );
  await mkdir(path.join(root, "styles"), { recursive: true });
  await writeFile(
    path.join(root, "styles", "main.css"),
    `.hero { background: url('../assets/missing-css.png'); }`,
  );

  const result = await validateCommand([root]);
  assert.equal(result.data.valid, false);
  const messages = result.data.errors.map((error) => error.message).join("\n");
  assert.match(messages, /missing-small\.png/);
  assert.match(messages, /missing-poster\.png/);
  assert.match(messages, /missing-bg\.png/);
  assert.match(messages, /missing-css\.png/);
});

test("validate ignores removed layout and HTML examples inside non-rendered code blocks", async () => {
  const root = await deckWithHtml(
    `<script type="module" src="./${runtimePath}"></script>`,
    `<pre><code>&lt;div class=&quot;ls-layout-detail-split&quot;&gt;&lt;/div&gt;</code></pre>
     <pre><img src="missing.png"><button><i data-lucide="menu"></i></button><ol class="ls-timeline"><li class="ls-timeline__item"><strong>Raw</strong><span>Example</span></li></ol></pre>`,
  );
  const result = await validateCommand([root]);
  assert.equal(result.data.valid, true);
  assert.ok(!result.data.errors.some((error) => error.code === "removed_layout_class"));
  assert.ok(!result.data.warnings.some((warning) => warning.code === "image_missing_alt"));
  assert.ok(!result.data.warnings.some((warning) => warning.code === "timeline_structure"));
});

test("validate warns for copied registry CSS that is not loaded", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "slidesls-load-tags-"));
  await initCommand([root, "--template", "blank"]);
  const htmlPath = path.join(root, "index.html");
  const html = await readFile(htmlPath, "utf8");
  await writeFile(htmlPath, html.replace(/.*icons\.css.*\n/, ""));

  const result = await validateCommand([root]);
  assert.equal(result.data.valid, true);
  assert.ok(result.data.warnings.some((warning) => warning.code === "copied_asset_not_loaded"));
});

test("validate warns for accessibility issues and strict mode escalates", async () => {
  const root = await deckWithHtml(
    `<script type="module" src="./${runtimePath}"></script>`,
    `<img src="assets/pic.png"><button><i data-lucide="menu"></i></button>`,
  );
  await mkdir(path.join(root, "assets"), { recursive: true });
  await writeFile(path.join(root, "assets", "pic.png"), "image");

  const result = await validateCommand([root]);
  assert.equal(result.data.valid, true);
  assert.ok(result.data.warnings.some((warning) => warning.code === "image_missing_alt"));
  assert.ok(result.data.warnings.some((warning) => warning.code === "control_accessible_name"));

  const strict = await validateCommand([root, "--strict"]);
  assert.equal(strict.data.valid, false);
  assert.ok(strict.data.errors.some((error) => error.code === "image_missing_alt"));
});

test("validate strict keeps structural accessible-name guidance as warnings", async () => {
  const root = await deckWithHtml(`<script type="module" src="./${runtimePath}"></script>`);
  const strict = await validateCommand([root, "--strict"]);
  assert.equal(strict.data.valid, true);
  assert.ok(strict.data.warnings.some((warning) => warning.code === "deck_accessible_name"));
});

test("validate reports registry source hint without fetching remote manifest registry by default", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "slidesls-registry-source-"));
  await initCommand([root, "--template", "blank"]);
  const manifestPath = path.join(root, "slidesls", "manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  manifest.registrySource = { mode: "remote", url: "https://example.invalid/slidesls" };
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));

  const result = await validateCommand([root]);
  assert.equal(result.data.valid, true);
  assert.equal(result.data.registrySourceUsed.mode, "local");
  assert.match(result.data.registrySourceHint, /default validation stays offline/);
});

test("validate warns when discovering an ancestor config from a nested start path", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "slidesls-ancestor-"));
  await initCommand([root, "--template", "blank"]);
  const nested = path.join(root, "nested");
  await mkdir(nested);

  const result = await validateCommand([nested]);
  assert.equal(result.data.valid, true);
  assert.equal(result.data.configDiscovery, "ancestor");
  assert.ok(result.data.warnings.some((warning) => warning.code === "ancestor_config_discovered"));
});

test("validate warns for very large code blocks", async () => {
  const code = Array.from({ length: 20 }, (_, index) => `const value${index} = ${index};`).join(
    "\n",
  );
  const root = await deckWithHtml(
    `<script type="module" src="./${runtimePath}"></script>`,
    `<pre class="ls-code-block"><code>${code}</code></pre>`,
  );
  const result = await validateCommand([root]);
  assert.equal(result.data.valid, true);
  assert.ok(result.data.warnings.some((warning) => warning.code === "large_code_block"));
});

test("freshly generated decks validate with zero errors and zero warnings", async () => {
  for (const template of ["minimal", "blank"]) {
    const root = await mkdtemp(path.join(os.tmpdir(), `slidesls-fresh-${template}-`));
    await initCommand([root, "--template", template]);
    const result = await validateCommand([root]);
    assert.equal(result.data.valid, true, `${template} deck should be valid`);
    assert.deepEqual(
      result.data.warnings,
      [],
      `${template} deck should have zero warnings, got: ${JSON.stringify(result.data.warnings)}`,
    );
  }
});

test("validate still warns when a copied runtime script is not loaded", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "slidesls-unloaded-script-"));
  await initCommand([root, "--template", "minimal"]);
  const entryPath = path.join(root, "index.html");
  const html = await readFile(entryPath, "utf8");
  await writeFile(entryPath, html.replace(/^.*slide-runtime\.js.*\n/m, ""));

  const result = await validateCommand([root]);
  assert.ok(
    result.data.warnings.some(
      (warning) =>
        warning.code === "copied_asset_not_loaded" && /slide-runtime\.js/.test(warning.message),
    ),
  );
});

test("validate detects loaded module scripts for items missing from the manifest", async () => {
  const root = await deckWithHtml(`<script type="module" src="./${runtimePath}"></script>`);
  await writeFile(
    path.join(root, "slidesls", "manifest.json"),
    JSON.stringify(
      { schemaVersion: 2, baseDir: "slidesls", dependencyOrder: [], links: [], scripts: [] },
      null,
      2,
    ),
  );

  const result = await validateCommand([root]);
  assert.ok(
    result.data.warnings.some(
      (warning) =>
        warning.code === "loaded_asset_missing_manifest_item" && warning.item === "core/base",
    ),
  );
});

async function deckWithHtml(runtimeScript, slideContent = "", slideAttributes = "") {
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
    <section class="ls-slide"${slideAttributes ? ` ${slideAttributes}` : ""}>${slideContent}</section>
  </main>
  ${runtimeScript}
</body>
</html>
`,
  );
  return root;
}
