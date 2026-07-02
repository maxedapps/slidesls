import path from "node:path";
import { readFile } from "node:fs/promises";
import { parseArgs, usageError } from "../shared/args.mjs";
import { ok } from "../shared/result.mjs";
import { assertInside, assertSafeRelativePath, exists, writeText } from "../shared/fs.mjs";
import { resolveItems, summarizeItem } from "../registry/source.mjs";
import { CONFIG_FILE, DEFAULT_CONFIG, readConfig, writeDefaultConfig } from "../deck/config.mjs";
import {
  createManifest,
  manifestPath,
  mergeManifest,
  readManifest,
  writeManifest,
} from "../deck/manifest.mjs";
import {
  commitCopies,
  performCopies,
  planCopies,
  prepareCopies,
  tagsForWrites,
} from "../deck/copy.mjs";
import { deckTemplate } from "../deck/templates.mjs";
import {
  addAgentInstructions,
  catalogAgentInstructions,
  initAgentInstructions,
  inspectAgentInstructions,
} from "./agent-instructions.mjs";
import { registryData, registrySource, rejectRemovedRegistryOption } from "./registry-options.mjs";
import { normalizedType, normalizeThemeName, themeApplication, themePreset } from "./theme.mjs";

const coreItems = ["core/base"];
const minimalItems = [
  "core/base",
  "utilities/layout",
  "components/badge",
  "components/panel",
  "animations/reveal",
];

async function precheckNewFiles(root, filePaths) {
  const collisions = [];
  for (const filePath of filePaths) {
    assertInside(root, filePath);
    if (await exists(filePath)) collisions.push(path.relative(root, filePath));
  }
  if (!collisions.length) return;
  const error = new Error(
    `Refusing to overwrite existing files without --force: ${collisions.join(", ")}`,
  );
  error.code = "file_exists";
  throw error;
}

export async function initCommand(argv) {
  const args = parseArgs(argv, { boolean: ["force", "json", "help"] });
  if (args.help)
    return ok({
      help: `Usage: slidesls init [dir] [--template blank|minimal] [--theme <theme>] [--title <text>] [--registry-root <path>] [--registry-url <url>] [--force] [--json]

Initializes the current directory by default. If [dir] is supplied, initializes that directory.
Use a dedicated deck folder inside larger projects to avoid adding deck files to the project root.
Use --theme executive-blue to copy a theme preset and set data-ls-theme on the generated <html>.

For AI agents:
  Start with JSON output: slidesls init <dir> --template minimal --json
  Then run slidesls catalog --recommended --json and slidesls validate <dir> --json.`,
    });
  rejectRemovedRegistryOption(args);
  const projectRoot = path.resolve(args._[0] || ".");
  const template = args.template || "minimal";
  if (!["blank", "minimal"].includes(template))
    throw usageError(
      `Unsupported template: ${template}`,
      "Use --template blank or --template minimal.",
    );
  const title = args.title || path.basename(projectRoot) || "Untitled deck";
  const config = DEFAULT_CONFIG;
  const entryPath = path.join(projectRoot, config.paths.entry);
  const configPath = path.join(projectRoot, CONFIG_FILE);
  const schemaFiles = [
    {
      target: path.join(projectRoot, config.paths.items, "schema", "slidesls.schema.json"),
      source: path.resolve(import.meta.dirname, "..", "..", "schemas", "slidesls.schema.json"),
    },
    {
      target: path.join(projectRoot, config.paths.items, "schema", "manifest.schema.json"),
      source: path.resolve(import.meta.dirname, "..", "..", "schemas", "manifest.schema.json"),
    },
  ];
  const data = await registryData(args);
  const themeName = args.theme ? normalizeThemeName(args.theme) : null;
  const themeItem = themeName ? themePreset(data, themeName) : null;
  const items = resolveItems(data, [
    ...(template === "blank" ? coreItems : minimalItems),
    ...(themeItem ? [themeItem.name] : []),
  ]);
  const writes = await planCopies({ items, targetRoot: projectRoot, baseDir: config.paths.items });
  const preparedCopies = await prepareCopies({
    source: registrySource(args),
    targetRoot: projectRoot,
    writes,
    force: args.force,
  });
  if (!args.force)
    await precheckNewFiles(projectRoot, [
      configPath,
      entryPath,
      manifestPath(projectRoot, config),
      ...schemaFiles.map((file) => file.target),
    ]);
  await writeDefaultConfig(projectRoot, config);
  for (const file of schemaFiles) await writeText(file.target, await readFile(file.source, "utf8"));
  const copiedFiles = await commitCopies(preparedCopies);
  await writeText(
    entryPath,
    deckTemplate({
      title,
      template,
      baseDir: config.paths.items,
      themeAttribute: themeItem?.themeAttribute,
    }),
  );
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
    theme: themeItem ? themeItem.themeAttribute : null,
    nextSteps: [
      "slidesls catalog --recommended --json",
      "slidesls inspect templates/split --readme --json",
      `slidesls validate ${projectRoot} --json`,
      `slidesls preview ${projectRoot}`,
    ],
    agentInstructions: initAgentInstructions(projectRoot),
  });
}

export async function addCommand(argv) {
  const args = parseArgs(argv, { boolean: ["include-docs", "dry-run", "force", "json", "help"] });
  if (args.help)
    return ok({
      help: `Usage: slidesls add <items...> [--dir <project>] [--base-dir <relative>] [--registry-root <path>] [--registry-url <url>] [--include-docs] [--dry-run] [--force] [--json]

Copies registry items into an initialized deck, or into any existing project in copy mode when --dir has no slidesls.json.

For AI agents:
  Run slidesls add <items...> --dir <deck-or-project> --dry-run --json first.
  add copies files and updates the manifest; it does not edit HTML.
  Add returned load tags to the entry HTML when needed.
  Use slidesls inspect <item> --readme --json for exact snippets, then slidesls validate <deck> --json.`,
    });
  rejectRemovedRegistryOption(args);
  const names = args._;
  if (!names.length) throw usageError("slidesls add requires at least one item name");
  const projectStart = path.resolve(args.dir || ".");
  const { config: foundConfig, root } = await readConfig(projectStart, Boolean(args.dir));
  const configFound = Boolean(foundConfig);
  const config = foundConfig
    ? { ...foundConfig, paths: { ...foundConfig.paths } }
    : { ...DEFAULT_CONFIG, paths: { ...DEFAULT_CONFIG.paths } };
  if (args["base-dir"] || !configFound)
    config.paths.items = assertSafeRelativePath(args["base-dir"] || DEFAULT_CONFIG.paths.items);
  const mode = configFound ? "deck" : "copy";
  const data = await registryData(args);
  const items = resolveItems(data, names);
  const writes = await planCopies({
    items,
    targetRoot: root,
    baseDir: config.paths.items,
    includeDocs: args["include-docs"],
  });
  const { links, scripts } = tagsForWrites(writes);
  const applyTheme = themeApplication(items);
  if (args["dry-run"])
    return ok({
      root,
      dryRun: true,
      configFound,
      mode,
      baseDir: config.paths.items,
      requestedItems: names,
      dependencyOrder: items.map((i) => i.name),
      files: writes,
      links,
      scripts,
      applyTheme,
      agentInstructions: addAgentInstructions({ dryRun: true, root }),
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
    configFound,
    mode,
    baseDir: config.paths.items,
    copied: copiedFiles.length,
    requestedItems: names,
    dependencyOrder: items.map((i) => i.name),
    links,
    scripts,
    applyTheme,
    snippets: [],
    agentInstructions: addAgentInstructions({ root }),
  });
}

export async function catalogCommand(argv) {
  const args = parseArgs(argv, { boolean: ["json", "help", "recommended"] });
  if (args.help)
    return ok({
      help: `Usage: slidesls catalog [--recommended] [--type <type>] [--tag <tag>] [--query <text>] [--limit <n>] [--registry-root <path>] [--registry-url <url>] [--json]

JSON output includes public authoring metadata for classes, modifiers, data attributes, attributes, CSS variables, and usage rules.

For AI agents:
  Use slidesls catalog --recommended --json for the agent-safe starting set.
  Use slidesls catalog --json before authoring ls-* markup.
  Use slidesls catalog --type preset --tag theme --json to discover themes.
  Use slidesls inspect <item> --readme --json for snippets, load tags, and docs.`,
    });
  rejectRemovedRegistryOption(args);
  const data = await registryData(args);
  let items = data.items.map(summarizeItem);
  if (args.recommended) items = items.filter((item) => item.agentRecommended === true);
  if (args.type)
    items = items.filter((item) => normalizedType(item.type) === normalizedType(args.type));
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
  return ok({ count: items.length, items, agentInstructions: catalogAgentInstructions() });
}

export async function inspectCommand(argv) {
  const args = parseArgs(argv, { boolean: ["json", "help", "readme"] });
  if (args.help)
    return ok({
      help: `Usage: slidesls inspect <items...> [--readme] [--registry-root <path>] [--registry-url <url>] [--json]

Includes public authoring metadata plus load tags, snippets, and optional README content.

For AI agents:
  Use after catalog to get exact markup and load tags.
  JSON includes authoring, load.links, load.scripts, snippets[].html, and optional readme.`,
    });
  rejectRemovedRegistryOption(args);
  if (!args._.length) throw usageError("slidesls inspect requires at least one item name");
  const data = await registryData(args);
  const source = registrySource(args);
  const requested = new Set(args._);
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
    if (args.readme && item.docs) readme = await source.readText(item.docs);
    const snippets = requested.has(item.name)
      ? await Promise.all(
          (item.snippets || []).map(async (snippet) => ({
            ...snippet,
            html: await source.readText(snippet.path),
          })),
        )
      : item.snippets || [];
    items.push({ ...summary, snippets, load: tags, readme });
  }
  return ok({ items, agentInstructions: inspectAgentInstructions(args._) });
}
