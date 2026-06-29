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

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
