import { constants } from "node:fs";
import { access, readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { assertInside } from "../shared/fs.mjs";

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

function isExternalOrNonFileUrl(value) {
  const trimmed = value.trim();
  return (
    trimmed === "" ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("//") ||
    /^[a-z][a-z0-9+.-]*:/i.test(trimmed)
  );
}

function stripQueryAndHash(value) {
  const queryIndex = value.indexOf("?");
  const hashIndex = value.indexOf("#");
  const indexes = [queryIndex, hashIndex].filter((index) => index >= 0);
  return value.slice(0, indexes.length > 0 ? Math.min(...indexes) : value.length);
}

function decodePath(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function extractLocalAssetReferences(html) {
  const references = [];
  const attributePattern = /\b(?:href|src)\s*=\s*(["'])(.*?)\1/gims;
  for (const match of html.matchAll(attributePattern)) {
    const value = match[2];
    if (isExternalOrNonFileUrl(value)) continue;
    const localPath = decodePath(stripQueryAndHash(value.trim()));
    if (localPath) references.push({ rawValue: value, localPath });
  }
  return references;
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
    for (const reference of extractLocalAssetReferences(html)) {
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

  const templateCandidates = ["src/deck/templates.mjs"];
  for (const relative of templateCandidates) {
    const templatePath = path.join(root, relative);
    if (!(await fileExists(templatePath))) continue;
    const html = await readFile(templatePath, "utf8");
    if (html.includes("title-hero.css")) {
      if (!html.includes("ls-layout-title-hero"))
        push(
          errors,
          "missing_title_hero_hook",
          `${relative} links title-hero.css but does not include ls-layout-title-hero.`,
        );
      if (html.includes("ls-slide__inner ls-title-hero"))
        push(
          errors,
          "obsolete_title_hero_hook",
          `${relative} still contains obsolete inner title-hero hook.`,
        );
    }
  }

  return { valid: errors.length === 0, root, checkedExamples: files.length, errors, warnings };
}
