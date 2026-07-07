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
const styles = ["editorial", "terminal", "gallery", "boardroom", "pop"];

test("style presets expose metadata and are type/tag-filterable", async () => {
  const catalog = JSON.parse((await run(["catalog", "--type", "style", "--json"])).stdout);
  assert.equal(catalog.ok, true);
  assert.deepEqual(
    styles
      .map((style) => `styles/${style}`)
      .every((name) => catalog.data.items.some((item) => item.name === name)),
    true,
  );
  assert.equal(
    catalog.data.items.every(
      (item) => typeof item.styleAttribute === "string" && typeof item.motion?.default === "string",
    ),
    true,
  );

  const dark = JSON.parse(
    (await run(["catalog", "--type", "style", "--tag", "dark", "--json"])).stdout,
  );
  assert.ok(dark.data.items.some((item) => item.name === "styles/terminal"));
  assert.ok(dark.data.items.some((item) => item.name === "styles/boardroom"));
  assert.equal(
    dark.data.items.some((item) => item.name === "styles/gallery"),
    false,
  );

  const inspect = JSON.parse((await run(["inspect", "styles/terminal", "--json"])).stdout);
  const style = inspect.data.items.at(-1);
  assert.equal(style.styleAttribute, "terminal");
  assert.match(style.styleTone, /technical/);
  assert.equal(typeof style.motion.default, "string");
});

test("add style copies style CSS plus fonts and returns applyStyle guidance", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "slidesls-style-add-"));
  const result = JSON.parse(
    (await run(["add", "styles/editorial", "--dir", root, "--json"])).stdout,
  );
  assert.equal(result.ok, true);
  assert.deepEqual(result.data.applyStyle, {
    styleAttribute: "editorial",
    item: "styles/editorial",
    element: "html",
  });
  assert.ok(result.data.links.some((link) => link.includes("registry/styles/editorial/style.css")));
  await readFile(
    path.join(root, "slidesls", "registry", "styles", "editorial", "style.css"),
    "utf8",
  );
  await readFile(path.join(root, "slidesls", "registry", "fonts", "fraunces", "font.css"), "utf8");
  await readFile(
    path.join(
      root,
      "slidesls",
      "registry",
      "fonts",
      "fraunces",
      "fraunces-latin-wght-normal.woff2",
    ),
  );

  const dryRun = JSON.parse(
    (await run(["add", "styles/terminal", "--dir", root, "--dry-run", "--json"])).stdout,
  );
  assert.equal(dryRun.data.applyStyle.styleAttribute, "terminal");
  assert.equal(dryRun.data.applyStyle.element, "html");

  const nonStyle = JSON.parse(
    (await run(["add", "components/surface", "--dir", root, "--dry-run", "--json"])).stdout,
  );
  assert.equal(nonStyle.data.applyStyle, null);
});

test("init --theme fails with the removed-theme usage error", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "slidesls-theme-removed-"));
  await assert.rejects(run(["init", root, "--theme", "executive-blue"]), (error) => {
    assert.equal(error.code, 2);
    assert.match(error.stderr, /--theme was removed: themes were replaced by v2 styles/);
    assert.match(error.stderr, /--style <name>/);
    return true;
  });

  const jsonFailure = await run(["init", root, "--theme", "executive-blue", "--json"]).catch(
    (error) => error,
  );
  assert.equal(jsonFailure.code, 2);
  const parsed = JSON.parse(jsonFailure.stdout);
  assert.equal(parsed.ok, false);
  assert.equal(parsed.error.code, "usage_error");
  assert.match(parsed.error.message, /--theme was removed/);
});

test("init --style rejects unknown styles clearly", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "slidesls-style-invalid-"));
  await assert.rejects(run(["init", root, "--style", "does-not-exist"]), (error) => {
    assert.equal(error.code, 2);
    assert.match(error.stderr, /Unknown style/);
    assert.match(error.stderr, /catalog --type style --json/);
    return true;
  });
});

test("style token refactor keeps key component styles tokenized", async () => {
  const expectations = [
    ["registry/core/base/slide.css", "background-image: var(--ls-page-bg-image)"],
    ["registry/core/base/slide.css", "background-color: var(--ls-print-bg)"],
    ["registry/components/code/code.css", "background: var(--ls-code-bg)"],
    ["registry/components/code/code.css", "color: var(--ls-code-text)"],
    ["registry/components/table/table.css", "background: var(--ls-table-stripe-bg)"],
    ["registry/components/progress/progress.css", "var(--ls-progress-accent-2)"],
    ["registry/components/surface/surface.css", "var(--ls-status-warning)"],
  ];
  for (const [file, snippet] of expectations) {
    assert.match(await readFile(path.resolve(file), "utf8"), new RegExp(escapeRegExp(snippet)));
  }
});

test("registry validation enforces style metadata convention", async () => {
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
