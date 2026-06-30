import { readFile } from "node:fs/promises";
import path from "node:path";
import { assertInside, assertSafeRelativePath } from "../shared/fs.mjs";

export const DEFAULT_REGISTRY_URL = "https://raw.githubusercontent.com/maxedapps/slidesls/main";

export function labelFromName(name) {
  return name
    .split("/")
    .at(-1)
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export class RegistrySource {
  constructor({ registryRoot, registryUrl, fetchTimeoutMs = 15000 } = {}) {
    this.registryRoot = registryRoot
      ? path.resolve(registryRoot)
      : path.resolve(path.join(import.meta.dirname, "..", ".."));
    this.registryUrl = registryRoot ? null : registryUrl;
    this.mode = registryUrl && !registryRoot ? "remote" : "local";
    this.fetchTimeoutMs = fetchTimeoutMs;
  }

  describe() {
    return this.mode === "local"
      ? { mode: "local", root: this.registryRoot }
      : { mode: "remote", url: this.registryUrl || DEFAULT_REGISTRY_URL };
  }

  async readText(relativePath) {
    const safePath = assertSafeRelativePath(relativePath);
    if (this.mode === "local") {
      const filePath = path.join(this.registryRoot, safePath);
      assertInside(this.registryRoot, filePath);
      return readFile(filePath, "utf8");
    }
    const url = `${String(this.registryUrl || DEFAULT_REGISTRY_URL).replace(/\/+$/, "")}/${safePath}`;
    let response;
    try {
      response = await fetch(url, { signal: AbortSignal.timeout(this.fetchTimeoutMs) });
    } catch (error) {
      if (error.name === "TimeoutError" || error.name === "AbortError")
        throw new Error(`Timed out fetching ${url} after ${this.fetchTimeoutMs}ms`);
      throw error;
    }
    if (!response.ok) throw new Error(`Could not fetch ${url}: HTTP ${response.status}`);
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
  if (!Array.isArray(registry.items)) throw new Error("registry.json must contain an items array");
  const items = [];
  const byName = new Map();
  const byPath = new Map();
  for (const itemPath of registry.items) {
    const metadata = await source.readJson(itemPath);
    if (!metadata.name) throw new Error(`${itemPath} is missing name`);
    const item = {
      ...metadata,
      registryItemPath: itemPath,
      label: metadata.title || labelFromName(metadata.name),
      tags: metadata.tags || [],
    };
    items.push(item);
    byName.set(item.name, item);
    byPath.set(itemPath, item);
  }
  return { registry, items, byName, byPath, source: source.describe() };
}

export function resolveItems(registryData, names) {
  const resolved = [],
    visiting = new Set(),
    visited = new Set();
  function visit(name) {
    if (visited.has(name)) return;
    if (visiting.has(name)) throw new Error(`Circular registry dependency involving ${name}`);
    const item = registryData.byName.get(name);
    if (!item) throw new Error(`Unknown registry item: ${name}`);
    visiting.add(name);
    for (const dependency of item.registryDependencies || []) visit(dependency);
    visiting.delete(name);
    visited.add(name);
    resolved.push(item);
  }
  for (const name of names) visit(name);
  return resolved;
}

export function summarizeItem(item) {
  return {
    name: item.name,
    title: item.title || item.label,
    label: item.label,
    type: item.type,
    description: item.description,
    tags: item.tags || [],
    useCases: item.useCases || [],
    registryDependencies: item.registryDependencies || [],
    dependencies: item.dependencies || [],
    devDependencies: item.devDependencies || [],
    files: item.files || [],
    docs: item.docs,
    rootClass: item.rootClass ?? null,
    safeAnywhere: item.safeAnywhere ?? false,
    agentRecommended: item.agentRecommended === true,
    styleTone: item.styleTone,
    pairsWith: item.pairsWith || [],
    themeAttribute: item.themeAttribute,
    authoring: item.authoring || null,
    snippets: item.snippets || [],
    registryItemPath: item.registryItemPath,
  };
}
