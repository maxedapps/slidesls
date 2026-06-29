import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

export function assertSafeRelativePath(relativePath) {
  if (!relativePath || path.isAbsolute(relativePath))
    throw new Error(`Unsafe absolute or empty path: ${relativePath}`);
  const normalized = path.posix.normalize(String(relativePath).replaceAll("\\", "/"));
  if (normalized === "." || normalized.startsWith("../") || normalized.includes("/../"))
    throw new Error(`Unsafe path traversal: ${relativePath}`);
  return normalized;
}

export function assertInside(root, target) {
  const relative = path.relative(path.resolve(root), path.resolve(target));
  if (relative.startsWith("..") || path.isAbsolute(relative))
    throw new Error(`Refusing to access outside root: ${target}`);
}

export async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function ensureParent(filePath) {
  await mkdir(path.dirname(filePath), { recursive: true });
}

export async function readText(filePath) {
  return readFile(filePath, "utf8");
}

export async function writeText(filePath, content) {
  await ensureParent(filePath);
  await writeFile(filePath, content);
}

export async function writeJson(filePath, data) {
  await writeText(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

export async function atomicWriteJson(filePath, data) {
  await ensureParent(filePath);
  const tmp = `${filePath}.${process.pid}.tmp`;
  await writeFile(tmp, `${JSON.stringify(data, null, 2)}\n`);
  await rename(tmp, filePath);
}

export function sha256Text(text) {
  return createHash("sha256").update(text).digest("hex");
}

export async function sha256File(filePath) {
  return sha256Text(await readFile(filePath));
}
