#!/usr/bin/env node

// Release-path budget assertion: vendored fonts and icons must never balloon
// the package. Fails pack:check when the unpacked tarball exceeds the budget.

import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const BUDGET_BYTES = 5 * 1024 * 1024;
const root = path.resolve(import.meta.dirname, "..");

const result = spawnSync("npm", ["pack", "--dry-run", "--json"], {
  cwd: root,
  encoding: "utf8",
  maxBuffer: 32 * 1024 * 1024,
});
if (result.status !== 0) {
  console.error(`pack-size: npm pack --dry-run failed: ${result.stderr}`);
  process.exit(1);
}
// npm may prefix JSON output with notices on some versions.
const jsonStart = result.stdout.indexOf("[");
const [pack] = JSON.parse(result.stdout.slice(jsonStart));
const unpacked = pack.unpackedSize;
const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

if (unpacked > BUDGET_BYTES) {
  console.error(
    `pack-size: FAILED — unpacked package is ${mb(unpacked)}, budget is ${mb(BUDGET_BYTES)} (${pack.entryCount} files).`,
  );
  process.exit(1);
}
console.log(
  `pack-size: ok — ${mb(unpacked)} unpacked of ${mb(BUDGET_BYTES)} budget (${pack.entryCount} files).`,
);
