import assert from "node:assert/strict";
import test from "node:test";
import {
  renderSprite,
  spriteIconNames,
  symbolFromLucideSvg,
  usedIconNames,
  withSprite,
} from "../src/icons/sprite.mjs";
import { validateIcons } from "../src/validation/icons.mjs";
import { assertSafeSymbolContent } from "../src/icons/sprite.mjs";

const deckWith = (sprite, body) => `<!doctype html>
<html><head></head><body class="ls-page">
${sprite}
<main class="ls-deck" data-ls-deck>${body}</main>
</body></html>`;

const zapSymbol = '<symbol id="ls-i-zap" viewBox="0 0 24 24"><path d="M1"/></symbol>';

test("sprite helpers parse, render, and rewrite the inline sprite", () => {
  const html = deckWith(
    `<svg class="ls-sprite" aria-hidden="true">${zapSymbol}</svg>`,
    '<svg class="ls-icon"><use href="#ls-i-zap"/></svg><svg class="ls-icon"><use href="#ls-i-check"/></svg>',
  );
  assert.deepEqual(usedIconNames(html), ["check", "zap"]);
  assert.deepEqual(spriteIconNames(html), ["zap"]);

  const next = withSprite(html, renderSprite([zapSymbol]));
  assert.ok(next.includes('id="ls-i-zap"'));
  assert.equal(spriteIconNames(next).length, 1);

  // Insertion path: a deck without a sprite gets one right after <body>.
  const bare = deckWith("", "").replace(/^\n/m, "");
  const inserted = withSprite(bare, renderSprite([zapSymbol]));
  assert.ok(/<body class="ls-page">\s*<svg class="ls-sprite"/.test(inserted));
  assert.equal(withSprite("<div>no body</div>", renderSprite([])), null);
});

test("symbolFromLucideSvg extracts viewBox and inner markup", () => {
  const symbol = symbolFromLucideSvg(
    "zap",
    '<svg viewBox="0 0 24 24" stroke="currentColor">\n  <path d="M4 14" />\n</svg>',
  );
  assert.ok(symbol.startsWith('<symbol id="ls-i-zap" viewBox="0 0 24 24"'));
  assert.ok(symbol.includes('<path d="M4 14" />'));
  assert.throws(() => symbolFromLucideSvg("bad", "not svg"), /Could not parse/);
});

test("unknown_icon fires for sprite-less references and passes after sync", () => {
  const errors = [];
  const warnings = [];
  validateIcons({
    html: deckWith(
      '<svg class="ls-sprite" aria-hidden="true"></svg>',
      '<svg class="ls-icon"><use href="#ls-i-zap"/></svg>',
    ),
    errors,
    warnings,
  });
  assert.equal(errors[0]?.code, "unknown_icon");

  const cleanErrors = [];
  validateIcons({
    html: deckWith(
      `<svg class="ls-sprite" aria-hidden="true">${zapSymbol}</svg>`,
      '<svg class="ls-icon"><use href="#ls-i-zap"/></svg>',
    ),
    errors: cleanErrors,
    warnings: [],
  });
  assert.deepEqual(cleanErrors, []);
});

test("emoji_icon warns in icon slots and respects the deck-level suppression", () => {
  const warnings = [];
  validateIcons({
    html: deckWith("", '<span class="ls-icon-badge">🛟</span>'),
    errors: [],
    warnings,
  });
  assert.equal(warnings[0]?.code, "emoji_icon");

  const suppressed = [];
  validateIcons({
    html: deckWith(
      "",
      '<main class="ls-deck" data-ls-deck data-ls-icons="emoji"><span class="ls-icon-badge">🛟</span></main>',
    ),
    errors: [],
    warnings: suppressed,
  });
  assert.deepEqual(suppressed, []);

  // Numbered badges (text markers) are not emoji.
  const numeric = [];
  validateIcons({
    html: deckWith("", '<span class="ls-icon-badge">01</span>'),
    errors: [],
    warnings: numeric,
  });
  assert.deepEqual(numeric, []);
});

test("network-fetched SVG content is sanitized", () => {
  assertSafeSymbolContent("ok", '<path d="M4 14"/><circle cx="1" cy="1" r="1"/>');
  assert.throws(
    () => assertSafeSymbolContent("bad", "<script>alert(1)</script>"),
    /Unsafe SVG element/,
  );
  assert.throws(
    () => assertSafeSymbolContent("bad", "<foreignObject></foreignObject>"),
    /Unsafe SVG element/,
  );
  assert.throws(
    () => assertSafeSymbolContent("bad", '<path onload="x()" d="M0 0"/>'),
    /Unsafe SVG attribute/,
  );
  assert.throws(
    () => assertSafeSymbolContent("bad", '<path fill="url(http://x)" d="M0 0"/>'),
    /Unsafe SVG attribute/,
  );
});

test("sprite license notice travels with non-empty sprites", async () => {
  const { renderSprite } = await import("../src/icons/sprite.mjs");
  assert.ok(renderSprite(['<symbol id="ls-i-zap"></symbol>']).includes("ISC license"));
  assert.ok(!renderSprite([]).includes("ISC license"));
});
