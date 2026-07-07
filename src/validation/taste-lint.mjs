import { slideSegments, startTags, stripNonRenderedCode } from "../shared/html.mjs";
import { usedIconNames } from "../icons/sprite.mjs";
import { emojiIconSlotCount } from "./icons.mjs";

// Taste-signature lints: statistical signatures of decks that are technically
// valid but read as monotone or dishonest. All advisory (never promoted by
// --strict). Per-slide findings (placeholder_echo) and per-slide counting
// (archetype_monotony) respect data-ls-lint="off"; icon_mix and motion_absent
// are deck-level facts with their own opt-ins. Deliberate art direction
// always wins.

// placeholder_echo: a figure/surface whose visible text is short AND mostly
// restates the slide's eyebrow/badge/title — the "hero panel echoing the
// badge word" anti-pattern. Thresholds are constants with fire/pass tests.
const ECHO_MAX_CHARS = 60;
const ECHO_JACCARD = 0.8;
const PLACEHOLDER_PHRASES = new Set([
  "diagram",
  "visual",
  "image",
  "image here",
  "placeholder",
  "screenshot",
  "chart",
  "graphic",
  "visual anchor",
  "diagram or visual anchor",
]);

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSet(text) {
  return new Set(normalize(text).split(" ").filter(Boolean));
}

function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  for (const token of a) if (b.has(token)) intersection += 1;
  return intersection / (a.size + b.size - intersection);
}

function innerTexts(html, className) {
  const texts = [];
  const pattern = new RegExp(
    `<([a-z][a-z0-9-]*)\\b[^>]*class=(?:"[^"]*\\b${className}\\b[^"]*"|'[^']*\\b${className}\\b[^']*')[^>]*>([\\s\\S]*?)</\\1>`,
    "gi",
  );
  for (const match of html.matchAll(pattern)) {
    texts.push(
      match[2]
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim(),
    );
  }
  return texts;
}

// One token set PER reference string: comparing against the union would let
// a long title dilute a verbatim badge echo below the threshold.
function slideReferenceTokenSets(segmentHtml) {
  const sets = [];
  for (const className of ["ls-eyebrow", "ls-badge", "ls-title"]) {
    for (const text of innerTexts(segmentHtml, className)) {
      const tokens = tokenSet(text);
      if (tokens.size) sets.push(tokens);
    }
  }
  return sets;
}

export function validateTaste({ html, warnings }) {
  const rendered = stripNonRenderedCode(html);
  const segments = slideSegments(rendered);

  // --- archetype_monotony -------------------------------------------------
  // Suppressed slides drop out of monotony counting entirely.
  const archetypes = segments.map((segment) =>
    segment.attributes.get("data-ls-lint") === "off"
      ? null
      : segment.attributes.get("data-ls-archetype") || null,
  );
  const contentArchetypes = archetypes.filter(
    (name) => name && !["title-hero", "section"].includes(name),
  );
  if (contentArchetypes.length >= 4) {
    const counts = new Map();
    for (const name of contentArchetypes) counts.set(name, (counts.get(name) || 0) + 1);
    const [topName, topCount] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (topCount / contentArchetypes.length > 0.5)
      warnings.push({
        code: "archetype_monotony",
        message: `${topCount} of ${contentArchetypes.length} content slides use archetypes/${topName}; the deck reads as one repeated layout.`,
        hint: "Vary the rhythm: statement, big-stat, evidence, and comparison break up runs of the same shape.",
      });
  }
  let run = 1;
  for (let index = 1; index < archetypes.length; index += 1) {
    const name = archetypes[index];
    run = name && name === archetypes[index - 1] && name !== "section" ? run + 1 : 1;
    if (run === 3)
      warnings.push({
        code: "archetype_monotony",
        slide: index + 1,
        message: `Slides ${index - 1}–${index + 1} are three consecutive archetypes/${name} slides.`,
        hint: "Insert a different shape (statement, section, evidence) or merge the content.",
      });
  }

  // --- placeholder_echo ---------------------------------------------------
  for (const [index, segment] of segments.entries()) {
    if (segment.attributes.get("data-ls-lint") === "off") continue;
    const referenceTokenSets = slideReferenceTokenSets(segment.html);
    for (const className of ["ls-figure", "ls-surface"]) {
      for (const text of innerTexts(segment.html, className)) {
        const normalized = normalize(text);
        if (!normalized || normalized.length >= ECHO_MAX_CHARS) continue;
        const phrase = PLACEHOLDER_PHRASES.has(normalized);
        const candidate = tokenSet(normalized);
        const echo = referenceTokenSets.some(
          (tokens) => jaccard(candidate, tokens) >= ECHO_JACCARD,
        );
        if (phrase || echo)
          warnings.push({
            code: "placeholder_echo",
            slide: index + 1,
            message: `Slide ${index + 1} has a ${className.replace("ls-", "")} whose text ${phrase ? `is a placeholder phrase ("${text}")` : `restates the slide's own heading ("${text}")`}.`,
            hint: "Follow the image ladder: real asset → authored diagram → ls-figure--abstract → the archetype's no-figure variant. Text pretending to be a visual is never the answer.",
          });
      }
    }
  }

  // --- icon_mix -------------------------------------------------------------
  // Mixing systems is the defect; data-ls-icons="emoji" legitimizes emoji
  // ALONE, not emoji alongside sprite icons.
  const hasSpriteIcons = usedIconNames(rendered).length > 0;
  if (hasSpriteIcons && emojiIconSlotCount(rendered) > 0)
    warnings.push({
      code: "icon_mix",
      message: "The deck mixes sprite icons with emoji in icon slots; one icon system per deck.",
      hint: "Replace the emoji with sprite icons (slidesls icons list), or drop the sprite references and commit to emoji deck-wide.",
    });

  // --- motion_absent ----------------------------------------------------------
  // Motion is on by default in v2, so absence is only expressible via the
  // deck-wide kill switch; surface it so it is always a decision, not a leak.
  const deckTag = startTags(rendered, "main").find((attributes) => attributes.has("data-ls-deck"));
  if (deckTag?.get("data-ls-motion") === "none")
    warnings.push({
      code: "motion_absent",
      message: 'The deck disables all motion (data-ls-motion="none").',
      hint: "Fine when deliberate (print-first decks, motion-sensitive venues); otherwise remove the attribute — transitions and entrances are the default.",
    });
}
