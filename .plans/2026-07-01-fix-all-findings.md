# Plan: Fix all `FINDINGS.md` issues in slidesls

## Summary

Fix the Eve-triggered registry breakages by making official snippets safe, clarifying slide-shell composition, removing misleading layout behavior, and adding targeted validation for the exact classes of failures discovered in `FINDINGS.md`.

The plan intentionally avoids mandatory browser/framework dependencies and keeps generated decks vanilla HTML/CSS/JS, as required by `PROJECT.md`.

Reviewed with Claude CLI. Changes after review:

- Do **not** blanket-remap `.ls-slide__inner > .ls-fill`; add a dedicated `.ls-slide-fill` instead.
- Do **not** “activate” container queries with a misleading slide-wide container; remove or redesign dead `@container` rules deliberately.
- Do **not** add a broad structural schema DSL now; use canonical snippets plus small targeted validators.
- Prefer removing unsupported progress docs values over adding no-op API values.
- Remove `:has()` where simple explicit selectors/modifiers are cleaner.
- Pin density to scoped token/variable overrides, not vague guidance.

## Requirements and assumptions

- Address all 44 findings in `FINDINGS.md`.
- Do not implement fixes until this plan is accepted.
- Do not add mandatory runtime dependencies to generated decks.
- Keep registry items copyable and editable.
- Keep browser/snapshot workflows optional for the package; use preview/browser checks during implementation.
- Registry snippets must become trustworthy source-of-truth markup for agents.
- Static validation should catch the known broken structures where feasible.

## Evidence gathered

Local files inspected included:

- `FINDINGS.md`, `PROJECT.md`
- registry core/layout/component/template/theme/font/animation files
- examples under `examples/**/*.html`
- validation code: `src/validation/registry.mjs`, `src/validation/examples.mjs`, `src/validation/authoring-api.mjs`
- CLI validation: `src/cli/commands.mjs`
- schemas/docs/skill/tests

Baseline commands:

- `pnpm test` passes.
- `pnpm validate:registry` passes despite broken snippets.
- `pnpm validate:examples` currently checks only 7 example `index.html` files and misses nested theme pages.
- A dependency-closure check confirms undeclared snippet class owners only for:
  - `utilities/layout` snippet → `components/panel`
  - `components/image-card` snippet → `components/panel`

External CSS docs checked:

- MDN: size-based `@container` requires a declared query container.
- MDN: `:has()` is modern-browser baseline, but explicit selectors/modifiers avoid the support question entirely.

## Implementation strategy

Fix source-of-truth markup first, then validation.

1. Repair primitives and snippets that caused the Eve breakages.
2. Update templates/examples/catalog/docs to match canonical patterns.
3. Add narrow validation for the discovered failure classes.
4. Add density/content-budget support without overexpanding public API.
5. Use preview/browser inspection as implementation verification, but keep it optional outside the package.

## Phase 1 — Slide shell and layout primitives

### 1. Add explicit full-slide layout primitive

Files:

- `registry/utilities/layout/layout.css`
- `registry/utilities/layout/README.md`
- `registry/utilities/layout/registry-item.json`
- `registry/core/base/README.md`
- templates/examples/docs using `.ls-fill`

Tasks:

- Add `.ls-slide-fill` as the explicit direct child for full-slide content under `.ls-slide__inner`:
  - `grid-row: 1 / -1`
  - `min-block-size: 0`
  - `block-size: 100%`
- Keep `.ls-fill` as a generic sizing helper; do **not** make all direct `.ls-fill` children span the slide shell because that could overlap header/body layouts.
- Update `title-hero`, `section-divider`, and affected examples to use `.ls-slide-fill`.
- Document two safe models:
  - header/body: `.ls-slide__header` + `.ls-slide__body`
  - full-slide: `.ls-slide__inner > .ls-slide-fill`

Findings: 1, 2, 5, 29, 35.

### 2. Resolve dead container-query rules

Files:

- `registry/utilities/layout/layout.css`
- `registry/utilities/layout/README.md`
- `registry/utilities/layout/registry-item.json`
- tests for registry/source validation

Tasks:

- Do **not** just add `container-type` to `.ls-slide__inner`; standard slides are fixed at 1600px and transform-scaled, so those rules would still never help normal decks.
- Remove the current misleading `@container` grid-collapse rules unless a meaningful query container/wrapper is introduced.
- Prefer explicit compact recipes and content-budget guidance for `.ls-grid--4` instead of false responsive behavior.
- Add a registry validation/test guard: no `@container` rules in registry CSS unless the same item or a documented dependency declares a relevant `container`/`container-type` contract.

Findings: 3, 12, 38.

### 3. Replace title-hero inline alignment with utilities

Files:

- `registry/utilities/layout/layout.css`
- `registry/utilities/layout/registry-item.json`
- `registry/templates/title-hero/snippet.html`
- examples using copied title-hero pattern

Tasks:

- Add small alignment utilities, e.g. `.ls-center-start` and `.ls-text-start`.
- Use them instead of `style="text-align: left; place-items: center start"`.

Findings: 33.

## Phase 2 — Broken component contracts

### 4. Timeline canonical markup

Files:

- `registry/components/timeline/timeline.css`
- `registry/components/timeline/snippets/basic.html`
- `registry/components/timeline/README.md`
- `registry/components/timeline/registry-item.json`

Tasks:

- Update snippet to canonical marker/body structure:
  - `.ls-timeline__marker`
  - new `.ls-timeline__body`
  - `.ls-timeline__title`
  - `.ls-timeline__text`
  - optional `.ls-timeline__meta`
- Add `.ls-timeline__body` to CSS/metadata.
- Make progress mode work with the canonical structure.
- Do not support raw markerless `strong/span` shorthand unless an explicit future modifier is added.

Findings: 6, 19, 20.

### 5. Progress canonical markup and API consistency

Files:

- `registry/components/progress/progress.css`
- `registry/components/progress/snippets/basic.html`
- `registry/components/progress/README.md`
- `registry/components/progress/registry-item.json`
- `registry/templates/metric-dashboard/snippet.html`
- `registry/templates/metric-dashboard/registry-item.json`
- `examples/template-gallery/index.html`

Tasks:

- Replace label-only snippet/template/gallery progress with accessible custom markup including:
  - `.ls-progress__label`
  - `.ls-progress__value`
  - `.ls-progress__track`
  - `.ls-progress__bar`
  - `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- Remove unsupported docs values:
  - no documented `data-ls-density="comfortable"` unless CSS/metadata actually implement it
  - no documented `data-ls-tone="accent"`; default accent is represented by omitting `data-ls-tone`
- Keep metadata/CSS/docs aligned.

Findings: 14, 15, 16, 30, 37.

### 6. Quote canonical markup

Files:

- `registry/components/quote/quote.css`
- `registry/components/quote/snippets/basic.html`
- `registry/components/quote/README.md`
- `registry/components/quote/registry-item.json`

Tasks:

- Update snippet to use `.ls-quote__text` and `.ls-quote__source`.
- Replace `.ls-quote:has(cite) cite` with direct `.ls-quote__source cite` styling.
- Include `<cite>` in the snippet if semantic citation remains part of the intended pattern.

Findings: 17, 18.

### 7. Card/callout snippets and `:has()` removal

Files:

- `registry/components/card/snippets/basic.html`
- `registry/components/callout/callout.css`
- `registry/components/callout/snippets/basic.html`
- card/callout READMEs and metadata

Tasks:

- Card: add `.ls-card__body` to snippet or explicitly document raw direct title/text as supported. Prefer canonical wrapper.
- Callout: add `.ls-callout__body` to snippet.
- Replace `:has()` icon detection with an explicit modifier such as `.ls-callout--with-icon`.
- Add the modifier to metadata/docs if introduced.

Findings: 6, 7.

### 8. Panel center/frame variants

Files:

- `registry/components/panel/panel.css`
- `registry/components/panel/README.md`
- `registry/components/panel/registry-item.json`
- title/visual templates and examples

Tasks:

- Add `.ls-panel--center` and optionally `.ls-panel--frame`.
- Use these variants in templates where a visual panel must center content.

Findings: 9.

### 9. Snippet dependency cleanup

Files:

- `registry/utilities/layout/snippets/basic.html`
- `registry/components/image-card/snippets/basic.html`
- corresponding `registry-item.json` files

Tasks:

- Prefer self-contained snippets:
  - remove `.ls-panel` classes from `utilities/layout` snippet
  - remove `.ls-panel` classes from `image-card` media placeholder because `.ls-image-card__media` already styles the visual placeholder
- If panel styling is intentionally retained, declare `components/panel` as a dependency; do not leave implicit dependencies.

Findings: 11, 44.

### 10. Code block overflow guidance/API

Files:

- `registry/components/code-block/code-block.css`
- `registry/components/code-block/README.md`
- `registry/components/code-block/registry-item.json`

Tasks:

- Keep current scroll behavior only if clearly documented as not presentation/PDF-safe.
- Add or strengthen dense/fit recipes via existing variables:
  - `data-ls-density="dense"`
  - `--ls-code-font-size`
  - `--ls-code-max-block-size`
- Add soft validation warning only for obviously large code blocks; avoid pretending regex line counts are exact visual fit checks.

Findings: 10.

### 11. Table frame default

Files:

- `registry/components/table/table.css`
- `registry/components/table/README.md`
- metadata if a modifier is added

Tasks:

- Add `align-self: start` to `.ls-table-frame` so it does not misleadingly stretch inside grid/fill contexts.
- Document a separate opt-in fill mode only if needed later.

Findings: 21.

### 12. Metric dashboard spacing

Files:

- `registry/templates/metric-dashboard/snippet.html`
- `registry/templates/metric-dashboard/registry-item.json`
- possibly `registry/components/metric/*`

Tasks:

- Remove double boxing where metrics are already card-like.
- Prefer standalone `.ls-metric` cards in the grid and a matching panel/card wrapper only where progress needs a surface.
- If visual parity requires it, add a minimal plain/compact metric variant instead of nesting full cards inside full panels.

Findings: 34.

## Phase 3 — Density, content budgets, themes, fonts

### 13. Scoped density tokens and component variables

Files:

- `registry/core/base/tokens.css`
- `registry/core/base/slide.css`
- component CSS/metadata/docs for card, panel, callout, metric, image-card, table/code where relevant

Tasks:

- Implement density by scoped custom-property overrides, not vague guidance:
  - e.g. `.ls-slide[data-ls-density="compact"] { --ls-text-2xl: ...; --ls-text-xl: ...; --ls-space-6: ...; }`
  - slide padding should use variables such as `--ls-slide-padding-block` / `--ls-slide-padding-inline` instead of fixed literals.
- Add component-local variables for title/text size and padding where fixed optimistic sizes currently cause overflow.
- Keep default rendering unchanged where possible.
- Add compact examples/content budgets for 3-card and 4-card layouts.

Findings: 4, 8, 31, 36, 38.

### 14. Serif-safe title metrics

Files:

- `registry/core/base/slide.css`
- `registry/presets/fonts/editorial-serif/font.css`
- `registry/presets/fonts/editorial-serif/README.md`

Tasks:

- Make `.ls-title` line-height/letter-spacing adjustable via variables.
- In `editorial-serif`, set safer title metrics, e.g. less aggressive letter spacing and serif-appropriate line-height.
- Avoid global surprise downsizing unless verified visually.

Findings: 26.

### 15. Theme and font docs alignment

Files:

- `registry/presets/fonts/*/registry-item.json`
- `registry/presets/fonts/README.md`
- `registry/presets/themes/README.md`
- theme READMEs
- `docs/registry-contract.md`
- skill docs

Tasks:

- Align `data-ls-font` scope. Prefer `html, body, or section` because CSS selectors and existing docs already allow/use `html`.
- Keep themes as visual token presets, not automatic density systems.
- Strengthen theme guidance: avoid overriding `--ls-slide-bg-image` / slide backgrounds with heavy gradients unless explicitly requested.
- Recommend density choices alongside themes rather than encoding density inside themes.

Findings: 25, 27, 28.

## Phase 4 — Animations and docs cleanup

### 16. Reveal variant composition

Files:

- `registry/animations/*/README.md`
- animation metadata
- `skills/slidesls/references/deck-authoring.md`
- deck validation tests/code

Tasks:

- Document: use `.ls-reveal` plus at most one transform variant (`fade`, `slide-up`, `scale-in`).
- Add static deck validation warning for incompatible reveal variant combinations on one element.

Findings: 22, 24.

### 17. Highlight reveal semantics

Files:

- `registry/animations/highlight/highlight.css`
- `registry/animations/highlight/README.md`
- metadata/docs/tests

Tasks:

- Keep `.ls-highlight` as static emphasis.
- Require `.ls-reveal ls-reveal-highlight` for reveal-timed highlight behavior.
- Add validation warning when `.ls-reveal-highlight` is used with reveal steps but without `.ls-reveal`.

Findings: 23.

### 18. Remove generic copied docs

Files:

- `registry/components/divider/README.md`
- `registry/animations/highlight/README.md`
- `registry/animations/scale-in/README.md`

Tasks:

- Remove divider’s unrelated animation sentence.
- Standardize animation load-order wording.

Findings: 13, 24.

## Phase 5 — Templates and examples

### 19. Update all templates

Files:

- all `registry/templates/*/snippet.html`
- all template metadata/docs

Tasks:

- Use `.ls-slide-fill` for title/section full-slide layouts.
- Use new alignment utilities in title hero.
- Use canonical progress/timeline/card/callout/quote structures wherever relevant.
- Add concise `authoring.usage` content-budget notes using existing metadata fields; do not add a schema DSL yet.

Findings: 29, 30, 31, 32, 33, 34.

### 20. Update examples and add stress coverage

Files:

- `examples/project-intro/index.html`
- `examples/template-gallery/index.html`
- `examples/theme-gallery/*.html`
- `examples/pi-coding-agent-*/index.html`
- optionally `examples/stress-gallery/index.html`
- `examples/README.md`

Tasks:

- Replace old `.ls-fill` full-slide pattern.
- Replace broken progress markup.
- Add realistic stress example(s): longer titles, 3–4 cards, timeline, table, progress, citations, serif font.
- Ensure examples demonstrate compact/dense recipes where needed.

Findings: 35, 36, 37, 38.

## Phase 6 — Targeted validation hardening

### 21. Snippet dependency closure validation

Files:

- `src/validation/registry.mjs`
- `src/validation/authoring-api.mjs` if helpers are needed
- tests

Tasks:

- For each snippet, collect `ls-*` classes.
- Map class owners with the existing authoring class index.
- Fail registry validation if a snippet uses a class owned by neither the item nor its resolved dependency closure.
- Land this together with snippet dependency cleanup so CI does not fail mid-change.

Findings: 40, 43, 44.

### 22. Targeted structural validation, not a schema DSL

Files:

- `src/validation/registry.mjs`
- `src/cli/commands.mjs` or a new small validation module
- `src/shared/html.mjs` if tag/class helpers are useful
- tests

Tasks:

Registry-source errors for official snippets:

- custom `.ls-progress` must contain track/bar unless native `<progress>` is used.
- `.ls-timeline__item` must use canonical marker/body structure.
- `.ls-quote` snippets must contain text/source classes.

Deck-level warnings by default, strict errors with `--strict` where appropriate:

- custom `.ls-progress` without track/bar.
- raw timeline `strong/span` marker-column pattern.
- `.ls-reveal-highlight` with reveal step but no `.ls-reveal`.
- multiple reveal transform variants.
- very large code blocks as a soft “review visual fit” hint.

Do not add `authoring.structure` / `contentBudget` schema fields yet unless they directly drive validation. Use existing `authoring.usage` for prose guidance.

Findings: 10, 19, 20, 22, 23, 39, 40, 43.

### 23. Recursive example validation

Files:

- `src/validation/examples.mjs`
- tests

Tasks:

- Recursively collect all `examples/**/*.html`.
- Keep deterministic sorting and report the true checked count.
- Add a test proving nested theme-gallery pages are validated.

Findings: 41.

### 24. Guard against dead container-query regressions

Files:

- `src/validation/registry.mjs` or tests

Tasks:

- Add a registry test that fails if an item contains `@container` without a declared/documented query container contract.
- This prevents recurrence of the inactive layout fallback issue.

Findings: 3, 12.

## Phase 7 — Docs, skill workflow, catalog

### 25. Stronger visual review workflow

Files:

- `skills/slidesls/SKILL.md`
- `skills/slidesls/references/preview-validation.md`
- `src/cli/agent-instructions.mjs`
- `docs/validation.md`
- `README.md`
- tests for CLI/skill output

Tasks:

- Change guidance from “preview when needed” to: after creating or materially editing slides, run preview and visually inspect representative slides unless the user opts out.
- Representative slides: title/section, densest content, table/timeline/progress/code slides.
- Update validate success text/agent instructions to say static validation does not replace preview.
- Keep browser automation optional.

Findings: 42.

### 26. Regenerate catalog and update docs

Files:

- `skills/slidesls/references/catalog.md`
- `docs/registry-contract.md`
- `docs/validation.md`
- `docs/cli.md`
- item READMEs

Tasks:

- Run `node bin/slidesls.mjs generate-catalog --registry-root .`.
- Ensure catalog reflects new classes, modifiers, dependencies, snippets, and usage guidance.
- Remove unsafe “snippets are source of truth” tension by fixing snippets before regenerating.

Findings: 32, 39, 42, 43.

## Verification plan

Automated:

```sh
pnpm test
pnpm validate:registry
pnpm validate:skills
pnpm validate:examples
pnpm check
```

New/updated tests:

- Full-slide templates use `.ls-slide-fill`, not the old ambiguous direct `.ls-fill` pattern.
- No registry `@container` rules exist without a declared/documented container contract.
- Registry validation fails old broken progress/timeline/quote snippet shapes.
- Registry validation fails snippets that use classes outside dependency closure.
- Example validation includes nested `examples/theme-gallery/*.html`.
- Deck validation warns for progress without track/bar.
- Deck validation warns for raw timeline strong/span pattern.
- Deck validation warns for bad reveal variant/highlight combinations.
- CLI/skill tests confirm stronger preview guidance.

Visual/browser verification during implementation:

- Use `slidesls preview` and browser/agent-browser inspection for:
  - `examples/template-gallery/index.html`
  - `examples/project-intro/index.html`
  - all `examples/pi-coding-agent-*/index.html`
  - nested `examples/theme-gallery/*.html`
  - any new stress gallery
- Confirm:
  - hero/section content is vertically centered;
  - progress bars render visibly;
  - timeline labels do not overlap;
  - quote typography applies;
  - dense examples do not visibly clip.

No browser dependency needs to be added to generated decks. If a future repo-level visual smoke script is added, it should be optional and outside the base package runtime.

## Backward compatibility

- Keep `.ls-fill`; just stop recommending it for full-slide direct children.
- Additive classes/modifiers are safe.
- Validation should warn for deck-authored issues by default and reserve hard failures for registry-source validation and strict mode.
- Existing copied decks are not automatically migrated; users update by copying new registry assets.

## Risks and mitigations

- `.ls-slide-fill` requires docs/examples to migrate consistently. Mitigate with grep/tests for old full-slide direct `.ls-fill` patterns.
- Removing `@container` rules may feel like losing responsiveness. Mitigate by documenting fixed-canvas behavior and adding compact/density recipes.
- Regex structural checks can false-positive. Mitigate by keeping deck-level checks as warnings and narrowly matching known broken patterns.
- Density can grow too broad. Mitigate by using scoped tokens/variables and a small `compact` path first.
- Visual review can still be skipped. Mitigate with stronger agent instructions, stress examples, and targeted static validators.

## Implementation order

1. `.ls-slide-fill`, alignment utilities, template/example migration.
2. Remove/deal with inactive `@container` rules.
3. Fix timeline, progress, quote, card/callout, panel, image-card/layout snippets.
4. Add snippet dependency and structural validation.
5. Recursive example validation.
6. Density tokens, serif metrics, table/code/dashboard improvements.
7. Animation docs/validation.
8. Docs/skill/catalog refresh.
9. Full automated checks and visual preview verification.

## Open decisions with recommended defaults

- Full-slide helper: use new `.ls-slide-fill`; keep `.ls-fill` generic.
- Progress docs: remove unsupported `accent`/`comfortable` values instead of adding no-op API.
- Timeline: canonical marker/body structure is mandatory for now.
- Container queries: remove misleading rules unless a meaningful container contract is designed.
- Density: start with compact scoped tokens/variables, not theme-driven automatic density.
