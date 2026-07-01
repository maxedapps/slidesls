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
  const attributePattern = /\b(?:href|src)\s*=\s*(["'])(.*?)\1/gims;
  for (const match of html.matchAll(attributePattern)) {
    const rawValue = match[2];
    if (isExternalOrNonFileUrl(rawValue)) continue;
    const localPath = decodePath(stripQueryAndHash(rawValue.trim()));
    if (localPath) refs.push({ rawValue, localPath });
  }
  return refs;
}

export function localReferences(html) {
  return localFileReferences(html).map((reference) => reference.localPath);
}

export function startTags(html, tagName) {
  return startTagRecords(html, tagName).map((tag) => tag.attributes);
}

export function startTagRecords(html, tagName = "[a-z][a-z0-9:-]*") {
  const tags = [];
  const pattern = new RegExp(`<(${tagName})\\b([^>]*)>`, "gi");
  let match;
  while ((match = pattern.exec(html)))
    tags.push({ name: match[1].toLowerCase(), attributes: parseAttributes(match[2] || "") });
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

export function classTokens(html) {
  const tokens = [];
  for (const attributes of startTags(html, "[a-z][a-z0-9:-]*")) {
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

export function hasModuleRuntimeScript(html) {
  return startTags(html, "script").some(
    (attributes) =>
      attributes.get("type")?.toLowerCase() === "module" &&
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
