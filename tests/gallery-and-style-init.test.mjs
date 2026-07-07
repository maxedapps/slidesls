import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, readdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";
import { galleryCommand } from "../src/cli/gallery-command.mjs";

const execFileAsync = promisify(execFile);
const bin = path.resolve("bin/slidesls.mjs");

test("gallery generates style × density pages for every snippet", async () => {
  const out = await mkdtemp(path.join(os.tmpdir(), "slidesls-gallery-"));
  const result = await galleryCommand(["--out", out, "--json"]);
  assert.equal(result.ok, true);
  assert.ok(result.data.styles.includes("styles/editorial"));

  const pages = (await readdir(out)).filter((file) => file.endsWith(".html"));
  assert.ok(pages.includes("index.html"));
  assert.ok(pages.includes("default--default.html"));
  assert.ok(pages.includes("editorial--compact.html"));

  const editorial = await readFile(path.join(out, "editorial--default.html"), "utf8");
  assert.ok(editorial.includes('data-ls-style="editorial"'));
  assert.ok(editorial.includes("registry/styles/editorial/style.css"));
  assert.ok(editorial.includes("registry/fonts/fraunces/font.css"));
  // Fragment snippets get wrapped into full measured slides.
  assert.ok(editorial.includes('aria-label="components/badge (Basic badge)"'));

  const compact = await readFile(path.join(out, "default--compact.html"), "utf8");
  assert.ok(compact.includes('data-ls-density="compact"'));
});

test("init --style produces a valid deck with fonts, style link, and activation", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "slidesls-style-init-"));
  const init = JSON.parse(
    (
      await execFileAsync(process.execPath, [
        bin,
        "init",
        root,
        "--template",
        "minimal",
        "--style",
        "editorial",
        "--json",
      ])
    ).stdout,
  );
  assert.equal(init.ok, true);
  assert.equal(init.data.style, "editorial");
  assert.ok(init.data.items.includes("fonts/fraunces"));

  const html = await readFile(path.join(root, "index.html"), "utf8");
  assert.ok(html.includes('data-ls-style="editorial"'));
  assert.ok(html.includes("registry/styles/editorial/style.css"));
  assert.ok(html.includes("registry/fonts/newsreader/font.css"));
  assert.ok(html.includes('<svg class="ls-sprite" aria-hidden="true">'));
  assert.ok(html.includes('<script defer src="./slidesls/registry/core/base/slide-runtime.js">'));

  const validation = JSON.parse(
    (await execFileAsync(process.execPath, [bin, "validate", root, "--json"])).stdout,
  );
  assert.equal(validation.data.valid, true);
  assert.deepEqual(validation.data.errors, []);
  assert.deepEqual(validation.data.warnings, []);
});

test("init rejects --theme with --style", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "slidesls-style-conflict-"));
  const failure = await execFileAsync(process.execPath, [
    bin,
    "init",
    root,
    "--theme",
    "clean-light",
    "--style",
    "editorial",
    "--json",
  ]).catch((error) => error);
  assert.equal(failure.code, 2);
  const parsed = JSON.parse(failure.stdout);
  assert.equal(parsed.ok, false);
  assert.equal(parsed.error.code, "usage_error");
  assert.match(parsed.error.message, /--theme was removed/);
  assert.match(parsed.error.hint, /--style <name>/);
});
