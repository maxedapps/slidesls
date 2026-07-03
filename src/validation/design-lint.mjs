import { slideSegments, startTagRecords, stripNonRenderedCode } from "../shared/html.mjs";

// Advisory structural composition lint. These codes are warnings by design and
// are never promoted to errors, even under --strict: they detect statistical
// signatures of weak composition (wrapping card rows, stretched sparse grids),
// not provable defects. Measured checks (fill ratios, computed type sizes)
// live in the browser-fact path (slidesls visual-qa), not here — a flat tag
// scanner cannot aggregate per-subtree content reliably.
//
// Thresholds. The 1600x900 canvas gives a content body of roughly
// 900 - 2*92 (slide padding) - ~120 (header) - 48 (gap) ≈ 550px. Three-column
// grids fit one row of substantial cards; more than 4 cards/panels in a
// column-limited grid forces a second wrapped row of equal boxes, the eve-deck
// failure signature. Three text cards without a visual anchor is the smallest
// grid where sparse copy reads as filler, so that is where the advisory
// density pointer starts.
const MAX_CARDS_IN_GRID = 4;
const STRETCHED_GRID_MIN_CARDS = 3;
// The density pointer starts at 4 cards for decks with content-sized grids:
// canonical 3-card layouts (three-cards, split's panel+2 cards) compose fine
// under 0.5 CSS, and flagging them would train agents to ignore the code.
// Legacy decks keep the 3-card floor because their copied CSS still
// stretches every grid.
const DENSITY_POINTER_MIN_CARDS = 4;
const DENSITY_POINTER_MIN_CARDS_LEGACY = 3;

// Copied layout CSS got content-sized grids in this release; older copies
// stretch plain .ls-grid rows to the full body height.
export const GRID_CONTENT_SIZED_SINCE = "0.5.0";

const columnGridClasses = ["ls-grid--2", "ls-grid--3", "ls-grid--4"];
const cardClasses = ["ls-card", "ls-panel"];
const visualAnchorClasses = ["ls-metric", "ls-progress"];
const visualAnchorTags = new Set(["svg", "img", "code"]);

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

function hasVisualAnchor(segmentHtml) {
  const tags = startTagRecords(segmentHtml);
  return tags.some(
    (tag) =>
      visualAnchorTags.has(tag.name) ||
      visualAnchorClasses.some((className) => classList(tag.attributes).includes(className)),
  );
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

export function deckAssetsPredateContentSizedGrids(manifest) {
  const version = manifest?.cliVersion;
  if (typeof version !== "string" || !/^\d+\.\d+/.test(version)) return false;
  return compareVersions(version, GRID_CONTENT_SIZED_SINCE) < 0;
}

function migrationPrefix(legacyAssets) {
  // Hints must never reference classes the deck's own copied CSS lacks; when
  // the manifest shows a pre-0.5 copy, remediation starts from the re-copy.
  return legacyAssets
    ? "Re-copy layout assets first (slidesls add utilities/layout core/base --dir <deck> --force) to get content-sized grids and density variants, then "
    : "";
}

function slideName(segment, index) {
  const label = segment.attributes.get("aria-label");
  return label ? `slide ${index + 1} ("${label}")` : `slide ${index + 1}`;
}

export function validateDesignComposition({ html, manifest, warnings }) {
  const legacyAssets = deckAssetsPredateContentSizedGrids(manifest);
  const prefix = migrationPrefix(legacyAssets);

  for (const [index, segment] of slideSegments(html).entries()) {
    if (segment.attributes.get("data-ls-lint") === "off") continue;
    const renderedSegment = stripNonRenderedCode(segment.html);
    const tags = startTagRecords(renderedSegment);
    const cardCount = tagsWithAnyClass(tags, cardClasses).length;
    const hasColumnGrid = tagsWithAnyClass(tags, columnGridClasses).length > 0;
    const hasGrid = hasColumnGrid || tagsWithAnyClass(tags, ["ls-grid"]).length > 0;
    const hasFillGrid = tagsWithAnyClass(tags, ["ls-grid--fill"]).length > 0;
    const name = slideName(segment, index);

    if (hasColumnGrid && cardCount > MAX_CARDS_IN_GRID)
      warnings.push({
        code: "many_cards_in_grid",
        slide: index + 1,
        message: `${name} places ${cardCount} cards/panels in a column grid; wrapped rows of equal boxes read as filler.`,
        hint: `${prefix}restructure with templates/icon-grid (4-6 short items), templates/feature-rows (one-liner rows), or a split layout; see slidesls inspect templates/icon-grid --json.`,
      });

    const stretched = hasFillGrid || (legacyAssets && hasGrid);
    if (stretched && cardCount >= STRETCHED_GRID_MIN_CARDS)
      warnings.push({
        code: "stretched_grid_with_cards",
        slide: index + 1,
        message: `${name} combines a stretch-to-fill grid with ${cardCount} cards/panels; sparse cards will stretch and trap dead space.`,
        hint: legacyAssets
          ? `${prefix}verify the rendered result with slidesls visual-qa.`
          : "Remove ls-grid--fill for card content (content-sized grids are the default), or add ls-card--center for intentionally stretched cards; verify with slidesls visual-qa.",
      });

    const densityPointerMinCards = legacyAssets
      ? DENSITY_POINTER_MIN_CARDS_LEGACY
      : DENSITY_POINTER_MIN_CARDS;
    if (
      hasGrid &&
      cardCount >= densityPointerMinCards &&
      !segment.attributes.get("data-ls-density") &&
      !hasVisualAnchor(segment.html)
    )
      warnings.push({
        code: "card_grid_check_density",
        slide: index + 1,
        message: `${name} is a grid of ${cardCount} text cards with no density setting or visual anchor; composition needs a visual check.`,
        hint: `${prefix}preview and run slidesls visual-qa; if the cards are sparse, use data-ls-density="spacious" or restructure with templates/feature-rows / templates/icon-grid.`,
      });
  }
}
