// Browser-side collector for slidesls visual QA. The returned string is a
// dependency-free IIFE for `agent-browser eval --stdin` (or any browser
// console). It only reads rendered geometry and computed styles; analysis
// happens offline in visual-rhythm.mjs.
//
// Rect-based measurements are normalized to native slide pixels (the deck is
// transform-scaled to fit the viewport; computed font sizes are unaffected by
// transforms and therefore reported as-is).
export function visualQaEvalScript() {
  return String.raw`(() => {
  const deck = document.querySelector("[data-ls-deck]");
  const rootStyles = getComputedStyle(document.documentElement);
  const slides = [...document.querySelectorAll(".ls-slide")];
  const nativeWidth = parseFloat(rootStyles.getPropertyValue("--ls-slide-width")) || 1600;
  const intentionalScrollSelector =
    ".ls-table-frame, pre, .ls-code__body, .ls-code-block pre, .ls-terminal__body, .ls-code-diff__body";
  // v2 vocabulary first; v1 class names remain measurable for copied decks.
  const containerSelector =
    ".ls-surface, .ls-media, .ls-card, .ls-panel, .ls-metric, .ls-callout, .ls-icon-item";
  const bodyTextSelector =
    ".ls-surface__text, .ls-layout__text, .ls-list__text, .ls-flow__text, .ls-statement__support, .ls-card__text, .ls-panel__text, .ls-callout__text, .ls-icon-item__text, .ls-subtitle, .ls-slide__body p, .ls-slide__body li";
  // Code-face content has its own sizing conventions; the prose legibility
  // floor must not measure it.
  const codeTextSelector =
    ".ls-code, .ls-terminal, .ls-file-tree, .ls-code-block, .ls-code-diff, pre";

  function selectorFor(element) {
    if (element.id) return "#" + element.id;
    const classes = [...element.classList].slice(0, 4).map((name) => "." + name).join("");
    return element.localName + classes;
  }

  // Normalize to native slide pixels so rect-based offsets stay comparable
  // with computed paddings/font sizes (which transforms do not scale).
  function normalizedRect(rect, scale) {
    const raw = rect.toJSON();
    const normalized = {};
    for (const key of Object.keys(raw)) {
      normalized[key] = typeof raw[key] === "number" ? raw[key] / scale : raw[key];
    }
    return normalized;
  }

  function rectFor(element, slideRect, scale) {
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    return {
      ...normalizedRect(rect, scale),
      offsetTop: (rect.top - slideRect.top) / scale,
    };
  }

  function hasInFill(slide, selector) {
    const fill = slide.querySelector(".ls-slide-fill");
    return Boolean(fill && (fill.matches(selector) || fill.querySelector(selector)));
  }

  function overflowFor(element) {
    const style = getComputedStyle(element);
    const rawOverflowX = element.scrollWidth - element.clientWidth;
    const rawOverflowY = element.scrollHeight - element.clientHeight;
    const overflowX = style.overflowX === "visible" ? 0 : rawOverflowX;
    const overflowY = style.overflowY === "visible" ? 0 : rawOverflowY;
    if (overflowX <= 1 && overflowY <= 1) return null;

    return {
      selector: selectorFor(element),
      slide: slides.findIndex((slide) => slide.contains(element)) + 1,
      overflowX,
      overflowY,
      clientWidth: element.clientWidth,
      clientHeight: element.clientHeight,
      scrollWidth: element.scrollWidth,
      scrollHeight: element.scrollHeight,
      overflowStyle: style.overflowX + " " + style.overflowY,
      intentional: Boolean(element.closest(intentionalScrollSelector)),
    };
  }

  function slideKind(slide) {
    const explicit = slide.dataset.lsSlideKind || null;
    if (explicit) return { kind: explicit, kindSource: "explicit" };
    if (hasInFill(slide, ".ls-center")) return { kind: "section", kindSource: "inferred" };
    if (hasInFill(slide, ".ls-center-start")) return { kind: "hero", kindSource: "inferred" };
    return { kind: "content", kindSource: "inferred" };
  }

  function textLengthOf(element) {
    return (element.textContent || "").replace(/\s+/g, " ").trim().length;
  }

  function round(value) {
    return Math.round(value * 100) / 100;
  }

  function containerMetrics(slide, slideRect, scale) {
    return [...slide.querySelectorAll(containerSelector)].map((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      const paddingTop = parseFloat(style.paddingTop) || 0;
      const paddingBottom = parseFloat(style.paddingBottom) || 0;
      let contentTop = Infinity;
      let contentBottom = -Infinity;
      for (const child of element.children) {
        const childRect = child.getBoundingClientRect();
        if (childRect.height === 0 && childRect.width === 0) continue;
        contentTop = Math.min(contentTop, childRect.top);
        contentBottom = Math.max(contentBottom, childRect.bottom);
      }
      // Normalize rect-derived heights to native pixels first: computed
      // paddings are untransformed, so they may only be subtracted from
      // already-normalized values.
      const outerHeight = rect.height / scale;
      const contentHeight =
        contentBottom > contentTop ? (contentBottom - contentTop) / scale : 0;
      const innerHeight = Math.max(outerHeight - paddingTop - paddingBottom, 0);
      const textElement = element.querySelector(bodyTextSelector);
      return {
        selector: selectorFor(element),
        height: round(outerHeight),
        width: round(rect.width / scale),
        innerHeight: round(innerHeight),
        contentHeight: round(contentHeight),
        contentFillRatio: innerHeight > 0 ? round(Math.min(contentHeight / innerHeight, 1)) : null,
        textLength: textLengthOf(element),
        bodyFontSize: textElement ? round(parseFloat(getComputedStyle(textElement).fontSize)) : null,
      };
    });
  }

  function gridMetrics(slide, scale) {
    return [...slide.querySelectorAll(".ls-grid")].map((grid) => ({
      selector: selectorFor(grid),
      classes: [...grid.classList],
      childCount: grid.children.length,
      children: [...grid.children].map((child) => ({
        selector: selectorFor(child),
        height: round(child.getBoundingClientRect().height / scale),
        textLength: textLengthOf(child),
      })),
    }));
  }

  function minBodyFontSize(slide) {
    let min = null;
    for (const element of slide.querySelectorAll(bodyTextSelector)) {
      if (!textLengthOf(element) || element.closest(codeTextSelector)) continue;
      const size = parseFloat(getComputedStyle(element).fontSize);
      if (Number.isFinite(size) && (min === null || size < min)) min = size;
    }
    return min === null ? null : round(min);
  }

  // Computed foreground/background pairs for contrast analysis. Backgrounds
  // are alpha-composited bottom-up from the slide background so tinted
  // surfaces report their effective color.
  function parseColor(value) {
    const rgb = /rgba?\(([^)]+)\)/.exec(value || "");
    if (rgb) {
      const parts = rgb[1].split(",").map((part) => parseFloat(part));
      return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
    }
    // color-mix() backgrounds can serialize as color(srgb r g b / a).
    const srgb = /color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.%]+))?\)/.exec(value || "");
    if (srgb) {
      const alpha = srgb[4] === undefined ? 1 : parseFloat(srgb[4]) / (srgb[4].endsWith("%") ? 100 : 1);
      return { r: parseFloat(srgb[1]) * 255, g: parseFloat(srgb[2]) * 255, b: parseFloat(srgb[3]) * 255, a: alpha };
    }
    return null;
  }

  function compositeChain(element, slide) {
    let color = parseColor(getComputedStyle(slide).backgroundColor) || { r: 17, g: 19, b: 24, a: 1 };
    const chain = [];
    for (let node = element; node && node !== slide; node = node.parentElement) chain.push(node);
    for (const node of chain.reverse()) {
      const layer = parseColor(getComputedStyle(node).backgroundColor);
      if (!layer || layer.a === 0) continue;
      color = {
        r: layer.r * layer.a + color.r * (1 - layer.a),
        g: layer.g * layer.a + color.g * (1 - layer.a),
        b: layer.b * layer.a + color.b * (1 - layer.a),
        a: 1,
      };
    }
    return color;
  }

  function colorPairs(slide) {
    const sampleSelector = ".ls-title, .ls-eyebrow, .ls-subtitle, .ls-slide__footer, .ls-stat__value, .ls-stat__label, .ls-surface__kicker, .ls-chart__label, .ls-chart__value, .ls-layout__heading, .ls-layout__note, .ls-badge, " + bodyTextSelector;
    const pairs = [];
    const seen = new Set();
    for (const element of slide.querySelectorAll(sampleSelector)) {
      if (!textLengthOf(element)) continue;
      const style = getComputedStyle(element);
      const fg = parseColor(style.color);
      if (!fg) continue;
      const bg = compositeChain(element, slide);
      const key = [selectorFor(element), Math.round(fg.r), Math.round(bg.r)].join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      pairs.push({
        selector: selectorFor(element),
        fontSize: round(parseFloat(style.fontSize)),
        fontWeight: style.fontWeight,
        color: [fg.r, fg.g, fg.b],
        background: [bg.r, bg.g, bg.b],
      });
    }
    return pairs.slice(0, 24);
  }

  const overflowCandidates = [...document.querySelectorAll("body, [data-ls-deck], .ls-slide, .ls-slide *")]
    .map(overflowFor)
    .filter(Boolean);

  return JSON.stringify({
    url: location.href,
    viewport: { width: innerWidth, height: innerHeight },
    deck: deck
      ? {
          ready: deck.dataset.lsReady || null,
          export: deck.dataset.lsExport || null,
          transition: deck.dataset.lsTransition || null,
          motion: deck.dataset.lsMotion || null,
          currentSlide: deck.dataset.lsCurrentSlide || null,
          currentStep: deck.dataset.lsCurrentStep || null,
          rect: deck.getBoundingClientRect().toJSON(),
        }
      : null,
    nativeSlide: {
      width: rootStyles.getPropertyValue("--ls-slide-width").trim(),
      height: rootStyles.getPropertyValue("--ls-slide-height").trim(),
      scale: rootStyles.getPropertyValue("--ls-scale").trim(),
    },
    slides: slides.map((slide, index) => {
      const slideRect = slide.getBoundingClientRect();
      const collected = slideRect.height > 1 && slideRect.width > 1;
      const scale = collected ? slideRect.width / nativeWidth : 1;
      const inner = slide.querySelector(".ls-slide__inner");
      const header = slide.querySelector("header");
      const title = slide.querySelector(".ls-title");
      const body = slide.querySelector(".ls-slide__body");
      const kind = slideKind(slide);
      const innerRect = rectFor(inner, slideRect, scale);
      const headerRect = rectFor(header, slideRect, scale);
      const titleRect = rectFor(title, slideRect, scale);
      const bodyRect = rectFor(body, slideRect, scale);
      // Headers sit at the inner's content box, not its border box: the inner
      // spans the slide and positions content via padding-block.
      const innerPaddingTop = inner ? parseFloat(getComputedStyle(inner).paddingTop) || 0 : 0;
      const expectedHeaderOffsetTop =
        innerRect === null ? null : innerRect.offsetTop + innerPaddingTop;
      return {
        index: index + 1,
        id: slide.id || null,
        label: slide.getAttribute("aria-label") || null,
        active: slide.dataset.active || null,
        step: slide.dataset.lsStep || null,
        density: slide.dataset.lsDensity || null,
        slideKind: slide.dataset.lsSlideKind || null,
        ...kind,
        collected,
        hasSlideFill: Boolean(slide.querySelector(".ls-slide-fill")),
        hasCenter: Boolean(slide.querySelector(".ls-center")),
        hasCenterStart: Boolean(slide.querySelector(".ls-center-start")),
        centerInFill: hasInFill(slide, ".ls-center"),
        centerStartInFill: hasInFill(slide, ".ls-center-start"),
        rect: normalizedRect(slideRect, scale),
        innerRect,
        headerRect,
        titleRect,
        bodyRect,
        innerOffsetTop: innerRect?.offsetTop ?? null,
        expectedHeaderOffsetTop,
        headerOffsetTop: headerRect?.offsetTop ?? null,
        titleOffsetTop: titleRect?.offsetTop ?? null,
        bodyOffsetTop: bodyRect?.offsetTop ?? null,
        scrollWidth: slide.scrollWidth,
        scrollHeight: slide.scrollHeight,
        clientWidth: slide.clientWidth,
        clientHeight: slide.clientHeight,
        textLength: textLengthOf(slide),
        archetype: slide.dataset.lsArchetype || null,
        motion: slide.dataset.lsMotion || null,
        stepCount: slide.querySelectorAll("[data-step]").length,
        iconCount: slide.querySelectorAll('use[href^="#ls-i-"]').length,
        titleFontSize:
          collected && title ? round(parseFloat(getComputedStyle(title).fontSize)) : null,
        minBodyFontSize: collected ? minBodyFontSize(slide) : null,
        colorPairs: collected ? colorPairs(slide) : [],
        containers: collected ? containerMetrics(slide, slideRect, scale) : [],
        grids: collected ? gridMetrics(slide, scale) : [],
      };
    }),
    overflowCandidates,
  }, null, 2);
})()
`;
}
