const deck = document.querySelector("[data-ls-deck]");

const interactiveSelector = "input, textarea, select, button, a, [contenteditable='true']";

function isExportMode() {
  const parameters = new URLSearchParams(window.location.search);
  return parameters.get("export") === "1" || parameters.get("export") === "pdf";
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

function getMaxStep(slide) {
  const revealSteps = getSteppedElements(slide).map(parseStep);

  return Math.max(0, ...revealSteps);
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
      slide.dataset.lsStep = "0";
      updateRevealState(slide, 0);
    }
  }

  deck.dataset.lsCurrentSlide = String(activeIndex + 1);
  deck.dataset.lsCurrentStep = String(step);
}

function shouldIgnoreKey(event) {
  return Boolean(event.target.closest(interactiveSelector));
}

function initializeLucide() {
  if (window.lucide?.createIcons) {
    window.lucide.createIcons();
  }
}

function initializeDeck() {
  if (!deck) {
    return;
  }

  initializeLucide();
  assignRevealSequences(deck);

  const slides = getSlides();
  if (slides.length === 0) {
    return;
  }

  const exportMode = isExportMode();
  let activeIndex = 0;
  let currentStep = exportMode ? getMaxStep(slides[0]) : 0;

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
    setSlideState(slides, activeIndex, currentStep);
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
        currentStep += 1;
      } else if (activeIndex < slides.length - 1) {
        activeIndex += 1;
        currentStep = 0;
      }
      setSlideState(slides, activeIndex, currentStep);
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      if (currentStep > 0) {
        currentStep -= 1;
      } else if (activeIndex > 0) {
        activeIndex -= 1;
        currentStep = getMaxStep(slides[activeIndex]);
      }
      setSlideState(slides, activeIndex, currentStep);
    }

    if (event.key === "Home") {
      event.preventDefault();
      activeIndex = 0;
      currentStep = 0;
      setSlideState(slides, activeIndex, currentStep);
    }

    if (event.key === "End") {
      event.preventDefault();
      activeIndex = slides.length - 1;
      currentStep = getMaxStep(slides[activeIndex]);
      setSlideState(slides, activeIndex, currentStep);
    }
  });

  document.dispatchEvent(
    new CustomEvent("ls-slides:ready", {
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
