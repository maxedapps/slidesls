import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { lstat, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(".");
const bin = path.join(repoRoot, "bin/slidesls.mjs");

async function run(args, options = {}) {
  return execFileAsync(process.execPath, [bin, ...args], {
    cwd: repoRoot,
    maxBuffer: 1024 * 1024,
    ...options,
  });
}

test("root and skill help expose skill commands", async () => {
  const rootHelp = await run(["--help"]);
  assert.match(rootHelp.stdout, /skill\s+Show, install, or link/);

  const skillHelp = await run(["skill", "--help"]);
  assert.match(skillHelp.stdout, /slidesls skill info/);
  assert.match(skillHelp.stdout, /slidesls skill show/);
  assert.match(skillHelp.stdout, /slidesls skill install/);
  assert.match(skillHelp.stdout, /slidesls skill link/);
});

test("skill info and show expose bundled skill metadata", async () => {
  const { stdout: infoStdout } = await run(["skill", "info", "--json"]);
  const info = JSON.parse(infoStdout);
  assert.equal(info.ok, true);
  assert.equal(info.data.name, "slidesls");
  assert.ok(info.data.files.some((file) => file.path === "SKILL.md"));
  assert.ok(info.data.recommendedTargets.includes(".claude/skills/slidesls"));

  const { stdout: showStdout } = await run(["skill", "show"]);
  assert.match(showStdout, /name: slidesls/);
  assert.match(showStdout, /slidesls skill link/);
});

test("skill install copies files and is idempotent", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "slidesls-skill-"));
  const target = path.join(root, "skill");

  const fileCount = JSON.parse((await run(["skill", "info", "--json"])).stdout).data.files.length;
  const { stdout } = await run(["skill", "install", target, "--json"]);
  const result = JSON.parse(stdout);
  assert.equal(result.ok, true);
  assert.equal(result.data.counts.created, fileCount);
  assert.equal(
    await readFile(path.join(target, "SKILL.md"), "utf8").then((text) =>
      /name: slidesls/.test(text),
    ),
    true,
  );

  const second = JSON.parse((await run(["skill", "install", target, "--json"])).stdout);
  assert.equal(second.data.counts.unchanged, fileCount);
});

test("skill install dry-run does not write files", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "slidesls-skill-dry-"));
  const target = path.join(root, "skill");
  const fileCount = JSON.parse((await run(["skill", "info", "--json"])).stdout).data.files.length;
  const result = JSON.parse(
    (await run(["skill", "install", target, "--dry-run", "--json"])).stdout,
  );

  assert.equal(result.ok, true);
  assert.equal(result.data.dryRun, true);
  assert.equal(result.data.counts["would-create"], fileCount);
  await assert.rejects(readFile(path.join(target, "SKILL.md"), "utf8"));
});

test("skill install protects changed files unless forced", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "slidesls-skill-conflict-"));
  const target = path.join(root, "skill");
  await run(["skill", "install", target]);
  await writeFile(path.join(target, "SKILL.md"), "custom", "utf8");

  await assert.rejects(run(["skill", "install", target]), (error) => {
    assert.equal(error.code, 1);
    assert.match(error.stderr, /without --force/);
    return true;
  });

  const forced = JSON.parse((await run(["skill", "install", target, "--force", "--json"])).stdout);
  assert.equal(forced.data.counts.updated, 1);
});

test("skill link creates an idempotent symlink", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "slidesls-skill-link-"));
  const target = path.join(root, "skill");

  try {
    const first = JSON.parse((await run(["skill", "link", target, "--json"])).stdout);
    assert.equal(first.data.status, "created");
    assert.equal((await lstat(target)).isSymbolicLink(), true);

    const second = JSON.parse((await run(["skill", "link", target, "--json"])).stdout);
    assert.equal(second.data.status, "unchanged");
  } catch (error) {
    if (["EPERM", "EACCES"].includes(error.code)) return;
    throw error;
  }
});

test("local checkout CLI resolves bundled skill and registry from another cwd", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "slidesls-cross-cwd-"));

  const info = JSON.parse((await run(["skill", "info", "--json"], { cwd: root })).stdout);
  assert.equal(info.ok, true);
  assert.ok(info.data.source.startsWith(repoRoot));

  await run(["init", "--template", "minimal", "--title", "Cross CWD", "--json"], { cwd: root });
  const catalog = JSON.parse((await run(["catalog", "--json"], { cwd: root })).stdout);
  assert.ok(catalog.data.items.some((item) => item.name === "core/base"));
  const validation = JSON.parse((await run(["validate", "--json"], { cwd: root })).stdout);
  assert.equal(validation.data.valid, true);
});
