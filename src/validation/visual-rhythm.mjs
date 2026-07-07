// Offline analyzer for collected visual QA payloads (see visual-qa-eval.mjs).
// All warnings are advisory: they point the author at slides worth inspecting,
// they do not fail validation.
//
// Threshold derivation (native 1600x900 canvas):
//   body height ~= 900 - 2*92 (slide padding-block) - ~110 (header) - 48 (gap)
//               ~= 550px for a typical content slide.
//   A stretch-to-fill grid therefore produces ~550px-tall cards in a single
//   row; a content-sized sparse card measures ~100-230px. Calibrated against
//   real captured geometry committed in tests/fixtures/: the rebuilt eve-deck
//   failure slides (eve-legacy-visual-qa.json, 0.3 CSS: 3 cards at 557px/12%
//   fill, 6 cards at 262px/29% fill) fire, and every slide of the
//   examples/composition deck under 0.5 CSS (composition-visual-qa.json) is
//   clean.
const HEADER_OFFSET_TOLERANCE = 24;
const MAX_CONTENT_HEADER_RATIO = 0.3;
const MEDIAN_TOLERANCE = 24;
// Cards taller than this with content filling less than the ratio have
// visually trapped dead space. 340px keeps content-sized cards (typically
// <260px) out of scope; primarily a backstop for --fill grids and decks
// copied before content-sized grids.
const CARD_LOW_FILL_MIN_HEIGHT = 340;
const CARD_LOW_FILL_RATIO = 0.45;
// Body copy below ~20px on the 1600x900 canvas reads as fine print from the
// back of a room (tokens.css --ls-text-xs is 20px). Slides that deliberately
// opt into compact density trade two points of size for fit; below 18px is
// fine print in any density.
const BODY_TEXT_MIN_PX = 20;
const BODY_TEXT_MIN_PX_COMPACT = 18;
// "Sparse" means roughly a title plus one short sentence. Height floor is
// calibrated against real geometry: the rebuilt eve slides measure 262px
// (6 wrapped cards) and 557px (3 cards) tall at 12-29% fill under 0.3 CSS,
// while content-sized sparse boxes under 0.5 CSS measure 102-230px
// (tests/fixtures/*-visual-qa.json). 240 separates the two populations.
const SPARSE_CHILD_MAX_CHARS = 140;
const SPARSE_CHILD_MIN_HEIGHT = 240;
const SPARSE_GRID_MIN_CHILDREN = 3;

export function analyzeVisualQa(payload, options = {}) {
  const tolerance = options.headerOffsetTolerance ?? HEADER_OFFSET_TOLERANCE;
  const ratioLimit = options.maxContentHeaderRatio ?? MAX_CONTENT_HEADER_RATIO;
  const medianTolerance = options.medianTolerance ?? MEDIAN_TOLERANCE;
  // Precedence: browser-resolved kind, then the raw data-ls-slide-kind attribute,
  // then fact-based inference for payloads collected without kind resolution.
  const slides = (payload.slides || []).map((slide) => ({
    ...slide,
    inferredKind: slide.kind || slide.slideKind || inferKind(slide),
  }));
  const warnings = [];
  const contentSlides = slides.filter((slide) => slide.inferredKind === "content");

  for (const slide of contentSlides) {
    // The inner spans the slide and positions its header via padding, so the
    // expected header top is the inner's content-box top when collected.
    const expected = number(slide.expectedHeaderOffsetTop)
      ? slide.expectedHeaderOffsetTop
      : slide.innerOffsetTop;
    if (number(slide.headerOffsetTop) && number(expected)) {
      const delta = Math.abs(slide.headerOffsetTop - expected);
      if (delta > tolerance)
        warnings.push({
          code: "content_header_offset",
          slide: slide.index,
          message: `Content slide ${slide.index} header starts ${Math.round(delta)}px from its expected top position.`,
        });
    }
    const slideHeight = slide.rect?.height || slide.clientHeight || 0;
    if (
      number(slide.headerOffsetTop) &&
      slideHeight &&
      slide.headerOffsetTop > slideHeight * ratioLimit
    )
      warnings.push({
        code: "content_header_too_low",
        slide: slide.index,
        message: `Content slide ${slide.index} header starts below ${Math.round(ratioLimit * 100)}% of slide height.`,
      });
  }

  if (contentSlides.length >= 3) {
    const offsets = contentSlides.map((slide) => slide.headerOffsetTop).filter(number);
    const median = medianValue(offsets);
    for (const slide of contentSlides) {
      if (
        number(slide.headerOffsetTop) &&
        Math.abs(slide.headerOffsetTop - median) > medianTolerance
      )
        warnings.push({
          code: "content_header_median_deviation",
          slide: slide.index,
          message: `Content slide ${slide.index} header rhythm deviates from content-slide median.`,
        });
    }
  }

  for (const slide of slides) {
    if (slide.collected === false) continue;
    analyzeContainers(slide, warnings);
    analyzeGrids(slide, warnings);
    analyzeBodyText(slide, warnings);
    analyzeContrast(slide, warnings);
  }

  // Uncollected slides carry no measurements, so their absence must be loud:
  // a payload collected outside export mode would otherwise read as "clean".
  const uncollected = slides.filter((slide) => slide.collected === false);
  if (uncollected.length)
    warnings.push({
      code: "collection_incomplete",
      slide: uncollected[0].index,
      message:
        uncollected.length === slides.length
          ? "No slide was rendered during collection; measured checks did not run."
          : `${uncollected.length} of ${slides.length} slides were not rendered during collection; measured checks skipped them (slides ${uncollected.map((slide) => slide.index).join(", ")}).`,
      hint: "Open the preview with ?export=1 (all slides render there), wait for load, and re-collect.",
    });

  const perSlide = slides.map((slide) => {
    const slideWarnings = warnings.filter((warning) => warning.slide === slide.index);
    return {
      index: slide.index,
      label: slide.label ?? null,
      kind: slide.inferredKind,
      density: slide.density ?? null,
      warnings: slideWarnings,
      inspect: slideWarnings.length > 0,
      deepLink: deepLinkFor(payload.url, slide.index),
    };
  });

  return {
    warnings,
    slides,
    perSlide,
    summary: {
      slideCount: slides.length,
      collectedSlideCount: slides.length - uncollected.length,
      contentSlideCount: contentSlides.length,
      warningCount: warnings.length,
      slidesToInspect: perSlide.filter((slide) => slide.inspect).map((slide) => slide.index),
      collectedInExportMode: payload.deck?.export === "true",
      variety: varietyStats(slides),
      motion: {
        deckTransition: payload.deck?.transition ?? null,
        deckMotion: payload.deck?.motion ?? null,
        slidesWithSteps: slides.filter((slide) => (slide.stepCount || 0) > 0).length,
      },
      icons: {
        slidesWithIcons: slides.filter((slide) => (slide.iconCount || 0) > 0).length,
        totalIconReferences: slides.reduce((sum, slide) => sum + (slide.iconCount || 0), 0),
      },
    },
  };
}

// Deck-level variety facts for the scorecard: archetype distribution and the
// longest consecutive run of one archetype.
function varietyStats(slides) {
  const archetypes = slides.map((slide) => slide.archetype ?? null);
  const marked = archetypes.filter(Boolean);
  const distribution = {};
  for (const name of marked) distribution[name] = (distribution[name] || 0) + 1;
  let longestRun = 0;
  let run = 0;
  for (let index = 0; index < archetypes.length; index += 1) {
    run = archetypes[index] && archetypes[index] === archetypes[index - 1] ? run + 1 : 1;
    if (archetypes[index] && run > longestRun) longestRun = run;
  }
  return {
    markedSlides: marked.length,
    distinctArchetypes: Object.keys(distribution).length,
    distribution,
    longestRun,
  };
}

// WCAG contrast over the collector's composited color pairs. Display-size
// text (>= 32px, or >= 24px bold) uses the 3:1 large-text floor; body copy
// uses 4.5:1. Essential with five independent style color systems.
const CONTRAST_BODY_MIN = 4.5;
const CONTRAST_DISPLAY_MIN = 3;

function channel(value) {
  const scaled = value / 255;
  return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
}

function luminance([r, g, b]) {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(foreground, background) {
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

function analyzeContrast(slide, warnings) {
  const flagged = new Set();
  for (const pair of slide.colorPairs || []) {
    if (!Array.isArray(pair.color) || !Array.isArray(pair.background)) continue;
    const bold = Number(pair.fontWeight) >= 600;
    const isDisplay = pair.fontSize >= 32 || (bold && pair.fontSize >= 24);
    const floor = isDisplay ? CONTRAST_DISPLAY_MIN : CONTRAST_BODY_MIN;
    const ratio = contrastRatio(pair.color, pair.background);
    if (ratio >= floor || flagged.has(pair.selector)) continue;
    flagged.add(pair.selector);
    warnings.push({
      code: "low_contrast",
      slide: slide.index,
      message: `Slide ${slide.index} ${pair.selector} renders at ${ratio.toFixed(2)}:1 contrast; the ${isDisplay ? "display" : "body"}-text floor is ${floor}:1.`,
      hint: "Adjust the style tokens (text/background/accent) rather than the slide; contrast failures usually repeat everywhere the pair appears.",
    });
  }
}

// Back-compat name: the 0.4.x analyzer only measured header rhythm.
export const analyzeVisualRhythm = analyzeVisualQa;

function analyzeContainers(slide, warnings) {
  const lowFill = (slide.containers || []).filter(
    (container) =>
      number(container.height) &&
      container.height >= CARD_LOW_FILL_MIN_HEIGHT &&
      number(container.contentFillRatio) &&
      container.contentFillRatio < CARD_LOW_FILL_RATIO,
  );
  if (lowFill.length)
    warnings.push({
      code: "card_low_fill",
      slide: slide.index,
      message: `Slide ${slide.index} has ${lowFill.length} tall container(s) with content filling under ${Math.round(CARD_LOW_FILL_RATIO * 100)}% of their height (${lowFill.map((container) => container.selector).join(", ")}).`,
      hint: "Dead space is trapped inside the box. Remove the fill behavior, or restructure with unboxed content: components/list for short items, components/stat for numbers.",
    });
}

function analyzeGrids(slide, warnings) {
  for (const grid of slide.grids || []) {
    const children = grid.children || [];
    if (children.length < SPARSE_GRID_MIN_CHILDREN) continue;
    const allSparse = children.every(
      (child) => number(child.textLength) && child.textLength < SPARSE_CHILD_MAX_CHARS,
    );
    const heights = children.map((child) => child.height).filter(number);
    if (!heights.length) continue;
    const averageHeight = heights.reduce((sum, height) => sum + height, 0) / heights.length;
    if (allSparse && averageHeight > SPARSE_CHILD_MIN_HEIGHT)
      warnings.push({
        code: "equal_cards_sparse",
        slide: slide.index,
        message: `Slide ${slide.index} grid (${grid.selector}) holds ${children.length} sparse boxes averaging ${Math.round(averageHeight)}px tall — equal boxes with one short line each read as filler.`,
        hint: "Use components/list (short items) or give each box real copy/visuals; boxes are for content that needs a frame.",
      });
  }
}

function analyzeBodyText(slide, warnings) {
  const floor = slide.density === "compact" ? BODY_TEXT_MIN_PX_COMPACT : BODY_TEXT_MIN_PX;
  if (number(slide.minBodyFontSize) && slide.minBodyFontSize < floor)
    warnings.push({
      code: "body_text_small",
      slide: slide.index,
      message: `Slide ${slide.index} body copy renders at ${slide.minBodyFontSize}px; below the ${floor}px legibility floor for the 1600x900 canvas.`,
      hint: 'Raise the type (data-ls-density="spacious" for sparse slides) or shorten the copy instead of shrinking it.',
    });
}

function deepLinkFor(url, index) {
  const fragment = `#slide=${index}`;
  if (typeof url !== "string" || !url) return fragment;
  try {
    const parsed = new URL(url);
    // Interactive mode renders exactly one slide per deep link; drop export
    // and hash state from the collected URL.
    parsed.search = "";
    parsed.hash = fragment;
    return parsed.toString();
  } catch {
    return fragment;
  }
}

function inferKind(slide) {
  if (slide.hasSlideFill && slide.centerInFill) return "section";
  if (slide.hasSlideFill && slide.centerStartInFill) return "hero";
  return "content";
}

function number(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function medianValue(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}
