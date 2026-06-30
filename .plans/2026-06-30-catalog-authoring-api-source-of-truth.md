# Plan: Make catalog the source of truth for agent authoring APIs

## Summary

Make `slidesls catalog --json` the fast, authoritative option map for agents. It should expose not only registry items, but each item’s public authoring API: classes, class groups/modifiers, data attributes and allowed values, CSS variables/tokens, theme/font attributes, load guidance, and short usage rules.

`inspect` remains the deep-dive command for snippets and READMEs, but agents should not need to inspect CSS or long docs just to know which classes/options are valid.

This directly addresses the recent failure mode: examples used `ls-grid--4`, but that layout class was not implemented or advertised, and validation did not catch it.

## Confirmed requirements and assumptions

- `catalog` must be the source of truth for agents to quickly detect usable building blocks, layouts, themes, core classes, and component APIs.
- Agents should be able to run `slidesls catalog --recommended --json` and see supported public APIs without digging through docs/CSS.
- Registry metadata should define intentional public APIs, not generated/parsing-derived internals.
- Generated decks remain plain HTML/CSS/JS and dependency-free.
- `inspect` remains useful for snippets/README detail, but is not the first place agents must go for class discovery.
- Avoid a huge Tailwind-like utility surface; add only high-signal layout utilities.
- Unknown `ls-*` classes in user decks should warn by default, but repo examples should fail CI when they use unknown public classes.

## Current-state findings

### What works today

- `catalog --json` lists registry items and common item metadata.
- `inspect --json` returns dependency load tags and snippets.
- Registry items already expose some useful metadata:
  - `rootClass`
  - `safeAnywhere`
  - `snippets`
  - `themeAttribute`
  - `pairsWith`
  - `useCases`
- `generate-catalog` creates the skill catalog from metadata.

### Current gap

`catalog` answers “what registry items exist?” but not “what can I use in HTML right now?”

Example: `utilities/layout` exists, but `catalog` does not list:

- `ls-grid`
- `ls-grid--2`
- `ls-grid--3`
- `ls-grid--wide-left`
- `ls-grid--wide-right`
- `ls-stack--sm`
- `ls-stack--lg`
- `ls-fill`, `ls-center`, etc.

Agents can therefore invent classes such as `ls-grid--4`. Today that silently no-ops if unsupported.

### Relevant files

- `src/cli/commands.mjs`
  - `catalogCommand`
  - `inspectCommand`
  - `validateCommand`
  - `validateClassDependencies`
- `src/registry/source.mjs`
  - `summarizeItem()` allowlist controls exposed JSON metadata.
- `src/registry/catalog-doc.mjs`
  - generated skill catalog output.
- `src/shared/html.mjs`
  - existing HTML attribute parsing helpers.
- `src/validation/examples.mjs`
  - repo example validation.
- `src/validation/registry.mjs`
  - registry metadata validation.
- `schemas/registry-item.schema.json`
- `registry/**/registry-item.json`
- `skills/slidesls/references/catalog.md`

## Chosen strategy

Add explicit `authoring` metadata to registry items and surface it through:

- `catalog --json`
- `inspect --json`
- generated skill catalog docs
- validation logic

Use metadata, not CSS parsing, as the main source of truth because metadata:

- exposes intentional public API only;
- avoids leaking internal selectors;
- works for themes, fonts, templates, data attributes, and tokens;
- gives agents compact, stable options;
- can drive validation.

## Metadata model

Use structured `authoring` metadata. Do **not** rely only on a flat class list, because the project uses BEM-style classes and modifiers heavily.

Recommended v1 shape:

```json
{
  "authoring": {
    "classGroups": [
      {
        "base": "ls-grid",
        "modifiers": [
          "ls-grid--2",
          "ls-grid--3",
          "ls-grid--4",
          "ls-grid--wide-left",
          "ls-grid--wide-right"
        ],
        "rule": "Use ls-grid with at most one layout modifier."
      },
      {
        "base": "ls-stack",
        "modifiers": ["ls-stack--sm", "ls-stack--lg"]
      }
    ],
    "classes": ["ls-center", "ls-fill", "ls-frame"],
    "dataAttributes": [
      {
        "name": "data-ls-tone",
        "values": ["success", "warning", "danger"]
      }
    ],
    "cssVariables": ["--ls-grid-gap", "--ls-stack-gap"],
    "attributes": [
      {
        "name": "data-ls-theme",
        "scope": "html",
        "value": "executive-blue"
      }
    ],
    "usage": ["Use only listed modifiers; unknown ls-* modifiers are validation warnings."]
  }
}
```

### Field semantics

- `classGroups`: BEM/base class plus public element/modifier classes.
  - `base`: root/base class.
  - `elements`: optional BEM element classes such as `ls-card__title`.
  - `modifiers`: optional modifier classes such as `ls-panel--muted`.
  - `rule`: short guidance for agents.
- `classes`: public standalone classes not naturally tied to a group.
- `dataAttributes`: structured attributes, with known values when enumerable.
- `cssVariables`: intended customization knobs.
- `attributes`: important attribute snippets, especially themes/fonts.
- `usage`: short rules/guidance.

### Why not just `classes: []`?

A flat class list works technically, but is worse for this project because:

- BEM classes become noisy and drift-prone.
- Modifiers lose their relationship to base classes.
- Validation cannot easily express “this modifier belongs to this base.”
- Agents get less semantic guidance.

Use `classGroups` as v1, plus `classes` for standalone utilities.

## Implementation phases

## Phase 0 — Immediate layout bug fix: `.ls-grid--4`

This should be small and can be implemented before the full metadata work.

Likely files:

- `registry/utilities/layout/layout.css`
- `registry/utilities/layout/README.md`
- `registry/utilities/layout/registry-item.json` once authoring metadata exists
- `examples/pi-coding-agent-*` only if additional layout adjustment is needed
- tests/validation

Tasks:

1. Add `.ls-grid--4` to layout utilities:

```css
.ls-grid--4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
```

2. Include it in responsive collapse rules.
3. Verify the Pi example slide no longer stacks into one column.
4. Document that `.ls-grid--4` is for short/compact cards/metrics only.
5. Add/adjust tests so `.ls-grid--4` is recognized as valid once metadata validation exists.

Rationale:

- Four-card rows are common in decks.
- The examples already need it.
- This bug should not wait for the whole authoring API project.

## Phase 1 — Schema and contract for `authoring`

Likely files:

- `schemas/registry-item.schema.json`
- `docs/registry-contract.md`
- `skills/slidesls/references/registry-contract.md`

Tasks:

1. Add optional `authoring` to the schema.
2. Make `authoring` strict enough to catch typos:
   - `additionalProperties: false` inside `authoring`.
3. Add typed substructures:
   - `classGroups`
   - `classes`
   - `dataAttributes`
   - `cssVariables`
   - `attributes`
   - `usage`
4. Keep top-level registry item `additionalProperties: true` if current flexibility is still desired.
5. Document that `authoring` is the public agent-facing API contract.
6. Document that agents should use classes/data attributes from `authoring` or returned snippets; do not invent `ls-*` classes.

## Phase 2 — Surface authoring API through `catalog` and `inspect`

Likely files:

- `src/registry/source.mjs`
- `src/cli/commands.mjs`
- tests in `tests/cli-output.test.mjs` or new tests

Tasks:

1. Extend `summarizeItem()` to include `authoring`.
2. Because both `catalog` and `inspect` flow through `summarizeItem()`, this likely covers both commands with one allowlist update.
3. `catalog --json` should always include `authoring` when present.
4. `inspect --json` should include the same `authoring` plus snippets/load/readme.
5. Keep text `catalog` compact by default.
6. Optional later/human UX: add `catalog --api` for text output. Do not make this required for agent JSON.

Tests:

- `catalog --json --type utility` exposes `authoring` for `utilities/layout`.
- `inspect utilities/layout --json` exposes the same `authoring`.
- `catalog --type preset --tag theme --json` exposes theme attribute guidance.

## Phase 3 — Add authoring metadata to registry items

Likely files:

- `registry/core/base/registry-item.json`
- `registry/utilities/layout/registry-item.json`
- all `registry/components/*/registry-item.json`
- all `registry/animations/*/registry-item.json`
- `registry/presets/fonts/*/registry-item.json`
- `registry/presets/themes/*/registry-item.json`
- `registry/templates/*/registry-item.json`

Tasks:

### 3.1 Layout utilities first

Add metadata for:

- `ls-stack`
  - `ls-stack--sm`
  - `ls-stack--lg`
- `ls-cluster`
- `ls-grid`
  - `ls-grid--2`
  - `ls-grid--3`
  - `ls-grid--4` if added
  - `ls-grid--wide-left`
  - `ls-grid--wide-right`
- `ls-center`
- `ls-fill`
- `ls-frame`

CSS variables:

- `--ls-stack-gap`
- `--ls-cluster-gap`
- `--ls-cluster-align`
- `--ls-grid-gap`
- `--ls-frame-min-block-size`

Usage rules:

- Use `ls-grid` with at most one grid modifier.
- Use `ls-fill` only when the item should intentionally fill the available slide/body area.
- Keep `.ls-grid--4` content short.

### 3.2 Core/base shell

Add metadata for:

- `ls-page`
- `ls-deck`
- `ls-slide`
- `ls-slide__inner`
- `ls-slide__header`
- `ls-slide__body`
- `ls-eyebrow`
- `ls-title`
- `ls-subtitle`
- `ls-muted`
- `ls-subtle`
- `ls-accent-text`

Data attributes:

- `data-ls-deck`
- `data-step`
- `data-ls-reveal-sequence`
- `data-ls-sequence-skip`

Important runtime-written attributes can be documented as runtime state, not author-authored options:

- `data-ls-ready`
- `data-ls-export`
- `data-active`
- `data-ls-step`
- `data-ls-reveal-state`

### 3.3 Components

For each component, add:

- root class group
- BEM element classes
- modifier classes
- data attributes and allowed values
- CSS variables exposed for customization

Examples:

- `components/card`
  - group `ls-card`
  - elements `ls-card__body`, `ls-card__title`, `ls-card__text`
  - modifier `ls-card--row`
- `components/panel`
  - group `ls-panel`
  - elements `ls-panel__title`, `ls-panel__text`
  - modifiers `ls-panel--muted`, `ls-panel--accent`
  - CSS vars `--ls-panel-gap`, `--ls-panel-padding`, `--ls-panel-border`, `--ls-panel-bg`
- `components/progress`
  - group `ls-progress`
  - elements `ls-progress__label`, `ls-progress__value`, `ls-progress__track`, `ls-progress__bar`
  - data attrs `data-ls-tone: success|warning|danger`, `data-ls-density: compact|spacious`, `data-ls-animate: fill`
  - CSS vars `--ls-progress-value`, `--ls-progress-thickness`, `--ls-progress-label-size`
- `components/table`
  - group `ls-table`
  - elements `ls-table__caption`, `ls-table__value`, `ls-table__muted`, `ls-table__note`
  - wrapper `ls-table-frame`
  - data attrs `data-ls-density: compact`, `data-ls-variant: striped|plain`

### 3.4 Presets

Themes:

- `attributes`: `data-ls-theme="<theme>"`, scope `html`.
- `usage`: use exactly one theme per deck.
- `cssVariables`: only if useful; otherwise rely on theme metadata and contract docs.

Fonts:

- `attributes`: `data-ls-font="<font>"`, scope `body` or `section`.
- `usage`: font presets can be deck-wide or scoped.

### 3.5 Templates

Templates should expose:

- primary structure/classes used in snippets;
- registry dependencies already define needed assets;
- usage guidance like “paste snippet into `.ls-deck`”.

Avoid duplicating the full snippet in `authoring`; snippets remain in `inspect`.

## Phase 4 — Registry validation for authoring metadata

Likely files:

- `src/validation/registry.mjs`
- tests for validation

Tasks:

1. Validate `authoring` shape beyond JSON schema if needed.
2. Validate `authoring.classes`, `classGroups[].base`, `elements`, and `modifiers` are strings beginning with `ls-` where applicable.
3. Validate `dataAttributes[].name` begins with `data-`.
4. Validate known values are arrays of strings.
5. Optional local-only consistency check:
   - If an item has CSS files, public classes in `authoring` should appear in either CSS, snippets, or docs.
   - Skip or degrade gracefully in remote registry mode.
6. Do **not** rely only on CSS parsing for completeness; CSS may contain internal selectors and cannot distinguish public/private reliably.

Important nuance:

- The staleness guard should not pretend to prove completeness of public CSS API. The stronger backstop is validating examples/templates against metadata.

## Phase 5 — Class extraction and validation for decks/examples

Likely files:

- `src/shared/html.mjs`
- `src/cli/commands.mjs`
- `src/validation/examples.mjs`
- maybe new `src/validation/authoring-api.mjs`
- tests in `tests/html-validation.test.mjs`

Tasks:

1. Add a helper to enumerate actual class tokens from HTML class attributes only.
   - Do **not** regex the whole HTML string.
   - Avoid false positives from `data-ls-theme`, `data-ls-tone`, etc.
2. Decide code-demo behavior:
   - If a class appears as escaped text inside `<code>` or `<pre>`, it should not be treated as a real class.
   - Extract only from parsed tag attributes, not text content; this naturally avoids code-demo false positives.
3. Build known public class set from registry `authoring` metadata:
   - class groups base/elements/modifiers
   - standalone classes
4. In `slidesls validate`:
   - unknown `ls-*` class => warning by default
   - unknown `ls-*` class => error in `--strict`
   - keep removed `ls-layout-*` as hard error
5. In `validate-examples`:
   - unknown `ls-*` class => error, because repo examples are CI-gated and should never ship unsupported classes.
6. Keep user custom class escape hatch simple:
   - document that project/user custom classes should avoid the `ls-` prefix unless they are part of the slidesls public API.

Tests:

- `data-ls-theme`, `data-ls-tone`, and `data-ls-variant` do not trigger unknown class warnings.
- Literal code samples containing `ls-grid--4` as text do not trigger warnings.
- Real class typo `ls-grdi` warns in normal validate and errors in strict.
- Repo examples fail validation if they contain unsupported `ls-*` classes.
- Normal snippets/examples validate cleanly.

## Phase 6 — Improve generated agent catalog

Likely files:

- `src/registry/catalog-doc.mjs`
- `skills/slidesls/references/catalog.md`
- `tests/catalog-doc.test.mjs`

Tasks:

1. Add concise authoring sections per item:

```md
- Classes: ls-grid, ls-grid--2, ls-grid--3, ls-grid--4, ls-grid--wide-left, ls-grid--wide-right
- Data attributes: none
- CSS variables: --ls-grid-gap, --ls-stack-gap
- Usage: Use one grid modifier per ls-grid.
```

2. For grouped classes, render compactly:

```md
- Class groups:
  - ls-grid: ls-grid--2, ls-grid--3, ls-grid--4, ls-grid--wide-left, ls-grid--wide-right
  - ls-stack: ls-stack--sm, ls-stack--lg
```

3. Regenerate catalog with:

```sh
node bin/slidesls.mjs generate-catalog --registry-root .
```

4. Ensure `pnpm validate:skills` passes.

## Phase 7 — Docs and skill workflow

Likely files:

- `README.md`
- `docs/cli.md`
- `docs/registry-contract.md`
- `skills/slidesls/SKILL.md`
- `skills/slidesls/references/deck-authoring.md`
- `skills/slidesls/references/copy-workflow.md`

Tasks:

1. Make the agent workflow explicit:
   - Run `slidesls catalog --recommended --json` first.
   - Use only classes/data attributes listed in `authoring` or copied from returned snippets.
   - Use `inspect` when full snippet HTML or README details are needed.
   - Run `slidesls validate --json` after editing.
2. Document that `catalog` is the quick source of truth.
3. Document that `inspect` is the deep source for snippets and item README guidance.
4. Update layout utility docs with all supported grid/stack/fill options.
5. Warn agents not to invent `ls-*` classes/modifiers.

## Phase 8 — Example cleanup and layout QA

Likely files:

- `examples/pi-coding-agent-*`
- maybe `examples/theme-gallery/*`
- `examples/README.md`

Tasks:

1. If `.ls-grid--4` is added, keep the Pi examples using it and verify slide 2 no longer overflows.
2. If `.ls-grid--4` is not added, replace with supported layout classes.
3. Address the table-frame stretch separately if desired:
   - example-level alignment, or
   - add a small utility such as `.ls-self-start` / `.ls-fit-content` and expose it through `authoring`.
4. Add `validate-examples` checks for unknown classes so future example mistakes fail CI.
5. Optional: add a browser-based visual/layout smoke script later. Keep it outside mandatory `pnpm check` unless it is stable and dependency-light.

## Utility classes to consider adding

### Recommended now

- `.ls-grid--4`
  - common for compact cards/metrics;
  - needed by current Pi examples;
  - add responsive collapse.

### Consider if solving table stretch ergonomics now

- `.ls-self-start`
  - `align-self: start;`
  - useful for tables/code/media that should not stretch inside the slide body row.
- `.ls-fit-content`
  - similar intent; name may be less obvious than `ls-self-start`.

### Defer unless repeated need emerges

- large sets of gap utilities (`ls-gap-sm`, etc.)
- many alignment variants
- auto-fit responsive grids
- Tailwind-like utility expansion

## Testing and verification plan

Run after implementation:

```sh
pnpm lint
pnpm fmt:check
pnpm test
pnpm validate:registry
pnpm validate:skills
pnpm validate:examples
pnpm cli:smoke
pnpm check
```

Targeted tests:

- `catalog --json` includes `authoring` for layout, core, components, themes.
- `inspect --json` includes `authoring`.
- Generated catalog includes class groups/data attributes/CSS variable summaries.
- Registry validation catches malformed `authoring` metadata.
- `validate` catches unknown real `ls-*` classes from class attributes.
- `validate` does not false-positive on `data-ls-theme`, `data-ls-tone`, `data-ls-variant`.
- Code/pre text containing class-looking strings does not trigger class validation.
- `validate-examples` errors on unsupported `ls-*` classes.
- Examples contain only known public `ls-*` classes.
- If `.ls-grid--4` is added, it appears in CSS, metadata, docs, generated catalog, and validates.

## Backward compatibility

- Existing registry item fields remain.
- `authoring` is additive JSON metadata.
- Text `catalog` can remain unchanged unless adding optional `--api`.
- User decks with unknown `ls-*` classes get warnings by default, not failures.
- `--strict` can fail unknown `ls-*` classes.
- Repo examples should fail hard on unknown `ls-*` classes.

## Risks and mitigations

### Risk: Metadata becomes stale

Mitigation:

- Validate metadata shape.
- Validate repo examples/templates against known public classes.
- Optionally check metadata-listed classes appear in CSS/snippets/docs for local registry mode.
- Keep metadata public-only and concise.

### Risk: Catalog JSON becomes too large

Mitigation:

- Keep `authoring.examples` short or omit it from most items.
- Do not embed full snippets in `catalog`; snippets remain in `inspect`.
- If needed later, add a compact mode, but default rich JSON is best for agents.

### Risk: Unknown-class validation false positives

Mitigation:

- Extract only from `class` attributes, not whole HTML text.
- Check only `ls-*` namespace.
- Warn by default for user decks; error only in strict and repo examples.

### Risk: Utility bloat

Mitigation:

- Add `.ls-grid--4` because there is concrete demand.
- Add alignment utilities only if they solve a repeated deck-authoring issue.
- Prefer CSS variables for one-off spacing/density customization.

## Claude review notes incorporated

Claude reviewed the draft plan and raised several important points, now incorporated:

- Validation must enumerate class tokens from `class` attributes only; whole-HTML regex would false-positive on `data-ls-*` attributes.
- Code/pre text examples containing class names should not be flagged.
- `classGroups` should be v1, not a later refinement, because BEM/modifier structure is central to this codebase.
- `validate` and `validate-examples` need different severities: warning/strict for user decks, hard error for repo examples.
- `.ls-grid--4` should be treated as an immediate bug fix, independent of the metadata epic.
- Metadata staleness checks cannot fully prove public API completeness from CSS; example validation is the stronger backstop.
- Keep typo suggestions out of v1.

## Open questions

No blocking open questions.

Recommended decisions:

1. Add `.ls-grid--4` immediately.
2. Add structured `authoring` metadata with `classGroups` as v1.
3. Include `authoring` in `catalog --json` by default.
4. Validate unknown real `ls-*` class attributes: warning by default, strict error, hard error in repo examples.
5. Keep full snippets in `inspect`; keep `catalog` rich but not bloated.
