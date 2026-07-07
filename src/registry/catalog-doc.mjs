import { readFile } from "node:fs/promises";
import path from "node:path";
import { writeText } from "../shared/fs.mjs";
import { loadRegistry, RegistrySource, summarizeItem } from "./source.mjs";

export function groupName(type = "") {
  const normalized = String(type).replace(/^ls:/, "");
  if (normalized === "archetype") return "Archetypes";
  if (normalized === "style") return "Styles";
  if (normalized === "core") return "Core";
  if (normalized === "layout") return "Layouts";
  if (normalized === "component") return "Components";
  if (normalized === "motion") return "Motion";
  if (normalized === "icons") return "Icons";
  if (normalized === "font") return "Fonts";
  if (normalized === "utility") return "Utilities";
  if (normalized === "animation") return "Animations";
  if (normalized.startsWith("preset")) return "Presets";
  if (normalized === "template") return "Templates";
  return "Other";
}

export function defaultCatalogOutput(root = process.cwd()) {
  return path.resolve(root, "skills/create-slides-with-slidesls/references/catalog.md");
}

export function renderCatalog(registryData) {
  const groups = new Map();
  // Preview items are excluded: this document is agent-facing discovery, and
  // preview items must stay invisible until their vocabulary ships.
  for (const item of registryData.items
    .filter((entry) => entry.status !== "preview")
    .map(summarizeItem)) {
    const group = groupName(item.type);
    groups.set(group, [...(groups.get(group) || []), item]);
  }

  const groupOrder = [
    "Archetypes",
    "Styles",
    "Core",
    "Layouts",
    "Components",
    "Motion",
    "Icons",
    "Fonts",
    "Utilities",
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
    "Deep reference for per-item lookup only; it is large, so do not read it end-to-end. For normal authoring use `slidesls catalog --json` (brief) and `slidesls inspect <item> --json` (snippet) first, and open this file only to look up one item.",
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
      lines.push(`- Agent level: ${item.agentLevel}`);
      lines.push(`- Agent recommended: ${item.agentRecommended ? "yes" : "no"}`);
      if (item.rootClass) lines.push(`- Root class: ${item.rootClass}`);
      if (item.themeAttribute) lines.push(`- Theme attribute: ${item.themeAttribute}`);
      if (item.styleAttribute) lines.push(`- Style attribute: ${item.styleAttribute}`);
      if (item.styleTone) lines.push(`- Style tone: ${item.styleTone}`);
      if (item.intent?.length) lines.push(`- Intent: ${item.intent.join(", ")}`);
      if (item.pairsWith?.length) lines.push(`- Pairs with: ${item.pairsWith.join(", ")}`);
      lines.push(`- Safe anywhere: ${item.safeAnywhere ? "yes" : "no"}`);
      lines.push(...contractLines(item.contract));
      if (item.motion?.default)
        lines.push(`- Motion default: ${markdownText(item.motion.default)}`);
      if (item.motion?.notes) lines.push(`- Motion notes: ${markdownText(item.motion.notes)}`);
      if (item.icons?.guidance) lines.push(`- Icon guidance: ${markdownText(item.icons.guidance)}`);
      if (item.icons?.suggested?.length)
        lines.push(`- Suggested icons: ${item.icons.suggested.join(", ")}`);
      lines.push(...compositionLines(item.composition));
      lines.push(...authoringLines(item.authoring));
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

function code(value) {
  return `\`${value}\``;
}

function markdownText(value) {
  return String(value).replaceAll("_", "\\_");
}

function codeList(values) {
  return values.map(code).join(", ");
}

function cssVariableDoc(variable) {
  if (typeof variable === "string") return code(variable);
  const details = [
    variable.default !== undefined ? `default ${variable.default}` : null,
    variable.overrideSafe === true ? "override-safe" : null,
    variable.overrideSafe === false ? "not override-safe" : null,
  ].filter(Boolean);
  return details.length ? `${code(variable.name)} (${details.join(", ")})` : code(variable.name);
}

function contractLines(contract) {
  if (!contract || !Object.keys(contract).length) return [];
  const lines = ["- Content contract:"];
  for (const [slot, constraints] of Object.entries(contract)) {
    const parts = [
      constraints.min !== undefined || constraints.max !== undefined
        ? `count ${constraints.min ?? 0}–${constraints.max ?? "∞"}`
        : null,
      constraints.minWords !== undefined || constraints.maxWords !== undefined
        ? `words ${constraints.minWords ?? 0}–${constraints.maxWords ?? "∞"}`
        : null,
      constraints.maxChars !== undefined ? `max ${constraints.maxChars} chars` : null,
      constraints.description ? markdownText(constraints.description) : null,
    ].filter(Boolean);
    lines.push(`  - ${code(slot)}: ${parts.join(", ") || "unconstrained"}`);
  }
  return lines;
}

function compositionLines(composition) {
  if (!composition) return [];
  const lines = ["- Composition:"];
  if (composition.contentDensity?.length)
    lines.push(`  - Content density: ${composition.contentDensity.join(", ")}`);
  if (composition.layoutBehavior) lines.push(`  - Layout behavior: ${composition.layoutBehavior}`);
  if (composition.itemCountGuidance)
    lines.push(`  - Item count: ${markdownText(composition.itemCountGuidance)}`);
  if (composition.copyGuidance) lines.push(`  - Copy: ${markdownText(composition.copyGuidance)}`);
  if (composition.useWhen?.length) {
    lines.push("  - Use when:");
    for (const entry of composition.useWhen) lines.push(`    - ${markdownText(entry)}`);
  }
  if (composition.avoidWhen?.length) {
    lines.push("  - Avoid when:");
    for (const entry of composition.avoidWhen) lines.push(`    - ${markdownText(entry)}`);
  }
  if (composition.alternatives?.length) {
    lines.push("  - Alternatives:");
    for (const alternative of composition.alternatives)
      lines.push(`    - ${markdownText(alternative.when)}: ${code(alternative.use)}`);
  }
  return lines.length > 1 ? lines : [];
}

function authoringLines(authoring) {
  if (!authoring) return [];
  const lines = [];
  if (authoring.classGroups?.length) {
    lines.push("- Class groups:");
    for (const group of authoring.classGroups) {
      const parts = [...(group.elements || []), ...(group.modifiers || [])];
      lines.push(`  - ${code(group.base)}: ${parts.length ? codeList(parts) : "base only"}`);
      if (group.rule) lines.push(`    - Rule: ${markdownText(group.rule)}`);
    }
  }
  if (authoring.classes?.length) lines.push(`- Classes: ${codeList(authoring.classes)}`);
  if (authoring.classMetadata && Object.keys(authoring.classMetadata).length) {
    lines.push("- Class metadata:");
    for (const [className, metadata] of Object.entries(authoring.classMetadata))
      lines.push(
        `  - ${code(className)}: scope ${code(metadata.scopeType)}, safe anywhere ${metadata.safeAnywhere ? "yes" : "no"}${metadata.description ? ` — ${markdownText(metadata.description)}` : ""}`,
      );
  }
  if (authoring.dataAttributes?.length)
    lines.push(
      `- Data attributes: ${authoring.dataAttributes
        .map((attribute) =>
          code(
            attribute.values?.length
              ? `${attribute.name}=${attribute.values.join("|")}`
              : attribute.name,
          ),
        )
        .join(", ")}`,
    );
  if (authoring.attributes?.length)
    lines.push(
      `- Attributes: ${authoring.attributes
        .map((attribute) =>
          code(
            attribute.value !== undefined
              ? `${attribute.name}="${attribute.value}"`
              : attribute.name,
          ),
        )
        .join(", ")}`,
    );
  if (authoring.cssVariables?.length)
    lines.push(`- CSS variables: ${authoring.cssVariables.map(cssVariableDoc).join(", ")}`);
  if (authoring.usage?.length)
    lines.push(`- Usage: ${authoring.usage.map(markdownText).join(" ")}`);
  return lines;
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
