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
