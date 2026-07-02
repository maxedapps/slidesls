#!/usr/bin/env node

import { stdout } from "node:process";

const help = `Usage:
  node scripts/visual-qa-report.mjs --eval

Prints a dependency-free browser evaluation payload for agent-browser:
  node scripts/visual-qa-report.mjs --eval | agent-browser eval --stdin

The payload returns JSON with deck dimensions, active slide state, and overflow/fit candidates.
`;

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  stdout.write(help);
  process.exit(0);
}

if (!process.argv.includes("--eval")) {
  stdout.write(help);
  process.exit(1);
}

stdout.write(String.raw`(() => {
  const deck = document.querySelector("[data-ls-deck]");
  const rootStyles = getComputedStyle(document.documentElement);
  const slides = [...document.querySelectorAll(".ls-slide")];
  const intentionalScrollSelector =
    ".ls-table-frame, pre, .ls-code-block pre, .ls-terminal__body, .ls-code-diff__body";

  function selectorFor(element) {
    if (element.id) return "#" + element.id;
    const classes = [...element.classList].slice(0, 4).map((name) => "." + name).join("");
    return element.localName + classes;
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
    slides: slides.map((slide, index) => ({
      index: index + 1,
      id: slide.id || null,
      active: slide.dataset.active || null,
      step: slide.dataset.lsStep || null,
      density: slide.dataset.lsDensity || null,
      rect: slide.getBoundingClientRect().toJSON(),
      scrollWidth: slide.scrollWidth,
      scrollHeight: slide.scrollHeight,
      clientWidth: slide.clientWidth,
      clientHeight: slide.clientHeight,
    })),
    overflowCandidates,
  }, null, 2);
})()
`);
