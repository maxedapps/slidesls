#!/usr/bin/env node
import {
  loadRegistry,
  parseArgs,
  printJson,
  RegistrySource,
  resolveItems,
  splitNames,
  summarizeItem,
} from "./lib/registry-source.mjs";

const help = `Usage: node skills/ls-slides/scripts/inspect-item.mjs --item <name> [options]\n\nOptions:\n  --registry-root <path>   Read registry from a local repo checkout\n  --registry-url <url>     Read registry from a raw-file base URL\n  --item <name>            Item name; repeatable or comma-separated\n  --include-readme         Include README/docs content\n  --json                  Print JSON\n  --help                  Show help\n`;

function loadOrderNote(item) {
  if (item.type === "ls:core")
    return "Load core/base files before all layouts, components, presets, and animations.";
  if (item.type === "ls:animation" && item.name !== "animations/reveal")
    return "Load after core/base and animations/reveal.";
  if (item.type === "ls:preset")
    return "Load after core/base tokens and before or alongside slide markup that uses the preset attribute.";
  return "Load after core/base styles.";
}

try {
  const args = parseArgs(process.argv.slice(2), {
    repeatable: ["item"],
    boolean: ["include-readme", "json", "help"],
  });
  if (args.help) {
    process.stdout.write(help);
    process.exit(0);
  }

  const names = splitNames(args.item);
  if (names.length === 0) throw new Error("At least one --item is required");

  const source = new RegistrySource({
    registryRoot: args["registry-root"],
    registryUrl: args["registry-url"],
  });
  const registryData = await loadRegistry(source);
  const dependencyOrder = resolveItems(registryData, names);
  const selected = names.map((name) => registryData.byName.get(name));

  const items = [];
  for (const item of selected) {
    if (!item) throw new Error(`Unknown registry item in selection`);
    const summary = summarizeItem(item);
    const dependencies = resolveItems(registryData, [item.name]).map(
      (dependency) => dependency.name,
    );
    const inspected = {
      ...summary,
      dependencyOrder: dependencies,
      loadOrderNote: loadOrderNote(item),
    };
    if (args["include-readme"] && item.docs) {
      inspected.readme = { path: item.docs, content: await source.readText(item.docs) };
    }
    items.push(inspected);
  }

  if (args.json) {
    printJson({
      source: registryData.source,
      dependencyOrder: dependencyOrder.map((item) => item.name),
      items,
    });
  } else {
    for (const item of items) {
      process.stdout.write(
        `# ${item.name}\n${item.description}\nType: ${item.type}\nDependencies: ${item.dependencyOrder.join(", ") || "none"}\nFiles: ${(item.files || []).map((file) => file.path).join(", ")}\nDocs: ${item.docs}\n${item.loadOrderNote}\n\n`,
      );
      if (item.readme) process.stdout.write(`${item.readme.content}\n`);
    }
  }
} catch (error) {
  console.error(`inspect-item: ${error.message}`);
  process.exit(1);
}
