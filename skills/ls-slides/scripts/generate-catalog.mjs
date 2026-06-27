#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  groupName,
  loadRegistry,
  parseArgs,
  RegistrySource,
  summarizeItem,
  writeTextFile,
} from "./lib/registry-source.mjs";
import { readFile } from "node:fs/promises";

const help = `Usage: node skills/ls-slides/scripts/generate-catalog.mjs [options]\n\nOptions:\n  --registry-root <path>   Read registry from a local repo checkout\n  --registry-url <url>     Read registry from a raw-file base URL\n  --output <path>          Output path (default: skills/ls-slides/references/catalog.md)\n  --check                 Verify output is current without writing\n  --help                  Show help\n`;

function defaultOutput() {
  const scriptPath = fileURLToPath(import.meta.url);
  return path.resolve(path.dirname(scriptPath), "../references/catalog.md");
}

function renderCatalog(registryData) {
  const groups = new Map();
  for (const item of registryData.items.map(summarizeItem)) {
    const group = groupName(item.type);
    groups.set(group, [...(groups.get(group) || []), item]);
  }

  const groupOrder = ["Core", "Layouts", "Components", "Animations", "Presets", "Other"];
  const lines = [
    "# ls_slides Agent Catalog",
    "",
    "Generated from `registry.json` and per-item metadata. Do not edit manually; run `generate-catalog.mjs`.",
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
      lines.push(
        `- Registry dependencies: ${(item.registryDependencies || []).join(", ") || "none"}`,
      );
      lines.push(`- Files: ${(item.files || []).map((file) => file.path).join(", ") || "none"}`);
      lines.push(`- Docs: ${item.docs || "none"}`);
      lines.push("");
    }
  }

  return `${lines.join("\n").trim()}\n`;
}

try {
  const args = parseArgs(process.argv.slice(2), { boolean: ["check", "help"] });
  if (args.help) {
    process.stdout.write(help);
    process.exit(0);
  }

  const source = new RegistrySource({
    registryRoot: args["registry-root"],
    registryUrl: args["registry-url"],
  });
  const registryData = await loadRegistry(source);
  const output = path.resolve(args.output || defaultOutput());
  const content = renderCatalog(registryData);

  if (args.check) {
    const current = await readFile(output, "utf8").catch(() => null);
    if (current !== content) {
      console.error(`Catalog is out of date: ${output}`);
      process.exit(1);
    }
    process.stdout.write(`Catalog is up to date: ${output}\n`);
  } else {
    await writeTextFile(output, content);
    process.stdout.write(`Wrote ${output}\n`);
  }
} catch (error) {
  console.error(`generate-catalog: ${error.message}`);
  process.exit(1);
}
