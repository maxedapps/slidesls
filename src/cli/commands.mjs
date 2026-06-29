import { createServer } from "node:http";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { parseArgs, usageError } from "../shared/args.mjs";
import { ok } from "../shared/result.mjs";
import {
  assertInside,
  assertSafeRelativePath,
  exists,
  sha256File,
  writeText,
} from "../shared/fs.mjs";
import { localReferences } from "../shared/html.mjs";
import { RegistrySource, loadRegistry, resolveItems, summarizeItem } from "../registry/source.mjs";
import { DEFAULT_CONFIG, mergeConfig, readConfig, writeDefaultConfig } from "../deck/config.mjs";
import { createManifest, mergeManifest, readManifest, writeManifest } from "../deck/manifest.mjs";
import { performCopies, planCopies, tagsForWrites } from "../deck/copy.mjs";
import { deckTemplate } from "../deck/templates.mjs";

const coreItems = ["core/base"];
const minimalItems = ["core/base", "layouts/title-hero"];

export const help = `slidesls — plain HTML/CSS/JS slide authoring CLI

Usage:
  slidesls <command> [options]

Commands:
  init [dir]       Create or prepare a deck project
  add <items...>   Copy registry items into a deck project
  catalog          List registry items
  inspect <items>  Show item metadata and load guidance
  validate [dir]   Static deck validation
  preview [dir]    Serve a deck locally
  help             Show help

Common options:
  --json           Machine-readable output
  --help           Command help
`;

export async function runCommand(command, argv) {
  switch (command) {
    case "init":
      return initCommand(argv);
    case "add":
      return addCommand(argv);
    case "catalog":
      return catalogCommand(argv);
    case "inspect":
      return inspectCommand(argv);
    case "validate":
      return validateCommand(argv);
    case "preview":
      return previewCommand(argv);
    case "help":
      return ok({ help });
    default:
      throw usageError(`Unknown command: ${command}`, "Run slidesls --help.");
  }
}

function registrySource(args) {
  return new RegistrySource({
    registryRoot:
      args["registry-root"] ||
      (args.registry && args.registry !== "bundled" ? args.registry : undefined),
    registryUrl: args["registry-url"],
  });
}

async function registryData(args) {
  const source = registrySource(args);
  return loadRegistry(source);
}

export async function initCommand(argv) {
  const args = parseArgs(argv, { boolean: ["force", "json", "help"] });
  if (args.help)
    return ok({
      help: `Usage: slidesls init [dir] [--template blank|minimal] [--title <text>] [--force] [--json]`,
    });
  const projectRoot = path.resolve(args._[0] || ".");
  const template = args.template || "minimal";
  if (!["blank", "minimal"].includes(template))
    throw usageError(
      `Unsupported template: ${template}`,
      "Use --template blank or --template minimal.",
    );
  const title = args.title || path.basename(projectRoot) || "Untitled deck";
  const config = mergeConfig({ registry: args.registry || "bundled" });
  const entryPath = path.join(projectRoot, config.paths.entry);
  const configPath = path.join(projectRoot, "slidesls.json");
  if (!args.force) {
    const collisions = [];
    if (await exists(configPath)) collisions.push("slidesls.json");
    if (await exists(entryPath)) collisions.push(config.paths.entry);
    if (collisions.length) {
      const e = new Error(
        `Refusing to overwrite existing files without --force: ${collisions.join(", ")}`,
      );
      e.code = "file_exists";
      throw e;
    }
  }
  await writeDefaultConfig(projectRoot, config);
  const data = await registryData(args);
  const items = resolveItems(data, template === "blank" ? coreItems : minimalItems);
  const writes = await planCopies({ items, targetRoot: projectRoot, baseDir: config.paths.items });
  const copiedFiles = await performCopies({
    source: registrySource(args),
    targetRoot: projectRoot,
    writes,
    force: args.force,
  });
  await writeText(entryPath, deckTemplate({ title, template, baseDir: config.paths.items }));
  const { links, scripts } = tagsForWrites(writes);
  const manifest = createManifest({
    registrySource: data.source,
    entry: config.paths.entry,
    baseDir: config.paths.items,
    requestedItems: items.map((i) => i.name),
    dependencyOrder: items.map((i) => i.name),
    copiedFiles,
    links,
    scripts,
  });
  await writeManifest(projectRoot, config, manifest);
  return ok({
    root: projectRoot,
    configPath: path.relative(projectRoot, configPath),
    entry: config.paths.entry,
    template,
    items: items.map((i) => i.name),
    nextSteps: [
      "slidesls catalog",
      "slidesls add layouts/two-column components/card",
      "slidesls validate",
      "slidesls preview",
    ],
  });
}

export async function addCommand(argv) {
  const args = parseArgs(argv, { boolean: ["include-docs", "dry-run", "force", "json", "help"] });
  if (args.help)
    return ok({
      help: `Usage: slidesls add <items...> [--dir <project>] [--base-dir <relative>] [--include-docs] [--dry-run] [--force] [--json]`,
    });
  const names = args._;
  if (!names.length) throw usageError("slidesls add requires at least one item name");
  const projectStart = path.resolve(args.dir || ".");
  const { config: foundConfig, root } = await readConfig(projectStart);
  const config = mergeConfig(
    foundConfig || { paths: { items: args["base-dir"] || DEFAULT_CONFIG.paths.items } },
  );
  if (args["base-dir"]) config.paths.items = assertSafeRelativePath(args["base-dir"]);
  const data = await registryData(args);
  const items = resolveItems(data, names);
  const writes = await planCopies({
    items,
    targetRoot: root,
    baseDir: config.paths.items,
    includeDocs: args["include-docs"],
  });
  const { links, scripts } = tagsForWrites(writes);
  if (args["dry-run"])
    return ok({
      root,
      dryRun: true,
      requestedItems: names,
      dependencyOrder: items.map((i) => i.name),
      files: writes,
      links,
      scripts,
    });
  const copiedFiles = await performCopies({
    source: registrySource(args),
    targetRoot: root,
    writes,
    force: args.force,
  });
  const next = createManifest({
    registrySource: data.source,
    entry: config.paths.entry,
    baseDir: config.paths.items,
    requestedItems: names,
    dependencyOrder: items.map((i) => i.name),
    copiedFiles,
    links,
    scripts,
  });
  await writeManifest(root, config, mergeManifest(await readManifest(root, config), next));
  return ok({
    root,
    copied: copiedFiles.length,
    requestedItems: names,
    dependencyOrder: items.map((i) => i.name),
    links,
    scripts,
    snippets: [],
  });
}

export async function catalogCommand(argv) {
  const args = parseArgs(argv, { boolean: ["json", "help"] });
  if (args.help)
    return ok({
      help: `Usage: slidesls catalog [--type <type>] [--tag <tag>] [--query <text>] [--limit <n>] [--json]`,
    });
  const data = await registryData(args);
  let items = data.items.map(summarizeItem);
  if (args.type)
    items = items.filter(
      (item) => item.type === args.type || item.type.endsWith(String(args.type)),
    );
  if (args.tag) items = items.filter((item) => item.tags?.includes(args.tag));
  if (args.query) {
    const q = String(args.query).toLowerCase();
    items = items.filter((item) =>
      `${item.name} ${item.title} ${item.description} ${(item.tags || []).join(" ")}`
        .toLowerCase()
        .includes(q),
    );
  }
  if (args.limit) items = items.slice(0, Number(args.limit));
  return ok({ count: items.length, items });
}

export async function inspectCommand(argv) {
  const args = parseArgs(argv, { boolean: ["json", "help", "readme"] });
  if (args.help) return ok({ help: `Usage: slidesls inspect <items...> [--json]` });
  if (!args._.length) throw usageError("slidesls inspect requires at least one item name");
  const data = await registryData(args);
  const items = [];
  for (const item of resolveItems(data, args._)) {
    const summary = summarizeItem(item);
    const writes = await planCopies({
      items: [item],
      targetRoot: process.cwd(),
      baseDir: "slidesls",
      includeDocs: false,
    });
    const tags = tagsForWrites(writes);
    let readme = null;
    if (args.readme && item.docs) readme = await registrySource(args).readText(item.docs);
    items.push({ ...summary, load: tags, readme });
  }
  return ok({ items });
}

export async function validateCommand(argv) {
  const args = parseArgs(argv, { boolean: ["strict", "json", "help"] });
  if (args.help) return ok({ help: `Usage: slidesls validate [dir] [--strict] [--json]` });
  const start = path.resolve(args._[0] || args.dir || ".");
  const { config: foundConfig, root } = await readConfig(start);
  const config = mergeConfig(foundConfig || {});
  const errors = [],
    warnings = [];
  if (!foundConfig)
    warnings.push({
      code: "missing_config",
      message: "slidesls.json was not found; using defaults for explicit validation.",
    });
  const entryPath = path.join(root, config.paths.entry);
  if (!(await exists(entryPath)))
    errors.push({ code: "missing_entry", message: `${config.paths.entry} does not exist` });
  let html = "";
  if (await exists(entryPath)) {
    html = await readFile(entryPath, "utf8");
    if (!/<body\b[^>]*class=["'][^"']*\bls-page\b/i.test(html))
      errors.push({ code: "missing_body_class", message: "body.ls-page is required" });
    if (
      !/<[^>]+class=["'][^"']*\bls-deck\b[^"']*["'][^>]*data-ls-deck/i.test(html) &&
      !/<[^>]+data-ls-deck[^>]*class=["'][^"']*\bls-deck\b/i.test(html)
    )
      errors.push({ code: "missing_deck", message: ".ls-deck[data-ls-deck] is required" });
    if (!/class=["'][^"']*\bls-slide\b/i.test(html))
      errors.push({ code: "missing_slide", message: "At least one .ls-slide is required" });
    if (
      !/slide-runtime\.js/i.test(html) ||
      !/<script\b[^>]*type=["']module["'][^>]*slide-runtime\.js/i.test(html)
    )
      errors.push({
        code: "missing_runtime",
        message: "slide-runtime.js must be loaded as a module script",
      });
    for (const ref of localReferences(html)) {
      const target = path.resolve(path.dirname(entryPath), ref);
      try {
        assertInside(root, target);
      } catch {
        errors.push({ code: "asset_outside_project", message: `${ref} resolves outside project` });
        continue;
      }
      if (!(await exists(target)))
        errors.push({ code: "missing_asset", message: `${ref} does not exist` });
    }
    if (/data-lucide=/.test(html) && !/lucide/i.test(html))
      warnings.push({
        code: "lucide_missing",
        message: "data-lucide appears without a Lucide script; icons are opt-in.",
      });
    if (/ls-reveal/.test(html) && !/data-step=/.test(html) && !/data-ls-reveal-sequence/.test(html))
      warnings.push({
        code: "reveal_steps",
        message: "Reveal elements should use data-step or data-ls-reveal-sequence.",
      });
  }
  const manifest = await readManifest(root, config);
  if (manifest) {
    for (const file of manifest.copiedFiles || []) {
      const target = path.join(root, file.targetPath);
      if (!(await exists(target))) {
        errors.push({
          code: "manifest_missing_file",
          message: `${file.targetPath} is listed in manifest but missing`,
        });
        continue;
      }
      if (file.sha256) {
        const actual = await sha256File(target);
        if (actual !== file.sha256)
          (args.strict ? errors : warnings).push({
            code: "manifest_hash_drift",
            message: `${file.targetPath} differs from manifest hash`,
          });
      }
    }
  }
  const valid = errors.length === 0;
  return ok({ valid, root, entry: config.paths.entry, errors, warnings });
}

export async function previewCommand(argv) {
  const args = parseArgs(argv, { boolean: ["json", "help", "open"] });
  if (args.help)
    return ok({ help: `Usage: slidesls preview [dir] [--host <host>] [--port <port>] [--json]` });
  const start = path.resolve(args._[0] || args.dir || ".");
  const { config: foundConfig, root } = await readConfig(start);
  const config = mergeConfig(foundConfig || {});
  const host = args.host || "127.0.0.1";
  const desiredPort = Number(args.port || 4321);
  const server = createServer(async (request, response) => {
    const url = new URL(request.url || "/", `http://${host}`);
    const relative =
      url.pathname === "/" ? config.paths.entry : decodeURIComponent(url.pathname.slice(1));
    const target = path.join(root, relative);
    try {
      assertInside(root, target);
      response.end(await readFile(target));
    } catch {
      response.statusCode = 404;
      response.end("Not found");
    }
  });
  const port = await listen(server, host, desiredPort);
  const url = `http://${host}:${port}/`;
  return ok({
    url,
    root,
    entry: config.paths.entry,
    host,
    port,
    pid: process.pid,
    note: "Server keeps running until this process is stopped.",
  });
}

function listen(server, host, port) {
  return new Promise((resolve, reject) => {
    server.once("error", (error) => {
      if (error.code === "EADDRINUSE" && port !== 0) resolve(listen(server, host, 0));
      else reject(error);
    });
    server.listen(port, host, () => resolve(server.address().port));
  });
}

export function textFor(command, result) {
  if (command === "help" || result.data?.help) return `${result.data.help}\n`;
  if (command === "catalog")
    return (
      result.data.items
        .map((item) => `${item.name.padEnd(36)} ${item.type.padEnd(13)} ${item.description || ""}`)
        .join("\n") + "\n"
    );
  if (command === "inspect")
    return (
      result.data.items
        .map(
          (item) =>
            `${item.name}\n  ${item.description || ""}\n  Files: ${(item.files || []).map((file) => file.path).join(", ")}\n  Links:\n    ${(item.load.links || []).join("\n    ")}\n  Scripts:\n    ${(item.load.scripts || []).join("\n    ")}`,
        )
        .join("\n\n") + "\n"
    );
  if (command === "validate")
    return result.data.valid
      ? `slidesls validate: ok (${result.data.root})\n`
      : `slidesls validate: failed (${result.data.errors.length} error(s))\n${result.data.errors.map((e) => `- ${e.message}`).join("\n")}\n`;
  if (command === "add")
    return `Copied ${result.data.copied} file(s). Add these tags if needed:\n${[...result.data.links, ...result.data.scripts].join("\n")}\n`;
  if (command === "init")
    return `Initialized ${result.data.root}\nNext steps:\n${result.data.nextSteps.map((s) => `  ${s}`).join("\n")}\n`;
  if (command === "preview") return `Serving ${result.data.root} at ${result.data.url}\n`;
  return `${JSON.stringify(result.data, null, 2)}\n`;
}
