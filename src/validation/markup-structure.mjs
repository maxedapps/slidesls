import { slideSegments, startTagRecords, stripNonRenderedCode } from "../shared/html.mjs";

const revealTransformVariants = ["ls-reveal-fade", "ls-reveal-slide-up", "ls-reveal-scale-in"];
const slideKinds = new Set(["content", "hero", "section"]);

function classList(attributes) {
  return String(attributes.get("class") || "")
    .split(/\s+/)
    .filter(Boolean);
}

function hasClass(attributes, className) {
  return classList(attributes).includes(className);
}

function push(list, code, message, details = {}) {
  list.push({ code, message, ...details });
}

function isCustomProgress(tag) {
  return tag.name !== "progress" && hasClass(tag.attributes, "ls-progress");
}

function segmentHasClass(html, className) {
  return new RegExp(`\\bclass=["'][^"']*\\b${className}\\b`, "i").test(html);
}

function validateSlideKinds({ html, strict, errors, warnings }) {
  for (const segment of slideSegments(html)) {
    const kind = segment.attributes.get("data-ls-slide-kind");
    const hasSlideFill = segmentHasClass(segment.html, "ls-slide-fill");
    const hasCenter = segmentHasClass(segment.html, "ls-center");
    const hasCenterStart = segmentHasClass(segment.html, "ls-center-start");
    if (kind && !slideKinds.has(kind))
      deckIssue({
        strict,
        errors,
        warnings,
        code: "invalid_slide_kind",
        message: `data-ls-slide-kind must be content, hero, or section (received ${kind}).`,
        hint: 'Use data-ls-slide-kind="content", "hero", or "section" on .ls-slide.',
      });
    if (kind === "content" && hasSlideFill)
      deckIssue({
        strict,
        errors,
        warnings,
        code: "content_slide_full_height_layout",
        message: "Content slides should not use full-slide ls-slide-fill layouts.",
        hint: 'Use .ls-slide__header plus body layout, or mark the slide data-ls-slide-kind="hero"/"section" if it is intentionally centered.',
      });
    if (!kind && hasSlideFill && (hasCenter || hasCenterStart))
      deckIssue({
        strict,
        errors,
        warnings,
        code: "missing_slide_kind",
        message: "Full-slide centered layouts should declare data-ls-slide-kind.",
        hint: 'Add data-ls-slide-kind="hero" or "section" for intentional centered slides, or "content" for ordinary content slides.',
      });
  }
}

export function validateSnippetStructure({ html, sourcePath, errors }) {
  const tags = startTagRecords(html);
  if (tags.some(isCustomProgress)) {
    if (!html.includes("ls-progress__track") || !html.includes("ls-progress__bar"))
      push(
        errors,
        "invalid_progress_structure",
        `${sourcePath} custom .ls-progress markup must include .ls-progress__track and .ls-progress__bar.`,
      );
  }

  if (html.includes("ls-quote")) {
    if (!html.includes("ls-quote__text") || !html.includes("ls-quote__source"))
      push(
        errors,
        "invalid_quote_structure",
        `${sourcePath} .ls-quote markup must include .ls-quote__text and .ls-quote__source.`,
      );
  }
}

function deckIssue({ strict, errors, warnings, code, message, hint }) {
  const entry = { code, message, ...(hint ? { hint } : {}) };
  if (strict) errors.push(entry);
  else warnings.push(entry);
}

export function validateDeckStructure({ html, strict = false, errors, warnings }) {
  const renderedHtml = stripNonRenderedCode(html);
  const tags = startTagRecords(renderedHtml);
  validateSlideKinds({ html: renderedHtml, strict, errors, warnings });
  if (tags.some(isCustomProgress)) {
    const progressCount = tags.filter(isCustomProgress).length;
    const trackCount = tags.filter((tag) => hasClass(tag.attributes, "ls-progress__track")).length;
    const barCount = tags.filter((tag) => hasClass(tag.attributes, "ls-progress__bar")).length;
    if (trackCount < progressCount || barCount < progressCount)
      deckIssue({
        strict,
        errors,
        warnings,
        code: "progress_structure",
        message:
          "Custom .ls-progress markup should include .ls-progress__track and .ls-progress__bar for each progress component.",
        hint: 'Use the components/progress snippet or native <progress class="ls-progress">.',
      });
  }

  for (const tag of tags) {
    const classes = classList(tag.attributes);
    if (classes.includes("ls-reveal-highlight") && !classes.includes("ls-reveal"))
      deckIssue({
        strict,
        errors,
        warnings,
        code: "reveal_highlight_without_reveal",
        message:
          ".ls-reveal-highlight should be combined with .ls-reveal for reveal-timed highlight behavior.",
        hint: "Use .ls-highlight for static emphasis, or .ls-reveal.ls-reveal-highlight with data-step.",
      });

    const variants = classes.filter((className) => revealTransformVariants.includes(className));
    if (variants.length && !classes.includes("ls-reveal"))
      deckIssue({
        strict,
        errors,
        warnings,
        code: "reveal_variant_without_reveal",
        message: `Reveal variant classes require .ls-reveal (${variants.join(", ")}).`,
        hint: "Use .ls-reveal plus exactly one transform variant and data-step or data-ls-reveal-sequence.",
      });
    if (variants.length > 1)
      deckIssue({
        strict,
        errors,
        warnings,
        code: "multiple_reveal_transform_variants",
        message: `Use at most one reveal transform variant per element (${variants.join(", ")}).`,
        hint: "Choose one of ls-reveal-fade, ls-reveal-slide-up, or ls-reveal-scale-in.",
      });
  }

  for (const match of html.matchAll(/<code\b[^>]*>([\s\S]*?)<\/code>/gi)) {
    const text = match[1].replace(/<[^>]*>/g, "");
    const lines = text.split(/\r?\n/).length;
    if (lines > 18 || text.length > 1800) {
      warnings.push({
        code: "large_code_block",
        message: "A code block is large enough to require visual fit review.",
        hint: 'Shorten the excerpt, split it, or use data-ls-density="dense" / code sizing variables after previewing.',
      });
      break;
    }
  }
}
