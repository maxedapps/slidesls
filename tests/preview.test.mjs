import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const bin = path.resolve("bin/slidesls.mjs");

test("preview does not serve symlinks that resolve outside the deck root", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "slidesls-preview-"));
  const outside = await mkdtemp(path.join(os.tmpdir(), "slidesls-outside-"));
  await writeFile(
    path.join(root, "slidesls.json"),
    JSON.stringify({ paths: { entry: "index.html" } }),
  );
  await writeFile(path.join(root, "index.html"), "<!doctype html><p>ok</p>");
  await writeFile(path.join(outside, "secret.txt"), "secret");
  await mkdir(path.join(root, "assets"), { recursive: true });

  try {
    await symlink(path.join(outside, "secret.txt"), path.join(root, "assets", "secret.txt"));
  } catch (error) {
    t.skip(`symlink unavailable: ${error.message}`);
    return;
  }

  const child = spawn(process.execPath, [bin, "preview", root, "--port", "0", "--json"], {
    cwd: path.resolve("."),
    stdio: ["ignore", "pipe", "pipe"],
  });

  try {
    const result = await readJsonFromStdout(child);
    const response = await fetch(`${result.data.url}assets/secret.txt`);
    assert.equal(response.status, 404);
  } finally {
    child.kill("SIGTERM");
  }
});

function readJsonFromStdout(child) {
  return new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    const timeout = setTimeout(() => {
      reject(new Error(`preview did not start in time: ${stderr}`));
    }, 5000);

    child.stdout.on("data", (chunk) => {
      stdout += chunk;
      const parsed = tryParseJson(stdout);
      if (parsed) {
        clearTimeout(timeout);
        resolve(parsed);
      }
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on("exit", (code) => {
      if (!tryParseJson(stdout)) {
        clearTimeout(timeout);
        reject(new Error(`preview exited with ${code}: ${stderr}`));
      }
    });
  });
}

function tryParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
