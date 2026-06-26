# Plan: Batch 2 Structured Content & Data Slides

Date: 2026-06-26
Status: Implemented
Project: ls_slides

## Context

`ls_slides` is a copyable registry of vanilla HTML, CSS, and JavaScript slide-building blocks. Batch 1 established the broader primitive vocabulary and then tightened the layout authoring contract for high-quality, copyable slide primitives.

Batch 2 should add the next layer of practical deck-building primitives: structured professional content and data slides. These are the slides users repeatedly need for strategy decks, product updates, teaching material, technical explainers, and roadmap presentations.

Current foundation to preserve:

- Registry item directories under `registry/<category>/<item>/` with implementation files, `registry-item.json`, and `README.md`.
- Root `registry.json` indexes registry item metadata paths.
- Vanilla, dependency-free CSS/HTML/JS; no framework, no generator, no Tailwind, no runtime package.
- Existing cascade layer order from `core/base/reset.css`: `reset`, `tokens`, `base`, `layouts`, `components`, `animations`, `utilities`.
- Shared primitive authoring guidance in `docs/primitive-authoring.md`.
- Example server auto-discovers `examples/<name>/index.html`.

## Goals

- Add a coherent Batch 2 focused on structured content and data-heavy slide patterns.
- Keep primitives copyable, semantic, and useful outside the demo deck.
- Exercise and reinforce the primitive authoring contract created after Batch 1.
- Provide product-quality defaults that work with realistic dense content.
- Add a new gallery deck that validates all Batch 2 primitives together.
- Avoid runtime/platform expansion; Batch 2 should remain CSS-first and dependency-free.

## User constraints

- Use `pnpm` only.
- Preserve the vanilla copyable registry model.
- No framework, generator, runtime package, Tailwind, charting library, GSAP, or new root dependency.
- Use `ls-` prefixed classes and attributes.
- Prefer explicit, documented layout/component APIs over one-off demo styling.
- Use modern CSS where useful, but only as baseline-safe progressive enhancement.
- Remove or avoid unused future-facing hooks.
- Keep slides useful for professional/boring decks and expressive teaching/editorial moments.

## Research performed

Local project research:

- Read `PROJECT.md` for registry model, technical direction, and constraints.
- Read `docs/primitive-expansion.md` for the roadmap and Batch 2 candidate families.
- Read `docs/primitive-authoring.md` for the shared layout/component API contract.
- Read `docs/modern-platform-strategy.md` for modern CSS/API posture.
- Inspected current registry categories and `registry.json` item list.
- Inspected existing gallery/example conventions and validation scripts.

External research is not required for this planning step. Batch 2 relies on already-documented platform primitives and project-local conventions; no third-party API/library behavior needs validation.

## Batch 2 scope

### Layouts

Add four full-slide layout primitives:

1. `registry/layouts/three-column/`
   - Equal or weighted columns for features, pillars, options, lessons, or portfolio summaries.
   - Should support compact professional slides and more spacious editorial columns.

2. `registry/layouts/metric-dashboard/`
   - Dashboard composition for a headline insight plus KPI/stat/card regions.
   - Should compose with existing `metric`, `stat-grid`, `card`, `callout`, and future `progress`.

3. `registry/layouts/timeline-strip/`
   - Full-slide horizontal roadmap/process layout.
   - Distinct from `components/timeline`, which should be usable inside other layouts.

4. `registry/layouts/code-explainer/`
   - Technical teaching/demo layout with code region, explanation region, optional steps/callouts.
   - Should compose with existing `code-block` and new `numbered-step` / `highlight-text`.

### Components

Add seven reusable components:

1. `registry/components/table/`
   - Presentation-friendly semantic table styling for comparison/data slides.

2. `registry/components/timeline/`
   - Sequence component for roadmaps, processes, milestones, or lesson progression.

3. `registry/components/numbered-step/`
   - Step item/card/list primitive for tutorials, processes, agendas, and walkthroughs.

4. `registry/components/progress/`
   - Progress bars/meters and simple status indicators.

5. `registry/components/logo-strip/`
   - Logo, partner, tool, or ecosystem rows/grids with text fallback support.

6. `registry/components/highlight-text/`
   - Inline emphasis primitive for important phrases, values, or code-adjacent text.

7. `registry/components/divider/`
   - Internal content separator for dense slides; not a section-divider layout.

### Animations

Add three reveal-compatible animation/emphasis primitives:

1. `registry/animations/scale-in/`
   - Reveal-compatible scale/opacity entrance variant.

2. `registry/animations/step-focus/`
   - Dims non-current or non-emphasized sibling items in grouped content.
   - Must not require runtime changes.

3. `registry/animations/highlight/`
   - CSS emphasis effect for marked text/data, composed with reveal when needed.

### Example

Add one validation deck:

```text
examples/structured-content-gallery/
  index.html
  README.md
```

Suggested slides:

1. Batch 2 title / overview slide.
2. Three-column strategy/pillars slide.
3. Metric dashboard slide.
4. Timeline/roadmap slide.
5. Comparison/data table slide.
6. Code explainer slide.
7. Numbered process + progress slide.
8. Logo strip / ecosystem slide.

## Decisions

### Decision 1 — Batch 2 theme is structured content and data

This is the highest-value next batch because it fills the gap between general layout primitives and real deck workflows: dashboards, tables, roadmaps, process steps, and code explanation.

### Decision 2 — Keep layouts and components separate

- `timeline-strip` is a full-slide roadmap/process composition.
- `timeline` is a reusable sequence component.
- `metric-dashboard` is a full-slide composition.
- Existing `metric` and `stat-grid` remain small reusable components.
- `code-explainer` is a full-slide composition.
- Existing `code-block` remains the code display component.

This prevents components from becoming rigid slide templates and keeps layouts useful with multiple component combinations.

### Decision 3 — No charts library or data visualization system yet

Batch 2 can support numeric/data slides without adding chart rendering. Tables, progress, metrics, and timelines cover common needs while preserving copyability and avoiding dependency/design complexity.

### Decision 4 — No runtime changes

Batch 2 should not modify `slide-runtime.js`. New animations must compose with the existing `.ls-reveal` / `data-step` contract and CSS states.

### Decision 5 — Use semantic markup first

The new components should start from native/semantic structures where possible:

- `table`: real `<table>`, `<thead>`, `<tbody>`, `<th>`, `<td>`.
- `progress`: native `<progress>` where appropriate, plus documented ARIA pattern for custom bars.
- `timeline`: ordered list (`<ol>`) when sequence matters.
- `numbered-step`: `<ol>` / `<li>` friendly markup.
- `logo-strip`: list or figure markup with text labels/alt text.
- `highlight-text`: `<mark>` or inline span depending on variant.
- `divider`: `<hr>` where semantic separation is intended.

### Decision 6 — Product-quality defaults, documented customization

Every primitive must ship with concise README usage guidance documenting:

- root class,
- key child classes,
- supported `data-ls-*` attributes,
- meaningful CSS variables,
- dependencies,
- composition notes.

Inline style in examples is acceptable only when demonstrating a documented variable.

### Decision 7 — Batch 2 should be implemented as one coherent branch

The planned scope is large but comparable to Batch 1 and internally coherent. Implementation may commit at sensible checkpoints, but the intended user-facing result is one complete Batch 2 with gallery validation.

### Decision 8 — Keep composition dependencies loose by default

Layouts that merely arrange slots should not force `registryDependencies` on every component used in examples. Declare direct dependencies only when an item CSS or markup contract actually requires another registry item. Use README composition notes for recommended pairings.

### Decision 9 — `step-focus` remains in scope as a CSS-only reveal companion

`step-focus` should be attempted by mirroring the current reveal selector contract. It must not require runtime changes. If implementation cannot remain simple and robust, defer the item rather than adding JS behavior.

## Alternatives considered

### Alternative A — Build runtime/presenter features next

Rejected for Batch 2. Fullscreen, Wake Lock, Popover, and View Transitions are valuable later, but the registry first needs a stronger content vocabulary. Runtime expansion would also increase behavior and testing complexity before the visual primitives are mature.

### Alternative B — Build creative/editorial Batch 2

Rejected for now. Batch 1 already added stronger editorial primitives (`centered-statement`, `section-divider`, `asymmetric-feature`, `image-spotlight`, `quote`). The more urgent gap is dense professional content.

### Alternative C — Add charts and graph primitives

Rejected for this batch. Useful chart primitives require deeper decisions about SVG vs CSS vs Canvas, data input, accessibility, and whether any dependency is justified. Batch 2 should add table/progress/timeline primitives first.

### Alternative D — Retrofit every existing Batch 1 primitive to the new authoring contract

Rejected for this batch. The known Batch 1 blockers were already addressed. Broad consistency retrofits can be a separate cleanup; Batch 2 should focus on adding new structured content primitives while following the contract from the start.

### Alternative E — Split Batch 2 into smaller sub-batches

Viable but not chosen as the default. The proposed layouts/components/animations are coherent and should validate each other in one gallery. If implementation becomes too large, split at a natural checkpoint: first components + example skeleton, then layouts + animations.

## Implementation phases

### Phase 1 — Baseline audit and conventions

- [x] Check `git status --short` and ensure the branch starts clean. Only Batch 2 plan files were untracked; removed generated HTML preview before implementation.
- [x] Run `pnpm check` before implementation. Baseline failed only because generated `.plans/*.html` preview was unformatted/untracked; removed generated preview.
- [x] Review current examples and Batch 1 docs for load order and API conventions.
- [x] Confirm all new CSS uses existing cascade layers:
  - layouts in `@layer layouts`,
  - components in `@layer components`,
  - animations in `@layer animations`.
- [x] Confirm naming and public APIs before coding to avoid churn.
- [x] Keep `registry-item.json` metadata format aligned with existing items.

### Phase 2 — Define Batch 2 APIs before implementation

Create a short internal implementation note or add comments in the plan while implementing that fixes the public API for each item before CSS is written.

Required API conventions:

- Layout roots use `.ls-<layout>`.
- Whole-slide wrapper hooks use `.ls-layout-<layout>` only if needed.
- Public alignment uses `data-ls-align` and `data-ls-valign` where useful.
- Density uses the canonical `data-ls-density="compact|comfortable|spacious"` scale; items may implement only the values they actually need, but README files must state supported values.
- Variant attributes use `data-ls-variant="..."` for visual style variants.
- Semantic state/structure attributes are allowed when clearer than overloading `variant`:
  - `data-ls-orientation="horizontal|vertical"` for orientation,
  - `data-ls-ratio="..."` for region sizing ratios, matching existing Batch 1 usage,
  - `data-ls-status="active|done|pending"` for process state,
  - `data-ls-tone="accent|success|warning"` for semantic tone.
- Avoid one-off names such as `data-ls-layout` or `data-ls-spacing` when `data-ls-variant`, `data-ls-ratio`, or `data-ls-density` communicates the API clearly.
- Variables should be meaningful and item-namespaced, e.g. `--ls-three-column-gap`, `--ls-metric-dashboard-metric-columns`, `--ls-timeline-accent`.
- Composing layouts should usually declare only `core/base` as `registryDependencies`, matching existing loose composition. Mention compatible components in README usage guidance instead of forcing cross-dependencies unless the CSS directly depends on another item.

## Batch 2 API implementation notes

- Layouts expose `.ls-<layout>` roots, documented child regions, optional `data-ls-align`, `data-ls-valign`, `data-ls-density`, `data-ls-ratio`, or `data-ls-variant` attributes only where meaningful.
- Components prefer semantic native elements (`table`, `ol`, `progress`, `hr`, `mark`) with class hooks for copyable styling.
- New variables are item-namespaced (`--ls-three-column-*`, `--ls-progress-*`, etc.).
- Layout metadata keeps loose dependencies unless CSS directly requires another registry item.
- Animations compose with `animations/reveal` and do not require runtime changes.

### Phase 3 — Add layout primitives

For each layout, create:

```text
registry/layouts/<item>/
  <item>.css
  registry-item.json
  README.md
```

#### `three-column`

Implementation direction:

- Root: `.ls-three-column`.
- Child regions: `.ls-three-column__item`, `.ls-three-column__header`, `.ls-three-column__title`, `.ls-three-column__body`, `.ls-three-column__footer`.
- Attributes:
  - `data-ls-align="start|center|end|stretch"`.
  - `data-ls-valign="start|center|end|stretch"`.
  - `data-ls-density="compact|comfortable|spacious"`.
  - Optional `data-ls-dividers="true"` for visible separators.
- Variables:
  - `--ls-three-column-gap`.
  - `--ls-three-column-min-inline`.
  - `--ls-three-column-max-inline`.
- Behavior:
  - default to three columns on slide canvas,
  - collapse gracefully to stacked columns in narrow containers/export if needed,
  - support equal-height child cards without requiring `.ls-card`.

#### `metric-dashboard`

Implementation direction:

- Root: `.ls-metric-dashboard`.
- Regions: `.ls-metric-dashboard__hero`, `.ls-metric-dashboard__metrics`, `.ls-metric-dashboard__panel`, `.ls-metric-dashboard__footer`.
- Attributes:
  - `data-ls-variant="hero-left|hero-top|balanced"`.
  - `data-ls-density="compact|comfortable"`.
  - `data-ls-valign="start|center|stretch"`.
- Variables:
  - `--ls-metric-dashboard-gap`.
  - `--ls-metric-dashboard-hero-size`.
  - `--ls-metric-dashboard-metric-min-inline`.
- Behavior:
  - compose with existing `metric`, `stat-grid`, `card`, `callout`, and future `progress`,
  - use container queries for dense/narrow regions,
  - avoid hard-coded dashboard data or chart visuals.

#### `timeline-strip`

Implementation direction:

- Root: `.ls-timeline-strip`.
- Regions: `.ls-timeline-strip__intro`, `.ls-timeline-strip__track`, `.ls-timeline-strip__item`, `.ls-timeline-strip__marker`, `.ls-timeline-strip__title`, `.ls-timeline-strip__text`.
- Attributes:
  - `data-ls-density="compact|comfortable"`.
  - `data-ls-progress="true"` to show a connecting/progress line.
  - `data-ls-align="start|center"`.
- Variables:
  - `--ls-timeline-strip-columns`.
  - `--ls-timeline-strip-gap`.
  - `--ls-timeline-strip-accent`.
- Behavior:
  - full-slide horizontal roadmap by default,
  - fallback to stacked/flow layout for constrained containers,
  - no absolute/floating labels that can overlap essential content.

#### `code-explainer`

Implementation direction:

- Root: `.ls-code-explainer`.
- Regions: `.ls-code-explainer__code`, `.ls-code-explainer__notes`, `.ls-code-explainer__steps`, `.ls-code-explainer__summary`.
- Attributes:
  - `data-ls-ratio="code-wide|notes-wide|balanced"`.
  - `data-ls-density="compact|comfortable"`.
  - `data-ls-valign="start|center|stretch"`.
- Variables:
  - `--ls-code-explainer-gap`.
  - `--ls-code-explainer-code-size`.
  - `--ls-code-explainer-notes-size`.
- Behavior:
  - compose with `code-block`, `callout`, `numbered-step`, and `highlight-text`,
  - prevent code region overflow with sensible `minmax(0, ...)`, `overflow`, and documented max-block variables,
  - avoid syntax-highlighting dependencies.

### Phase 4 — Add component primitives

For each component, create:

```text
registry/components/<item>/
  <item>.css
  registry-item.json
  README.md
```

#### `table`

Implementation direction:

- Root: `.ls-table` on `<table>` or wrapper with table inside.
- Classes: `.ls-table__caption`, `.ls-table__note`, `.ls-table__value`, `.ls-table__muted`.
- Attributes:
  - `data-ls-density="compact|comfortable"`.
  - `data-ls-variant="comparison|striped|plain"`.
  - `data-ls-sticky="header"` only if safe inside slide containers; otherwise defer.
- Variables:
  - `--ls-table-min-inline`.
  - `--ls-table-cell-padding`.
  - `--ls-table-accent`.
- Requirements:
  - semantic table support first,
  - handle dense content without horizontal overflow in the gallery,
  - support row/column emphasis with existing classes rather than data-specific styles.

#### `timeline`

Implementation direction:

- Root: `.ls-timeline`, preferably on `<ol>`.
- Classes: `.ls-timeline__item`, `.ls-timeline__marker`, `.ls-timeline__title`, `.ls-timeline__meta`, `.ls-timeline__text`.
- Attributes:
  - `data-ls-orientation="vertical|horizontal"`.
  - `data-ls-density="compact|comfortable"`.
  - `data-ls-progress="true"`.
- Variables:
  - `--ls-timeline-gap`.
  - `--ls-timeline-marker-size`.
  - `--ls-timeline-accent`.
- Requirements:
  - default vertical component should work inside side panels,
  - horizontal variant should work in a full-width region,
  - connector line should not depend on absolute positioning for baseline correctness.

#### `numbered-step`

Implementation direction:

- Root: `.ls-numbered-step` for a step item/card.
- Optional group: `.ls-numbered-steps`.
- Classes: `.ls-numbered-step__number`, `.ls-numbered-step__title`, `.ls-numbered-step__text`, `.ls-numbered-step__meta`.
- Attributes:
  - `data-ls-variant="card|inline|compact"`.
  - `data-ls-status="active|done|pending"`.
- Variables:
  - `--ls-numbered-step-accent`.
  - `--ls-numbered-step-number-size`.
  - `--ls-numbered-step-gap`.
- Requirements:
  - work inside semantic ordered lists,
  - allow manual numbers for non-list contexts,
  - support reveal/stagger composition.

#### `progress`

Implementation direction:

- Root: `.ls-progress` on `<progress>` or a wrapper.
- Classes: `.ls-progress__track`, `.ls-progress__bar`, `.ls-progress__label`, `.ls-progress__value` for custom markup.
- Attributes:
  - `data-ls-density="compact|comfortable|spacious"`.
  - `data-ls-tone="accent|success|warning"`.
  - `data-ls-variant="bar|meter"`.
- Variables:
  - `--ls-progress-value` for custom bars.
  - `--ls-progress-accent`.
  - `--ls-progress-thickness`.
  - `--ls-progress-label-size`.
- Requirements:
  - document native `<progress>` option and custom ARIA option,
  - use `@property` only if animating `--ls-progress-value` materially improves the result,
  - no circular/ring progress in Batch 2 unless it stays simple and accessible.

#### `logo-strip`

Implementation direction:

- Root: `.ls-logo-strip`.
- Classes: `.ls-logo-strip__item`, `.ls-logo-strip__mark`, `.ls-logo-strip__label`.
- Attributes:
  - `data-ls-density="compact|comfortable"`.
  - `data-ls-align="start|center|end"`.
  - `data-ls-variant="muted|cards|plain"`.
- Variables:
  - `--ls-logo-strip-gap`.
  - `--ls-logo-strip-item-min-inline`.
  - `--ls-logo-strip-logo-block`.
- Requirements:
  - handle SVG, img, and text-only labels,
  - grayscale/muted styling should be opt-in or variant-controlled,
  - do not depend on external image assets in examples.

#### `highlight-text`

Implementation direction:

- Root: `.ls-highlight-text`, usable on `<mark>` or inline elements.
- Attributes:
  - `data-ls-variant="marker|underline|box|glow"`.
  - `data-ls-tone="accent|success|warning"`.
- Variables:
  - `--ls-highlight-text-accent`.
  - `--ls-highlight-text-opacity`.
  - `--ls-highlight-text-thickness`.
- Requirements:
  - preserve text readability and line wrapping,
  - work inside headings, paragraphs, table cells, and code-adjacent explanations,
  - avoid animation by default; animation belongs to `animations/highlight`.

#### `divider`

Implementation direction:

- Root: `.ls-divider`, ideally on `<hr>`.
- Optional label: `.ls-divider__label`.
- Attributes:
  - `data-ls-orientation="horizontal|vertical"`.
  - `data-ls-variant="line|dashed|accent|label"`.
  - `data-ls-density="compact|comfortable|spacious"`.
- Variables:
  - `--ls-divider-color`.
  - `--ls-divider-thickness`.
  - `--ls-divider-gap`.
- Requirements:
  - useful inside dense layouts,
  - not a replacement for `section-divider`,
  - vertical divider must not require fragile absolute positioning.

### Phase 5 — Add animation primitives

For each animation, create:

```text
registry/animations/<item>/
  <item>.css
  registry-item.json
  README.md
```

#### `scale-in`

Implementation direction:

- Class: `.ls-reveal-scale-in` combined with `.ls-reveal`.
- Variables:
  - `--ls-scale-in-start`.
  - `--ls-scale-in-duration`.
  - `--ls-scale-in-ease`.
- Requirements:
  - compose with `animations/reveal`,
  - respect reduced motion,
  - no runtime changes.

#### `step-focus`

Implementation direction:

- Group class: `.ls-step-focus`.
- Child class: normal `.ls-reveal` items, plus optional `.ls-step-focus__item` for non-reveal children.
- State contract:
  - mirror the real reveal runtime contract: the slide owns `data-ls-step="N"`, children own static `data-step="N"`, and selectors compare those values.
  - do not use non-existent runtime attributes such as `data-ls-shown`.
  - support the same initial three-step ceiling as `animations/reveal`; document that copied decks can extend selectors for more steps.
  - optional `data-ls-focus="active|muted"` manual state may be supported for static/non-reveal examples.
- Variables:
  - `--ls-step-focus-muted-opacity`.
  - `--ls-step-focus-scale`.
  - `--ls-step-focus-blur`.
- Requirements:
  - no JavaScript and no runtime changes,
  - fallback should be harmless if runtime state is not present,
  - export mode must show all content clearly and disable dimming that would hide essential information,
  - if a clean selector-only implementation proves too brittle, defer `step-focus` rather than modifying `slide-runtime.js` in this batch.

#### `highlight`

Implementation direction:

- Class: `.ls-highlight` or `.ls-reveal-highlight` depending on whether it is static emphasis or reveal-compatible. Prefer two clear classes if both are needed:
  - `.ls-highlight` for static/emphasis animation wrapper.
  - `.ls-reveal-highlight` for reveal-compatible entrance emphasis.
- Variables:
  - `--ls-highlight-animation-duration`.
  - `--ls-highlight-animation-accent`.
  - `--ls-highlight-animation-spread`.
- Requirements:
  - compose with `components/highlight-text`,
  - respect reduced motion,
  - avoid flashing/pulsing defaults that harm readability.

### Phase 6 — Update registry metadata and category docs

- [x] Add every new `registry-item.json` path to `registry.json`.
- [x] Run `pnpm validate:registry` after metadata is added.
- [x] Update `registry/layouts/README.md` with four new layouts.
- [x] Update `registry/components/README.md` with seven new components.
- [x] Update `registry/animations/README.md` with three new animations and composition guidance.
- [x] Update `registry/README.md` only if copy/dependency guidance changes. No change needed.

### Phase 7 — Add structured content gallery

Create:

```text
examples/structured-content-gallery/
  index.html
  README.md
```

Implementation requirements:

- Load only the core files, font preset if useful, reveal/animation CSS, and registry item CSS needed by the gallery.
- Demonstrate all Batch 2 primitives at least once.
- Reuse Batch 1 primitives where composition is realistic, but keep Batch 2 items visible and clearly validated.
- Primary slide content should be visible by default; reveals may add supporting detail.
- Avoid external images/network assets.
- Use inline CSS variables only to demonstrate documented customization hooks.
- Ensure `/examples/structured-content-gallery/?export=1` renders all essential content.

Suggested deck structure:

1. `centered-statement` or `section-divider` intro: Batch 2 theme.
2. `three-column` with `highlight-text`, `divider`, and `scale-in`.
3. `metric-dashboard` with existing `metric`, `stat-grid`, and new `progress`.
4. `timeline-strip` with `timeline` and `step-focus`.
5. `table` comparison slide with `highlight-text` and `highlight` animation.
6. `code-explainer` with `code-block`, `numbered-step`, and `callout`.
7. Process slide using `numbered-step`, `progress`, and `divider`.
8. Ecosystem slide using `logo-strip`.

### Phase 8 — Documentation updates

- [x] Update `docs/primitive-expansion.md`:
  - mark Batch 2 as planned or implemented depending on progress,
  - list new primitives,
  - record any new quality bar refinements.
- [x] Update `PROJECT.md` current registry foundation after implementation.
- [x] Update `examples/README.md` to include `structured-content-gallery`.
- [x] Update root `README.md` only if the high-level registry summary changes.
- [x] Consider a short `docs/batch-2-structured-content.md` only if implementation reveals reusable guidance beyond the item READMEs. No extra doc needed.

### Phase 9 — Accessibility and semantics pass

- [x] Confirm table examples use proper table semantics and accessible captions/headers.
- [x] Confirm timeline and step examples use ordered lists where sequence matters.
- [x] Confirm progress examples expose readable labels/values and accessible native or ARIA semantics.
- [x] Confirm logo examples have text labels or accessible names.
- [x] Confirm highlight text does not reduce contrast below reasonable readability.
- [x] Confirm animations honor reduced-motion behavior and export/static rendering.
- [x] Confirm no primitive relies on color alone for meaning where status/progress matters.

### Phase 10 — Validation and visual review

Run automated validation:

```sh
pnpm fmt
pnpm check
pnpm validate:registry
node --check scripts/serve-examples.mjs
```

Smoke test examples server:

```sh
pnpm serve:examples -- --port 4173
curl -I http://localhost:4173/examples/
curl -I http://localhost:4173/examples/structured-content-gallery/
curl -I 'http://localhost:4173/examples/structured-content-gallery/?export=1'
```

Browser/visual review:

- Capture screenshots for every slide in `examples/structured-content-gallery`.
- Capture export-mode screenshot.
- Check for overflow candidates, especially:
  - tables,
  - code blocks,
  - horizontal timelines,
  - metric dashboard cards,
  - logo strips.
- Verify first impression: primary content should not be blank before reveal steps.
- Verify animations do not hide essential content in export mode.

### Phase 11 — Peer review, cleanup, and commit

- [x] Run a fresh peer review after implementation, focused on:
  - architecture consistency,
  - semantic markup,
  - copyability,
  - density/overflow handling,
  - docs accuracy,
  - visual quality,
  - whether any primitive is too rigid or too demo-specific.
- [x] Address blocking feedback.
- [x] Ensure working tree contains no generated screenshots, server logs, or temporary files unless intentionally tracked.
- [x] Update this plan status to `Implemented` when complete.
- [x] Add implementation notes, validation results, peer review outcome, and commit hash(es) to this plan.
- [x] Commit with a concise message such as `Add structured content primitive batch`.

## Validation commands

```sh
pnpm fmt
pnpm check
pnpm validate:registry
node --check scripts/serve-examples.mjs
pnpm serve:examples -- --port 4173
curl -I http://localhost:4173/examples/
curl -I http://localhost:4173/examples/structured-content-gallery/
curl -I 'http://localhost:4173/examples/structured-content-gallery/?export=1'
```

## Expected files to add

```text
registry/layouts/three-column/
registry/layouts/metric-dashboard/
registry/layouts/timeline-strip/
registry/layouts/code-explainer/
registry/components/table/
registry/components/timeline/
registry/components/numbered-step/
registry/components/progress/
registry/components/logo-strip/
registry/components/highlight-text/
registry/components/divider/
registry/animations/scale-in/
registry/animations/step-focus/
registry/animations/highlight/
examples/structured-content-gallery/
```

## Expected files to update

```text
registry.json
registry/layouts/README.md
registry/components/README.md
registry/animations/README.md
examples/README.md
docs/primitive-expansion.md
PROJECT.md
README.md              # only if high-level summary changes
registry/README.md     # only if copy/dependency guidance changes
.plans/2026-06-26-batch-2-structured-content-data.md
```

## Risks / rollback

- Risk: Batch becomes too large. Mitigation: keep APIs concise, avoid optional variants that are not validated in the gallery, and split only if implementation becomes unwieldy.
- Risk: Table/timeline/code slides overflow. Mitigation: use `minmax(0, ...)`, container queries, documented density controls, and visual review with realistic content.
- Risk: Component/layout boundaries blur. Mitigation: layouts only arrange regions; components own reusable internal presentation.
- Risk: `step-focus` may be impossible to make robust without runtime changes. Mitigation: keep it CSS-only and harmless; if it cannot work cleanly, defer it rather than modifying runtime in this batch.
- Risk: `progress` accessibility gets muddled between native and custom markup. Mitigation: document both patterns clearly and prefer native `<progress>` in examples where possible.
- Rollback: revert the Batch 2 implementation commit(s). Changes should be confined to new registry item directories, the new example, registry index/category docs, and project docs.

## Implementation progress

- [x] Phase 1 — Baseline audit and conventions.
- [x] Phase 2 — Batch 2 public APIs finalized.
- [x] Phase 3 — Layout primitives implemented.
- [x] Phase 4 — Component primitives implemented.
- [x] Phase 5 — Animation primitives implemented.
- [x] Phase 6 — Registry metadata and category docs updated.
- [x] Phase 7 — Structured content gallery added.
- [x] Phase 8 — Documentation updates completed.
- [x] Phase 9 — Accessibility and semantics pass completed.
- [x] Phase 10 — Validation and visual review completed.
- [x] Phase 11 — Peer review, cleanup, and commit completed.

## Implementation notes

- Removed generated Batch 2 HTML plan preview from the working tree before implementation.
- Added 14 Batch 2 registry items: four layouts, seven components, and three reveal-compatible animations.
- `step-focus` remained CSS-only and mirrors the existing three-step reveal selector ceiling; copied decks can extend selectors if needed.
- Kept layout registry dependencies loose; README files document compatible components instead of forcing composition dependencies.
- Added `examples/structured-content-gallery` with `data-ls-deck` runtime activation and no external assets.

## Validation results

- `pnpm fmt` passed.
- `pnpm check` passed.
- `pnpm validate:registry` passed with 40 registry items.
- `node --check scripts/serve-examples.mjs` passed.
- Example smoke tests returned 200 for `/examples/`, `/examples/structured-content-gallery/`, and `/examples/structured-content-gallery/?export=1`.
- Browser review via `npx agent-browser` confirmed the deck initializes (`data-ls-ready="true"`), has 8 slides, and key dense elements fit their containers.
- Screenshots captured to `/tmp/ls-slides-batch2-gallery-1.png` through `/tmp/ls-slides-batch2-gallery-8.png` and `/tmp/ls-slides-batch2-export.png` for visual inspection.

## Peer review outcome

- Fresh implementation review found the batch architecturally aligned and acceptable after two should-fix gallery issues.
- Fixed the native progress example so `.ls-progress` is not applied to both wrapper and child.
- Switched the table highlight demo to the reveal-gated `.ls-reveal-highlight` variant so the animation is actually validated when the slide step appears.
- Added a scale-in README note clarifying that the variant should load after `animations/reveal` because it replaces the reveal start transform by source order.
- Post-fix validation: `pnpm fmt`, `pnpm check`, `pnpm validate:registry`, `node --check scripts/serve-examples.mjs`, and example curl smoke tests passed.
- Follow-up review accepted the fixes and found no blocking issues.

## Commits

- `cfbe19e` — `Add structured content primitive batch`
- `f8ca338` — `Polish structured content gallery validation`

## Peer review summary

Fresh plan review confirmed the Batch 2 theme and scope align with the project roadmap and registry constraints. Required fixes were incorporated before finalizing:

- Corrected `step-focus` to mirror the real reveal contract (`data-ls-step` on slides and `data-step` on children) instead of relying on a non-existent `data-ls-shown` attribute.
- Clarified public attribute policy: use `data-ls-variant` for visual variants, allow semantic attributes such as `data-ls-orientation`, `data-ls-ratio`, `data-ls-status`, and `data-ls-tone`, and avoid unnecessary one-off names.
- Renamed highlight-related variables to avoid collisions between `components/highlight-text` and `animations/highlight`.
- Clarified density scale expectations and replaced inconsistent `data-ls-size` / `data-ls-spacing` recommendations where `data-ls-density` is clearer.
- Added an explicit loose-composition dependency policy for layouts that pair with components but do not require them.
- Confirmed no user clarification is required: implement Batch 2 as one coherent branch, keep `step-focus` CSS-only or defer it if it cannot be robust, and preserve existing loose dependency conventions.
- Follow-up review found no blocking issues and confirmed the plan is ready to save as final.
