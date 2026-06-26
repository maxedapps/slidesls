# Plan: Batch 3 Visual Narrative & Annotation

Date: 2026-06-26
Status: In Progress
Project: ls_slides

## Context

`ls_slides` is a copyable registry of vanilla HTML, CSS, and JavaScript slide-building blocks. Batch 1 established general layouts/components and editorial primitives. Batch 2 added structured content/data primitives and then tightened reveal sequencing, overflow, and visual QA for dense slides.

The remaining roadmap gap is visual storytelling: annotated visuals, connected diagrams, layered canvases, case-study/image cards, legends, and attention/focus animations. These primitives should help users explain screenshots, product flows, system diagrams, customer stories, and editorial visuals without adopting a framework, charting library, or runtime package.

Current foundation to preserve:

- Copyable registry item directories under `registry/<category>/<item>/` with implementation files, `registry-item.json`, and `README.md`.
- `registry.json` indexes all item metadata paths.
- `core/base` owns reset, tokens, slide shell, runtime navigation, and reveal state.
- Existing reveal runtime supports arbitrary `data-step` counts via `data-ls-reveal-state` and optional `data-ls-reveal-sequence`.
- Existing cascade layer order: `reset`, `tokens`, `base`, `layouts`, `components`, `animations`, `utilities`.
- Shared authoring rules in `docs/primitive-authoring.md` and platform posture in `docs/modern-platform-strategy.md`.
- Example server auto-discovers `examples/<name>/index.html`.

## Goals

- Add a coherent visual narrative batch that complements Batch 1 editorial primitives and Batch 2 structured-content primitives.
- Provide safe, reusable primitives for annotations, connectors, legends, image/case cards, and layered canvases.
- Keep visual storytelling flexible: primitives should provide regions, slots, and variables instead of hard-coded demo artwork.
- Use modern CSS/SVG where it materially improves copyability, but ensure baseline correctness without fragile overlap.
- Validate the new primitives together in a product-quality gallery deck.
- Avoid runtime expansion and new dependencies unless a narrowly scoped CSS/SVG animation requires a small item-local script; default plan is CSS/SVG only.

## User constraints

- Use `pnpm` only.
- Preserve vanilla, dependency-free, copyable registry architecture.
- No framework, generator, runtime package, Tailwind, charting library, GSAP, or new root dependency.
- Use `ls-` prefixed classes and attributes.
- Prefer reusable primitive/API improvements over one-off gallery styling.
- Follow `docs/primitive-authoring.md`.
- Keep browser/API enhancements progressive and baseline-safe.
- Remove or avoid unused future-facing hooks.

## Research performed

Local project research:

- Read `PROJECT.md` for current registry state, constraints, and technical direction.
- Read `docs/primitive-expansion.md` for remaining roadmap gaps: `quote-feature`, `layered-canvas`, `image-card`, `connector`, `annotation`, `pulse`, `spotlight`, `path-draw`, and `connector-grow`.
- Read `docs/primitive-authoring.md` for layout APIs, reveal sequencing, safe progressive enhancement, and visual QA guidance.
- Read `docs/modern-platform-strategy.md` for anchor positioning, SVG/CSS animation, `:has()`, `color-mix()`, `@property`, and browser API posture.
- Inspected current registry category READMEs, example conventions, and representative existing CSS for `diagram`, `media-frame`, reveal animations, and Batch 2 gallery composition.
- Reviewed recent commit history showing Batch 2 plus polish commits are implemented and stable.

External research is not required for this planning step. The proposed batch uses platform features already documented in project strategy and does not depend on third-party library/API behavior.

## Batch 3 scope

### Layouts

Add two full-slide layout primitives:

1. `registry/layouts/quote-feature/`
   - Large quote/testimonial/editorial statement layout with attribution and optional context region.
   - Distinct from the existing smaller `components/quote` block.

2. `registry/layouts/layered-canvas/`
   - Full-slide visual canvas for overlapping cards, media, labels, annotations, and connectors.
   - Must provide safe normal-flow/fallback placement and make absolute layering explicit.

### Components

Add four reusable components:

1. `registry/components/annotation/`
   - Label/note/callout annotation block for diagrams, screenshots, and visuals.
   - Normal-flow default; optional anchored/floating mode only when explicitly requested and safe.

2. `registry/components/connector/`
   - Dependency-free line/arrow connector primitive, preferably SVG-first for robust geometry.
   - Supports simple horizontal/vertical/diagonal connector recipes and composition with `connector-grow` / `path-draw`.

3. `registry/components/image-card/`
   - Image/media case-study card with caption, eyebrow, metadata, and optional badge/status region.
   - No external assets in examples; use gradients/SVG placeholders when needed.

4. `registry/components/legend/`
   - Keyed legend for diagrams, maps, ecosystem visuals, and color/status explanations.
   - Must not rely on color alone; include text labels and marker shape/pattern hooks.

### Animations

Add four optional animation primitives:

1. `registry/animations/pulse/`
   - Subtle attention pulse for markers, badges, annotations, and diagram points.

2. `registry/animations/spotlight/`
   - Focus treatment for a visual region or item without hiding essential content.

3. `registry/animations/connector-grow/`
   - Reveal-compatible line/connector growth animation.

4. `registry/animations/path-draw/`
   - SVG path drawing animation for simple diagrams and connector paths.

### Example

Add one validation deck:

```text
examples/visual-narrative-gallery/
  index.html
  README.md
```

Suggested slides:

1. Batch 3 title / visual narrative overview.
2. Quote feature slide.
3. Visual explainer with annotated screenshot-style placeholder.
4. Layered canvas with cards, annotations, connectors, and tag clusters.
5. Image-card case-study grid.
6. Diagram/legend slide with connector/path animation.
7. Spotlight/pulse annotation slide.
8. Composition recap / copyability slide.

## Decisions

### Decision 1 — Batch 3 theme is visual narrative and annotation

This is the highest-value next batch because Batch 1 covered general/editorial primitives and Batch 2 covered structured business/data slides. Visual narrative primitives unlock annotated screenshots, diagrams, case studies, product flows, and creative explanation slides.

### Decision 2 — Keep annotations baseline-safe

`annotation` must default to normal-flow placement or explicit grid placement. Floating/anchored annotations are allowed only as an opt-in mode with clear fallback and documentation. Do not repeat earlier mistakes where modern positioning can overlap essential content.

### Decision 3 — Use manual SVG paths for robust connectors, CSS for simple connectors

The `connector` component should support inline SVG paths as the primary robust pattern for diagonal/curved lines. Batch 3 does not attempt auto-routing between arbitrary boxes; users copy and edit simple hand-authored SVG paths. CSS borders/pseudo-elements may support simple horizontal/vertical connectors. This keeps geometry copyable, avoids runtime geometry code, and sets honest expectations.

### Decision 4 — Layouts arrange; components own visuals

`layered-canvas` and existing composition layouts should arrange slots and safe areas. They should not hard-code specific screenshot, product, or diagram content. `annotation`, `connector`, `legend`, and `image-card` own reusable internal presentation.

### Decision 5 — Animations compose with reveal and export mode

`pulse`, `spotlight`, `connector-grow`, and `path-draw` should work statically and/or with `.ls-reveal` where sensible. They must respect reduced motion and export/static rendering so essential content remains visible.

### Decision 6 — No charting/data-viz system in this batch

Connectors and legends are for visual explanation, not a general charting library. Avoid introducing data input formats, rendering abstractions, Canvas, or chart dependencies.

### Decision 7 — No runtime changes by default

Batch 3 should not modify `slide-runtime.js` unless implementation reveals a small, generic bug in existing reveal state. The planned primitives can use CSS, SVG, and existing reveal state.

### Decision 8 — Example visuals use local inline primitives only

The gallery should avoid external images/network assets. Use CSS gradients, inline SVG, existing `media-frame`, and simple placeholder panels so the example remains self-contained and copyable.

### Decision 9 — Cut redundant non-roadmap primitives from Batch 3

Do not add `tag-cluster`; grouped existing `badge` elements are sufficient for this batch. Do not add `visual-explainer`; the gallery should demonstrate visual explainer composition with existing layouts plus new annotation/connector/legend components. This keeps Batch 3 focused and avoids primitives that are likely to overlap existing registry items.

## Alternatives considered

### Alternative A — Build presenter/runtime features next

Rejected for this batch. Fullscreen, Wake Lock, Popover, and View Transitions are valuable but would shift focus from the registry vocabulary. The current visual primitive set still lacks annotation and diagram storytelling basics.

### Alternative B — Build chart primitives next

Rejected for now. Charts require deeper choices about SVG vs Canvas, data formats, accessibility, labels, responsive scaling, and whether any dependency is acceptable. Batch 3 should add lower-level visual explanation primitives first.

### Alternative C — Add only animations next

Rejected. Animations like `path-draw` and `connector-grow` need connector/annotation components and real examples to be meaningful. Building visual components and animations together validates composition.

### Alternative D — Retrofit old `diagram` into a comprehensive diagram system

Rejected. The existing `diagram` component is intentionally simple. A broad rewrite risks breaking existing examples and registry expectations. Batch 3 should add focused `connector`, `annotation`, and `legend` primitives that can compose with `diagram` instead.

### Alternative E — Make `layered-canvas` fully absolute-positioned

Rejected as the default. Absolute positioning is useful for editorial canvases but can be fragile when copied. The layout should provide normal-flow zones and make absolute layers explicit via attributes/classes and variables.

### Alternative F — Add `visual-explainer` and `tag-cluster` as first-class primitives

Rejected for this batch after review. `visual-explainer` overlaps existing `image-spotlight`, `detail-split`, and `two-column` layouts. `tag-cluster` overlaps grouped `badge` usage. The gallery can still demonstrate both composition patterns without adding weak registry items.

## Implementation phases

### Phase 1 — Baseline audit and conventions

- [x] Check `git status --short`; avoid unrelated changes.
- [x] Run `pnpm check` before implementation. Baseline was blocked only by generated Batch 3 HTML preview; removed preview before implementation.
- [x] Remove any generated `.plans/*.html` preview from the working tree unless intentionally tracked.
- [x] Review the current Batch 1/2 galleries for load order, `data-ls-deck`, reveal sequencing, export mode, and example style.
- [x] Confirm all new CSS uses existing cascade layers:
  - layouts in `@layer layouts`,
  - components in `@layer components`,
  - animations in `@layer animations`.
- [x] Confirm metadata format against existing `registry-item.json` files.

### Phase 2 — Finalize public APIs before CSS

Document the public API in implementation notes or directly in each README before finalizing CSS.

Required conventions:

- Layout roots use `.ls-<layout>`.
- Whole-slide wrapper hooks use `.ls-layout-<layout>` only where useful.
- Public alignment uses `data-ls-align` and `data-ls-valign` where useful.
- Density uses `data-ls-density="compact|comfortable|spacious"` only where implemented.
- Variants use `data-ls-variant="..."` for visual style variants.
- Orientation uses `data-ls-orientation="horizontal|vertical"` where relevant.
- Tone/status attributes use established patterns: `data-ls-tone`, `data-ls-status`.
- Layering/floating APIs must be explicit and safe, e.g. `data-ls-layer="base|overlay|floating"`, `data-ls-placement="..."`, or item-local variables. Avoid vague one-off names.
- Item variables must be namespaced, e.g. `--ls-annotation-accent`, `--ls-connector-stroke`, `--ls-layered-canvas-gap`.
- Layout dependencies should stay loose unless CSS directly requires a component.

## Batch 3 API implementation notes

- Components use normal-flow, semantic defaults: annotations are blocks, legends use lists, image cards use figure/article-friendly regions, and connectors are SVG-first with decorative `aria-hidden` guidance.
- `layered-canvas` defaults to grid/flow layout; explicit overlay/layering is opt-in through `data-ls-layer` and item variables.
- Animation items use existing reveal state where gated and include reduced-motion/export-safe fallbacks.
- Item variables are namespaced (`--ls-annotation-*`, `--ls-connector-*`, `--ls-layered-canvas-*`, etc.).

### Phase 3 — Add component primitives

For each component, create:

```text
registry/components/<item>/
  <item>.css
  registry-item.json
  README.md
```

#### `annotation`

Implementation direction:

- Root: `.ls-annotation`.
- Classes: `.ls-annotation__marker`, `.ls-annotation__body`, `.ls-annotation__title`, `.ls-annotation__text`, `.ls-annotation__meta`.
- Attributes:
  - `data-ls-tone="accent|success|warning"`.
  - `data-ls-variant="note|label|callout"`.
  - Optional `data-ls-placement="inline|floating"` only if implemented safely.
- Variables:
  - `--ls-annotation-accent`.
  - `--ls-annotation-gap`.
  - `--ls-annotation-marker-size`.
- Requirements:
  - Normal-flow default.
  - If floating/anchor positioning is included, it must be behind `@supports` and have a non-overlapping fallback.
  - Use text + marker, not color alone.

#### `connector`

Implementation direction:

- Root: `.ls-connector`, usable on SVG or wrapper.
- Classes: `.ls-connector__path`, `.ls-connector__label`, `.ls-connector__marker`.
- Attributes:
  - `data-ls-variant="line|arrow|elbow|curve"`.
  - `data-ls-tone="accent|muted|success|warning"`.
  - `data-ls-orientation="horizontal|vertical"` for non-SVG simple connectors.
- Variables:
  - `--ls-connector-stroke`.
  - `--ls-connector-stroke-width`.
  - `--ls-connector-dash`.
- Requirements:
  - Prefer inline SVG path examples for robust connectors.
  - CSS-only connector examples may handle simple horizontal/vertical cases.
  - Must be visible in export mode without animation.
  - Include accessible guidance: decorative connectors should use `aria-hidden="true"`; meaningful connectors need labels/text.

#### `image-card`

Implementation direction:

- Root: `.ls-image-card`, preferably `figure` or `article`.
- Classes: `.ls-image-card__media`, `.ls-image-card__content`, `.ls-image-card__eyebrow`, `.ls-image-card__title`, `.ls-image-card__text`, `.ls-image-card__meta`, `.ls-image-card__badge`.
- Attributes:
  - `data-ls-variant="plain|panel|cover"`.
  - `data-ls-ratio="wide|square|portrait"`.
  - `data-ls-density="compact|comfortable"`.
- Variables:
  - `--ls-image-card-aspect`.
  - `--ls-image-card-gap`.
  - `--ls-image-card-media-block`.
- Requirements:
  - Handle `img`, `svg`, and CSS placeholder media.
  - Support captions/metadata without clipping.
  - No external image assets in gallery.

#### `legend`

Implementation direction:

- Root: `.ls-legend`, preferably `ul`/`ol` or `dl` depending on usage.
- Classes: `.ls-legend__item`, `.ls-legend__marker`, `.ls-legend__label`, `.ls-legend__description`.
- Attributes:
  - `data-ls-orientation="horizontal|vertical"`.
  - `data-ls-density="compact|comfortable"`.
  - `data-ls-variant="plain|panel"`.
- Variables:
  - `--ls-legend-gap`.
  - `--ls-legend-marker-size`.
  - `--ls-legend-marker-color`.
- Requirements:
  - Do not rely on color alone; support marker text/shape/pattern hooks.
  - Work inside visual side panels and beneath diagrams.

### Phase 4 — Add layout primitives

For each layout, create:

```text
registry/layouts/<item>/
  <item>.css
  registry-item.json
  README.md
```

#### `quote-feature`

Implementation direction:

- Root: `.ls-quote-feature`.
- Regions/classes: `.ls-quote-feature__quote`, `.ls-quote-feature__mark`, `.ls-quote-feature__text`, `.ls-quote-feature__source`, `.ls-quote-feature__context`, `.ls-quote-feature__media`.
- Attributes:
  - `data-ls-align="start|center|end"`.
  - `data-ls-valign="start|center|space-between"`.
  - `data-ls-variant="plain|panel|editorial"`.
- Variables:
  - `--ls-quote-feature-max-inline`.
  - `--ls-quote-feature-gap`.
  - `--ls-quote-feature-mark-size`.
- Requirements:
  - Use semantic `blockquote`, `footer`, and `cite` in examples/README.
  - Distinguish from `components/quote`: this is a full-slide composition.
  - Keep large typography responsive to slide regions and export mode.

#### `layered-canvas`

Implementation direction:

- Root: `.ls-layered-canvas`.
- Regions/classes: `.ls-layered-canvas__stage`, `.ls-layered-canvas__layer`, `.ls-layered-canvas__item`, `.ls-layered-canvas__caption`, `.ls-layered-canvas__safe`.
- Attributes:
  - `data-ls-valign="start|center|stretch"`.
  - `data-ls-variant="plain|panel|editorial"`.
  - Optional `data-ls-overlap="soft|strong"` for spacing presets.
- Variables:
  - `--ls-layered-canvas-gap`.
  - `--ls-layered-canvas-min-block`.
  - `--ls-layered-canvas-overlap`.
- Requirements:
  - Baseline should use grid/flow layout, including grid-stack overlap where useful.
  - Absolute/floating usage must be explicit, opt-in, and documented with guardrails.
  - Provide `min-inline-size: 0` / `min-block-size: 0` and safe overflow behavior.
  - Validate with annotations/connectors without clipping essential content.

### Phase 5 — Add animation primitives

For each animation, create:

```text
registry/animations/<item>/
  <item>.css
  registry-item.json
  README.md
```

#### `pulse`

Implementation direction:

- Classes: `.ls-pulse` for static/loop use and `.ls-reveal-pulse` if reveal-gated behavior is useful.
- Variables:
  - `--ls-pulse-accent`.
  - `--ls-pulse-size`.
  - `--ls-pulse-duration`.
- Requirements:
  - Subtle default; avoid distracting infinite motion unless `data-ls-loop="true"` or similar is explicit.
  - Respect reduced motion.
  - Export mode should show marker without animation.

#### `spotlight`

Implementation direction:

- Classes: `.ls-spotlight`, `.ls-spotlight__target`, optional `.ls-reveal-spotlight`.
- Attributes:
  - `data-ls-variant="ring|wash|dim"`.
- Variables:
  - `--ls-spotlight-accent`.
  - `--ls-spotlight-opacity`.
  - `--ls-spotlight-spread`.
- Requirements:
  - Must not hide essential content.
  - Prefer local target treatments over full-slide overlays by default.
  - Respect reduced motion and export mode.

#### `connector-grow`

Implementation direction:

- Class: `.ls-connector-grow`, applied to `.ls-connector__path` or connector root; it should share the same SVG `pathLength="1"` stroke-dash model as `path-draw` and document the connector-specific intent.
- Variables:
  - `--ls-connector-grow-duration`.
  - `--ls-connector-grow-ease`.
- Requirements:
  - Compose with `animations/reveal` using `data-ls-reveal-state` where possible.
  - Work for simple SVG lines/paths via stroke dash techniques.
  - Avoid needing JS to compute path lengths; use documented `pathLength="1"` in examples.

#### `path-draw`

Implementation direction:

- Class: `.ls-path-draw`, applied to SVG paths.
- Variables:
  - `--ls-path-draw-duration`.
  - `--ls-path-draw-ease`.
  - `--ls-path-draw-delay`.
- Requirements:
  - Use SVG `pathLength="1"` convention to keep CSS generic.
  - Respect reduced motion and export mode.
  - Document that copied custom paths should set `pathLength="1"` or adapt variables.

### Phase 6 — Registry metadata and category docs

- [x] Add every new `registry-item.json` path to `registry.json`.
- [x] Run `pnpm validate:registry` after metadata updates.
- [x] Update `registry/layouts/README.md` with new layouts. Plan text said three, final trimmed scope adds two.
- [x] Update `registry/components/README.md` with new components. Plan text said five, final trimmed scope adds four.
- [x] Update `registry/animations/README.md` with four new animations and composition/load-order guidance.
- [x] Update `registry/README.md` only if copy/dependency guidance changes. No change needed.

### Phase 7 — Add visual narrative gallery

Create:

```text
examples/visual-narrative-gallery/
  index.html
  README.md
```

Implementation requirements:

- Include `data-ls-deck` so runtime/reveal behavior initializes.
- Load only core files, optional font preset, reveal/animation CSS, and registry item CSS needed by the gallery.
- Demonstrate all Batch 3 primitives at least once.
- Reuse existing primitives where composition is realistic (`media-frame`, `card`, `diagram`, `callout`, `highlight-text`, `divider`, `badge`).
- Primary content should be visible by default; reveals may add annotation/connector detail.
- Avoid external images/network assets; use inline SVG/CSS placeholders.
- Use inline CSS variables only to demonstrate documented customization hooks.
- Ensure `/examples/visual-narrative-gallery/?export=1` renders all essential content.

Suggested deck structure:

1. Title/overview slide using `quote-feature` or `centered-statement`.
2. `quote-feature` testimonial/editorial slide.
3. Annotated visual composition using existing `image-spotlight`/`detail-split` patterns, plus `annotation`, `legend`, `connector`, and `spotlight`.
4. `layered-canvas` with overlapping image cards, annotations, badges, and connectors.
5. `image-card` case-study grid with existing `badge` composition and `pulse` marker.
6. Connected diagram using `connector`, `legend`, `connector-grow`, and `path-draw`.
7. Annotated screenshot/product-flow slide using `annotation` and `spotlight`.
8. Recap slide showing copyable composition and export-safe rendering.

### Phase 8 — Documentation updates

- [x] Update `docs/primitive-expansion.md`:
  - mark Batch 3 as implemented after completion,
  - list new primitives,
  - record visual narrative quality bar refinements.
- [x] Update `PROJECT.md` current registry foundation after implementation.
- [x] Update `examples/README.md` to include `visual-narrative-gallery`.
- [x] Update root `README.md` only if the high-level registry summary should mention Batch 3.
- [x] Consider a short `docs/visual-narrative-primitives.md` only if implementation reveals guidance not covered by item READMEs and `primitive-expansion.md`. No extra doc needed.

### Phase 9 — Accessibility and semantics pass

- [x] Confirm quote examples use `blockquote`, attribution, and `cite` where appropriate.
- [x] Confirm image cards use `figure`/`figcaption` or accessible article labels.
- [x] Confirm decorative SVG/connectors are `aria-hidden="true"` and meaningful connectors have text labels or descriptions.
- [x] Confirm annotations include text labels and do not rely on color alone.
- [x] Confirm legends provide text labels and marker shape/pattern cues.
- [x] Confirm animations honor reduced motion and export/static rendering.
- [x] Confirm spotlight/dimming effects do not hide essential content.

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
curl -I http://localhost:4173/examples/visual-narrative-gallery/
curl -I 'http://localhost:4173/examples/visual-narrative-gallery/?export=1'
```

Browser/visual review:

- Capture screenshots for every slide in `examples/visual-narrative-gallery`.
- Capture export-mode screenshot.
- Verify reveal steps for connector/path/annotation animations in live mode, not only export mode.
- Check overflow/clipping candidates, especially:
  - layered canvas overlays,
  - annotations near edges,
  - connector SVG bounds,
  - quote-feature large type,
  - image-card captions/metadata.
- Verify first impression: primary content should not be blank before reveal steps.
- Verify copied animation classes do not hide essential content in export mode.

### Phase 11 — Peer review, cleanup, and commit

- [ ] Run a fresh peer review after implementation, focused on:
  - architecture consistency,
  - annotation/connector safety,
  - copyability,
  - semantic markup/accessibility,
  - visual quality,
  - whether any primitive is too demo-specific,
  - whether modern CSS/SVG enhancements are baseline-safe.
- [ ] Address blocking feedback.
- [ ] Ensure working tree contains no generated screenshots, server logs, or temporary files unless intentionally tracked.
- [ ] Update this plan status to `Implemented` when complete.
- [ ] Add implementation notes, validation results, peer review outcome, and commit hash(es) to this plan.
- [ ] Commit with a concise message such as `Add visual narrative primitive batch`.

## Validation commands

```sh
pnpm fmt
pnpm check
pnpm validate:registry
node --check scripts/serve-examples.mjs
pnpm serve:examples -- --port 4173
curl -I http://localhost:4173/examples/
curl -I http://localhost:4173/examples/visual-narrative-gallery/
curl -I 'http://localhost:4173/examples/visual-narrative-gallery/?export=1'
```

## Expected files to add

```text
registry/layouts/quote-feature/
registry/layouts/layered-canvas/
registry/components/annotation/
registry/components/connector/
registry/components/image-card/
registry/components/legend/
registry/animations/pulse/
registry/animations/spotlight/
registry/animations/connector-grow/
registry/animations/path-draw/
examples/visual-narrative-gallery/
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
.plans/2026-06-26-batch-3-visual-narrative-annotation.md
```

## Risks / rollback

- Risk: Annotation/floating APIs become fragile. Mitigation: normal-flow default, explicit floating opt-in, visual review across live/export modes.
- Risk: Connectors become too demo-specific. Mitigation: SVG-first generic path classes, documented variables, and simple examples that users can copy/edit.
- Risk: `layered-canvas` encourages absolute-position hacks. Mitigation: provide grid/flow defaults and document guardrails for explicit overlay use.
- Risk: Animations distract or hide content. Mitigation: subtle defaults, reduced-motion/export fallbacks, reveal-state composition.
- Risk: Batch becomes too broad. Mitigation: keep to 2 layouts, 4 components, 4 animations, one gallery; defer charts and runtime features.
- Rollback: revert the Batch 3 implementation commit(s). Changes should be confined to new registry item directories, the new example, registry index/category docs, project docs, and this plan.

## Implementation progress

- [x] Phase 1 — Baseline audit and conventions.
- [x] Phase 2 — Batch 3 public APIs finalized.
- [x] Phase 3 — Component primitives implemented.
- [x] Phase 4 — Layout primitives implemented.
- [x] Phase 5 — Animation primitives implemented.
- [x] Phase 6 — Registry metadata and category docs updated.
- [x] Phase 7 — Visual narrative gallery added.
- [x] Phase 8 — Documentation updates completed.
- [x] Phase 9 — Accessibility and semantics pass completed.
- [x] Phase 10 — Validation and visual review completed.
- [ ] Phase 11 — Peer review, cleanup, and commit completed.

## Implementation notes

- Removed generated `.plans/2026-06-26-batch-3-visual-narrative-annotation.html` preview before implementation.
- Added 10 Batch 3 registry items: two layouts, four components, and four animation recipes.
- Kept runtime unchanged; animation recipes use existing reveal state and export/reduced-motion fallbacks.
- Kept annotations normal-flow by default and connectors SVG-first/manual instead of auto-routed.
- Plan wording in Phase 6 referenced three layouts and five components, but the final trimmed scope contains two layouts and four components; implementation follows the scoped item list and decisions.

## Validation results

- `pnpm fmt` passed.
- `pnpm check` passed.
- `pnpm validate:registry` passed with 50 registry items.
- `node --check scripts/serve-examples.mjs` passed.
- Example smoke tests returned 200 for `/examples/`, `/examples/visual-narrative-gallery/`, and `/examples/visual-narrative-gallery/?export=1`.
- Browser review via `npx agent-browser` confirmed the deck initializes (`data-ls-ready="true"`), has 8 slides, and exercises Batch 3 annotations, connectors, image cards, and legends.
- Screenshots captured to `/tmp/ls-slides-batch3-gallery-1.png` through `/tmp/ls-slides-batch3-gallery-8.png` and `/tmp/ls-slides-batch3-export.png` for visual inspection.

## Peer review summary

Fresh plan review confirmed that the visual narrative direction fits the project roadmap and current codebase. Required revisions were incorporated before finalizing:

- Trimmed weak/redundant items: removed `tag-cluster` and `visual-explainer` from Batch 3 scope.
- Kept `legend` because it fills a real diagram/accessibility gap.
- Clarified that `connector` provides manual SVG/CSS connector recipes, not auto-routing.
- Reordered implementation so components are built before dependent layouts and gallery composition.
- Clarified that `connector-grow` should share the same `pathLength="1"` stroke-dash model as `path-draw`, but document connector-specific usage.
- Strengthened `layered-canvas` guardrails around grid/flow baseline, explicit overlay mode, and live/export visual QA.
- Confirmed no further user clarification is required; the user approved creating the final trimmed plan.
