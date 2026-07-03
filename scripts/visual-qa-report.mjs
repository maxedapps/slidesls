#!/usr/bin/env node

import { stdin, stdout } from "node:process";
import { analyzeVisualRhythm } from "../src/validation/visual-rhythm.mjs";

const help = `Usage:
  node scripts/visual-qa-report.mjs --eval
  node scripts/visual-qa-report.mjs --analyze < collected.json

Prints a dependency-free browser evaluation payload for agent-browser, or analyzes
collected JSON for advisory visual rhythm warnings.
`;

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  stdout.write(help);
  process.exit(0);
}

if (process.argv.includes("--analyze")) {
  const input = await readStdin();
  const payload = JSON.parse(input || "{}");
  stdout.write(`${JSON.stringify(analyzeVisualRhythm(payload), null, 2)}\n`);
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

  function rectFor(element, slideRect) {
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    return {
      ...rect.toJSON(),
      offsetTop: rect.top - slideRect.top,
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
    slides: slides.map((slide, index) => {
      const slideRect = slide.getBoundingClientRect();
      const inner = slide.querySelector(".ls-slide__inner");
      const header = slide.querySelector("header");
      const title = slide.querySelector(".ls-title");
      const body = slide.querySelector(".ls-slide__body");
      const kind = slideKind(slide);
      const innerRect = rectFor(inner, slideRect);
      const headerRect = rectFor(header, slideRect);
      const titleRect = rectFor(title, slideRect);
      const bodyRect = rectFor(body, slideRect);
      return {
        index: index + 1,
        id: slide.id || null,
        active: slide.dataset.active || null,
        step: slide.dataset.lsStep || null,
        density: slide.dataset.lsDensity || null,
        slideKind: slide.dataset.lsSlideKind || null,
        ...kind,
        hasSlideFill: Boolean(slide.querySelector(".ls-slide-fill")),
        hasCenter: Boolean(slide.querySelector(".ls-center")),
        hasCenterStart: Boolean(slide.querySelector(".ls-center-start")),
        centerInFill: hasInFill(slide, ".ls-center"),
        centerStartInFill: hasInFill(slide, ".ls-center-start"),
        rect: slideRect.toJSON(),
        innerRect,
        headerRect,
        titleRect,
        bodyRect,
        innerOffsetTop: innerRect?.offsetTop ?? null,
        headerOffsetTop: headerRect?.offsetTop ?? null,
        titleOffsetTop: titleRect?.offsetTop ?? null,
        bodyOffsetTop: bodyRect?.offsetTop ?? null,
        scrollWidth: slide.scrollWidth,
        scrollHeight: slide.scrollHeight,
        clientWidth: slide.clientWidth,
        clientHeight: slide.clientHeight,
      };
    }),
    overflowCandidates,
  }, null, 2);
})()
`);

function readStdin() {
  return new Promise((resolve, reject) => {
    let data = "";
    stdin.setEncoding("utf8");
    stdin.on("data", (chunk) => {
      data += chunk;
    });
    stdin.on("end", () => resolve(data));
    stdin.on("error", reject);
  });
}
