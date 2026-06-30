import { access, constants } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { assertInside, assertSafeRelativePath } from "../shared/fs.mjs";
import { RegistrySource, loadRegistry, resolveItems } from "../registry/source.mjs";

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

  return {
    valid: errors.length === 0,
    source: data.source,
    itemCount: data.items.length,
    errors,
    warnings,
  };
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
