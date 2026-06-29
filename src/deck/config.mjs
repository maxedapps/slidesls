import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { exists, writeJson } from "../shared/fs.mjs";

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
  const configPath = explicit
    ? path.join(path.resolve(projectDir), CONFIG_FILE)
    : await findConfig(projectDir);
  if (!configPath)
    return { config: null, configPath: null, root: path.resolve(projectDir || process.cwd()) };
  const config = JSON.parse(await readFile(configPath, "utf8"));
  return { config: mergeConfig(config), configPath, root: path.dirname(configPath) };
}

export function mergeConfig(config = {}) {
  return {
    ...DEFAULT_CONFIG,
    ...config,
    paths: { ...DEFAULT_CONFIG.paths, ...config.paths },
  };
}

export async function writeDefaultConfig(projectDir, overrides = {}) {
  await mkdir(projectDir, { recursive: true });
  const config = mergeConfig(overrides);
  await writeJson(path.join(projectDir, CONFIG_FILE), config);
  return config;
}
