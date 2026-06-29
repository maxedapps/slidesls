import { constants } from "node:fs";
import { access, readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const examplesRoot = path.join(repoRoot, "examples");
const minimalDeckPath = path.join(repoRoot, "skills/ls-slides/assets/minimal-deck.html");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function fileExists(filePath) {
  try {
    await access(filePath, constants.R_OK);
    const fileStat = await stat(filePath);
    return fileStat.isFile();
  } catch {
    return false;
  }
}

async function getExampleHtmlFiles() {
  const entries = await readdir(examplesRoot, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const indexPath = path.join(examplesRoot, entry.name, "index.html");
    if (await fileExists(indexPath)) {
      files.push(indexPath);
    }
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
  const endIndex = indexes.length > 0 ? Math.min(...indexes) : value.length;
  return value.slice(0, endIndex);
}

function decodePath(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function assertInsideRepo(filePath, sourcePath, rawValue) {
  const relative = path.relative(repoRoot, filePath);
  assert(
    relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative)),
    `${sourcePath} links outside the repository: ${rawValue}`,
  );
}

function extractLocalAssetReferences(html) {
  const references = [];
  const attributePattern = /\b(?:href|src)\s*=\s*(["'])(.*?)\1/gims;

  for (const match of html.matchAll(attributePattern)) {
    const value = match[2];
    if (isExternalOrNonFileUrl(value)) {
      continue;
    }

    const localPath = decodePath(stripQueryAndHash(value.trim()));
    if (!localPath) {
      continue;
    }

    references.push({ rawValue: value, localPath });
  }

  return references;
}

async function validateExampleAssets() {
  const exampleFiles = await getExampleHtmlFiles();

  for (const filePath of exampleFiles) {
    const html = await readFile(filePath, "utf8");
    const sourcePath = path.relative(repoRoot, filePath);

    for (const reference of extractLocalAssetReferences(html)) {
      const resolvedPath = path.resolve(path.dirname(filePath), reference.localPath);
      assertInsideRepo(resolvedPath, sourcePath, reference.rawValue);
      assert(
        await fileExists(resolvedPath),
        `${sourcePath} links to missing local asset: ${reference.rawValue} -> ${path.relative(repoRoot, resolvedPath)}`,
      );
    }
  }

  console.log(`Validated local asset links for ${exampleFiles.length} example HTML file(s).`);
}

async function validateMinimalDeckHooks() {
  const html = await readFile(minimalDeckPath, "utf8");
  const sourcePath = path.relative(repoRoot, minimalDeckPath);

  if (html.includes("registry/layouts/title-hero/title-hero.css")) {
    assert(
      html.includes("ls-layout-title-hero"),
      `${sourcePath} links title-hero.css but does not include the ls-layout-title-hero hook.`,
    );
    assert(
      !html.includes("ls-slide__inner ls-title-hero"),
      `${sourcePath} still contains obsolete inner title-hero hook: ls-slide__inner ls-title-hero`,
    );
  }

  console.log("Validated minimal deck layout hooks.");
}

try {
  await validateExampleAssets();
  await validateMinimalDeckHooks();
} catch (error) {
  console.error(`validate-examples: ${error.message}`);
  process.exit(1);
}
