import { readFile } from "node:fs/promises";
import path from "node:path";
import { writeText } from "../shared/fs.mjs";
import { loadRegistry, RegistrySource, summarizeItem } from "./source.mjs";

export function groupName(type = "") {
  const normalized = String(type).replace(/^ls:/, "");
  if (normalized === "core") return "Core";
  if (normalized === "utility") return "Utilities";
  if (normalized === "component") return "Components";
  if (normalized === "animation") return "Animations";
  if (normalized.startsWith("preset")) return "Presets";
  if (normalized === "template") return "Templates";
  return "Other";
}

export function defaultCatalogOutput(root = process.cwd()) {
  return path.resolve(root, "skills/slidesls/references/catalog.md");
}

export function renderCatalog(registryData) {
  const groups = new Map();
  for (const item of registryData.items.map(summarizeItem)) {
    const group = groupName(item.type);
    groups.set(group, [...(groups.get(group) || []), item]);
  }

  const groupOrder = [
    "Core",
    "Utilities",
    "Components",
    "Animations",
    "Presets",
    "Templates",
    "Other",
  ];
  const lines = [
    "# slidesls Agent Catalog",
    "",
    "Generated from `registry.json` and per-item metadata. Do not edit manually; run `slidesls generate-catalog`.",
    "",
  ];

  for (const group of groupOrder) {
    const items = groups.get(group) || [];
    if (items.length === 0) continue;
    lines.push(`## ${group}`, "");
    for (const item of items) {
      lines.push(`### ${item.name}`);
      lines.push("");
      lines.push(`- Label: ${item.label}`);
      lines.push(`- Type: ${item.type}`);
      lines.push(`- Description: ${item.description || ""}`);
      lines.push(`- Agent recommended: ${item.agentRecommended ? "yes" : "no"}`);
      if (item.rootClass) lines.push(`- Root class: ${item.rootClass}`);
      lines.push(`- Safe anywhere: ${item.safeAnywhere ? "yes" : "no"}`);
      lines.push(
        `- Registry dependencies: ${(item.registryDependencies || []).join(", ") || "none"}`,
      );
      lines.push(`- Files: ${(item.files || []).map((file) => file.path).join(", ") || "none"}`);
      lines.push(
        `- Snippets: ${(item.snippets || []).map((snippet) => `${snippet.label} (${snippet.path})`).join(", ") || "none"}`,
      );
      lines.push(`- Docs: ${item.docs || "none"}`);
      lines.push("");
    }
  }

  return `${lines.join("\n").trim()}\n`;
}

export async function generateCatalogDoc({
  registryRoot,
  registryUrl,
  output,
  check = false,
} = {}) {
  const source = new RegistrySource({ registryRoot, registryUrl });
  const registryData = await loadRegistry(source);
  const outputPath = path.resolve(output || defaultCatalogOutput(registryRoot || process.cwd()));
  const content = renderCatalog(registryData);
  if (check) {
    const current = await readFile(outputPath, "utf8").catch(() => null);
    return {
      ok: current === content,
      checked: true,
      output: outputPath,
      itemCount: registryData.items.length,
    };
  }
  await writeText(outputPath, content);
  return { ok: true, checked: false, output: outputPath, itemCount: registryData.items.length };
}
