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

export function localFileReferences(html) {
  const refs = [];
  const attributePattern = /\b(href|src|poster)\s*=\s*(["'])(.*?)\2/gims;
  for (const match of html.matchAll(attributePattern)) {
    const attribute = match[1].toLowerCase();
    addLocalRef(refs, match[3], { attribute, kind: attribute });
  }
  const srcsetPattern = /\bsrcset\s*=\s*(["'])(.*?)\1/gims;
  for (const match of html.matchAll(srcsetPattern)) {
    for (const candidate of match[2].split(",")) {
      const rawValue = candidate.trim().split(/\s+/, 1)[0];
      addLocalRef(refs, rawValue, { attribute: "srcset", kind: "srcset" });
    }
  }
  const stylePattern = /\bstyle\s*=\s*(["'])(.*?)\1/gims;
  for (const match of html.matchAll(stylePattern)) {
    for (const url of cssUrlValues(match[2]))
      addLocalRef(refs, url, { attribute: "style", kind: "style-url" });
  }
  return refs;
}

function addLocalRef(refs, rawValue, details = {}) {
  if (isExternalOrNonFileUrl(rawValue)) return;
  const localPath = decodePath(stripQueryAndHash(String(rawValue).trim()));
  if (localPath) refs.push({ rawValue, localPath, ...details });
}

function cssUrlValues(source) {
  const urls = [];
  for (const match of String(source).matchAll(
    /url\(\s*(?:"([^"]*)"|'([^']*)'|([^)'"\s][^)]*?))\s*\)/gims,
  ))
    urls.push((match[1] ?? match[2] ?? match[3] ?? "").trim());
  return urls;
}

export function localReferences(html) {
  return localFileReferences(html).map((reference) => reference.localPath);
}

export function stylesheetHrefs(html) {
  return startTags(html, "link")
    .filter((attributes) =>
      String(attributes.get("rel") || "")
        .toLowerCase()
        .split(/\s+/)
        .includes("stylesheet"),
    )
    .map((attributes) => attributes.get("href") || "")
    .filter(Boolean);
}

export function moduleScriptSrcs(html) {
  // Module scripts and classic defer scripts both count: module scripts are
  // CORS-blocked over file://, so copied runtimes ship as classic defer.
  return startTags(html, "script")
    .filter(
      (attributes) => attributes.get("type")?.toLowerCase() === "module" || attributes.has("defer"),
    )
    .map((attributes) => attributes.get("src") || "")
    .filter(Boolean);
}

export function startTags(html, tagName) {
  return startTagRecords(html, tagName).map((tag) => tag.attributes);
}

export function startTagRecords(html, tagName = "[a-z][a-z0-9:-]*") {
  const tags = [];
  const pattern = new RegExp(`<(${tagName})\\b([^>]*)>`, "gi");
  let match;
  while ((match = pattern.exec(html)))
    tags.push({
      name: match[1].toLowerCase(),
      attributes: parseAttributes(match[2] || ""),
      index: match.index,
      raw: match[0],
    });
  return tags;
}

export function parseAttributes(source) {
  const attributes = new Map();
  const pattern = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  let match;
  while ((match = pattern.exec(source))) {
    attributes.set(match[1].toLowerCase(), match[2] ?? match[3] ?? match[4] ?? "");
  }
  return attributes;
}

export function stripNonRenderedCode(html) {
  return String(html).replace(/<(code|pre|script|style)\b[\s\S]*?<\/\1>/gim, "");
}

export function classTokens(html) {
  const tokens = [];
  for (const attributes of startTags(stripNonRenderedCode(html), "[a-z][a-z0-9:-]*")) {
    for (const token of String(attributes.get("class") || "").split(/\s+/)) {
      if (token) tokens.push(token);
    }
  }
  return tokens;
}

export function hasClass(attributes, className) {
  return String(attributes.get("class") || "")
    .split(/\s+/)
    .includes(className);
}

export function hasElementWithClass(html, tagName, className) {
  return startTags(html, tagName).some((attributes) => hasClass(attributes, className));
}

export function hasDeckElement(html) {
  return startTags(html, "[a-z][a-z0-9:-]*").some(
    (attributes) => hasClass(attributes, "ls-deck") && attributes.has("data-ls-deck"),
  );
}

export function slideSegments(html) {
  const slideStarts = startTagRecords(html, "[a-z][a-z0-9:-]*").filter((tag) =>
    hasClass(tag.attributes, "ls-slide"),
  );
  return slideStarts.map((tag, index) => ({
    attributes: tag.attributes,
    html: html.slice(tag.index, slideStarts[index + 1]?.index ?? html.length),
  }));
}

export function hasModuleRuntimeScript(html) {
  // Accepts type="module" (v1 decks) or classic defer (v2 decks — module
  // scripts do not load over file:// in Chromium).
  return startTags(html, "script").some(
    (attributes) =>
      (attributes.get("type")?.toLowerCase() === "module" || attributes.has("defer")) &&
      /slide-runtime\.js/i.test(attributes.get("src") || ""),
  );
}

export function usesLucideIcons(html) {
  return /\bdata-lucide(?:\s*=|\s|>)/i.test(html);
}

export function hasLucideScript(html) {
  if (/lucide\.createIcons\s*\(/i.test(html)) return true;
  return startTags(html, "script").some((attributes) =>
    /lucide/i.test(attributes.get("src") || ""),
  );
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
