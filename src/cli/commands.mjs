import { createServer } from "node:http";
import path from "node:path";
import { access, readFile, realpath } from "node:fs/promises";
import { parseArgs, usageError } from "../shared/args.mjs";
import { ok } from "../shared/result.mjs";
import {
  assertInside,
  assertSafeRelativePath,
  exists,
  sha256File,
  writeText,
} from "../shared/fs.mjs";
import {
  hasDeckElement,
  hasElementWithClass,
  hasLucideScript,
  hasModuleRuntimeScript,
  localReferences,
  usesLucideIcons,
} from "../shared/html.mjs";
import { RegistrySource, loadRegistry, resolveItems, summarizeItem } from "../registry/source.mjs";
import {
  CONFIG_FILE,
  DEFAULT_CONFIG,
  mergeConfig,
  readConfig,
  writeDefaultConfig,
} from "../deck/config.mjs";
import { createManifest, mergeManifest, readManifest, writeManifest } from "../deck/manifest.mjs";
import { performCopies, planCopies, tagsForWrites } from "../deck/copy.mjs";
import { deckTemplate } from "../deck/templates.mjs";
import { validateRegistry } from "../validation/registry.mjs";
import { validateExamples } from "../validation/examples.mjs";
import { generateCatalogDoc } from "../registry/catalog-doc.mjs";
import {
  defaultSkillTarget,
  performSkillInstall,
  performSkillLink,
  readSkillMarkdown,
  skillInfo,
} from "../skill/agent-skill.mjs";

const coreItems = ["core/base"];
const minimalItems = ["core/base", "utilities/layout", "components/badge", "components/panel"];

export const help = `slidesls — plain HTML/CSS/JS slide authoring CLI

Usage:
  slidesls <command> [options]

Commands:
  init [dir]       Initialize a deck in the current directory, or in [dir]
  add <items...>   Copy registry items into a deck project
  catalog          List registry items, with --recommended for agent-safe items
  inspect <items>  Show metadata, load guidance, and snippets
  skill            Show, install, or link the bundled agent skill
  validate [dir]           Static deck validation
  preview [dir]            Serve a deck locally
  doctor                   Check CLI/project health
  validate-registry        Validate registry metadata and files
  validate-examples        Validate repo example/template references
  generate-catalog         Generate/check agent catalog docs
  help                     Show help

Agent usage:
  slidesls skill install ./.claude/skills/slidesls
  slidesls catalog --recommended --json
  slidesls inspect templates/split --json
  slidesls add utilities/layout components/panel components/card --dry-run --json

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
    case "skill":
      return skillCommand(argv);
    case "validate":
      return validateCommand(argv);
    case "preview":
      return previewCommand(argv);
    case "doctor":
      return doctorCommand(argv);
    case "validate-registry":
      return validateRegistryCommand(argv);
    case "validate-examples":
      return validateExamplesCommand(argv);
    case "generate-catalog":
      return generateCatalogCommand(argv);
    case "help":
      return ok({ help });
    default:
      throw usageError(`Unknown command: ${command}`, "Run slidesls --help.");
  }
}

function rejectRemovedRegistryOption(args) {
  if (args.registry !== undefined)
    throw usageError(
      "--registry has been removed.",
      "Use --registry-root <path> or --registry-url <url>.",
    );
}

function registrySource(args) {
  return new RegistrySource({
    registryRoot: args["registry-root"],
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
      help: `Usage: slidesls init [dir] [--template blank|minimal] [--title <text>] [--registry-root <path>] [--registry-url <url>] [--force] [--json]

Initializes the current directory by default. If [dir] is supplied, initializes that directory.
Use a dedicated deck folder inside larger projects to avoid adding deck files to the project root.`,
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
  const config = mergeConfig({ registry: "bundled" });
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
  await writeText(
    path.join(projectRoot, config.paths.items, "schema", "slidesls.schema.json"),
    await readFile(
      path.resolve(import.meta.dirname, "..", "..", "schemas", "slidesls.schema.json"),
      "utf8",
    ),
  );
  await writeText(
    path.join(projectRoot, config.paths.items, "schema", "manifest.schema.json"),
    await readFile(
      path.resolve(import.meta.dirname, "..", "..", "schemas", "manifest.schema.json"),
      "utf8",
    ),
  );
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
      "slidesls catalog --recommended",
      "slidesls inspect templates/split --json",
      "slidesls add utilities/layout components/card components/panel",
      "slidesls validate",
      "slidesls preview",
    ],
  });
}

export async function addCommand(argv) {
  const args = parseArgs(argv, { boolean: ["include-docs", "dry-run", "force", "json", "help"] });
  if (args.help)
    return ok({
      help: `Usage: slidesls add <items...> [--dir <project>] [--base-dir <relative>] [--registry-root <path>] [--registry-url <url>] [--include-docs] [--dry-run] [--force] [--json]`,
    });
  rejectRemovedRegistryOption(args);
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
  const args = parseArgs(argv, { boolean: ["json", "help", "recommended"] });
  if (args.help)
    return ok({
      help: `Usage: slidesls catalog [--recommended] [--type <type>] [--tag <tag>] [--query <text>] [--limit <n>] [--registry-root <path>] [--registry-url <url>] [--json]`,
    });
  rejectRemovedRegistryOption(args);
  const data = await registryData(args);
  let items = data.items.map(summarizeItem);
  if (args.recommended) items = items.filter((item) => item.agentRecommended === true);
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
  if (args.help)
    return ok({
      help: `Usage: slidesls inspect <items...> [--readme] [--registry-root <path>] [--registry-url <url>] [--json]`,
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
  return ok({ items });
}

export async function skillCommand(argv) {
  const args = parseArgs(argv, { boolean: ["json", "help", "dry-run", "force"] });
  const subcommand = args._[0] || "info";
  const targetDir = args._[1] ? path.resolve(args._[1]) : defaultSkillTarget();

  if (args.help)
    return ok({
      help: `Usage:
  slidesls skill info [--json]
  slidesls skill show
  slidesls skill install [dir] [--dry-run] [--force] [--json]
  slidesls skill link [dir] [--force] [--json]

Defaults:
  [dir] defaults to ./.claude/skills/slidesls in the current project.

Local checkout example:
  node /path/to/ls_slides/bin/slidesls.mjs skill link ./.claude/skills/slidesls`,
    });

  switch (subcommand) {
    case "info":
      return ok(await skillInfo());
    case "show":
      return ok({ markdown: await readSkillMarkdown() });
    case "install":
      return ok(
        await performSkillInstall({
          targetDir,
          dryRun: args["dry-run"],
          force: args.force,
        }),
      );
    case "link":
      if (args["dry-run"])
        throw usageError(
          "slidesls skill link does not support --dry-run",
          "Use skill install --dry-run.",
        );
      return ok(await performSkillLink({ targetDir, force: args.force }));
    default:
      throw usageError(`Unknown skill subcommand: ${subcommand}`, "Run slidesls skill --help.");
  }
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
    if (!hasElementWithClass(html, "body", "ls-page"))
      errors.push({ code: "missing_body_class", message: "body.ls-page is required" });
    if (!hasDeckElement(html))
      errors.push({ code: "missing_deck", message: ".ls-deck[data-ls-deck] is required" });
    if (!hasElementWithClass(html, "[a-z][a-z0-9:-]*", "ls-slide"))
      errors.push({ code: "missing_slide", message: "At least one .ls-slide is required" });
    if (!hasModuleRuntimeScript(html))
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
    if (usesLucideIcons(html) && !hasLucideScript(html))
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
  if (html) validateClassDependencies({ html, manifest, errors, warnings });
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

export async function doctorCommand(argv) {
  const args = parseArgs(argv, { boolean: ["json", "help"] });
  if (args.help)
    return ok({
      help: `Usage: slidesls doctor [--dir <project>] [--registry-root <path>] [--registry-url <url>] [--json]`,
    });
  rejectRemovedRegistryOption(args);
  const start = path.resolve(args.dir || args._[0] || ".");
  const checks = [];
  const warnings = [];
  const errors = [];
  const pkg = JSON.parse(
    await readFile(path.resolve(import.meta.dirname, "..", "..", "package.json"), "utf8"),
  );

  function check(code, passed, message, severity = "error", details = {}) {
    const entry = { code, passed, message, severity, ...details };
    checks.push(entry);
    if (!passed && severity === "error") errors.push(entry);
    if (!passed && severity === "warning") warnings.push(entry);
  }

  const required = pkg.engines?.node?.match(/>=\s*([\d.]+)/)?.[1];
  check(
    "node_version",
    !required || compareVersions(process.versions.node, required) >= 0,
    `Node ${process.versions.node}${required ? ` satisfies >=${required}` : " detected"}`,
  );
  check(
    "package_metadata",
    Boolean(pkg.name && pkg.version && pkg.bin?.slidesls),
    `Package ${pkg.name}@${pkg.version} metadata is readable`,
  );

  let configInfo;
  try {
    configInfo = await readConfig(start);
    check(
      "config_parse",
      true,
      configInfo.configPath
        ? `${CONFIG_FILE} parsed`
        : `${CONFIG_FILE} not found; defaults are available`,
      configInfo.configPath ? "error" : "warning",
    );
  } catch (error) {
    check("config_parse", false, `${CONFIG_FILE} could not be parsed: ${error.message}`);
    configInfo = { config: null, root: start };
  }
  const config = mergeConfig(configInfo.config || {});
  if (configInfo.config) {
    check(
      "entry_exists",
      await exists(path.join(configInfo.root, config.paths.entry)),
      `Entry file exists: ${config.paths.entry}`,
    );
  }
  try {
    await access(configInfo.root, 2);
    check("project_writable", true, `Project directory is writable: ${configInfo.root}`);
  } catch {
    check("project_writable", false, `Project directory is not writable: ${configInfo.root}`);
  }
  try {
    const data = await registryData(args);
    check("registry_available", true, `Registry available with ${data.items.length} item(s)`);
  } catch (error) {
    check("registry_available", false, `Registry is unavailable: ${error.message}`);
  }
  check(
    "browser_optional",
    false,
    "Browser snapshot support is optional and not bundled in the MVP",
    "warning",
  );

  return ok({
    ok: errors.length === 0,
    package: { name: pkg.name, version: pkg.version },
    root: configInfo.root,
    checks,
    errors,
    warnings,
  });
}

function validateClassDependencies({ html, manifest, errors, warnings }) {
  if (/\bls-layout-[\w-]+/.test(html))
    errors.push({
      code: "removed_layout_class",
      message:
        "ls-layout-* classes are not part of the current registry; use templates and utilities instead.",
    });

  const copied = new Set(manifest?.dependencyOrder || []);
  const checks = [
    { item: "utilities/layout", pattern: /\bls-(?:stack|cluster|grid|center|fill|frame)(?:\b|--)/ },
    { item: "components/panel", pattern: /\bls-panel(?:\b|__|--)/ },
    { item: "components/card", pattern: /\bls-card(?:\b|__|--)/ },
    { item: "components/badge", pattern: /\bls-badge(?:\b|__|--)/ },
    { item: "components/callout", pattern: /\bls-callout(?:\b|__|--)/ },
    { item: "components/code-block", pattern: /\bls-code-block(?:\b|__|--)/ },
    { item: "components/metric", pattern: /\bls-metric(?:\b|__|--)/ },
    { item: "components/progress", pattern: /\bls-progress(?:\b|__|--)/ },
    { item: "components/quote", pattern: /\bls-quote(?:\b|__|--)/ },
    { item: "components/table", pattern: /\bls-table(?:\b|__|--)/ },
    { item: "components/timeline", pattern: /\bls-timeline(?:\b|__|--)/ },
  ];

  for (const check of checks) {
    if (check.pattern.test(html) && !copied.has(check.item))
      warnings.push({
        code: "missing_registry_item_for_class",
        message: `${check.item} should be added when using its classes in HTML`,
      });
  }
}

function compareVersions(actual, required) {
  const a = actual.split(".").map(Number);
  const b = required.split(".").map(Number);
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    const diff = (a[index] || 0) - (b[index] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export async function validateRegistryCommand(argv) {
  const args = parseArgs(argv, { boolean: ["json", "help"] });
  if (args.help)
    return ok({
      help: `Usage: slidesls validate-registry [--registry-root <path>] [--registry-url <url>] [--json]`,
    });
  rejectRemovedRegistryOption(args);
  const result = await validateRegistry({
    registryRoot: args["registry-root"],
    registryUrl: args["registry-url"],
  });
  return ok(result);
}

export async function validateExamplesCommand(argv) {
  const args = parseArgs(argv, { boolean: ["json", "help"] });
  if (args.help) return ok({ help: `Usage: slidesls validate-examples [--dir <repo>] [--json]` });
  return ok(await validateExamples({ root: args.dir || args._[0] || process.cwd() }));
}

export async function generateCatalogCommand(argv) {
  const args = parseArgs(argv, { boolean: ["json", "help", "check"] });
  if (args.help)
    return ok({
      help: `Usage: slidesls generate-catalog [--registry-root <path>] [--registry-url <url>] [--output <path>] [--check] [--json]`,
    });
  rejectRemovedRegistryOption(args);
  const result = await generateCatalogDoc({
    registryRoot: args["registry-root"],
    registryUrl: args["registry-url"],
    output: args.output,
    check: args.check,
  });
  if (!result.ok) {
    const error = new Error(`Catalog is out of date: ${result.output}`);
    error.code = "catalog_out_of_date";
    throw error;
  }
  return ok(result);
}

export async function previewCommand(argv) {
  const args = parseArgs(argv, { boolean: ["json", "help"] });
  if (args.help)
    return ok({ help: `Usage: slidesls preview [dir] [--host <host>] [--port <port>] [--json]` });
  const start = path.resolve(args._[0] || args.dir || ".");
  const { config: foundConfig, root } = await readConfig(start);
  const config = mergeConfig(foundConfig || {});
  const host = args.host || "127.0.0.1";
  const desiredPort = Number(args.port || 4321);
  const realRoot = await realpath(root);
  const server = createServer(async (request, response) => {
    const url = new URL(request.url || "/", `http://${host}`);
    const relative =
      url.pathname === "/" ? config.paths.entry : decodeURIComponent(url.pathname.slice(1));
    const target = path.join(root, relative);
    try {
      assertInside(root, target);
      const realTarget = await realpath(target);
      assertInside(realRoot, realTarget);
      response.setHeader("Content-Type", contentType(target));
      response.end(await readFile(realTarget));
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

function contentType(filePath) {
  return (
    {
      ".html": "text/html; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".js": "text/javascript; charset=utf-8",
      ".mjs": "text/javascript; charset=utf-8",
      ".json": "application/json; charset=utf-8",
      ".svg": "image/svg+xml",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".webp": "image/webp",
      ".gif": "image/gif",
    }[path.extname(filePath).toLowerCase()] || "application/octet-stream"
  );
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

function formatCounts(counts = {}) {
  const entries = Object.entries(counts);
  if (!entries.length) return "";
  return `${entries.map(([status, count]) => `${status}: ${count}`).join(", ")}\n`;
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
        .map((item) => {
          const snippets = (item.snippets || [])
            .map((snippet) => `${snippet.label}: ${snippet.path}`)
            .join("\n    ");
          return `${item.name}\n  ${item.description || ""}\n  Files: ${(item.files || []).map((file) => file.path).join(", ") || "none"}\n  Snippets:\n    ${snippets || "none"}\n  Links:\n    ${(item.load.links || []).join("\n    ")}\n  Scripts:\n    ${(item.load.scripts || []).join("\n    ")}`;
        })
        .join("\n\n") + "\n"
    );
  if (command === "skill") {
    if (result.data.markdown) return result.data.markdown;
    if (!result.data.action)
      return `slidesls skill: ${result.data.source}\nFiles: ${result.data.files?.length || 0}\n${result.data.recommendedTargets ? `Recommended target: ${result.data.recommendedTargets[0]}\n` : ""}`;
    return `slidesls skill ${result.data.action}: ${result.data.target}\n${result.data.status ? `status: ${result.data.status}\n` : ""}${formatCounts(result.data.counts)}`;
  }
  if (command === "validate")
    return result.data.valid
      ? `slidesls validate: ok (${result.data.root})\n`
      : `slidesls validate: failed (${result.data.errors.length} error(s))\n${result.data.errors.map((e) => `- ${e.message}`).join("\n")}\n`;
  if (command === "add") {
    const links = result.data.links || [];
    const scripts = result.data.scripts || [];
    const count = result.data.dryRun ? result.data.files.length : result.data.copied;
    const action = result.data.dryRun ? "Would copy" : "Copied";
    return `${action} ${count} file(s). Add these tags if needed:\n${[...links, ...scripts].join("\n")}\n`;
  }
  if (command === "init")
    return `Initialized ${result.data.root}\nNext steps:\n${result.data.nextSteps.map((s) => `  ${s}`).join("\n")}\n`;
  if (command === "preview") return `Serving ${result.data.root} at ${result.data.url}\n`;
  if (command === "doctor")
    return result.data.ok
      ? `slidesls doctor: ok (${result.data.root})\n${result.data.warnings.map((w) => `- warning: ${w.message}`).join("\n")}${result.data.warnings.length ? "\n" : ""}`
      : `slidesls doctor: failed (${result.data.errors.length} error(s))\n${result.data.errors.map((e) => `- ${e.message}`).join("\n")}\n`;
  if (command === "validate-registry")
    return result.data.valid
      ? `slidesls validate-registry: ok (${result.data.itemCount} item(s))\n`
      : `slidesls validate-registry: failed (${result.data.errors.length} error(s))\n${result.data.errors.map((e) => `- ${e.message}`).join("\n")}\n`;
  if (command === "validate-examples")
    return result.data.valid
      ? `slidesls validate-examples: ok (${result.data.checkedExamples} example(s))\n`
      : `slidesls validate-examples: failed (${result.data.errors.length} error(s))\n${result.data.errors.map((e) => `- ${e.message}`).join("\n")}\n`;
  if (command === "generate-catalog")
    return `${result.data.checked ? "Catalog is up to date" : "Wrote catalog"}: ${result.data.output}\n`;
  return `${JSON.stringify(result.data, null, 2)}\n`;
}
