import { constants } from "node:fs";
import { access, readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { assertInside } from "../shared/fs.mjs";
import { localFileReferences } from "../shared/html.mjs";
import { RegistrySource, loadRegistry } from "../registry/source.mjs";
import { buildAuthoringClassIndex, unknownLsClasses } from "./authoring-api.mjs";
import { validateDeckStructure } from "./markup-structure.mjs";

async function fileExists(filePath) {
  try {
    await access(filePath, constants.R_OK);
    return (await stat(filePath)).isFile();
  } catch {
    return false;
  }
}

async function collectHtmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const files = [];
  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await collectHtmlFiles(entryPath)));
    else if (entry.isFile() && entry.name.endsWith(".html")) files.push(entryPath);
  }
  return files;
}

async function exampleHtmlFiles(root) {
  const examplesRoot = path.join(root, "examples");
  const files = await collectHtmlFiles(examplesRoot);
  return files.sort((a, b) => path.relative(root, a).localeCompare(path.relative(root, b)));
}

function push(list, code, message, details = {}) {
  list.push({ code, message, ...details });
}

export async function validateExamples({ root = process.cwd() } = {}) {
  root = path.resolve(root);
  const errors = [];
  const warnings = [];
  const files = await exampleHtmlFiles(root);
  const authoringIndex = buildAuthoringClassIndex(
    (await loadRegistry(new RegistrySource({ registryRoot: root }))).items,
  );

  for (const filePath of files) {
    const html = await readFile(filePath, "utf8");
    const sourcePath = path.relative(root, filePath);
    for (const reference of localFileReferences(html)) {
      const resolvedPath = path.resolve(path.dirname(filePath), reference.localPath);
      try {
        assertInside(root, resolvedPath);
      } catch {
        push(
          errors,
          "asset_outside_repo",
          `${sourcePath} links outside the repository: ${reference.rawValue}`,
        );
        continue;
      }
      if (!(await fileExists(resolvedPath)))
        push(
          errors,
          "missing_asset",
          `${sourcePath} links to missing local asset: ${reference.rawValue} -> ${path.relative(root, resolvedPath)}`,
        );
    }
  }

  for (const relative of [
    "src/deck/templates.mjs",
    ...files.map((file) => path.relative(root, file)),
  ]) {
    const candidatePath = path.join(root, relative);
    if (!(await fileExists(candidatePath))) continue;
    const html = await readFile(candidatePath, "utf8");
    for (const className of unknownLsClasses(html, authoringIndex.known))
      push(errors, "unknown_ls_class", `${relative} uses unknown slidesls class ${className}.`, {
        className,
      });
    if (html.includes("ls-grid") && !html.includes("layouts/core/utilities.css"))
      push(
        errors,
        "missing_layout_utilities",
        `${relative} uses ls-grid but does not reference layouts/core/utilities.css.`,
      );
    validateDeckStructure({ html, strict: true, errors, warnings });
  }

  return { valid: errors.length === 0, root, checkedExamples: files.length, errors, warnings };
}
