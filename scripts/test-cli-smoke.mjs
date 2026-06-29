#!/usr/bin/env node
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const cli = path.join(root, "bin", "slidesls.mjs");
const tmp = await mkdtemp(path.join(tmpdir(), "slidesls-smoke-"));

function run(args, options = {}) {
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd: root,
    encoding: "utf8",
    ...options,
  });
  if (result.status !== 0) {
    console.error(`Command failed: slidesls ${args.join(" ")}`);
    console.error(result.stdout);
    console.error(result.stderr);
    process.exit(result.status || 1);
  }
  return result.stdout;
}

try {
  run(["init", tmp, "--template", "minimal", "--title", "Smoke Deck", "--json"]);
  run(["catalog", "--json"]);
  run(["inspect", "layouts/title-hero", "--json"]);
  run(["add", "components/card", "--dir", tmp, "--dry-run", "--json"]);
  run(["add", "components/card", "--dir", tmp, "--json"]);
  run(["validate", tmp, "--json"]);
  const preview = spawnSync(process.execPath, [cli, "preview", tmp, "--port", "0", "--json"], {
    cwd: root,
    encoding: "utf8",
    timeout: 1000,
  });
  if (!preview.stdout.includes('"url"'))
    throw new Error(`preview did not print JSON: ${preview.stdout} ${preview.stderr}`);
  console.log(`slidesls CLI smoke passed: ${tmp}`);
} finally {
  await rm(tmp, { recursive: true, force: true });
}
