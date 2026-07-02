import { hasClass, startTagRecords, stripNonRenderedCode } from "../shared/html.mjs";

function classes(attributes) {
  return String(attributes.get("class") || "")
    .split(/\s+/)
    .filter(Boolean);
}

function textWithoutTags(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const strictErrorCodes = new Set(["image_missing_alt", "control_accessible_name"]);

function add({ strict, errors, warnings, code, message, hint }) {
  const entry = { code, message, ...(hint ? { hint } : {}) };
  if (strict && strictErrorCodes.has(code)) errors.push(entry);
  else warnings.push(entry);
}

export function validateAccessibility({ html, strict = false, errors, warnings }) {
  const renderedHtml = stripNonRenderedCode(html);
  const tags = startTagRecords(renderedHtml);
  const deck = tags.find((tag) => hasClass(tag.attributes, "ls-deck"));
  if (deck && !hasAccessibleName(deck.attributes))
    add({
      strict,
      errors,
      warnings,
      code: "deck_accessible_name",
      message: ".ls-deck should have aria-label or aria-labelledby.",
    });

  for (const img of tags.filter((tag) => tag.name === "img")) {
    if (
      !img.attributes.has("alt") &&
      img.attributes.get("role") !== "presentation" &&
      img.attributes.get("aria-hidden") !== "true"
    )
      add({
        strict,
        errors,
        warnings,
        code: "image_missing_alt",
        message:
          'Images need alt text, alt="" for decorative images, or aria-hidden/role=presentation.',
      });
  }

  const labels = new Map();
  const slides = slideFragments(renderedHtml);
  for (const slide of slides) {
    const attrs = slide.attributes;
    const label = attrs.get("aria-label") || attrs.get("aria-labelledby");
    if (!label && !/<h[1-6]\b/i.test(slide.html))
      add({
        strict,
        errors,
        warnings,
        code: "slide_accessible_name",
        message: ".ls-slide should have aria-label/aria-labelledby or a clear heading.",
      });
    if (label) labels.set(label, (labels.get(label) || 0) + 1);
  }
  for (const [label, count] of labels) {
    if (count > 1)
      add({
        strict,
        errors,
        warnings,
        code: "duplicate_slide_label",
        message: `Duplicate slide accessible label: ${label}`,
      });
  }

  for (const button of buttonFragments(renderedHtml)) {
    if (!hasAccessibleName(button.attributes) && !textWithoutTags(button.html))
      add({
        strict,
        errors,
        warnings,
        code: "control_accessible_name",
        message: "Icon-only controls need an accessible name.",
      });
  }
}

function hasAccessibleName(attributes) {
  return Boolean(
    attributes.get("aria-label") || attributes.get("aria-labelledby") || attributes.get("title"),
  );
}

function slideFragments(html) {
  const fragments = [];
  const pattern = /<section\b([^>]*)>([\s\S]*?)<\/section>/gi;
  let match;
  while ((match = pattern.exec(html))) {
    const tag = startTagRecords(match[0], "section")[0];
    if (tag && classes(tag.attributes).includes("ls-slide"))
      fragments.push({ attributes: tag.attributes, html: match[2] });
  }
  return fragments;
}

function buttonFragments(html) {
  const fragments = [];
  const pattern = /<button\b([^>]*)>([\s\S]*?)<\/button>/gi;
  let match;
  while ((match = pattern.exec(html))) {
    const tag = startTagRecords(match[0], "button")[0];
    if (tag) fragments.push({ attributes: tag.attributes, html: match[2] });
  }
  return fragments;
}
