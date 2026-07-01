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
    if (typeof variable !== "string" || !variable.startsWith("--"))
      add(
        "error",
        errors,
        "invalid_authoring_css_variable",
        `${itemPath} CSS variable must start with --: ${variable}`,
      );
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
    if (!/@container\b/.test(combinedCss)) continue;
    if (/\bcontainer(?:-type)?\s*:/.test(combinedCss)) continue;
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

async function validateItemMetadata({ item, itemPath, source, errors, warnings }) {
  if (item.agentRecommended !== undefined && typeof item.agentRecommended !== "boolean")
    add(
      "error",
      errors,
      "invalid_agent_recommended",
      `${itemPath} agentRecommended must be boolean`,
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

  if (item.name?.startsWith("presets/themes/"))
    await validateThemePreset({ item, itemPath, source, errors });

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
