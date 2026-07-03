import path from "node:path";
import { readFile } from "node:fs/promises";
import { parseArgs, usageError } from "../shared/args.mjs";
import { commandOptionSpecs } from "./option-specs.mjs";
import { ok } from "../shared/result.mjs";
import { assertInside, assertSafeRelativePath, exists, writeText } from "../shared/fs.mjs";
import {
  catalogGroups,
  mergeBriefAndRich,
  resolveItems,
  summarizeItemBrief,
} from "../registry/source.mjs";
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
  const args = parseArgs(argv, commandOptionSpecs.init);
  if (args.help)
    return ok({
      help: `Usage: slidesls init [dir] [--template blank|minimal] [--theme <theme>] [--title <text>] [--registry-root <path>] [--registry-url <url>] [--force] [--json]

Initializes the current directory by default. If [dir] is supplied, initializes that directory.
Use a dedicated deck folder inside larger projects to avoid adding deck files to the project root.
Use --theme executive-blue to copy a theme preset and set data-ls-theme on the generated <html>.

For AI agents:
  Start with JSON output: slidesls init <dir> --template minimal --json
  Then run slidesls catalog --starter --json and slidesls validate <dir> --json.`,
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
      "slidesls catalog --starter --json",
      "slidesls inspect templates/split --json",
      `slidesls validate ${projectRoot} --json`,
      `slidesls preview ${projectRoot}`,
    ],
    agentInstructions: initAgentInstructions(projectRoot),
  });
}

export async function addCommand(argv) {
  const args = parseArgs(argv, commandOptionSpecs.add);
  if (args.help)
    return ok({
      help: `Usage: slidesls add <items...> [--dir <project>] [--base-dir <relative>] [--registry-root <path>] [--registry-url <url>] [--include-docs] [--dry-run] [--force] [--json]

Copies registry items into an initialized deck, or into any existing project in copy mode when --dir has no slidesls.json.

For AI agents:
  Run slidesls add <items...> --dir <deck-or-project> --dry-run --json first.
  add copies files and updates the manifest; it does not edit HTML.
  Add returned load tags to the entry HTML when needed.
  Use slidesls inspect <item> --json for exact snippets, then slidesls validate <deck> --json.`,
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
  const args = parseArgs(argv, commandOptionSpecs.catalog);
  if (args.help)
    return ok({
      help: `Usage: slidesls catalog [--recommended] [--type <type>] [--tag <tag>] [--query <text>] [--limit <n>] [--registry-root <path>] [--registry-url <url>] [--json]

JSON output is brief by default. Add --api for public authoring metadata.

For AI agents:
  Use slidesls catalog --starter --json for the smallest starting set.
  Use slidesls catalog --json before choosing registry items.
  Use slidesls catalog --type preset --tag theme --json to discover themes.
  Use slidesls inspect <item> --json for snippets and load tags.`,
    });
  rejectRemovedRegistryOption(args);
  const data = await registryData(args);
  let rawItems = data.items;
  if (args.starter) rawItems = rawItems.filter((item) => item.agentLevel === "starter");
  if (args.level) rawItems = rawItems.filter((item) => item.agentLevel === args.level);
  if (args.recommended)
    rawItems = rawItems.filter((item) => ["starter", "recommended"].includes(item.agentLevel));
  if (args.type)
    rawItems = rawItems.filter((item) => normalizedType(item.type) === normalizedType(args.type));
  if (args.tag) rawItems = rawItems.filter((item) => item.tags?.includes(args.tag));
  if (args.query) {
    const q = String(args.query).toLowerCase();
    rawItems = rawItems.filter((item) =>
      `${item.name} ${item.title || item.label} ${item.description} ${(item.tags || []).join(" ")}`
        .toLowerCase()
        .includes(q),
    );
  }
  if (args.limit) rawItems = rawItems.slice(0, Number(args.limit));
  const items = rawItems.map((item) =>
    args.api ? mergeBriefAndRich(item) : summarizeItemBrief(item),
  );
  return ok({
    count: items.length,
    groups: catalogGroups(items),
    items,
    commandTemplates: catalogCommandTemplates(),
    agentInstructions: catalogAgentInstructions({ api: args.api }),
  });
}

export async function inspectCommand(argv) {
  const args = parseArgs(argv, commandOptionSpecs.inspect);
  if (args.help)
    return ok({
      help: `Usage: slidesls inspect <items...> [--api] [--with-dependencies] [--readme] [--registry-root <path>] [--registry-url <url>] [--json]

JSON output is snippet-focused by default. Add --api for authoring metadata and --with-dependencies for dependency details.

For AI agents:
  Use after catalog to get exact markup and aggregate load tags.
  Default JSON includes snippets[].html, dependencyOrder, load.links, and load.scripts.`,
    });
  rejectRemovedRegistryOption(args);
  if (!args._.length) throw usageError("slidesls inspect requires at least one item name");
  const data = await registryData(args);
  const source = registrySource(args);
  const items = [];
  for (const name of args._) {
    const closure = resolveItems(data, [name]);
    const item = closure.at(-1);
    const writes = await planCopies({
      items: closure,
      targetRoot: process.cwd(),
      baseDir: "slidesls",
      includeDocs: false,
    });
    const snippets = await Promise.all(
      (item.snippets || []).map(async (snippet) => ({
        ...snippet,
        html: await source.readText(snippet.path),
      })),
    );
    const readme = args.readme && item.docs ? await source.readText(item.docs) : undefined;
    const dependencies = args["with-dependencies"]
      ? closure
          .slice(0, -1)
          .map((dependency) =>
            args.api ? mergeBriefAndRich(dependency) : summarizeItemBrief(dependency),
          )
      : undefined;
    items.push(
      omitUndefined({
        ...(args.api ? mergeBriefAndRich(item) : summarizeItemBrief(item)),
        docs: item.docs,
        snippets,
        dependencyOrder: closure.map((resolved) => resolved.name),
        load: tagsForWrites(writes),
        readme,
        dependencies,
      }),
    );
  }
  return ok({
    items,
    commandTemplates: inspectCommandTemplates(),
    agentInstructions: inspectAgentInstructions(args._, { api: args.api }),
  });
}

function catalogCommandTemplates() {
  return {
    inspect: "slidesls inspect <item> --json",
    inspectApi: "slidesls inspect <item> --api --json",
    addDryRun: "slidesls add <item> --dir <deck> --dry-run --json",
  };
}

function inspectCommandTemplates() {
  return {
    addDryRun: "slidesls add <item> --dir <deck> --dry-run --json",
    validate: "slidesls validate <deck> --json",
    inspectApi: "slidesls inspect <item> --api --json",
  };
}

function omitUndefined(object) {
  return Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined));
}
