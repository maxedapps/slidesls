import path from "node:path";
import { access, readFile } from "node:fs/promises";
import { parseArgs } from "../shared/args.mjs";
import { commandOptionSpecs } from "./option-specs.mjs";
import { ok } from "../shared/result.mjs";
import { exists, sha256File } from "../shared/fs.mjs";
import {
  hasDeckElement,
  hasElementWithClass,
  hasLucideScript,
  hasModuleRuntimeScript,
  stripNonRenderedCode,
  usesLucideIcons,
} from "../shared/html.mjs";
import { RegistrySource, loadRegistry } from "../registry/source.mjs";
import { CONFIG_FILE, DEFAULT_CONFIG, readConfig } from "../deck/config.mjs";
import { readManifest } from "../deck/manifest.mjs";
import { validateRegistry } from "../validation/registry.mjs";
import { validateExamples } from "../validation/examples.mjs";
import { validateDeckStructure } from "../validation/markup-structure.mjs";
import { validateDesignComposition } from "../validation/design-lint.mjs";
import { validateLocalAssets } from "../validation/assets.mjs";
import { validateLoadTags } from "../validation/load-tags.mjs";
import { validateAccessibility } from "../validation/accessibility.mjs";
import {
  buildAuthoringClassIndex,
  itemNamesForClasses,
  unknownLsClasses,
} from "../validation/authoring-api.mjs";
import { generateCatalogDoc } from "../registry/catalog-doc.mjs";
import { validateAgentInstructions } from "./agent-instructions.mjs";
import { registryData, registrySource, rejectRemovedRegistryOption } from "./registry-options.mjs";

export async function validateCommand(argv) {
  const args = parseArgs(argv, commandOptionSpecs.validate);
  if (args.help)
    return ok({
      help: `Usage: slidesls validate [dir] [--strict] [--registry-root <path>] [--registry-url <url>] [--use-manifest-registry] [--json]

For AI agents:
  Run after every edit: slidesls validate <deck> --json
  Unknown ls-* classes warn by default and error with --strict.
  Default validation is offline/deterministic and uses the bundled registry unless an explicit registry source is provided.
  Use slidesls catalog --api --json for valid classes and slidesls inspect <item> --json for snippets.`,
    });
  rejectRemovedRegistryOption(args);
  const start = path.resolve(args._[0] || args.dir || ".");
  const { config: foundConfig, configPath, root } = await readConfig(start);
  const config = foundConfig || DEFAULT_CONFIG;
  const configDiscovery = configPath
    ? path.resolve(start) === root
      ? "explicit"
      : "ancestor"
    : "default";
  const errors = [],
    warnings = [],
    customizedFiles = [];
  if (!foundConfig)
    warnings.push({
      code: "missing_config",
      message: "slidesls.json was not found; using defaults for explicit validation.",
    });
  else if (configDiscovery === "ancestor")
    warnings.push({
      code: "ancestor_config_discovered",
      message: `Using ${CONFIG_FILE} from ancestor ${root} for start path ${start}`,
      hint: "Run from the deck root or pass the intended deck directory explicitly.",
    });
  const entryPath = path.join(root, config.paths.entry);
  const manifest = await readManifest(root, config);
  const registryChoice = registrySourceForValidation({ args, manifest });
  const registrySourceUsed = registryChoice.source.describe();
  const registrySourceHint = registryChoice.hint;
  let activeRegistry = null;
  try {
    activeRegistry = await loadRegistry(registryChoice.source);
  } catch (error) {
    warnings.push({
      code: "registry_source_unavailable",
      message: `Could not load validation registry source: ${error.message}`,
      hint: "Class, load-tag, and dependency checks may be incomplete.",
    });
  }

  if (!(await exists(entryPath)))
    errors.push({
      code: "missing_entry",
      message: `${config.paths.entry} does not exist`,
      hint: "Check slidesls.json paths.entry or create the configured entry HTML file.",
    });
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
        hint: "Run slidesls add core/base --dir <deck> --dry-run --json and add the returned script tag.",
      });
    await validateLocalAssets({ html, root, entryPath, errors });
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
  if (html && activeRegistry) {
    const authoringIndex = buildAuthoringClassIndex(activeRegistry.items);
    validateKnownClasses({
      html,
      strict: args.strict,
      knownClasses: authoringIndex.known,
      errors,
      warnings,
    });
    validateClassDependencies({
      html,
      manifest,
      ownerByClass: authoringIndex.ownerByClass,
      errors,
      warnings,
    });
    validateDeckStructure({ html, strict: args.strict, errors, warnings });
    validateAccessibility({ html, strict: args.strict, errors, warnings });
    await validateLoadTags({ html, manifest, registryData: activeRegistry, root, warnings });
  } else if (html) {
    validateDeckStructure({ html, strict: args.strict, errors, warnings });
    validateAccessibility({ html, strict: args.strict, errors, warnings });
  }
  // Advisory composition lint: warnings only, never promoted by --strict, and
  // suppressible per slide with data-ls-lint="off".
  if (html) validateDesignComposition({ html, manifest, warnings });
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
        if (actual !== file.sha256) {
          customizedFiles.push({
            targetPath: file.targetPath,
            expectedSha256: file.sha256,
            actualSha256: actual,
          });
          if (args.strict)
            errors.push({
              code: "manifest_hash_drift",
              message: `${file.targetPath} differs from manifest hash`,
            });
        }
      }
    }
    if (activeRegistry) {
      const knownItems = new Set(activeRegistry.items.map((item) => item.name));
      for (const item of manifest.dependencyOrder || []) {
        if (!knownItems.has(item))
          warnings.push({
            code: "manifest_unknown_item",
            message: `${item} is listed in the manifest but not found in the active registry source`,
          });
      }
    }
  }
  const valid = errors.length === 0;
  return ok({
    valid,
    start,
    root,
    configPath: configPath ? path.relative(root, configPath) : null,
    configDiscovery,
    entry: config.paths.entry,
    registrySourceUsed,
    registrySourceHint,
    manifestPresent: Boolean(manifest),
    manifestBaseDir: manifest?.baseDir || null,
    customizedFilesCount: customizedFiles.length,
    errors,
    warnings,
    customizedFiles,
    agentInstructions: validateAgentInstructions(root),
  });
}

function registrySourceForValidation({ args, manifest }) {
  if (args["registry-root"] || args["registry-url"])
    return { source: registrySource(args), hint: null };
  const manifestSource = manifest?.registrySource;
  if (args["use-manifest-registry"] && manifestSource?.mode === "local" && manifestSource.root)
    return { source: new RegistrySource({ registryRoot: manifestSource.root }), hint: null };
  if (args["use-manifest-registry"] && manifestSource?.mode === "remote" && manifestSource.url)
    return { source: new RegistrySource({ registryUrl: manifestSource.url }), hint: null };
  if (manifestSource?.mode === "local" && manifestSource.root)
    return {
      source: new RegistrySource(),
      hint: `Manifest references local registry ${manifestSource.root}; pass --use-manifest-registry or --registry-root to validate against it.`,
    };
  if (manifestSource?.mode === "remote")
    return {
      source: new RegistrySource(),
      hint: `Manifest references remote registry ${manifestSource.url}; default validation stays offline. Pass --use-manifest-registry or --registry-url to fetch explicitly.`,
    };
  return { source: new RegistrySource(), hint: null };
}

export async function doctorCommand(argv) {
  const args = parseArgs(argv, commandOptionSpecs.doctor);
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
    const code = error.code === "invalid_config_path" ? "config_paths" : "config_parse";
    const message =
      error.code === "invalid_config_path"
        ? `${CONFIG_FILE} has invalid paths: ${error.message}`
        : `${CONFIG_FILE} could not be parsed: ${error.message}`;
    check(code, false, message);
    configInfo = { config: null, root: start };
  }
  const config = configInfo.config || DEFAULT_CONFIG;
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

function validateKnownClasses({ html, strict, knownClasses, errors, warnings }) {
  const renderedHtml = stripNonRenderedCode(html);
  if (/\bls-layout-[\w-]+/.test(renderedHtml))
    errors.push({
      code: "removed_layout_class",
      message:
        "ls-layout-* classes are not part of the current registry; use templates and utilities instead.",
      hint: "Run slidesls catalog --api --json to see valid public layout utilities.",
    });

  for (const className of unknownLsClasses(renderedHtml, knownClasses)) {
    const entry = {
      code: "unknown_ls_class",
      message: `${className} is not listed in the slidesls authoring API catalog`,
      className,
      hint: "Run slidesls catalog --api --json to see valid public ls-* classes.",
    };
    if (strict) errors.push(entry);
    else warnings.push(entry);
  }
}

function validateClassDependencies({ html, manifest, ownerByClass, warnings }) {
  const copied = new Set(manifest?.dependencyOrder || []);
  // One grouped warning instead of one per item: identical hints repeated per
  // finding bloat agent-facing JSON without adding information.
  const missing = [...itemNamesForClasses(html, ownerByClass)].filter(
    (item) => item !== "core/base" && !copied.has(item),
  );
  if (!missing.length) return;
  const list = missing.join(" ");
  warnings.push({
    code: "missing_registry_item_for_class",
    message: `${missing.length} registry item(s) should be added when using their classes in HTML: ${missing.join(", ")}`,
    items: missing,
    hint: `Inspect with slidesls inspect <item> --api --json, then run slidesls add ${list} --dir <deck> --dry-run --json.`,
    command: `slidesls add ${list} --dir <deck> --dry-run --json`,
  });
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
  const args = parseArgs(argv, commandOptionSpecs["validate-registry"]);
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
  const args = parseArgs(argv, commandOptionSpecs["validate-examples"]);
  if (args.help) return ok({ help: `Usage: slidesls validate-examples [--dir <repo>] [--json]` });
  return ok(await validateExamples({ root: args.dir || args._[0] || process.cwd() }));
}

export async function generateCatalogCommand(argv) {
  const args = parseArgs(argv, commandOptionSpecs["generate-catalog"]);
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
