const HEADER_OFFSET_TOLERANCE = 24;
const MAX_CONTENT_HEADER_RATIO = 0.3;
const MEDIAN_TOLERANCE = 24;

export function analyzeVisualRhythm(payload, options = {}) {
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

  return {
    warnings,
    slides,
    summary: {
      slideCount: slides.length,
      contentSlideCount: contentSlides.length,
      warningCount: warnings.length,
    },
  };
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
