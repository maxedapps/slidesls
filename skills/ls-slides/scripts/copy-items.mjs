#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  assertInside,
  assertSafeRelativePath,
  exists,
  loadRegistry,
  parseArgs,
  printJson,
  RegistrySource,
  resolveItems,
  splitNames,
} from "./lib/registry-source.mjs";

const help = `Usage: node skills/ls-slides/scripts/copy-items.mjs --target <path> --items <names> [options]\n\nOptions:\n  --registry-root <path>   Read registry from a local repo checkout\n  --registry-url <url>     Read registry from a raw-file base URL\n  --target <path>          Target deck/project folder\n  --items <a,b>            Comma-separated item names\n  --item <name>            Repeatable item name\n  --base-dir <relative>    Destination base under target (default: ls-slides)\n  --include-docs           Copy item README.md and registry-item.json for traceability\n  --dry-run                Print plan without writing\n  --force                 Allow overwrites\n  --json                  Print JSON\n  --help                  Show help\n`;

function uniqueFilesForItem(item, includeDocs) {
  const files = (item.files || []).map((file) => file.path);
  if (includeDocs) {
    files.push(item.registryItemPath);
    if (item.docs) files.push(item.docs);
  }
  return [...new Set(files)].map(assertSafeRelativePath);
}

try {
  const args = parseArgs(process.argv.slice(2), {
    repeatable: ["item"],
    boolean: ["include-docs", "dry-run", "force", "json", "help"],
  });
  if (args.help) {
    process.stdout.write(help);
    process.exit(0);
  }

  if (!args.target) throw new Error("--target is required");
  const names = [...splitNames(args.items), ...splitNames(args.item)];
  if (names.length === 0) throw new Error("--items or --item is required");

  const targetRoot = path.resolve(args.target);
  const baseDir = assertSafeRelativePath(args["base-dir"] || "ls-slides");
  const source = new RegistrySource({
    registryRoot: args["registry-root"],
    registryUrl: args["registry-url"],
  });
  const registryData = await loadRegistry(source);
  const items = resolveItems(registryData, names);

  const writes = [];
  for (const item of items) {
    for (const relativePath of uniqueFilesForItem(item, args["include-docs"])) {
      const destination = path.join(targetRoot, baseDir, relativePath);
      assertInside(targetRoot, destination);
      writes.push({
        item: item.name,
        sourcePath: relativePath,
        targetPath: path.relative(targetRoot, destination),
      });
    }
  }

  const manifest = {
    source: registryData.source,
    requestedItems: names,
    dependencyOrder: items.map((item) => item.name),
    baseDir,
    copiedFiles: writes,
  };
  const manifestPath = path.join(targetRoot, baseDir, "manifest.json");
  assertInside(targetRoot, manifestPath);

  const plan = {
    ...manifest,
    manifestPath: path.relative(targetRoot, manifestPath),
    dryRun: Boolean(args["dry-run"]),
  };

  if (args["dry-run"]) {
    if (args.json) printJson(plan);
    else process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`);
    process.exit(0);
  }

  const collisions = [];
  for (const write of writes) {
    const destination = path.join(targetRoot, write.targetPath);
    if (!args.force && (await exists(destination))) collisions.push(write.targetPath);
  }
  if (!args.force && (await exists(manifestPath)))
    collisions.push(path.relative(targetRoot, manifestPath));
  if (collisions.length > 0) {
    throw new Error(
      `Refusing to overwrite existing files without --force: ${collisions.join(", ")}`,
    );
  }

  for (const write of writes) {
    const destination = path.join(targetRoot, write.targetPath);
    await mkdir(path.dirname(destination), { recursive: true });
    const content = await source.readText(write.sourcePath);
    await writeFile(destination, content);
  }

  await mkdir(path.dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  if (args.json) printJson(plan);
  else
    process.stdout.write(
      `Copied ${writes.length} file(s) for ${items.length} item(s) to ${path.join(targetRoot, baseDir)}\n`,
    );
} catch (error) {
  console.error(`copy-items: ${error.message}`);
  process.exit(1);
}
