import path from "node:path";
import { exists, readText, atomicWriteJson } from "../shared/fs.mjs";
import { VERSION } from "../shared/result.mjs";

export function manifestPath(projectRoot, config) {
  return path.join(projectRoot, config.paths.items, "manifest.json");
}

export function createManifest({
  registrySource,
  entry,
  baseDir,
  requestedItems = [],
  dependencyOrder = [],
  copiedFiles = [],
  links = [],
  scripts = [],
}) {
  return {
    schemaVersion: 2,
    cliVersion: VERSION,
    registrySource,
    entry,
    baseDir,
    requestedItems,
    dependencyOrder,
    copiedFiles,
    links,
    scripts,
    updatedAt: new Date().toISOString(),
  };
}

export async function readManifest(projectRoot, config) {
  const filePath = manifestPath(projectRoot, config);
  if (!(await exists(filePath))) return null;
  return JSON.parse(await readText(filePath));
}

export async function writeManifest(projectRoot, config, manifest) {
  await atomicWriteJson(manifestPath(projectRoot, config), manifest);
}

export function mergeManifest(previous, next) {
  if (!previous) return next;
  const files = new Map((previous.copiedFiles || []).map((file) => [file.targetPath, file]));
  for (const file of next.copiedFiles || []) files.set(file.targetPath, file);
  return {
    ...previous,
    ...next,
    requestedItems: [
      ...new Set([...(previous.requestedItems || []), ...(next.requestedItems || [])]),
    ],
    dependencyOrder: [
      ...new Set([...(previous.dependencyOrder || []), ...(next.dependencyOrder || [])]),
    ],
    copiedFiles: [...files.values()],
    links: [...new Set([...(previous.links || []), ...(next.links || [])])],
    scripts: [...new Set([...(previous.scripts || []), ...(next.scripts || [])])],
    updatedAt: new Date().toISOString(),
  };
}
