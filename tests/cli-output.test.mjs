import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile } from "node:fs/promises";
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
