// Inline-sprite icon model. Decks carry a hidden <svg class="ls-sprite"> right
// after <body> holding exactly the <symbol>s the deck references via
// <use href="#ls-i-<name>">. External sprite files are ruled out: <use> with a
// cross-document href is blocked over file://.

// Matches the sprite element with the ls-sprite class token anywhere in its
// class attribute, either quote style.
const SPRITE_PATTERN =
  /[ \t]*<svg\b[^>]*class=(?:"[^"]*\bls-sprite\b[^"]*"|'[^']*\bls-sprite\b[^']*')[^>]*>[\s\S]*?<\/svg>\n?/;

export const ICON_ID_PREFIX = "ls-i-";

// The ISC notice must travel with the copied symbols, not just the package:
// decks are standalone artifacts.
const LICENSE_COMMENT =
  "<!-- Icons: Lucide (https://lucide.dev), ISC license. The full license text is copied with the deck assets at registry/icons/LICENSE -->";

// Lucide icons are plain stroke shapes; anything beyond these tags/attributes
// in fetched content is rejected (network fallback must never persist
// scriptable or externally-referencing SVG into deck HTML).
const SAFE_SVG_TAGS = new Set([
  "path",
  "circle",
  "ellipse",
  "line",
  "polyline",
  "polygon",
  "rect",
  "g",
]);
const UNSAFE_ATTRIBUTE_PATTERN = /\bon[a-z]+\s*=|\b(?:xlink:)?href\s*=|javascript:|url\s*\(/i;

export function assertSafeSymbolContent(name, inner) {
  for (const match of inner.matchAll(/<\s*\/?\s*([a-zA-Z][a-zA-Z0-9-]*)/g)) {
    if (!SAFE_SVG_TAGS.has(match[1].toLowerCase()))
      throw new Error(`Unsafe SVG element <${match[1]}> in icon "${name}"`);
  }
  if (UNSAFE_ATTRIBUTE_PATTERN.test(inner))
    throw new Error(`Unsafe SVG attribute content in icon "${name}"`);
}

export function symbolFromLucideSvg(name, svg) {
  const viewBox = /viewBox=["']([^"']+)["']/.exec(svg)?.[1] || "0 0 24 24";
  const inner = /<svg[^>]*>([\s\S]*)<\/svg>/.exec(svg)?.[1]?.trim();
  if (!inner) throw new Error(`Could not parse lucide SVG for ${name}`);
  assertSafeSymbolContent(name, inner);
  return `<symbol id="${ICON_ID_PREFIX}${name}" viewBox="${viewBox}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</symbol>`;
}

// Icon names referenced anywhere in the document, via href or xlink:href,
// either quote style.
export function usedIconNames(html) {
  const names = new Set();
  for (const match of html.matchAll(/(?:xlink:)?href\s*=\s*["']#ls-i-([a-z0-9-]+)["']/gi))
    names.add(match[1].toLowerCase());
  return [...names].sort();
}

export function spriteIconNames(html) {
  const sprite = SPRITE_PATTERN.exec(html)?.[0] || "";
  return [...sprite.matchAll(/id\s*=\s*["']ls-i-([a-z0-9-]+)["']/gi)]
    .map((match) => match[1].toLowerCase())
    .sort();
}

export function hasSprite(html) {
  return SPRITE_PATTERN.test(html);
}

export function renderSprite(symbols, indent = "    ") {
  if (!symbols.length) return `${indent}<svg class="ls-sprite" aria-hidden="true"></svg>\n`;
  const body = symbols.map((symbol) => `${indent}  ${symbol}`).join("\n");
  return `${indent}<svg class="ls-sprite" aria-hidden="true">\n${indent}  ${LICENSE_COMMENT}\n${body}\n${indent}</svg>\n`;
}

// Replaces the existing sprite, or inserts one directly after the opening
// <body> tag. Returns null when no <body> exists to anchor an insertion.
export function withSprite(html, spriteHtml) {
  if (SPRITE_PATTERN.test(html)) return html.replace(SPRITE_PATTERN, spriteHtml);
  const bodyOpen = /<body[^>]*>\n?/.exec(html);
  if (!bodyOpen) return null;
  const insertAt = bodyOpen.index + bodyOpen[0].length;
  return `${html.slice(0, insertAt)}${spriteHtml}${html.slice(insertAt)}`;
}
