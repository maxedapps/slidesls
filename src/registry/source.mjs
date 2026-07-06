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

export function isAgentRecommended(item) {
  return ["starter", "recommended"].includes(item.agentLevel);
}

export function summarizeItemBrief(item) {
  return omitUndefined({
    name: item.name,
    type: item.type,
    description: item.description,
    tags: item.tags?.length ? item.tags : undefined,
    useCases: item.useCases?.length ? item.useCases : undefined,
    agentLevel: item.agentLevel,
    snippetCount: item.snippets?.length ? item.snippets.length : undefined,
    dependencyCount: item.registryDependencies?.length
      ? item.registryDependencies.length
      : undefined,
    themeAttribute: item.themeAttribute,
    styleTone: item.styleTone,
    pairsWith: item.pairsWith?.length ? item.pairsWith : undefined,
    avoidWhen: item.composition?.avoidWhen?.length ? item.composition.avoidWhen : undefined,
  });
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
    agentLevel: item.agentLevel,
    registryDependencies: item.registryDependencies || [],
    dependencies: item.dependencies || [],
    devDependencies: item.devDependencies || [],
    files: item.files || [],
    docs: item.docs,
    rootClass: item.rootClass ?? null,
    safeAnywhere: item.safeAnywhere ?? false,
    agentRecommended: isAgentRecommended(item),
    styleTone: item.styleTone,
    pairsWith: item.pairsWith || [],
    themeAttribute: item.themeAttribute,
    composition: item.composition || null,
    authoring: item.authoring || null,
    snippets: item.snippets || [],
    registryItemPath: item.registryItemPath,
  };
}

const groupMetadata = {
  "ls:animation": {
    label: "Animations",
    purpose: "Optional reveal and emphasis recipes for progressive disclosure.",
  },
  "ls:component": {
    label: "Components",
    purpose: "Standalone content, data, media, technical, and visual primitives.",
  },
  "ls:core": {
    label: "Core",
    purpose: "Required shell, tokens, runtime, and icon helpers.",
  },
  "ls:preset": {
    label: "Presets",
    purpose: "Optional theme and font token remaps.",
  },
  "ls:template": {
    label: "Templates",
    purpose: "Paste-ready full-slide skeleton snippets.",
  },
  "ls:utility": {
    label: "Utilities",
    purpose: "Layout and helper classes that compose anywhere.",
  },
};

const groupOrder = [
  "ls:core",
  "ls:utility",
  "ls:component",
  "ls:template",
  "ls:animation",
  "ls:preset",
];

export function catalogGroups(items) {
  const counts = new Map();
  for (const item of items) counts.set(item.type, (counts.get(item.type) || 0) + 1);
  return [...counts.entries()]
    .sort(
      ([left], [right]) =>
        groupSortIndex(left) - groupSortIndex(right) || left.localeCompare(right),
    )
    .map(([type, count]) => ({
      type,
      count,
      ...(groupMetadata[type] || { label: labelFromName(type), purpose: "Registry items." }),
    }));
}

export function mergeBriefAndRich(item) {
  return { ...summarizeItemBrief(item), ...summarizeItem(item) };
}

function groupSortIndex(type) {
  const index = groupOrder.indexOf(type);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function omitUndefined(object) {
  return Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined));
}
