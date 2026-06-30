import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { assertSafeRelativePath, exists, writeJson } from "../shared/fs.mjs";

export const CONFIG_FILE = "slidesls.json";
export const DEFAULT_CONFIG = {
  $schema: "./slidesls/schema/slidesls.schema.json",
  registry: "bundled",
  paths: { items: "slidesls", entry: "index.html", assets: "assets", snapshots: "snapshots" },
};

export async function findConfig(startDir) {
  let current = path.resolve(startDir || process.cwd());
  while (true) {
    const candidate = path.join(current, CONFIG_FILE);
    if (await exists(candidate)) return candidate;
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

export async function readConfig(projectDir, explicit = false) {
  const root = path.resolve(projectDir || process.cwd());
  const configPath = explicit ? path.join(root, CONFIG_FILE) : await findConfig(projectDir);
  if (!configPath || !(await exists(configPath))) return { config: null, configPath: null, root };
  const config = validateConfigPaths(mergeConfig(JSON.parse(await readFile(configPath, "utf8"))));
  return { config, configPath, root: path.dirname(configPath) };
}

export function mergeConfig(config = {}) {
  return {
    ...DEFAULT_CONFIG,
    ...config,
    paths: { ...DEFAULT_CONFIG.paths, ...config.paths },
  };
}

export function validateConfigPaths(config) {
  const next = mergeConfig(config);
  try {
    next.paths = { ...next.paths };
    for (const key of ["items", "entry", "assets", "snapshots"])
      next.paths[key] = assertSafeRelativePath(next.paths[key]);
  } catch (error) {
    error.code = "invalid_config_path";
    error.hint = "Use non-empty relative paths that stay inside the project.";
    throw error;
  }
  return next;
}

export async function writeDefaultConfig(projectDir, overrides = {}) {
  await mkdir(projectDir, { recursive: true });
  const config = validateConfigPaths(mergeConfig(overrides));
  await writeJson(path.join(projectDir, CONFIG_FILE), config);
  return config;
}
