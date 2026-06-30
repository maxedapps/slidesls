import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { assertInside, assertSafeRelativePath, exists, sha256Text } from "../shared/fs.mjs";

export function itemFiles(item, includeDocs = false) {
  const files = (item.files || []).map((file) => ({ ...file, path: file.path }));
  if (includeDocs) {
    files.push({ path: item.registryItemPath, type: "registry:metadata" });
    if (item.docs) files.push({ path: item.docs, type: "registry:docs" });
  }
  const seen = new Map();
  for (const file of files)
    seen.set(assertSafeRelativePath(file.path), {
      ...file,
      path: assertSafeRelativePath(file.path),
    });
  return [...seen.values()];
}

export async function planCopies({ items, targetRoot, baseDir, includeDocs = false }) {
  const writes = [];
  for (const item of items) {
    for (const file of itemFiles(item, includeDocs)) {
      const destination = path.join(targetRoot, baseDir, file.path);
      assertInside(targetRoot, destination);
      writes.push({
        item: item.name,
        sourcePath: file.path,
        targetPath: path.relative(targetRoot, destination),
        fileType: file.type || "registry:file",
      });
    }
  }
  return writes;
}

export function tagsForWrites(writes) {
  const links = [],
    scripts = [];
  for (const write of writes) {
    const normalized = write.targetPath.replaceAll("\\", "/");
    if (normalized.endsWith(".css")) links.push(`<link rel="stylesheet" href="./${normalized}" />`);
    if (normalized.endsWith(".js"))
      scripts.push(`<script type="module" src="./${normalized}"></script>`);
  }
  return { links, scripts };
}

export async function prepareCopies({ source, targetRoot, writes, force = false }) {
  const copiedFiles = [];
  const collisions = [];
  const prepared = [];

  for (const write of writes) {
    const content = await source.readText(write.sourcePath);
    const destination = path.join(targetRoot, write.targetPath);
    const sha256 = sha256Text(content);
    const file = { ...write, sha256 };

    if ((await exists(destination)) && !force) {
      const currentHash = sha256Text(await readFile(destination));
      file.skipped = currentHash === sha256;
      if (!file.skipped) collisions.push(write.targetPath);
    }

    copiedFiles.push(file);
    prepared.push({ file, destination, content, shouldWrite: force || !file.skipped });
  }

  if (collisions.length) {
    const error = new Error(
      `Refusing to overwrite modified existing files without --force: ${collisions.join(", ")}`,
    );
    error.code = "file_exists";
    error.hint = "Retry with --force, or resolve conflicting files.";
    throw error;
  }

  return { copiedFiles, prepared };
}

export async function commitCopies(preparedCopies) {
  for (const copy of preparedCopies.prepared) {
    if (!copy.shouldWrite) continue;
    await mkdir(path.dirname(copy.destination), { recursive: true });
    await writeFile(copy.destination, copy.content);
  }
  return preparedCopies.copiedFiles;
}

export async function performCopies(options) {
  return commitCopies(await prepareCopies(options));
}
