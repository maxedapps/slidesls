import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const DEFAULT_REGISTRY_URL = "https://raw.githubusercontent.com/maxedapps/slidesls/main";

export function parseArgs(argv, spec = {}) {
  const result = { _: [] };
  const repeatable = new Set(spec.repeatable || []);
  const boolean = new Set(spec.boolean || []);

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) {
      result._.push(arg);
      continue;
    }

    const [rawKey, inlineValue] = arg.slice(2).split("=", 2);
    const key = rawKey;
    const value = boolean.has(key) ? true : (inlineValue ?? argv[++index]);

    if (value === undefined) {
      throw new Error(`Missing value for --${key}`);
    }

    if (repeatable.has(key)) {
      result[key] = [...(result[key] || []), value];
    } else {
      result[key] = value;
    }
  }

  return result;
}

export function printJson(data) {
  process.stdout.write(`${JSON.stringify(data, null, 2)}\n`);
}

export function labelFromName(name) {
  return name
    .split("/")
    .at(-1)
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function normalizeBaseUrl(url) {
  return String(url || DEFAULT_REGISTRY_URL).replace(/\/+$/, "");
}

export function assertSafeRelativePath(relativePath) {
  if (!relativePath || path.isAbsolute(relativePath)) {
    throw new Error(`Unsafe absolute or empty path: ${relativePath}`);
  }

  const normalized = path.posix.normalize(relativePath.replaceAll("\\", "/"));
  if (normalized === "." || normalized.startsWith("../") || normalized.includes("/../")) {
    throw new Error(`Unsafe path traversal: ${relativePath}`);
  }

  return normalized;
}

export function assertInside(root, target) {
  const relative = path.relative(root, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Refusing to write outside target root: ${target}`);
  }
}

export class RegistrySource {
  constructor({ registryRoot, registryUrl } = {}) {
    this.registryRoot = registryRoot ? path.resolve(registryRoot) : null;
    this.registryUrl = this.registryRoot ? null : normalizeBaseUrl(registryUrl);
    this.mode = this.registryRoot ? "local" : "remote";
  }

  describe() {
    return this.mode === "local"
      ? { mode: "local", root: this.registryRoot }
      : { mode: "remote", url: this.registryUrl };
  }

  async readText(relativePath) {
    const safePath = assertSafeRelativePath(relativePath);

    if (this.registryRoot) {
      const filePath = path.join(this.registryRoot, safePath);
      assertInside(this.registryRoot, filePath);
      try {
        return await readFile(filePath, "utf8");
      } catch (error) {
        throw new Error(`Could not read ${safePath} from ${this.registryRoot}: ${error.message}`);
      }
    }

    const url = `${this.registryUrl}/${safePath}`;
    let response;
    try {
      response = await fetch(url);
    } catch (error) {
      throw new Error(
        `Could not fetch ${url}: ${error.message}. If the remote registry is unavailable, retry with --registry-root <local-repo>.`,
      );
    }

    if (!response.ok) {
      throw new Error(
        `Could not fetch ${url}: HTTP ${response.status}. If the repository is private or unavailable, retry with --registry-root <local-repo>.`,
      );
    }

    return response.text();
  }

  async readJson(relativePath) {
    const text = await this.readText(relativePath);
    try {
      return JSON.parse(text);
    } catch (error) {
      throw new Error(`Malformed JSON in ${relativePath}: ${error.message}`);
    }
  }
}

export async function loadRegistry(source) {
  const registry = await source.readJson("registry.json");
  if (!Array.isArray(registry.items)) {
    throw new Error("registry.json must contain an items array");
  }

  const items = [];
  const byName = new Map();
  const byPath = new Map();

  for (const itemPath of registry.items) {
    const metadata = await source.readJson(itemPath);
    if (!metadata.name) {
      throw new Error(`${itemPath} is missing name`);
    }
    const item = { ...metadata, registryItemPath: itemPath, label: labelFromName(metadata.name) };
    items.push(item);
    byName.set(item.name, item);
    byPath.set(itemPath, item);
  }

  return { registry, items, byName, byPath, source: source.describe() };
}

export function splitNames(value) {
  if (!value) {
    return [];
  }
  const values = Array.isArray(value) ? value : [value];
  return values
    .flatMap((entry) => String(entry).split(","))
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function resolveItems(registryData, names) {
  const resolved = [];
  const visiting = new Set();
  const visited = new Set();

  function visit(name) {
    if (visited.has(name)) {
      return;
    }
    if (visiting.has(name)) {
      throw new Error(`Circular registry dependency involving ${name}`);
    }

    const item = registryData.byName.get(name);
    if (!item) {
      throw new Error(`Unknown registry item: ${name}`);
    }

    visiting.add(name);
    for (const dependency of item.registryDependencies || []) {
      visit(dependency);
    }
    visiting.delete(name);
    visited.add(name);
    resolved.push(item);
  }

  for (const name of names) {
    visit(name);
  }

  return resolved;
}

export function summarizeItem(item) {
  return {
    name: item.name,
    label: item.label,
    type: item.type,
    description: item.description,
    registryDependencies: item.registryDependencies || [],
    dependencies: item.dependencies || [],
    devDependencies: item.devDependencies || [],
    docs: item.docs,
    files: item.files || [],
    registryItemPath: item.registryItemPath,
  };
}

export function groupName(type) {
  return (
    {
      "ls:core": "Core",
      "ls:layout": "Layouts",
      "ls:component": "Components",
      "ls:animation": "Animations",
      "ls:preset": "Presets",
    }[type] || "Other"
  );
}

export async function ensureParent(filePath) {
  await mkdir(path.dirname(filePath), { recursive: true });
}

export async function writeTextFile(filePath, content) {
  await ensureParent(filePath);
  await writeFile(filePath, content);
}

export async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

export function scriptDir(importMetaUrl) {
  return path.dirname(fileURLToPath(importMetaUrl));
}
