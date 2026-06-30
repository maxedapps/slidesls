export function localReferences(html) {
  const refs = [];
  const attributePattern = /\b(?:href|src)\s*=\s*(["'])(.*?)\1/gi;
  let match;
  while ((match = attributePattern.exec(html))) {
    const value = match[2];
    if (
      !value ||
      value.startsWith("#") ||
      /^[a-z][a-z0-9+.-]*:/i.test(value) ||
      value.startsWith("//")
    )
      continue;
    refs.push(value.split(/[?#]/, 1)[0]);
  }
  return refs;
}

export function startTags(html, tagName) {
  const tags = [];
  const pattern = new RegExp(`<${tagName}\\b([^>]*)>`, "gi");
  let match;
  while ((match = pattern.exec(html))) tags.push(parseAttributes(match[1] || ""));
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
