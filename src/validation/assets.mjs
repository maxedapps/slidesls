import path from "node:path";
import { readFile } from "node:fs/promises";
import { assertInside, exists } from "../shared/fs.mjs";
import { localFileReferences, stylesheetHrefs, stripNonRenderedCode } from "../shared/html.mjs";

function add(list, code, message, details = {}) {
  list.push({ code, message, ...details });
}

function isExternalOrNonFileUrl(value) {
  const trimmed = String(value || "").trim();
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
  return value.slice(0, indexes.length ? Math.min(...indexes) : value.length);
}

function decodePath(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function localFileReference(rawValue) {
  if (isExternalOrNonFileUrl(rawValue)) return null;
  const localPath = decodePath(stripQueryAndHash(String(rawValue).trim()));
  return localPath ? { rawValue, localPath } : null;
}

export function localCssUrlReferences(css) {
  const refs = [];
  for (const match of css.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)'"\s][^)]*?))\s*\)/gims)) {
    const rawValue = (match[1] ?? match[2] ?? match[3] ?? "").trim();
    if (isExternalOrNonFileUrl(rawValue)) continue;
    const localPath = decodePath(stripQueryAndHash(rawValue));
    if (localPath) refs.push({ rawValue, localPath });
  }
  return refs;
}

export async function validateLocalAssets({ html, root, entryPath, errors }) {
  const renderedHtml = stripNonRenderedCode(html);
  const outside = [];
  const missing = [];
  for (const ref of localFileReferences(renderedHtml)) {
    await checkReference({ root, baseDir: path.dirname(entryPath), ref, outside, missing });
  }

  for (const href of stylesheetHrefs(renderedHtml)) {
    const stylesheet = localFileReference(href);
    if (!stylesheet) continue;
    const stylesheetPath = path.resolve(path.dirname(entryPath), stylesheet.localPath);
    try {
      assertInside(root, stylesheetPath);
    } catch {
      continue;
    }
    if (!(await exists(stylesheetPath))) continue;
    const css = await readFile(stylesheetPath, "utf8");
    for (const ref of localCssUrlReferences(css)) {
      await checkReference({ root, baseDir: path.dirname(stylesheetPath), ref, outside, missing });
    }
  }

  // Group per code with one hint and a paths list; identical hints repeated
  // per finding bloat agent-facing JSON.
  if (outside.length)
    add(
      errors,
      "asset_outside_project",
      `${outside.length} asset reference(s) resolve outside the project: ${outside.join(", ")}`,
      {
        paths: outside,
        hint: "Use local asset paths that stay inside the deck project.",
      },
    );
  if (missing.length)
    add(
      errors,
      "missing_asset",
      `${missing.length} local asset reference(s) do not exist: ${missing.join(", ")}`,
      {
        paths: missing,
        hint: "Local asset paths are resolved relative to the file that references them.",
      },
    );
}

async function checkReference({ root, baseDir, ref, outside, missing }) {
  const target = path.resolve(baseDir, ref.localPath);
  try {
    assertInside(root, target);
  } catch {
    if (!outside.includes(ref.rawValue)) outside.push(ref.rawValue);
    return;
  }
  if (!(await exists(target)) && !missing.includes(ref.rawValue)) missing.push(ref.rawValue);
}
