import { startTags, stripNonRenderedCode } from "../shared/html.mjs";
import { spriteIconNames, usedIconNames } from "../icons/sprite.mjs";

// One icon system per deck: sprite icons or nothing. unknown_icon is a
// provable defect (a reference that renders as empty space); emoji_icon is a
// taste signature and stays advisory, suppressible by declaring the deck
// intentionally emoji-styled via data-ls-icons="emoji" on the deck element.
export const ICON_SLOT_PATTERN =
  /<[a-z][^>]*class=(?:"[^"]*\bls-icon(?:-badge|-mark)?\b[^"]*"|'[^']*\bls-icon(?:-badge|-mark)?\b[^']*')[^>]*>([\s\S]*?)<\/[a-z][a-z0-9-]*>/g;
const EMOJI_PATTERN = /\p{Extended_Pictographic}/u;

// Emoji anywhere inside an icon slot's subtree (child spans included).
export function emojiIconSlotCount(html) {
  let count = 0;
  for (const match of html.matchAll(ICON_SLOT_PATTERN)) {
    const text = match[1].replace(/<[^>]*>/g, "").trim();
    if (EMOJI_PATTERN.test(text)) count += 1;
  }
  return count;
}

function deckDeclaresEmojiIcons(html) {
  return startTags(html, "main")
    .concat(startTags(html, "div"), startTags(html, "section"))
    .some(
      (attributes) => attributes.has("data-ls-deck") && attributes.get("data-ls-icons") === "emoji",
    );
}

export function validateIcons({ html, errors, warnings }) {
  const rendered = stripNonRenderedCode(html);
  const available = new Set(spriteIconNames(html));
  const missing = usedIconNames(rendered).filter((name) => !available.has(name));
  if (missing.length)
    errors.push({
      code: "unknown_icon",
      message: `${missing.length} referenced icon(s) missing from the deck's inline sprite: ${missing.join(", ")}`,
      icons: missing,
      hint: "Run slidesls icons sync --dir <deck> --json to rewrite the sprite.",
    });

  if (deckDeclaresEmojiIcons(rendered)) return;
  const emojiSlots = [];
  for (const match of rendered.matchAll(ICON_SLOT_PATTERN)) {
    const text = match[1].replace(/<[^>]*>/g, "").trim();
    if (EMOJI_PATTERN.test(text)) emojiSlots.push(text.slice(0, 8));
  }
  if (emojiSlots.length)
    warnings.push({
      code: "emoji_icon",
      message: `${emojiSlots.length} icon slot(s) contain emoji instead of sprite icons: ${emojiSlots.join(" ")}`,
      hint: 'Use <svg class="ls-icon"><use href="#ls-i-<name>"/></svg>, or declare the deck intentionally emoji-styled with data-ls-icons="emoji" on the deck element.',
    });
}
