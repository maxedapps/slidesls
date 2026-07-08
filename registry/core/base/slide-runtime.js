const deck = document.querySelector("[data-ls-deck]");

const interactiveSelector = "input, textarea, select, button, a, [contenteditable='true']";
const transitionKinds = new Set(["fade", "rise", "slide", "none"]);
const staggerContainerSelector =
  ".ls-grid, .ls-stack, .ls-cluster, .ls-layout, .ls-hero-media, .ls-hero-copy, [data-ls-stagger]";
const maxStaggerUnits = 12;

function isExportMode() {
  const parameters = new URLSearchParams(window.location.search);
  return parameters.get("export") === "1" || parameters.get("export") === "pdf";
}

function prefersReducedMotion() {
  return typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;
}

function getSlides() {
  return deck ? [...deck.querySelectorAll(".ls-slide")] : [];
}

function getSteppedElements(slide) {
  return [...slide.querySelectorAll("[data-step]")];
}

function parseStep(element) {
  const value = Number.parseInt(element.dataset.step || "0", 10);
  return Number.isFinite(value) ? value : 0;
}

function assignRevealSequences(root = document) {
  for (const group of root.querySelectorAll("[data-ls-reveal-sequence]")) {
    const revealChildren = [...group.children].filter(
      (child) =>
        child.classList.contains("ls-reveal") && !child.hasAttribute("data-ls-sequence-skip"),
    );

    for (const [index, child] of revealChildren.entries()) {
      if (!child.hasAttribute("data-step")) {
        child.dataset.step = String(index + 1);
      }
    }
  }
}

// Normative stagger traversal: direct children of the slide body (falling back
// to the inner wrapper for hero/section slides without a body) in DOM order;
// a layout/utility container or [data-ls-stagger] contributes its children as
// units instead of itself (one level, no deeper recursion). Stepped elements
// are excluded — steps own their reveal. Units past the cap share the last
// index so long lists do not crawl in forever.
function assignStaggerUnits(slide) {
  if (slide.dataset.lsMotion === "none") return;
  const root = slide.querySelector(".ls-slide__body") || slide.querySelector(".ls-slide__inner");
  if (!root) return;
  const units = [];
  for (const child of root.children) {
    if (child.matches(staggerContainerSelector)) {
      units.push(...child.children);
    } else {
      units.push(child);
    }
  }
  let index = 0;
  for (const unit of units) {
    if (unit.hasAttribute("data-step")) continue;
    unit.dataset.lsEnter = "";
    unit.style.setProperty("--ls-enter-index", String(Math.min(index, maxStaggerUnits - 1)));
    index += 1;
  }
}

function getMaxStep(slide) {
  const revealSteps = getSteppedElements(slide).map(parseStep);

  return Math.max(0, ...revealSteps);
}

function parseHashState(hash) {
  const rawHash = String(hash || "").replace(/^#/, "");
  const parameters = new URLSearchParams(rawHash);
  const slide = Number.parseInt(parameters.get("slide") || "", 10);
  const step = Number.parseInt(parameters.get("step") || "", 10);

  return {
    slide: Number.isFinite(slide) ? slide : 1,
    step: Number.isFinite(step) ? step : 0,
  };
}

function formatHashState(index, step) {
  return `#slide=${index + 1}&step=${step}`;
}

function clampState(state, slides) {
  const slideCount = slides.length;
  if (slideCount === 0) return { index: 0, step: 0 };

  const requestedSlide = Number.isFinite(state?.slide) ? Math.trunc(state.slide) : 1;
  const requestedStep = Number.isFinite(state?.step) ? Math.trunc(state.step) : 0;
  const index = Math.min(Math.max(requestedSlide - 1, 0), slideCount - 1);
  const maxStep = getMaxStep(slides[index]);
  const step = Math.min(Math.max(requestedStep, 0), maxStep);

  return { index, step };
}

function updateRevealState(slide, currentStep, exportMode = false) {
  for (const element of getSteppedElements(slide)) {
    if (exportMode) {
      element.dataset.lsRevealState = "past";
      continue;
    }

    const elementStep = parseStep(element);

    if (elementStep > currentStep) {
      element.dataset.lsRevealState = "future";
    } else if (elementStep === currentStep) {
      element.dataset.lsRevealState = "current";
    } else {
      element.dataset.lsRevealState = "past";
    }
  }
}

function updateScale() {
  if (!deck || deck.dataset.lsExport === "true") {
    return;
  }

  const width = Number.parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue("--ls-slide-width"),
  );
  const height = Number.parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue("--ls-slide-height"),
  );
  const margin = 32;
  const scale = Math.min(
    (window.innerWidth - margin) / width,
    (window.innerHeight - margin) / height,
    1,
  );

  deck.style.setProperty("--ls-scale", Math.max(scale, 0.1).toString());
}

function setSlideState(slides, activeIndex, step) {
  for (const [index, slide] of slides.entries()) {
    const isActive = index === activeIndex;
    slide.dataset.active = isActive ? "true" : "false";
    slide.setAttribute("aria-hidden", isActive ? "false" : "true");

    if (isActive) {
      slide.removeAttribute("inert");
      slide.dataset.lsStep = String(step);
      updateRevealState(slide, step);
    } else {
      slide.setAttribute("inert", "");
      // A leaving slide keeps its step and reveal states while its exit
      // animation plays (future content must stay hidden mid-flight); the
      // transition settle handler resets it once it is display:none again.
      if (slide.dataset.lsTransit !== "out") {
        slide.dataset.lsStep = "0";
        updateRevealState(slide, 0);
      }
    }
  }

  deck.dataset.lsCurrentSlide = String(activeIndex + 1);
  deck.dataset.lsCurrentStep = String(step);
}

function updateHash(index, step) {
  const nextHash = formatHashState(index, step);
  if (window.location.hash === nextHash) return;

  const nextUrl = `${window.location.pathname}${window.location.search}${nextHash}`;
  window.history.replaceState(window.history.state, "", nextUrl);
}

function shouldIgnoreKey(event) {
  return event.target instanceof Element && Boolean(event.target.closest(interactiveSelector));
}

// The author attribute wins over the style's token default; motion-off and
// reduced-motion collapse every kind to none.
function currentTransitionKind() {
  if (deck.dataset.lsMotion === "none" || prefersReducedMotion()) return "none";
  return declaredTransitionKind();
}

function declaredTransitionKind() {
  if (transitionKinds.has(deck.dataset.lsTransition)) return deck.dataset.lsTransition;
  const token = getComputedStyle(deck).getPropertyValue("--ls-transition-kind").trim();
  return transitionKinds.has(token) ? token : "fade";
}

function motionValue(name, fallback) {
  const raw = getComputedStyle(deck).getPropertyValue(name).trim();
  if (!raw) return fallback;
  const value = Number.parseFloat(raw);
  if (!Number.isFinite(value)) return fallback;
  return raw.endsWith("ms") || !raw.endsWith("s") ? value : value * 1000;
}

function transitionFrames(kind, forward, distance) {
  if (kind === "rise") {
    return {
      out: [
        { opacity: 1, translate: "0 0" },
        { opacity: 0, translate: `0 ${-Math.round(distance / 2)}px` },
      ],
      in: [
        { opacity: 0, translate: `0 ${distance}px` },
        { opacity: 1, translate: "0 0" },
      ],
    };
  }
  if (kind === "slide") {
    const exit = forward ? -distance : distance;
    const enter = forward ? distance : -distance;
    return {
      out: [
        { opacity: 1, translate: "0 0" },
        { opacity: 0, translate: `${exit}px 0` },
      ],
      in: [
        { opacity: 0, translate: `${enter}px 0` },
        { opacity: 1, translate: "0 0" },
      ],
    };
  }
  return {
    out: [{ opacity: 1 }, { opacity: 0 }],
    in: [{ opacity: 0 }, { opacity: 1 }],
  };
}

function initializeDeck() {
  if (!deck) {
    return;
  }

  assignRevealSequences(deck);

  const slides = getSlides();
  if (slides.length === 0) {
    return;
  }

  const exportMode = isExportMode();
  const motionEnabled = deck.dataset.lsMotion !== "none" && !exportMode;
  let activeIndex = 0;
  let currentStep = exportMode ? getMaxStep(slides[0]) : 0;
  // Exactly one WAAPI pair runs at a time: a new navigation mid-flight
  // finishes the running pair (both animations jump to their end state, the
  // leaving slide returns to display:none) before the next pair starts, so
  // arbitrary key-spam can never strand a slide mid-transition.
  let activeTransition = null;

  deck.dataset.lsSlideCount = String(slides.length);
  for (const [index, slide] of slides.entries()) {
    slide.dataset.lsSlideIndex = String(index + 1);
    for (const element of slide.querySelectorAll("[data-ls-page-number]")) {
      element.textContent = String(index + 1);
    }
    if (motionEnabled) assignStaggerUnits(slide);
  }

  // Choreography rule: a translating slide transition (rise/slide) degrades
  // the child stagger to opacity-only so motion never doubles up.
  if (motionEnabled && ["rise", "slide"].includes(declaredTransitionKind())) {
    deck.dataset.lsStaggerMode = "fade";
  }

  function finishActiveTransition() {
    if (!activeTransition) return;
    const transition = activeTransition;
    activeTransition = null;
    transition.finish();
  }

  function startSlideTransition(fromSlide, toSlide, forward) {
    const slideOptsOut =
      fromSlide.dataset.lsMotion === "none" || toSlide.dataset.lsMotion === "none";
    const kind = slideOptsOut ? "none" : currentTransitionKind();
    if (kind === "none" || typeof fromSlide.animate !== "function") {
      delete fromSlide.dataset.lsTransit;
      fromSlide.dataset.lsStep = "0";
      updateRevealState(fromSlide, 0);
      return;
    }
    const options = {
      duration: motionValue("--ls-transition-duration", 460),
      easing: getComputedStyle(deck).getPropertyValue("--ls-transition-ease").trim() || "ease",
      fill: "both",
    };
    const frames = transitionFrames(kind, forward, motionValue("--ls-transition-distance", 96));
    const animations = [
      fromSlide.animate(frames.out, options),
      toSlide.animate(frames.in, options),
    ];
    let settled = false;
    const transition = {};
    // The settle handler owns the display bookkeeping (removing
    // data-ls-transit re-hides the leaving slide), so CSS never races JS.
    const settle = () => {
      if (settled) return;
      settled = true;
      if (activeTransition === transition) activeTransition = null;
      delete fromSlide.dataset.lsTransit;
      fromSlide.dataset.lsStep = "0";
      updateRevealState(fromSlide, 0);
      for (const animation of animations) animation.cancel();
    };
    transition.finish = () => {
      if (settled) return;
      for (const animation of animations) {
        try {
          animation.finish();
        } catch {
          // finish() only throws for infinite animations; ours are finite.
        }
      }
      settle();
    };
    animations[1].onfinish = settle;
    activeTransition = transition;
  }

  function applyState(nextState, options = {}) {
    const state = clampState(nextState, slides);
    const previousIndex = activeIndex;
    activeIndex = state.index;
    currentStep = state.step;

    finishActiveTransition();
    const animate = Boolean(options.animate) && motionEnabled && previousIndex !== activeIndex;
    if (options.animate && motionEnabled) deck.dataset.lsNavigated = "true";
    if (animate) slides[previousIndex].dataset.lsTransit = "out";
    setSlideState(slides, activeIndex, currentStep);
    if (animate) {
      startSlideTransition(slides[previousIndex], slides[activeIndex], activeIndex > previousIndex);
    }

    if (options.updateHash) {
      updateHash(activeIndex, currentStep);
    }
  }

  deck.dataset.lsReady = "true";
  deck.dataset.lsExport = exportMode ? "true" : "false";
  deck.setAttribute("tabindex", "-1");

  if (exportMode) {
    for (const slide of slides) {
      slide.dataset.active = "true";
      slide.dataset.lsStep = String(getMaxStep(slide));
      slide.setAttribute("aria-hidden", "false");
      slide.removeAttribute("inert");
      updateRevealState(slide, getMaxStep(slide), true);
    }
  } else {
    updateScale();
    applyState(parseHashState(window.location.hash), { updateHash: window.location.hash !== "" });
    window.addEventListener("hashchange", () =>
      applyState(parseHashState(window.location.hash), { updateHash: true, animate: true }),
    );
  }

  window.addEventListener("resize", updateScale);

  document.addEventListener("keydown", (event) => {
    if (exportMode || shouldIgnoreKey(event)) {
      return;
    }

    const activeSlide = slides[activeIndex];
    const maxStep = getMaxStep(activeSlide);

    if (event.key === "ArrowRight" || event.key === " ") {
      event.preventDefault();
      if (currentStep < maxStep) {
        applyState(
          { slide: activeIndex + 1, step: currentStep + 1 },
          { updateHash: true, animate: true },
        );
      } else if (activeIndex < slides.length - 1) {
        applyState({ slide: activeIndex + 2, step: 0 }, { updateHash: true, animate: true });
      }
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      if (currentStep > 0) {
        applyState(
          { slide: activeIndex + 1, step: currentStep - 1 },
          { updateHash: true, animate: true },
        );
      } else if (activeIndex > 0) {
        const previousIndex = activeIndex - 1;
        applyState(
          { slide: previousIndex + 1, step: getMaxStep(slides[previousIndex]) },
          { updateHash: true, animate: true },
        );
      }
    }

    if (event.key === "Home") {
      event.preventDefault();
      applyState({ slide: 1, step: 0 }, { updateHash: true, animate: true });
    }

    if (event.key === "End") {
      event.preventDefault();
      const lastIndex = slides.length - 1;
      applyState(
        { slide: lastIndex + 1, step: getMaxStep(slides[lastIndex]) },
        { updateHash: true, animate: true },
      );
    }
  });

  document.dispatchEvent(
    new CustomEvent("slidesls:ready", {
      detail: {
        deck,
        slideCount: slides.length,
        exportMode,
      },
    }),
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeDeck, { once: true });
} else {
  initializeDeck();
}
