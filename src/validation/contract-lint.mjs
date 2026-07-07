import { slideSegments, startTagRecords, stripNonRenderedCode } from "../shared/html.mjs";

// Content-contract lint: slides marked data-ls-archetype are checked against
// their archetype's slot counts and word ranges. Advisory with precise hints —
// contracts constrain the CONTENT (the structural fix for ragged unequal
// boxes), and agents are good at writing to spec once the spec is visible.
//
// Count constraints are measured from start tags; word/char constraints from
// leaf text elements (inline markup stripped). The slot → selector mapping is
// versioned with the archetypes it describes.
export const ARCHETYPE_SLOTS = {
  "title-hero": {
    title: { className: "ls-title", text: true },
    subtitle: { className: "ls-subtitle", text: true },
    badges: { className: "ls-badge", text: true },
    figure: { className: "ls-figure" },
  },
  statement: {
    claim: { className: "ls-statement__text", text: true },
    support: { className: "ls-statement__support", text: true },
  },
  "process-flow": {
    steps: { className: "ls-flow__step" },
    stepTitle: { className: "ls-flow__title", text: true },
    stepBody: { className: "ls-flow__text", text: true },
  },
  comparison: {
    columns: { className: "ls-layout__region" },
    columnHeading: { className: "ls-layout__heading", text: true },
    verdict: { className: "ls-surface--row" },
  },
  section: {
    number: { className: "ls-stat__value", text: true },
    title: { className: "ls-statement__text", text: true },
    progressHint: { className: "ls-stat__label", text: true },
  },
  "big-stat": {
    stats: { className: "ls-stat" },
    statValue: { className: "ls-stat__value", text: true },
    statLabel: { className: "ls-stat__label", text: true },
    context: { className: "ls-layout__text", text: true },
  },
  evidence: {
    quote: { className: "ls-quote__text", text: true },
    attribution: { className: "ls-quote__source", text: true },
    proof: { className: "ls-quote__evidence" },
  },
  walkthrough: {
    code: { className: "ls-code" },
    annotations: { className: "ls-list__text", text: true },
  },
  dashboard: {
    tiles: { className: "ls-surface|ls-stat|ls-chart|ls-table" },
    tileTitle: { className: "ls-surface__title|ls-chart__title", text: true },
  },
};

function countMatches(tags, mapping) {
  if (mapping.tagName) return tags.filter((tag) => tag.name === mapping.tagName).length;
  const names = mapping.className.split("|");
  return tags.filter((tag) => {
    const classes = String(tag.attributes.get("class") || "").split(/\s+/);
    return names.some((name) => classes.includes(name));
  }).length;
}

// Text of leaf-ish elements carrying the given class. Matches to the first
// same-name closing tag, which is exact for the text elements contracts
// constrain (they contain only inline markup).
function textsByClass(html, classNames) {
  const texts = [];
  for (const className of classNames.split("|")) {
    const pattern = new RegExp(
      `<([a-z][a-z0-9-]*)\\b[^>]*class=(?:"[^"]*\\b${className}\\b[^"]*"|'[^']*\\b${className}\\b[^']*')[^>]*>([\\s\\S]*?)</\\1>`,
      "gi",
    );
    for (const match of html.matchAll(pattern)) {
      // Inline tags strip to nothing so "218<em>ms</em>" measures 5 chars;
      // source whitespace between elements still separates words.
      texts.push(
        match[2]
          .replace(/<[^>]*>/g, "")
          .replace(/\s+/g, " ")
          .trim(),
      );
    }
  }
  return texts;
}

function wordCount(text) {
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
}

export function validateContracts({ html, registryData, warnings }) {
  if (!registryData) return;
  for (const [index, segment] of slideSegments(html).entries()) {
    if (segment.attributes.get("data-ls-lint") === "off") continue;
    const archetype = segment.attributes.get("data-ls-archetype");
    if (!archetype) continue;
    const item = registryData.byName.get(`archetypes/${archetype}`);
    const slots = ARCHETYPE_SLOTS[archetype];
    if (!item?.contract || !slots) {
      if (!item)
        warnings.push({
          code: "contract_unknown_archetype",
          slide: index + 1,
          message: `Slide ${index + 1} declares data-ls-archetype="${archetype}", which is not a registry archetype.`,
          hint: "Run slidesls catalog --type archetype --json for the archetype list.",
        });
      continue;
    }

    const rendered = stripNonRenderedCode(segment.html);
    const tags = startTagRecords(rendered);
    for (const [slot, constraints] of Object.entries(item.contract)) {
      const mapping = slots[slot];
      if (!mapping) continue;
      const count = countMatches(tags, mapping);

      if (constraints.min !== undefined && count < constraints.min)
        warnings.push({
          code: "contract_slot_count",
          slide: index + 1,
          message: `Slide ${index + 1} (${archetype}): ${slot} has ${count} item(s); the contract asks for at least ${constraints.min}.`,
          hint: constraints.description || `Add ${slot} content or switch archetypes.`,
        });
      if (constraints.max !== undefined && count > constraints.max)
        warnings.push({
          code: "contract_slot_count",
          slide: index + 1,
          message: `Slide ${index + 1} (${archetype}): ${slot} has ${count} item(s); the contract caps it at ${constraints.max}.`,
          hint: constraints.description || `Trim ${slot} or split the slide.`,
        });

      if (!mapping.text) continue;
      for (const text of textsByClass(rendered, mapping.className)) {
        const words = wordCount(text);
        if (constraints.maxWords !== undefined && words > constraints.maxWords)
          warnings.push({
            code: "contract_copy_length",
            slide: index + 1,
            message: `Slide ${index + 1} (${archetype}): ${slot} runs ${words} words; the contract caps it at ${constraints.maxWords} ("${text.slice(0, 60)}…").`,
            hint: "Cut the copy to the contract instead of shrinking type.",
          });
        if (constraints.minWords !== undefined && words > 0 && words < constraints.minWords)
          warnings.push({
            code: "contract_copy_length",
            slide: index + 1,
            message: `Slide ${index + 1} (${archetype}): ${slot} runs ${words} words; the contract asks for at least ${constraints.minWords}.`,
            hint: "One-word fragments read as filler; give the slot a real sentence.",
          });
        if (constraints.maxChars !== undefined && text.length > constraints.maxChars)
          warnings.push({
            code: "contract_copy_length",
            slide: index + 1,
            message: `Slide ${index + 1} (${archetype}): ${slot} runs ${text.length} characters; the contract caps it at ${constraints.maxChars}.`,
            hint: "Shorten the value; display slots are sized for short strings.",
          });
      }
    }
  }
}
