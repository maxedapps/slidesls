#!/usr/bin/env node
import {
  loadRegistry,
  parseArgs,
  printJson,
  RegistrySource,
  summarizeItem,
} from "./lib/registry-source.mjs";

const help = `Usage: node skills/ls-slides/scripts/list-items.mjs [options]\n\nOptions:\n  --registry-root <path>   Read registry from a local repo checkout\n  --registry-url <url>     Read registry from a raw-file base URL\n  --type <type>            Filter by ls:layout, ls:component, ls:animation, ls:preset, or ls:core\n  --query <text>           Search name, label, description, and type\n  --limit <n>              Limit output\n  --json                  Print JSON\n  --help                  Show help\n`;

try {
  const args = parseArgs(process.argv.slice(2), { boolean: ["json", "help"] });
  if (args.help) {
    process.stdout.write(help);
    process.exit(0);
  }

  const source = new RegistrySource({
    registryRoot: args["registry-root"],
    registryUrl: args["registry-url"],
  });
  const registryData = await loadRegistry(source);
  const query = String(args.query || "").toLowerCase();
  const limit = args.limit ? Number.parseInt(args.limit, 10) : null;

  let items = registryData.items.map(summarizeItem);
  if (args.type) {
    items = items.filter((item) => item.type === args.type);
  }
  if (query) {
    items = items.filter((item) =>
      [item.name, item.label, item.description, item.type, item.docs].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(query),
      ),
    );
  }
  if (Number.isFinite(limit)) {
    items = items.slice(0, limit);
  }

  if (args.json) {
    printJson({ source: registryData.source, count: items.length, items });
  } else {
    for (const item of items) {
      process.stdout.write(`${item.name} (${item.type}) — ${item.description}\n`);
    }
    process.stdout.write(`\n${items.length} item(s) from ${registryData.source.mode} registry.\n`);
  }
} catch (error) {
  console.error(`list-items: ${error.message}`);
  process.exit(1);
}
