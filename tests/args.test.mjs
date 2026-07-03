import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";
import { parseArgs } from "../src/shared/args.mjs";

const execFileAsync = promisify(execFile);
const bin = path.resolve("bin/slidesls.mjs");

test("parseArgs rejects unknown options with nearest suggestion", () => {
  assert.throws(
    () => parseArgs(["--breif", "--json"], { boolean: ["brief", "json"], value: [] }),
    (error) => {
      assert.equal(error.code, "usage_error");
      assert.equal(error.exitCode, 2);
      assert.match(error.message, /Unknown option --breif/);
      assert.match(error.hint, /--brief/);
      return true;
    },
  );
});

test("parseArgs rejects missing value and flag-as-value", () => {
  assert.throws(
    () => parseArgs(["--type"], { boolean: ["json"], value: ["type"] }),
    /Missing value for --type/,
  );
  assert.throws(
    () => parseArgs(["--type", "--json"], { boolean: ["json"], value: ["type"] }),
    /Missing value for --type/,
  );
});

test("catalog typo does not swallow --json", async () => {
  await assert.rejects(run(["catalog", "--levle", "starter", "--json"]), (error) => {
    assert.equal(error.code, 2);
    const output = error.stdout || error.stderr;
    assert.match(output, /Unknown option --levle/);
    assert.match(output, /Did you mean --level/);
    return true;
  });
});

test("leading unknown root option fails instead of showing help", async () => {
  await assert.rejects(run(["--breif", "--json"]), (error) => {
    assert.equal(error.code, 2);
    const result = JSON.parse(error.stdout);
    assert.equal(result.ok, false);
    assert.equal(result.error.message, "Unknown option --breif");
    return true;
  });
});

test("removed --registry keeps the dedicated error", async () => {
  await assert.rejects(run(["catalog", "--registry", "foo"]), (error) => {
    assert.equal(error.code, 2);
    assert.match(error.stderr, /--registry has been removed/);
    return true;
  });
});

async function run(args) {
  return execFileAsync(process.execPath, [bin, ...args], {
    cwd: path.resolve("."),
    maxBuffer: 1024 * 1024,
  });
}

test("documented help flags stay in the declared command option set", async () => {
  const commandFlags = {
    init: new Set(["template", "theme", "title", "registry-root", "registry-url", "force", "json"]),
    add: new Set([
      "dir",
      "base-dir",
      "registry-root",
      "registry-url",
      "include-docs",
      "dry-run",
      "force",
      "json",
    ]),
    catalog: new Set([
      "recommended",
      "starter",
      "level",
      "api",
      "type",
      "tag",
      "query",
      "limit",
      "registry-root",
      "registry-url",
      "json",
    ]),
    inspect: new Set([
      "api",
      "with-dependencies",
      "readme",
      "registry-root",
      "registry-url",
      "json",
    ]),
    validate: new Set(["strict", "registry-root", "registry-url", "use-manifest-registry", "json"]),
    preview: new Set(["host", "port", "json"]),
    doctor: new Set(["dir", "registry-root", "registry-url", "json"]),
    "validate-registry": new Set(["registry-root", "registry-url", "json"]),
    "validate-examples": new Set(["dir", "json"]),
    "generate-catalog": new Set(["registry-root", "registry-url", "output", "check", "json"]),
    skill: new Set(["reference", "all", "dry-run", "force", "json"]),
  };

  for (const command of Object.keys(commandFlags)) {
    const { stdout } = await run([command, "--help"]);
    for (const line of stdout.split(/\n/)) {
      const commandMatch = line.match(/slidesls\s+([a-z][a-z0-9-]*)/);
      const target = commandMatch?.[1] && commandFlags[commandMatch[1]] ? commandMatch[1] : command;
      const allowed = commandFlags[target];
      for (const flag of line.matchAll(/--([a-z][a-z0-9-]*)/g)) {
        if (flag[1] === "help") continue;
        assert.ok(
          allowed.has(flag[1]),
          `${command} help line documents undeclared ${target} --${flag[1]}: ${line}`,
        );
      }
    }
  }
});
