import { constants } from "node:fs";
import { access, readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { assertInside } from "../shared/fs.mjs";
import { localFileReferences } from "../shared/html.mjs";

async function fileExists(filePath) {
  try {
    await access(filePath, constants.R_OK);
    return (await stat(filePath)).isFile();
  } catch {
    return false;
  }
}

async function exampleHtmlFiles(root) {
  const examplesRoot = path.join(root, "examples");
  const entries = await readdir(examplesRoot, { withFileTypes: true }).catch(() => []);
  const files = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const indexPath = path.join(examplesRoot, entry.name, "index.html");
    if (await fileExists(indexPath)) files.push(indexPath);
  }
  return files.sort((a, b) => a.localeCompare(b));
}

function push(list, code, message, details = {}) {
  list.push({ code, message, ...details });
}

export async function validateExamples({ root = process.cwd() } = {}) {
  root = path.resolve(root);
  const errors = [];
  const warnings = [];
  const files = await exampleHtmlFiles(root);

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
    if (/\bls-layout-[\w-]+/.test(html))
      push(errors, "removed_layout_class", `${relative} uses removed ls-layout-* classes.`);
    if (html.includes("ls-grid") && !html.includes("utilities/layout/layout.css"))
      push(
        errors,
        "missing_layout_utilities",
        `${relative} uses ls-grid but does not reference utilities/layout/layout.css.`,
      );
  }

  return { valid: errors.length === 0, root, checkedExamples: files.length, errors, warnings };
}
