import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { access, mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);
const bin = path.resolve("bin/slidesls.mjs");

test("add --dry-run text output reports planned copies", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "slidesls-cli-"));
  await run([bin, "init", root, "--template", "minimal"]);

  const { stdout } = await run([bin, "add", "components/card", "--dir", root, "--dry-run"]);
  assert.match(stdout, /Would copy \d+ file\(s\)/);
  assert.doesNotMatch(stdout, /undefined/);
});

test("catalog --json returns an agent-friendly result envelope", async () => {
  const { stdout } = await run([bin, "catalog", "--json"]);
  const result = JSON.parse(stdout);
  assert.equal(result.ok, true);
  assert.equal(typeof result.data.count, "number");
  assert.ok(result.data.items.some((item) => item.name === "core/base"));
  assert.ok(result.data.items.some((item) => item.name === "utilities/layout"));
  assert.equal(
    result.data.items.some((item) => item.name.startsWith("layouts/")),
    false,
  );
});

test("catalog --recommended returns only recommended items", async () => {
  const { stdout } = await run([bin, "catalog", "--recommended", "--json"]);
  const result = JSON.parse(stdout);
  assert.equal(result.ok, true);
  assert.ok(result.data.items.length > 0);
  assert.equal(
    result.data.items.every((item) => item.agentRecommended === true),
    true,
  );
  assert.ok(result.data.items.some((item) => item.name === "utilities/layout"));
  assert.ok(result.data.items.some((item) => item.name === "components/panel"));
  assert.ok(result.data.items.some((item) => item.name === "templates/split"));
});

test("inspect returns snippet HTML for requested templates and components", async () => {
  const template = JSON.parse((await run([bin, "inspect", "templates/split", "--json"])).stdout);
  const requested = template.data.items.find((item) => item.name === "templates/split");
  assert.match(requested.snippets[0].html, /<section class="ls-slide"/);

  const component = JSON.parse((await run([bin, "inspect", "components/card", "--json"])).stdout);
  assert.match(component.data.items.at(-1).snippets[0].html, /class="ls-card"/);
});

test("add without init uses explicit copy mode", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "slidesls-copy-"));
  const dryRun = JSON.parse(
    (await run([bin, "add", "core/base", "--dir", root, "--dry-run", "--json"])).stdout,
  );
  assert.equal(dryRun.ok, true);
  assert.equal(dryRun.data.root, root);
  assert.equal(dryRun.data.configFound, false);
  assert.equal(dryRun.data.mode, "copy");
  assert.equal(dryRun.data.baseDir, "slidesls");

  const real = JSON.parse(
    (await run([bin, "add", "core/base", "--dir", root, "--base-dir", "vendor/slides", "--json"]))
      .stdout,
  );
  assert.equal(real.ok, true);
  assert.equal(real.data.mode, "copy");
  assert.equal(real.data.baseDir, "vendor/slides");
});

test("add --dir does not inherit ancestor config", async () => {
  const parent = await mkdtemp(path.join(os.tmpdir(), "slidesls-parent-"));
  const child = path.join(parent, "child");
  await mkdir(child);
  await run([bin, "init", parent, "--template", "blank"]);

  const result = JSON.parse(
    (await run([bin, "add", "core/base", "--dir", child, "--dry-run", "--json"])).stdout,
  );
  assert.equal(result.ok, true);
  assert.equal(result.data.root, child);
  assert.equal(result.data.mode, "copy");
});

test("catalog --type uses exact normalized type matching", async () => {
  const component = JSON.parse(
    (await run([bin, "catalog", "--type", "component", "--json"])).stdout,
  );
  assert.ok(component.data.items.length > 0);
  assert.equal(
    component.data.items.every((item) => item.type === "ls:component"),
    true,
  );

  const prefixed = JSON.parse(
    (await run([bin, "catalog", "--type", "ls:component", "--json"])).stdout,
  );
  assert.deepEqual(prefixed.data.items, component.data.items);

  const suffix = JSON.parse((await run([bin, "catalog", "--type", "e", "--json"])).stdout);
  assert.equal(suffix.data.items.length, 0);
});

test("add collisions do not partially copy earlier files", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "slidesls-add-collision-"));
  const collision = path.join(root, "slidesls", "registry", "components", "card", "card.css");
  await mkdir(path.dirname(collision), { recursive: true });
  await writeFile(collision, "modified");

  await assert.rejects(run([bin, "add", "components/card", "--dir", root]), (error) => {
    assert.equal(error.code, 1);
    assert.match(error.stderr, /Refusing to overwrite/);
    return true;
  });
  await assert.rejects(
    access(path.join(root, "slidesls", "registry", "core", "base", "tokens.css")),
  );
});

test("init collisions do not write config first", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "slidesls-init-collision-"));
  const collision = path.join(root, "slidesls", "registry", "core", "base", "tokens.css");
  await mkdir(path.dirname(collision), { recursive: true });
  await writeFile(collision, "modified");

  await assert.rejects(run([bin, "init", root, "--template", "blank"]), (error) => {
    assert.equal(error.code, 1);
    assert.match(error.stderr, /Refusing to overwrite/);
    return true;
  });
  await assert.rejects(access(path.join(root, "slidesls.json")));
});

test("add accepts existing identical files", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "slidesls-identical-"));
  const target = path.join(root, "slidesls", "registry", "core", "base", "tokens.css");
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, await readFile(path.resolve("registry/core/base/tokens.css"), "utf8"));

  const result = JSON.parse((await run([bin, "add", "core/base", "--dir", root, "--json"])).stdout);
  assert.equal(result.ok, true);
});

test("template add plans dependencies but not snippet files", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "slidesls-template-"));
  await run([bin, "init", root, "--template", "minimal"]);
  const result = JSON.parse(
    (await run([bin, "add", "templates/split", "--dir", root, "--dry-run", "--json"])).stdout,
  );
  assert.equal(result.ok, true);
  assert.ok(result.data.dependencyOrder.includes("templates/split"));
  assert.equal(
    result.data.files.some((file) => file.targetPath?.endsWith("snippet.html")),
    false,
  );
});

test("removed --registry option fails with a usage error", async () => {
  await assert.rejects(run([bin, "catalog", "--registry", "foo"]), (error) => {
    assert.equal(error.code, 2);
    assert.match(error.stderr, /--registry has been removed/);
    assert.match(error.stderr, /--registry-root <path> or --registry-url <url>/);
    return true;
  });
});

test("canonical help and docs do not mention removed --registry option", async () => {
  const { stdout } = await run([bin, "catalog", "--help"]);
  const docs = await readFile(path.resolve("docs/cli.md"), "utf8");
  assert.doesNotMatch(stdout, /--registry(?!-(?:root|url))/);
  assert.doesNotMatch(docs, /--registry(?!-(?:root|url))/);
});

async function run(args) {
  return execFileAsync(process.execPath, args, { cwd: path.resolve("."), maxBuffer: 1024 * 1024 });
}
