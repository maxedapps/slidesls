#!/usr/bin/env node
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";

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

async function previewSmoke() {
  const child = spawn(process.execPath, [cli, "preview", tmp, "--port", "0", "--json"], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => {
    stdout += chunk;
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });

  try {
    const data = await new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error(`preview timed out: ${stdout}\n${stderr}`)),
        3000,
      );
      child.stdout.on("data", () => {
        try {
          const parsed = JSON.parse(stdout);
          clearTimeout(timeout);
          resolve(parsed.data);
        } catch {
          // Wait for complete JSON.
        }
      });
      child.on("exit", (code) => {
        clearTimeout(timeout);
        reject(new Error(`preview exited early (${code}): ${stdout}\n${stderr}`));
      });
    });
    const response = await fetch(`${data.url}slidesls/registry/core/base/slide-runtime.js`);
    const contentType = response.headers.get("content-type") || "";
    if (!response.ok || !contentType.includes("text/javascript")) {
      throw new Error(`preview served invalid JS MIME: ${response.status} ${contentType}`);
    }
  } finally {
    child.kill("SIGTERM");
  }
}

try {
  run(["init", tmp, "--template", "minimal", "--title", "Smoke Deck", "--json"]);
  run(["catalog", "--json"]);
  run(["inspect", "layouts/title-hero", "--json"]);
  run(["add", "components/card", "--dir", tmp, "--dry-run", "--json"]);
  run(["add", "components/card", "--dir", tmp, "--json"]);
  run(["validate", tmp, "--json"]);
  await previewSmoke();
  console.log(`slidesls CLI smoke passed: ${tmp}`);
} finally {
  await rm(tmp, { recursive: true, force: true });
}
