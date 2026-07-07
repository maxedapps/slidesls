import { slideSegments, startTagRecords, stripNonRenderedCode } from "../shared/html.mjs";
import { validateLegacyDesignComposition } from "./legacy/design-lint-v1.mjs";

// Advisory structural composition lint for the v2 vocabulary. These codes are
// warnings by design and are never promoted to errors, even under --strict:
// they detect statistical signatures of weak composition, not provable
// defects. Measured checks (fill ratios, computed type sizes, contrast) live
// in the browser-fact path (slidesls visual-qa), not here.
//
// v1 decks (manifest cliVersion < 0.6.0) are routed to the frozen legacy
// module: their copied CSS and class vocabulary predate these rules.
const MAX_SURFACES_IN_GRID = 4;
const V2_VOCABULARY_SINCE = "0.6.0";

const columnGridClasses = ["ls-grid--2", "ls-grid--3", "ls-grid--4"];
const surfaceClasses = ["ls-surface"];
const unboxedAlternatives =
  "components/list (short items), components/stat (numbers), components/flow (sequences)";

function classList(attributes) {
  return String(attributes.get("class") || "")
    .split(/\s+/)
    .filter(Boolean);
}

function tagsWithAnyClass(tags, classNames) {
  return tags.filter((tag) => {
    const classes = classList(tag.attributes);
    return classNames.some((className) => classes.includes(className));
  });
}

function compareVersions(left, right) {
  const a = String(left).split(".").map(Number);
  const b = String(right).split(".").map(Number);
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    const diff = (a[index] || 0) - (b[index] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export function deckUsesV1Vocabulary(manifest) {
  const version = manifest?.cliVersion;
  if (typeof version !== "string" || !/^\d+\.\d+/.test(version)) return false;
  return compareVersions(version, V2_VOCABULARY_SINCE) < 0;
}

function slideName(segment, index) {
  const label = segment.attributes.get("aria-label");
  return label ? `slide ${index + 1} ("${label}")` : `slide ${index + 1}`;
}

export function validateDesignComposition({ html, manifest, warnings }) {
  if (deckUsesV1Vocabulary(manifest)) {
    validateLegacyDesignComposition({ html, manifest, warnings });
    warnings.push({
      code: "legacy_deck_rules",
      message:
        "v1 deck (manifest cliVersion < 0.6.0) — validated with frozen legacy composition rules.",
      hint: "Re-init with the current CLI to adopt the v2 vocabulary (styles, layouts, components).",
    });
    return;
  }

  for (const [index, segment] of slideSegments(html).entries()) {
    if (segment.attributes.get("data-ls-lint") === "off") continue;
    const renderedSegment = stripNonRenderedCode(segment.html);
    const tags = startTagRecords(renderedSegment);
    const surfaceCount = tagsWithAnyClass(tags, surfaceClasses).length;
    const hasColumnGrid =
      tagsWithAnyClass(tags, columnGridClasses).length > 0 ||
      tagsWithAnyClass(tags, ["ls-layout--columns-3", "ls-layout--columns-4"]).length > 0;
    const name = slideName(segment, index);

    if (hasColumnGrid && surfaceCount > MAX_SURFACES_IN_GRID)
      warnings.push({
        code: "many_surfaces_in_grid",
        slide: index + 1,
        message: `${name} places ${surfaceCount} surfaces in a column grid; wrapped rows of equal boxes read as filler.`,
        hint: `Surfaces are for content that needs a frame — try the unboxed vocabulary instead: ${unboxedAlternatives}.`,
      });

    // The box is the exception in v2: a slide whose body is ONLY surfaces
    // reproduces the v1 card-grid monotony.
    if (surfaceCount >= 3 && !hasNonSurfaceContent(tags))
      warnings.push({
        code: "surface_only_slide",
        slide: index + 1,
        message: `${name} composes its body entirely from ${surfaceCount} bordered surfaces.`,
        hint: `Mix in unboxed content (${unboxedAlternatives}) or drop the boxes; scale contrast beats borders.`,
      });
  }
}

const nonSurfaceContentClasses = [
  "ls-statement",
  "ls-stat",
  "ls-figure",
  "ls-list",
  "ls-quote",
  "ls-chart",
  "ls-flow",
  "ls-media",
  "ls-code",
  "ls-table",
];

function hasNonSurfaceContent(tags) {
  return tagsWithAnyClass(tags, nonSurfaceContentClasses).length > 0;
}
