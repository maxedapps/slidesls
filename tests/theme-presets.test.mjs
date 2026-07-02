import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";
import { validateRegistry } from "../src/validation/registry.mjs";

const execFileAsync = promisify(execFile);
const bin = path.resolve("bin/slidesls.mjs");
const themes = ["executive-blue", "clean-light", "boardroom-navy", "technical-deep", "playful-ink"];

test("theme presets expose metadata and are tag-filterable", async () => {
  const catalog = JSON.parse(
    (await run(["catalog", "--type", "preset", "--tag", "theme", "--json"])).stdout,
  );
  assert.equal(catalog.ok, true);
  assert.deepEqual(
    themes
      .map((theme) => `presets/themes/${theme}`)
      .every((name) => catalog.data.items.some((item) => item.name === name)),
    true,
  );

  const inspect = JSON.parse(
    (await run(["inspect", "presets/themes/technical-deep", "--json"])).stdout,
  );
  const theme = inspect.data.items.at(-1);
  assert.equal(theme.themeAttribute, "technical-deep");
  assert.equal(theme.styleTone, "technical deep dark");
  assert.ok(theme.pairsWith.includes("presets/fonts/technical-mono"));
});

test("add theme copies theme CSS and prints application guidance", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "slidesls-theme-add-"));
  const result = JSON.parse(
    (await run(["add", "presets/themes/executive-blue", "--dir", root, "--json"])).stdout,
  );
  assert.equal(result.ok, true);
  assert.equal(result.data.applyTheme.themeAttribute, "executive-blue");
  assert.ok(
    result.data.links.some((link) =>
      link.includes("registry/presets/themes/executive-blue/theme.css"),
    ),
  );
  await readFile(
    path.join(root, "slidesls", "registry", "presets", "themes", "executive-blue", "theme.css"),
    "utf8",
  );

  const text = (await run(["add", "presets/themes/technical-deep", "--dir", root, "--dry-run"]))
    .stdout;
  assert.match(text, /data-ls-theme="technical-deep"/);
  assert.match(text, /<html>/);
});

test("init --theme copies theme CSS and sets html attribute/link", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "slidesls-theme-init-"));
  const result = JSON.parse(
    (await run(["init", root, "--template", "blank", "--theme", "executive-blue", "--json"]))
      .stdout,
  );
  assert.equal(result.ok, true);
  assert.equal(result.data.theme, "executive-blue");

  const html = await readFile(path.join(root, "index.html"), "utf8");
  assert.match(html, /<html lang="en" data-ls-theme="executive-blue">/);
  assert.match(html, /registry\/presets\/themes\/executive-blue\/theme\.css/);
  await readFile(
    path.join(root, "slidesls", "registry", "presets", "themes", "executive-blue", "theme.css"),
    "utf8",
  );
});

test("init --theme rejects unknown themes clearly", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "slidesls-theme-invalid-"));
  await assert.rejects(run(["init", root, "--theme", "does-not-exist"]), (error) => {
    assert.equal(error.code, 2);
    assert.match(error.stderr, /Unknown theme preset/);
    return true;
  });
});

test("theme token refactor keeps key component styles tokenized", async () => {
  const expectations = [
    ["registry/core/base/slide.css", "background-image: var(--ls-page-bg-image)"],
    ["registry/core/base/slide.css", "background-color: var(--ls-print-bg)"],
    ["registry/components/code-block/code-block.css", "background: var(--ls-code-bg)"],
    ["registry/components/code-block/code-block.css", "color: var(--ls-code-text)"],
    ["registry/components/table/table.css", "background: var(--ls-table-stripe-bg)"],
    ["registry/components/progress/progress.css", "var(--ls-progress-accent-2)"],
    ["registry/components/callout/callout.css", "var(--ls-status-warning)"],
  ];
  for (const [file, snippet] of expectations) {
    assert.match(await readFile(path.resolve(file), "utf8"), new RegExp(escapeRegExp(snippet)));
  }
});

test("registry validation enforces theme metadata convention", async () => {
  const result = await validateRegistry();
  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
});

async function run(args) {
  return execFileAsync(process.execPath, [bin, ...args], {
    cwd: path.resolve("."),
    maxBuffer: 1024 * 1024,
  });
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
