# Plan: Batch 1 primitive expansion

Date: 2026-06-26
Status: Implemented
Project: ls_slides

## Context

`ls_slides` is a copyable registry of vanilla HTML, CSS, and JavaScript slide-building blocks. It is not a framework, generator, runtime package, or publishable component library. The current foundation includes:

- `registry/core/base`
- `registry/animations/reveal`
- `registry/layouts/title-hero` and `registry/layouts/detail-split`
- `registry/components/badge`, `registry/components/card`, and `registry/components/diagram`
- scoped font presets under `registry/presets/fonts/*`
- `examples/project-intro`
- `scripts/serve-examples.mjs`
- `scripts/validate-registry.mjs`

The next branch should implement the first full primitive expansion batch. This should add enough layouts, components, and animations to make the registry substantially useful for both everyday professional decks and more expressive editorial decks.

## Goals

- Add the full Batch 1 primitive set as copyable registry items.
- Balance structured professional primitives with flexible creative primitives.
- Preserve the copyable shadcn-inspired item model: item directory, implementation file(s), `registry-item.json`, and concise `README.md`.
- Use modern CSS aggressively but safely: cascade layers, container queries, `:has()`, `color-mix()`, and anchor positioning as progressive enhancement.
- Keep all Batch 1 primitives vanilla and dependency-free.
- Avoid animation duplication by making new animation items explicit variants/extensions of the existing reveal model.
- Add a primitive gallery example that validates all new primitives together.
- Update `PROJECT.md`, registry docs, example docs, and this plan to track completed progress.

## User constraints

- Use `pnpm` only.
- No framework dependencies, runtime package, generator, Tailwind, or monorepo tooling.
- Preserve the copyable-registry model.
- Use `ls-` prefixed classes/attributes.
- Implement the **full Batch 1** in one branch.
- Support both professional “boring” slides and creative/editorial layouts.
- Take aggressive advantage of modern CSS and browser APIs, but use progressive enhancement when support is uneven.

## Research performed

Project-local docs reviewed:

- `PROJECT.md`
- `docs/primitive-expansion.md`
- `docs/modern-platform-strategy.md`
- existing registry item metadata for layouts, components, and animations
- `registry/animations/reveal/reveal.css`

External research is already captured in `docs/modern-platform-strategy.md`:

- MDN docs for CSS anchor positioning, container queries, cascade layers, `@property`, `color-mix()`, `:has()`, subgrid, scroll-driven animations, Popover API, Fullscreen API, Screen Wake Lock API, and View Transition API.
- web.dev docs/articles for anchor positioning, container queries baseline, and same-document View Transitions baseline.

No additional framework/library research is required because this batch is dependency-free vanilla HTML/CSS/JS.

## Decisions

### Full Batch 1 scope

Implement the full first batch in one branch, despite the higher review burden, because the user explicitly wants the full batch and the project benefits from a coherent gallery-scale primitive expansion.

Layouts:

- `registry/layouts/centered-statement`
- `registry/layouts/section-divider`
- `registry/layouts/two-column`
- `registry/layouts/comparison-grid`
- `registry/layouts/asymmetric-feature`
- `registry/layouts/image-spotlight`

Components:

- `registry/components/callout`
- `registry/components/metric`
- `registry/components/stat-grid`
- `registry/components/bullet-list`
- `registry/components/code-block`
- `registry/components/media-frame`
- `registry/components/quote`

Animations:

- `registry/animations/fade`
- `registry/animations/slide-up`
- `registry/animations/stagger`

Example:

- `examples/primitive-gallery`

### Animation model

The existing `registry/animations/reveal` item owns step-gated reveal state driven by the core runtime (`data-step`, `data-ls-step`, active slide state, export fallback, reduced motion). Batch 1 animation items should **not** replace or duplicate that contract.

- `animations/fade`: a reveal effect variant for opacity-only reveals. It should depend on `animations/reveal` and be used with the existing reveal markup, for example `class="ls-reveal ls-reveal-fade"` or another consistent `ls-` prefixed class chosen during implementation.
- `animations/slide-up`: a reveal effect variant for more configurable directional/vertical motion than the default reveal. It should depend on `animations/reveal`, expose variables such as distance/duration/easing, and remain distinct from the small default translate in `reveal.css`.
- `animations/stagger`: within-step sequencing only. It should apply delays to groups/children inside the current reveal step, using CSS variables and bounded child selectors. It should not require runtime changes.

Do not lift the current three-step reveal ceiling unless the primitive gallery genuinely needs it. If the ceiling is lifted, update `registry/animations/reveal/README.md` and explain why in this plan’s implementation notes.

### Modern CSS posture

- Use container queries where primitives need to adapt to their assigned slide region.
- Use `:has()` for optional child/slot-aware styling when selectors remain readable.
- Use `color-mix()` for accent surfaces and borders where it improves themeability.
- Use anchor positioning only as progressive enhancement behind `@supports`; baseline layout must still work without it.
- Do not introduce browser API runtime enhancements in this branch; Fullscreen, Wake Lock, Popover, and View Transitions belong in a later runtime/presentation-enhancement batch.

### Component dependency posture

- Prefer standalone components with `registryDependencies: ["core/base"]` unless a hard composition dependency is required.
- `stat-grid` may visually compose with `metric`, but should not require `metric` unless implementation reuses metric classes directly. If it does reuse `metric`, declare `registryDependencies: ["core/base", "components/metric"]`.
- Animation variants should depend on `animations/reveal` if they rely on its step-gated state.

## Alternatives considered

### Alternative A — Add a much larger primitive catalog immediately

Rejected. Batch 1 is already substantial. Additional items such as timelines, tables, terminals, connectors, and speaker/runtime controls should wait for later batches.

### Alternative B — Split Batch 1 into professional and creative sub-batches

Considered and recommended during peer review, but rejected by explicit user direction. Mitigation: keep the full branch coherent via strict conventions, a primitive gallery, visual review, and a peer review before commit.

### Alternative C — Only add professional/business primitives first

Rejected. The user explicitly wants both conventional slides and more creative expressive layouts.

### Alternative D — Only add creative/editorial primitives first

Rejected. The registry also needs familiar professional workhorse slides such as two-column, comparison, metrics, bullets, and code blocks.

### Alternative E — Add browser API runtime features first

Rejected for this branch. Fullscreen, wake lock, popovers, and View Transitions are useful, but the immediate value is a broader primitive vocabulary. Runtime enhancements should be a later batch.

### Alternative F — Make `fade`, `slide-up`, and `stagger` independent animation systems

Rejected. Independent systems would duplicate `animations/reveal` and fragment the runtime contract. Batch 1 animation items should be reveal-compatible variants/extensions.

## Implementation phases

### Phase 1 — Baseline and convention review

- [x] Check `git status --short`.
- [x] Run `pnpm check` before implementation. Baseline failed only because generated `.plans/*.html` preview was unformatted/untracked; removed generated preview before implementation.
- [ ] Review existing CSS conventions in:
  - `registry/core/base/reset.css`
  - `registry/core/base/tokens.css`
  - `registry/core/base/slide.css`
  - `registry/animations/reveal/reveal.css`
  - existing layout/component CSS files
- [x] Confirm all new styles use existing cascade layers:
  - layouts in `@layer layouts`
  - components in `@layer components`
  - animations in `@layer animations`
- [x] Decide final class naming before coding to avoid collisions and inconsistent APIs.

### Phase 2 — Metadata and item template conventions

Each new item must include:

```text
registry/<category>/<item>/
  <item>.css
  registry-item.json
  README.md
```

Metadata conventions:

```json
{
  "name": "layouts/example-name",
  "type": "ls:layout",
  "description": "Short human-readable description.",
  "files": [{ "path": "registry/layouts/example-name/example-name.css", "type": "registry:style" }],
  "registryDependencies": ["core/base"],
  "dependencies": [],
  "devDependencies": [],
  "docs": "registry/layouts/example-name/README.md"
}
```

Use:

- `ls:layout` for layouts
- `ls:component` for components
- `ls:animation` for animations
- `registry:style` for CSS files
- `registry:script` only if a future item truly ships JavaScript

Registry dependency names must match `name` fields of other indexed items, such as `core/base`, `animations/reveal`, or `components/metric`.

### Phase 3 — Implement layouts

Create CSS, metadata, and README files for every layout.

#### `centered-statement`

Purpose: sparse high-impact centered message slide.

Expected classes/regions:

- `.ls-centered-statement`
- optional eyebrow/kicker
- title/statement
- supporting text
- optional actions/meta row

Modern CSS opportunities:

- container-aware sizing where useful
- `:has()` for optional eyebrow/supporting text spacing

#### `section-divider`

Purpose: chapter/section transition slide.

Expected classes/regions:

- `.ls-section-divider`
- section number/kicker
- title
- short description
- optional footer/meta

Modern CSS opportunities:

- `color-mix()` for subtle section accent surfaces
- flexible alignment variants via attributes or modifiers

#### `two-column`

Purpose: reliable professional two-region layout.

Expected classes/regions:

- `.ls-two-column`
- `.ls-two-column__main`
- `.ls-two-column__aside`

Modern CSS opportunities:

- CSS grid
- custom property for column ratio
- container queries for stacked or denser variants if region width changes

#### `comparison-grid`

Purpose: option-vs-option, before/after, pros/cons.

Expected classes/regions:

- `.ls-comparison-grid`
- comparison columns/items/header/footer

Modern CSS opportunities:

- grid/subgrid where helpful
- container queries for two vs. three-or-more columns
- `:has()` for optional verdict/footer styling

#### `asymmetric-feature`

Purpose: creative “bold statement on one side, stacked content regions on the other”.

Expected classes/regions:

- `.ls-asymmetric-feature`
- statement region
- stack/content region
- optional accent/annotation region

Modern CSS opportunities:

- asymmetric grid ratios
- container queries
- optional anchor-positioned annotation as progressive enhancement

#### `image-spotlight`

Purpose: large visual with caption, overlay, or side annotation.

Expected classes/regions:

- `.ls-image-spotlight`
- media area
- content/annotation area
- optional caption/label

Modern CSS opportunities:

- `aspect-ratio` and `object-fit`
- anchor positioning for labels/annotations behind `@supports`
- fallback to absolute/grid placement

### Phase 4 — Implement components

Create CSS, metadata, and README files for every component.

#### `callout`

Purpose: highlighted note, warning, insight, or takeaway.

Modern CSS opportunities:

- `color-mix()` for accent variants
- `:has(.ls-icon)` or equivalent for icon spacing
- optional anchor-positioning hook for attached callouts

#### `metric`

Purpose: single KPI/stat block.

Modern CSS opportunities:

- container queries for compact/dense display
- semantic font roles and numeric emphasis

#### `stat-grid`

Purpose: grouped metrics.

Modern CSS opportunities:

- container queries for auto column count
- composition with `metric` if useful and declared

#### `bullet-list`

Purpose: styled bullets, checklists, and process bullets.

Modern CSS opportunities:

- custom markers/counters
- optional icon/check variants
- readable dense and spacious modes

#### `code-block`

Purpose: presentation-ready code snippets.

Modern CSS opportunities:

- no syntax highlighter dependency
- optional header/file/meta region
- horizontal overflow handling
- container-aware density

Use semantic HTML in examples/docs: `pre` and `code`.

#### `media-frame`

Purpose: frame for screenshots, images, videos, and diagrams.

Modern CSS opportunities:

- `aspect-ratio`
- `object-fit`
- optional caption and chrome styles
- `:has()` for caption/media variants

#### `quote`

Purpose: testimonial, pull quote, or cited statement.

Modern CSS opportunities:

- `:has()` for attribution/source spacing
- semantic font roles
- optional large quotation mark styling

Use semantic HTML in examples/docs: `blockquote`, `footer`, and/or `cite` where appropriate.

### Phase 5 — Implement animation variants

Create CSS, metadata, and README files for each animation item.

#### `fade`

- Reveal-compatible opacity-only effect.
- Depends on `animations/reveal`.
- Should not duplicate full reveal step selectors if it can work by overriding transform/variables on top of `.ls-reveal`.
- Respect `prefers-reduced-motion` through the base reveal behavior.

#### `slide-up`

- Reveal-compatible configurable slide-up effect.
- Depends on `animations/reveal`.
- Expose variables for distance/duration/easing where practical.
- Must be meaningfully different from the default small translate in `reveal.css`.
- Respect `prefers-reduced-motion` through the base reveal behavior.

#### `stagger`

- Within-step sequencing utility.
- Depends on `animations/reveal` if it assumes reveal classes.
- Use CSS custom properties and bounded child selectors.
- Document the default supported child count and how to extend it.
- Do not change runtime behavior unless absolutely necessary.

### Phase 6 — Update registry metadata and category docs

- [x] Add every new item metadata path to `registry.json`.
- [x] Run `pnpm validate:registry` early after adding metadata.
- [x] Update:
  - `registry/layouts/README.md`
  - `registry/components/README.md`
  - `registry/animations/README.md`
- [ ] Update `registry/README.md` only if copy/dependency guidance changes.
- [ ] Ensure animation docs clearly explain how `fade`, `slide-up`, and `stagger` compose with `animations/reveal`.

### Phase 7 — Add primitive gallery example

Create:

```text
examples/primitive-gallery/
  index.html
  README.md
```

Suggested slide coverage:

1. Centered statement + fade/slide-up variant.
2. Section divider.
3. Two-column with callout and bullet list.
4. Comparison grid with metric/stat-grid blocks.
5. Asymmetric feature with stacked content.
6. Image spotlight with media frame and quote/annotation.
7. Code/content slide with code block and staggered bullets.

Requirements:

- Link registry CSS files directly via relative `<link>` tags; no bundling.
- Respect load order: core first, then layouts/components/animations/presets as needed.
- Include enough examples to validate all new primitives without becoming a full docs site.
- Include at least one professional slide and one creative/editorial slide.
- Validate normal mode and `?export=1` mode.

### Phase 8 — Accessibility and semantic HTML pass

- [x] Use semantic elements in example markup where natural:
  - headings for slide titles
  - `ul`/`ol` for lists
  - `blockquote`/`cite` for quotes
  - `pre`/`code` for code blocks
  - `figure`/`figcaption` for media frames
- [x] Confirm color contrast is reasonable against the dark theme, especially for `color-mix()` surfaces.
- [x] Confirm animations honor reduced-motion behavior through reveal composition or explicit media queries.
- [x] Avoid hiding essential content in export/static mode.

### Phase 9 — Update project docs and progress tracking

- [x] Update `PROJECT.md` current registry foundation to mention the Batch 1 primitive expansion and primitive gallery after implementation.
- [x] Update `README.md` if the short project overview should mention the expanded primitive set.
- [x] Update `docs/primitive-expansion.md`:
  - mark Batch 1 as implemented or move it from recommended to completed,
  - keep later-batch direction visible.
- [x] Update `docs/modern-platform-strategy.md` only if implementation reveals new guidance or caveats. No changes needed.
- [x] Update this plan status to `Implemented` when complete.
- [x] Add implementation notes and commit hash(es) to this plan.
- [x] Do not add `skills/` content in this branch unless implementation reveals agent-facing usage instructions that are not already covered by registry READMEs/docs.

### Phase 10 — Validation and visual review

Run:

```sh
pnpm fmt
pnpm check
```

`pnpm check` already runs lint, format check, and registry validation.

If scripts are edited, also run targeted syntax checks for changed scripts. If scripts are not edited, do not treat `node --check` as meaningful validation for this CSS-heavy branch.

Serve and smoke-test examples:

```sh
pnpm serve:examples -- --port 4173
curl -I http://localhost:4173/examples/
curl -I http://localhost:4173/examples/primitive-gallery/
curl -I 'http://localhost:4173/examples/primitive-gallery/?export=1'
```

Browser/visual checks:

- `/examples/primitive-gallery/`
- `/examples/primitive-gallery/?export=1`
- keyboard navigation and reveal behavior
- every new layout at intended 16:9 scale
- reduced-motion behavior where practical
- fallback correctness for anchor-positioned enhancements

Because CSS has little automated coverage in the current project, use browser automation/screenshots when available, preferably via `agent-browser`, to inspect the primitive gallery in normal and export modes.

### Phase 11 — Peer review, cleanup, and commit

- [x] Run a fresh peer review after implementation, focused on:
  - coherence across all 16 new items,
  - copyability,
  - modern CSS usage without overengineering,
  - animation model clarity,
  - docs accuracy,
  - visual quality.
- [x] Address blocking feedback.
- [x] Ensure working tree contains no generated previews, server temp files, or screenshots unless intentionally tracked.
- [x] Commit with a concise message such as `Add first primitive expansion batch`.

## Validation

Minimum validation before declaring done:

```sh
pnpm check
```

If the example server is touched or example paths are added:

```sh
pnpm serve:examples -- --port 4173
curl -I http://localhost:4173/examples/
curl -I http://localhost:4173/examples/primitive-gallery/
curl -I 'http://localhost:4173/examples/primitive-gallery/?export=1'
```

Recommended visual validation:

- browser automation screenshot pass for the primitive gallery
- normal mode and export mode
- all slides/reveal states that exercise new primitives

## Risks / rollback

- Risk: Full Batch 1 is large and may produce inconsistent APIs. Mitigation: follow strict naming/metadata/doc conventions and validate everything in one gallery.
- Risk: Animation items duplicate `animations/reveal`. Mitigation: implement them as reveal-compatible variants/extensions with explicit dependencies.
- Risk: The three-step reveal ceiling may constrain dense slides. Mitigation: keep stagger within-step; only extend reveal step selectors if the gallery genuinely needs more steps.
- Risk: Modern CSS features reduce compatibility. Mitigation: use progressive enhancement for uneven features and keep baseline layouts functional.
- Risk: Components duplicate existing `card`/`diagram` capabilities. Mitigation: keep new components clearly scoped and reusable.
- Risk: Example deck becomes too large. Mitigation: cover all primitives in roughly seven focused slides.
- Rollback: revert the implementation commit(s). Registry additions are additive and should not break existing examples if metadata remains valid.

## Implementation progress

- [x] Phase 1 — Baseline and convention review complete.
- [x] Phase 2 — Metadata and item template conventions applied to all new items.
- [x] Phase 3 — Six layouts implemented.
- [x] Phase 4 — Seven components implemented.
- [x] Phase 5 — Three reveal-compatible animation variants implemented.
- [x] Phase 6 — Registry metadata and category docs updated.
- [x] Phase 7 — `examples/primitive-gallery` added.
- [x] Phase 8 — Semantic/accessibility pass completed.
- [x] Phase 9 — Project docs and progress tracking updated.
- [x] Phase 10 — Validation and visual review completed.
- [x] Phase 11 — Peer review, cleanup, and commit pending.

## Implementation notes

- Removed generated `.plans/2026-06-26-batch-1-primitive-expansion.html` preview from the working tree; the project tracks Markdown plan sources only.
- Did not extend the three-step reveal ceiling; the gallery uses within-step staggering with `animations/stagger`.
- `fade` and `slide-up` are thin `.ls-reveal` variants loaded after `animations/reveal`; `stagger` sets child `--ls-delay` values only.
- Validation: `pnpm validate:registry`, `pnpm fmt`, and `pnpm check` passed. Post-review `pnpm check` also passed.
- Smoke tests: `curl -I` passed for `/examples/`, `/examples/primitive-gallery/`, and `/examples/primitive-gallery/?export=1`.
- Browser visual review: captured normal-mode gallery screenshots and export-mode screenshot with `npx agent-browser`; no blocking layout issues found.

## Peer review outcome

- Fresh review accepted the overall implementation and identified one blocking layout-height defect plus README/API documentation cleanup.
- Fixed direct-child full-slide layout height for `asymmetric-feature` and `image-spotlight`.
- Replaced boilerplate new-item READMEs with concrete usage contracts and removed stale animation README text.
- Wired the `asymmetric-feature` anchor-positioning enhancement instead of leaving a no-op hook.
- Removed a non-functional `comparison-grid` subgrid enhancement.
- Commits: `a8e1e84`; follow-up fixes are included in the final docs/layout polish commit.
- Follow-up: `.plans/2026-06-26-batch-1-layout-api-polish.md` tracks the corrective layout API pass for the three user-flagged Batch 1 layouts.

## Peer review summary

Initial peer review approved the overall structure but flagged these required improvements:

- Avoid animation duplication with existing `animations/reveal`.
- Resolve stagger semantics and the three-step reveal ceiling.
- Pin metadata conventions precisely.
- Acknowledge full-batch size risk.
- Add accessibility/semantic HTML guidance.
- Add stronger visual validation because CSS has little automated coverage.

The final plan incorporates that feedback. The user explicitly chose to keep the full Batch 1 in one branch rather than splitting it into sub-batches.
