import { slideSegments, startTags, stripNonRenderedCode } from "../shared/html.mjs";
import { usedIconNames } from "../icons/sprite.mjs";

// Deck scorecard for `validate --report`: archetype map, variety, motion
// coverage, icon consistency, and the lint summary in one structure.
//
// The scorecard is NECESSARY, NEVER SUFFICIENT: it gates structure and
// honesty. Taste is gated by rendered review (visual-qa + live preview),
// which is why `note` always says so.
export function deckScorecard({ html, errors, warnings }) {
  const rendered = stripNonRenderedCode(html);
  const segments = slideSegments(rendered);

  const archetypeMap = segments.map((segment, index) => ({
    slide: index + 1,
    label: segment.attributes.get("aria-label") || null,
    archetype: segment.attributes.get("data-ls-archetype") || null,
    kind: segment.attributes.get("data-ls-slide-kind") || null,
    steps: (segment.html.match(/data-step=/g) || []).length,
  }));

  const marked = archetypeMap.filter((entry) => entry.archetype);
  const distribution = {};
  for (const entry of marked)
    distribution[entry.archetype] = (distribution[entry.archetype] || 0) + 1;
  let longestRun = 0;
  let run = 0;
  for (let index = 0; index < archetypeMap.length; index += 1) {
    const name = archetypeMap[index].archetype;
    run = name && name === archetypeMap[index - 1]?.archetype ? run + 1 : 1;
    if (name && run > longestRun) longestRun = run;
  }

  const deckTag = startTags(rendered, "main").find((attributes) => attributes.has("data-ls-deck"));
  const emojiSlots = (
    rendered.match(
      /class=(?:"[^"]*\bls-icon(?:-badge|-mark)?\b[^"]*"|'[^']*\bls-icon(?:-badge|-mark)?\b[^']*')[^>]*>[^<]*\p{Extended_Pictographic}/gu,
    ) || []
  ).length;

  const lintCounts = {};
  for (const finding of [...errors, ...warnings])
    lintCounts[finding.code] = (lintCounts[finding.code] || 0) + 1;

  return {
    slides: archetypeMap,
    variety: {
      slideCount: segments.length,
      markedSlides: marked.length,
      distinctArchetypes: Object.keys(distribution).length,
      distribution,
      longestRun,
    },
    motion: {
      deckTransition: deckTag?.get("data-ls-transition") || "fade (default)",
      deckMotionDisabled: deckTag?.get("data-ls-motion") === "none",
      slidesWithSteps: archetypeMap.filter((entry) => entry.steps > 0).length,
    },
    icons: {
      spriteIconsUsed: usedIconNames(rendered).length,
      emojiIconSlots: emojiSlots,
      emojiOptIn: deckTag?.get("data-ls-icons") === "emoji",
    },
    lints: lintCounts,
    note: "The scorecard gates structure and honesty only — it is necessary, never sufficient. A clean scorecard is not 'done': run slidesls visual-qa against a live preview (contrast, fill, rhythm) and review rendered slides before calling the deck finished.",
  };
}
