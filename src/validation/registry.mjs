import { access, constants } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { assertInside, assertSafeRelativePath } from "../shared/fs.mjs";
import { RegistrySource, loadRegistry, resolveItems } from "../registry/source.mjs";

const knownTypes = new Set([
  "core",
  "layout",
  "component",
  "animation",
  "preset",
  "preset/font",
  "ls:core",
  "ls:layout",
  "ls:component",
  "ls:animation",
  "ls:preset",
]);
const knownFileTypes = new Set([
  "css",
  "js",
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
