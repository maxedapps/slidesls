import { stylesheetHrefs, moduleScriptSrcs, stripNonRenderedCode } from "../shared/html.mjs";
import { planCopies, tagsForWrites } from "../deck/copy.mjs";

function normalizeRef(value) {
  return String(value || "")
    .replace(/^\.\//, "")
    .replaceAll("\\\\", "/")
    .split(/[?#]/, 1)[0];
}

function add(warnings, code, message, details = {}) {
  warnings.push({ code, message, ...details });
}

export async function validateLoadTags({ html, manifest, registryData, root, warnings }) {
  if (!manifest) return;
  const renderedHtml = stripNonRenderedCode(html);
  const loadedLinks = new Set(stylesheetHrefs(renderedHtml).map(normalizeRef));
  const loadedScripts = new Set(moduleScriptSrcs(renderedHtml).map(normalizeRef));
  const copiedItems = [...new Set(manifest.dependencyOrder || [])];

  for (const tag of [...(manifest.links || []), ...(manifest.scripts || [])]) {
    const attr = /\b(?:href|src)=["']([^"']+)["']/i.exec(tag)?.[1];
    if (!attr) continue;
    const normalized = normalizeRef(attr);
    const loaded = normalized.endsWith(".js") ? loadedScripts : loadedLinks;
    if (!loaded.has(normalized))
      add(
        warnings,
        "copied_asset_not_loaded",
        `${normalized} is copied but not loaded in the entry HTML`,
        {
          hint: "`slidesls add` copies assets only; insert returned load tags into the entry HTML when needed.",
        },
      );
  }

  if (!registryData) return;
  const manifestItems = new Set(copiedItems);
  for (const item of registryData.items) {
    if (manifestItems.has(item.name)) continue;
    const writes = await planCopies({
      items: [item],
      targetRoot: root,
      baseDir: manifest.baseDir || "slidesls",
    });
    const tags = tagsForWrites(writes);
    const expectedLinks = tags.links.map((tag) =>
      normalizeRef(/href=["']([^"']+)/i.exec(tag)?.[1]),
    );
    const expectedScripts = tags.scripts.map((tag) =>
      normalizeRef(/src=["']([^"']+)/i.exec(tag)?.[1]),
    );
    if (
      expectedLinks.some((ref) => loadedLinks.has(ref)) ||
      expectedScripts.some((ref) => loadedScripts.has(ref))
    )
      add(
        warnings,
        "loaded_asset_missing_manifest_item",
        `${item.name} assets are loaded but the active manifest does not list the item`,
        {
          item: item.name,
          hint: `Run slidesls add ${item.name} --dir <deck> --dry-run --json or reconcile the manifest.`,
        },
      );
  }
}
