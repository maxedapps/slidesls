import { access, constants, readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { assertInside, assertSafeRelativePath } from "../shared/fs.mjs";
import { RegistrySource, loadRegistry, resolveItems } from "../registry/source.mjs";
import {
  authoringClasses,
  buildAuthoringClassIndex,
  lsClassTokens,
  unknownLsClasses,
} from "./authoring-api.mjs";
import { validateSnippetStructure } from "./markup-structure.mjs";

const knownTypes = new Set([
  "core",
  "utility",
  "component",
  "animation",
  "preset",
  "preset/font",
  "template",
  "ls:core",
  "ls:utility",
  "ls:component",
  "ls:animation",
  "ls:preset",
  "ls:template",
]);
const knownFileTypes = new Set([
  "css",
  "js",
  "mjs",
  "json",
  "html",
  "md",
  "svg",
  "png",
  "jpg",
  "jpeg",
  "webp",
  "gif",
]);
const agentLevels = new Set(["starter", "recommended", "advanced", "experimental"]);
const snippetRequiredLevels = new Set(["starter", "recommended"]);
const classScopeTypes = new Set([
  "anywhere",
  "within-slide",
  "within-slide-inner",
  "direct-child-of-slide-inner",
  "within-constrained-area",
  "centers-content-cluster",
]);
const contentDensities = new Set(["sparse", "balanced", "dense"]);
const layoutBehaviors = new Set(["content-sized", "fills-area", "fixed"]);

async function canRead(source, relativePath) {
  if (source.mode === "local") {
    const filePath = path.join(source.registryRoot, relativePath);
    assertInside(source.registryRoot, filePath);
    await access(filePath, constants.R_OK);
    return;
  }
  await source.readText(relativePath);
}

function add(severity, list, code, message, details = {}) {
  list.push({ severity, code, message, ...details });
}

export async function validateRegistry({ registryRoot, registryUrl } = {}) {
  const source = new RegistrySource({ registryRoot, registryUrl });
  const errors = [];
  const warnings = [];
  let data;

  try {
    data = await loadRegistry(source);
  } catch (error) {
    add("error", errors, "registry_load_failed", error.message);
    return { valid: false, source: source.describe(), itemCount: 0, errors, warnings };
  }

  const seenNames = new Set();
  const seenPaths = new Set();
  for (const itemPath of data.registry.items) {
    try {
      assertSafeRelativePath(itemPath);
      if (seenPaths.has(itemPath))
        add(
          "error",
          errors,
          "duplicate_item_path",
          `Duplicate registry metadata path: ${itemPath}`,
        );
      seenPaths.add(itemPath);
    } catch (error) {
      add("error", errors, "unsafe_item_path", `${itemPath}: ${error.message}`);
    }
  }

  for (const item of data.items) {
    const itemPath = item.registryItemPath;
    if (seenNames.has(item.name))
      add("error", errors, "duplicate_item_name", `Duplicate registry item name: ${item.name}`, {
        item: item.name,
      });
    seenNames.add(item.name);

    if (!knownTypes.has(item.type))
      add("warning", warnings, "unknown_item_type", `${itemPath} has unknown type: ${item.type}`);
    if (!Array.isArray(item.files))
      add("error", errors, "files_not_array", `${itemPath} must contain a files array`);
    if (!Array.isArray(item.registryDependencies))
      add(
        "error",
        errors,
        "dependencies_not_array",
        `${itemPath} must contain a registryDependencies array`,
      );

    for (const file of item.files || []) {
      if (!file || typeof file.path !== "string") {
        add("error", errors, "missing_file_path", `${itemPath} has a file without a path`);
        continue;
      }
      try {
        assertSafeRelativePath(file.path);
        await canRead(source, file.path);
      } catch (error) {
        add(
          "error",
          errors,
          "missing_or_unsafe_file",
          `${itemPath} lists invalid file ${file.path}: ${error.message}`,
        );
        continue;
      }
      const ext = path.extname(file.path).slice(1).toLowerCase();
      if (ext && !knownFileTypes.has(ext))
        add(
          "warning",
          warnings,
          "unknown_file_type",
          `${itemPath} lists unknown file type: ${file.path}`,
        );
      if ((ext === "js" || ext === "mjs") && source.mode === "local") {
        const check = spawnSync(
          process.execPath,
          ["--check", path.join(source.registryRoot, file.path)],
          {
            encoding: "utf8",
          },
        );
        if (check.status !== 0)
          add(
            "error",
            errors,
            "js_syntax",
            `${file.path} has invalid JavaScript syntax: ${check.stderr || check.stdout}`,
          );
      }
    }

    await validateItemMetadata({ item, itemPath, source, errors, warnings });

    for (const dependencyName of item.registryDependencies || []) {
      if (!data.byName.has(dependencyName))
        add(
          "error",
          errors,
          "unknown_dependency",
          `${itemPath} depends on unknown registry item: ${dependencyName}`,
        );
    }

    if (item.docs) {
      try {
        assertSafeRelativePath(item.docs);
        await canRead(source, item.docs);
      } catch (error) {
        add(
          "error",
          errors,
          "missing_docs",
          `${itemPath} docs invalid: ${item.docs}: ${error.message}`,
        );
      }
    } else {
      add("warning", warnings, "missing_docs", `${itemPath} does not declare docs`);
    }
  }

  for (const item of data.items) {
    try {
      resolveItems(data, [item.name]);
    } catch (error) {
      add("error", errors, "dependency_cycle", error.message, { item: item.name });
    }
  }

  await validateRegistryAuthoringCoverage({ data, source, errors });
  await validateRegistryCssContracts({ data, source, errors });
  await validateCompositionIntegrity({ data, source, errors });

  return {
    valid: errors.length === 0,
    source: data.source,
    itemCount: data.items.length,
    errors,
    warnings,
  };
}

function validateAuthoringMetadataShape({ item, itemPath, errors }) {
  const authoring = item.authoring;
  if (authoring === undefined) return false;
  if (!authoring || typeof authoring !== "object" || Array.isArray(authoring)) {
    add("error", errors, "invalid_authoring", `${itemPath} authoring must be an object`);
    return false;
  }
  for (const key of [
    "classGroups",
    "classes",
    "dataAttributes",
    "cssVariables",
    "attributes",
    "usage",
  ]) {
    if (authoring[key] !== undefined && !Array.isArray(authoring[key]))
      add("error", errors, "invalid_authoring", `${itemPath} authoring.${key} must be an array`);
  }
  for (const className of authoringClasses(item)) {
    if (typeof className !== "string" || !className.startsWith("ls-"))
      add(
        "error",
        errors,
        "invalid_authoring_class",
        `${itemPath} authoring class must start with ls-: ${className}`,
      );
  }
  for (const attribute of authoring.dataAttributes || []) {
    if (!attribute?.name?.startsWith("data-"))
      add(
        "error",
        errors,
        "invalid_authoring_attribute",
        `${itemPath} data attribute must start with data-: ${attribute?.name}`,
      );
    if (attribute.values !== undefined && !Array.isArray(attribute.values))
      add(
        "error",
        errors,
        "invalid_authoring_attribute_values",
        `${itemPath} ${attribute.name} values must be an array`,
      );
  }
  for (const variable of authoring.cssVariables || []) {
    // Legacy form is a bare "--name" string; enriched form is
    // { name, default?, overrideSafe? }. Both stay valid.
    const isObjectForm = variable && typeof variable === "object" && !Array.isArray(variable);
    const name = isObjectForm ? variable.name : variable;
    if (typeof name !== "string" || !name.startsWith("--"))
      add(
        "error",
        errors,
        "invalid_authoring_css_variable",
        `${itemPath} CSS variable must start with --: ${isObjectForm ? name : variable}`,
      );
    if (!isObjectForm) continue;
    if (variable.default !== undefined && typeof variable.default !== "string")
      add(
        "error",
        errors,
        "invalid_authoring_css_variable",
        `${itemPath} CSS variable ${name} default must be a string`,
      );
    if (variable.overrideSafe !== undefined && typeof variable.overrideSafe !== "boolean")
      add(
        "error",
        errors,
        "invalid_authoring_css_variable",
        `${itemPath} CSS variable ${name} overrideSafe must be boolean`,
      );
  }
  if (authoring.classMetadata !== undefined) {
    if (
      !authoring.classMetadata ||
      typeof authoring.classMetadata !== "object" ||
      Array.isArray(authoring.classMetadata)
    ) {
      add(
        "error",
        errors,
        "invalid_class_metadata",
        `${itemPath} authoring.classMetadata must be an object`,
      );
    } else {
      const classes = new Set(authoringClasses(item));
      for (const [className, metadata] of Object.entries(authoring.classMetadata)) {
        if (!className.startsWith("ls-"))
          add(
            "error",
            errors,
            "invalid_class_metadata_key",
            `${itemPath} classMetadata key must start with ls-: ${className}`,
          );
        if (!classes.has(className))
          add(
            "error",
            errors,
            "unknown_class_metadata_key",
            `${itemPath} classMetadata key is not declared in authoring classes: ${className}`,
          );
        if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
          add(
            "error",
            errors,
            "invalid_class_metadata",
            `${itemPath} classMetadata.${className} must be an object`,
          );
          continue;
        }
        if (!classScopeTypes.has(metadata.scopeType))
          add(
            "error",
            errors,
            "invalid_class_scope_type",
            `${itemPath} classMetadata.${className}.scopeType is invalid`,
          );
        if (typeof metadata.safeAnywhere !== "boolean")
          add(
            "error",
            errors,
            "invalid_class_safe_anywhere",
            `${itemPath} classMetadata.${className}.safeAnywhere must be boolean`,
          );
      }
    }
  }
  return true;
}

async function validateAuthoringMetadata({ item, itemPath, source, errors }) {
  if (!validateAuthoringMetadataShape({ item, itemPath, errors }) || source.mode !== "local")
    return;
  const cssFiles = (item.files || []).filter((file) => file?.path?.endsWith(".css"));
  if (!cssFiles.length) return;
  const css = (
    await Promise.all(
      cssFiles.map((file) => readFile(path.join(source.registryRoot, file.path), "utf8")),
    )
  ).join("\n");
  for (const className of authoringClasses(item)) {
    const escaped = className.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (!new RegExp(`\\.${escaped}(?![A-Za-z0-9_-])`).test(css))
      add(
        "error",
        errors,
        "authoring_class_missing_css",
        `${itemPath} lists ${className} in authoring but no local CSS selector defines it`,
      );
  }
}

async function validateRegistryAuthoringCoverage({ data, source, errors }) {
  if (source.mode !== "local") return;
  const index = buildAuthoringClassIndex(data.items);
  for (const item of data.items) {
    const dependencyClosure = new Set(
      resolveItems(data, [item.name]).map((resolved) => resolved.name),
    );
    for (const snippet of item.snippets || []) {
      const html = await source.readText(snippet.path);
      for (const className of unknownLsClasses(html, index.known))
        add(
          "error",
          errors,
          "unknown_authoring_class",
          `${snippet.path} uses unknown slidesls class ${className}`,
          { item: item.name, className },
        );
      for (const className of lsClassTokens(html)) {
        const owners = index.ownersByClass.get(className) || new Set();
        const allowed = [...owners].some((owner) => dependencyClosure.has(owner));
        if (owners.size && !allowed) {
          const ownerList = [...owners].join(", ");
          add(
            "error",
            errors,
            "undeclared_snippet_dependency",
            `${snippet.path} uses ${className} from ${ownerList}, but ${item.name} does not depend on any owning item`,
            { item: item.name, className, owners: [...owners] },
          );
        }
      }
      validateSnippetStructure({ html, sourcePath: snippet.path, errors });
    }
  }
}

async function validateRegistryCssContracts({ data, source, errors }) {
  if (source.mode !== "local") return;
  const globalIndex = buildAuthoringClassIndex(data.items);
  for (const item of data.items) {
    const cssFiles = (item.files || []).filter((file) => file?.path?.endsWith(".css"));
    if (!cssFiles.length) continue;
    const cssByFile = await Promise.all(
      cssFiles.map(async (file) => ({
        path: file.path,
        css: await readFile(path.join(source.registryRoot, file.path), "utf8"),
      })),
    );
    const combinedCss = cssByFile.map((file) => file.css).join("\n");
    if (/@container\b/.test(combinedCss) && !/\bcontainer(?:-type)?\s*:/.test(combinedCss)) {
      for (const file of cssByFile) {
        if (/@container\b/.test(file.css))
          add(
            "error",
            errors,
            "container_query_without_contract",
            `${file.path} contains @container rules without declaring a query container contract in the same registry item`,
            { item: item.name },
          );
      }
    }

    const dependencyClosure = new Set(
      resolveItems(data, [item.name]).map((resolved) => resolved.name),
    );
    for (const className of publicCssClasses(combinedCss)) {
      const owners = globalIndex.ownersByClass.get(className) || new Set();
      if (![...owners].some((owner) => dependencyClosure.has(owner)))
        add(
          "error",
          errors,
          "css_class_missing_authoring_metadata",
          `${item.name} CSS defines .${className}, but no owning item in its dependency closure lists it in authoring metadata`,
          { item: item.name, className },
        );
    }
  }
}

function publicCssClasses(css) {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
  return [
    ...new Set(
      [...withoutComments.matchAll(/\.((?:ls-)[A-Za-z0-9_-]+)/g)].map((match) => match[1]),
    ),
  ];
}

async function validateThemePreset({ item, itemPath, source, errors }) {
  const expectedAttribute = item.name.split("/").at(-1);
  if (item.type !== "ls:preset")
    add("error", errors, "theme_type", `${itemPath} theme presets must use type ls:preset`);
  if (item.themeAttribute !== expectedAttribute)
    add(
      "error",
      errors,
      "theme_attribute",
      `${itemPath} must set themeAttribute to ${expectedAttribute}`,
    );
  const themeFiles = (item.files || []).filter((file) => file?.path?.endsWith("/theme.css"));
  if (themeFiles.length !== 1)
    add("error", errors, "theme_file", `${itemPath} must list exactly one theme.css file`);
  if (source.mode !== "local" || themeFiles.length !== 1) return;
  const css = await readFile(path.join(source.registryRoot, themeFiles[0].path), "utf8");
  if (!css.includes(`:root[data-ls-theme="${expectedAttribute}"]`))
    add(
      "error",
      errors,
      "theme_css_attribute",
      `${themeFiles[0].path} must scope tokens to :root[data-ls-theme="${expectedAttribute}"]`,
    );
}

const compositionKeys = new Set([
  "contentDensity",
  "layoutBehavior",
  "itemCountGuidance",
  "copyGuidance",
  "avoidWhen",
  "alternatives",
]);

function validateCompositionShape({ item, itemPath, errors }) {
  const composition = item.composition;
  if (composition === undefined) return;
  if (!composition || typeof composition !== "object" || Array.isArray(composition)) {
    add("error", errors, "invalid_composition", `${itemPath} composition must be an object`);
    return;
  }
  // Reject unknown keys so typos (avoidwhen, layoutBehaviour) fail loudly
  // instead of silently dropping guidance.
  for (const key of Object.keys(composition)) {
    if (!compositionKeys.has(key))
      add(
        "error",
        errors,
        "invalid_composition",
        `${itemPath} composition has unknown key: ${key}`,
      );
  }
  if (composition.contentDensity !== undefined) {
    if (
      !Array.isArray(composition.contentDensity) ||
      composition.contentDensity.some((density) => !contentDensities.has(density))
    )
      add(
        "error",
        errors,
        "invalid_composition",
        `${itemPath} composition.contentDensity must be an array of ${[...contentDensities].join(", ")}`,
      );
  }
  if (composition.layoutBehavior !== undefined && !layoutBehaviors.has(composition.layoutBehavior))
    add(
      "error",
      errors,
      "invalid_composition",
      `${itemPath} composition.layoutBehavior must be one of ${[...layoutBehaviors].join(", ")}`,
    );
  for (const key of ["itemCountGuidance", "copyGuidance"]) {
    if (composition[key] !== undefined && typeof composition[key] !== "string")
      add(
        "error",
        errors,
        "invalid_composition",
        `${itemPath} composition.${key} must be a string`,
      );
  }
  if (composition.avoidWhen !== undefined) {
    if (
      !Array.isArray(composition.avoidWhen) ||
      composition.avoidWhen.some((entry) => typeof entry !== "string" || !entry.trim())
    )
      add(
        "error",
        errors,
        "invalid_composition",
        `${itemPath} composition.avoidWhen must be an array of non-empty strings`,
      );
  }
  if (composition.alternatives !== undefined) {
    if (!Array.isArray(composition.alternatives)) {
      add(
        "error",
        errors,
        "invalid_composition",
        `${itemPath} composition.alternatives must be an array`,
      );
    } else {
      for (const alternative of composition.alternatives) {
        if (
          !alternative ||
          typeof alternative !== "object" ||
          typeof alternative.when !== "string" ||
          typeof alternative.use !== "string"
        )
          add(
            "error",
            errors,
            "invalid_composition",
            `${itemPath} composition.alternatives entries must be { when, use } objects`,
          );
      }
    }
  }
}

// Item-name tokens inside freeform guidance strings (composition fields and
// authoring.usage). Matched tokens must name an existing item or an item-name
// prefix such as "presets/themes" so renames cannot silently rot guidance.
const guidanceItemTokenPattern =
  /(?<![\w/])(core|utilities|components|templates|animations|presets)\/[a-z0-9-]+(?:\/[a-z0-9-]+)*/g;

function compositionGuidanceStrings(item) {
  const composition = item.composition || {};
  return [
    composition.itemCountGuidance,
    composition.copyGuidance,
    ...(Array.isArray(composition.avoidWhen) ? composition.avoidWhen : []),
    ...(Array.isArray(composition.alternatives)
      ? composition.alternatives.flatMap((alternative) => [alternative?.when])
      : []),
    ...(item.authoring?.usage || []),
  ].filter((value) => typeof value === "string");
}

async function validateCompositionIntegrity({ data, source, errors }) {
  const knownNames = [...data.byName.keys()];
  const nameExists = (token) =>
    data.byName.has(token) || knownNames.some((name) => name.startsWith(`${token}/`));

  for (const item of data.items) {
    const itemPath = item.registryItemPath;
    for (const alternative of item.composition?.alternatives || []) {
      if (alternative?.use && !data.byName.has(alternative.use))
        add(
          "error",
          errors,
          "unknown_composition_alternative",
          `${itemPath} composition.alternatives references unknown registry item: ${alternative.use}`,
        );
    }
    for (const text of compositionGuidanceStrings(item)) {
      for (const match of text.matchAll(guidanceItemTokenPattern)) {
        if (!nameExists(match[0]))
          add(
            "error",
            errors,
            "unknown_item_in_guidance",
            `${itemPath} guidance references unknown registry item: ${match[0]}`,
          );
      }
    }
    if (item.composition?.avoidWhen?.length && item.docs && source.mode === "local") {
      const readme = await readFile(path.join(source.registryRoot, item.docs), "utf8").catch(
        () => "",
      );
      if (!/^##\s+When not to use\s*$/m.test(readme))
        add(
          "error",
          errors,
          "avoid_when_missing_readme_section",
          `${itemPath} declares composition.avoidWhen but ${item.docs} has no "## When not to use" section`,
        );
    }
  }
}

async function validateItemMetadata({ item, itemPath, source, errors, warnings }) {
  if (item.agentRecommended !== undefined)
    add(
      "error",
      errors,
      "stored_agent_recommended",
      `${itemPath} must not store agentRecommended; use agentLevel instead`,
    );

  if (!agentLevels.has(item.agentLevel))
    add(
      "error",
      errors,
      "invalid_agent_level",
      `${itemPath} agentLevel must be one of ${[...agentLevels].join(", ")}`,
    );

  if (item.safeAnywhere !== undefined && typeof item.safeAnywhere !== "boolean")
    add("error", errors, "invalid_safe_anywhere", `${itemPath} safeAnywhere must be boolean`);

  if (item.rootClass !== undefined && item.rootClass !== null && typeof item.rootClass !== "string")
    add("error", errors, "invalid_root_class", `${itemPath} rootClass must be a string or null`);

  if (item.type === "ls:template") {
    if ((item.files || []).length > 0)
      add(
        "error",
        errors,
        "template_files",
        `${itemPath} templates must not list snippet HTML in files`,
      );
    if (!Array.isArray(item.snippets) || item.snippets.length === 0)
      add(
        "error",
        errors,
        "template_missing_snippet",
        `${itemPath} templates must declare snippets`,
      );
  }

  if (
    snippetRequiredLevels.has(item.agentLevel) &&
    ["ls:component", "ls:utility", "ls:animation", "ls:template"].includes(item.type) &&
    (!Array.isArray(item.snippets) || item.snippets.length === 0)
  )
    add(
      "error",
      errors,
      "recommended_item_missing_snippet",
      `${itemPath} ${item.agentLevel} ${item.type} items must provide a snippet or be advanced/experimental`,
    );

  if (
    item.safeAnywhere === true &&
    Object.values(item.authoring?.classMetadata || {}).some(
      (metadata) => metadata?.safeAnywhere === false,
    )
  )
    add(
      "error",
      errors,
      "safe_anywhere_class_metadata_conflict",
      `${itemPath} safeAnywhere cannot be true when classMetadata marks a class as not safe anywhere`,
    );

  if (item.name?.startsWith("presets/themes/"))
    await validateThemePreset({ item, itemPath, source, errors });

  validateCompositionShape({ item, itemPath, errors });
  await validateAuthoringMetadata({ item, itemPath, source, errors });

  if (item.snippets === undefined) return;
  if (!Array.isArray(item.snippets)) {
    add("error", errors, "snippets_not_array", `${itemPath} snippets must be an array`);
    return;
  }

  const filePaths = new Set((item.files || []).map((file) => file?.path).filter(Boolean));
  for (const snippet of item.snippets) {
    if (!snippet || typeof snippet.label !== "string" || !snippet.label.trim()) {
      add("error", errors, "invalid_snippet_label", `${itemPath} has a snippet without a label`);
      continue;
    }
    if (typeof snippet.path !== "string" || !snippet.path.trim()) {
      add(
        "error",
        errors,
        "invalid_snippet_path",
        `${itemPath} snippet ${snippet.label} has no path`,
      );
      continue;
    }
    try {
      assertSafeRelativePath(snippet.path);
      await canRead(source, snippet.path);
    } catch (error) {
      add(
        "error",
        errors,
        "missing_or_unsafe_snippet",
        `${itemPath} snippet ${snippet.path} invalid: ${error.message}`,
      );
      continue;
    }
    if (path.extname(snippet.path).toLowerCase() !== ".html")
      add(
        "warning",
        warnings,
        "snippet_not_html",
        `${itemPath} snippet is not HTML: ${snippet.path}`,
      );
    if (item.type === "ls:template" && filePaths.has(snippet.path))
      add(
        "error",
        errors,
        "template_snippet_copied",
        `${itemPath} template snippet must be listed only in snippets, not files: ${snippet.path}`,
      );
  }
}
