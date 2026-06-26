# Plan: Batch 2 Structured Slide Polish

Date: 2026-06-26
Status: In Progress
Project: ls_slides

## Context

Batch 2 added structured content and data primitives: dashboards, timelines, tables, steps, progress, highlights, and the `examples/structured-content-gallery` deck. Visual review of the gallery revealed several issues that are important because `ls_slides` is a reusable primitive registry: the examples should model hard-to-misuse defaults, not fragile one-off markup.

Observed issues:

1. The metric dashboard’s right-side metric/progress columns look stretched, with content vertically distributed across tall cards.
2. The timeline strip’s fourth milestone is visible from the start, and the timeline line itself appears before the milestone sequence.
3. The process/progress slide is static; numbered steps, right-column timeline items, and progress filling could animate in a more presentation-appropriate sequence.
4. The table caption clips the first glyph in “Operating model comparison,” likely because caption text is inside a clipped table formatting context.
5. Several structured slides leave too much unused bottom space because content is top-packed inside large slide safe areas.

The goal is not only to repair the gallery, but to improve the primitives so downstream copied decks are less likely to reproduce these mistakes.

## Goals

- Preserve the copyable, dependency-free, vanilla HTML/CSS/JS registry model.
- Improve defaults and APIs so structured slide primitives are reusable and adaptable.
- Make reveal/step sequencing hard to misuse for common 4+ item timelines and processes.
- Keep animations optional and progressive, but make example sequencing credible and product-quality.
- Avoid layout stretch defaults that distribute small content awkwardly across tall regions.
- Fix table caption clipping at the primitive level, not with a gallery-only hack.
- Improve safe-area utilization through layout contracts and examples rather than arbitrary global padding reductions.
- Validate visually in `examples/structured-content-gallery` normal and export modes.

## User constraints

- Use `pnpm` only.
- Preserve vanilla, copyable registry architecture.
- No framework, generator, runtime package, Tailwind, charting library, GSAP, or new root dependency.
- Use `ls-` prefixed classes and attributes.
- Keep primitives semantic, dependency-free, and useful beyond the demo deck.
- Do not paper over issues with dirty one-off fixes; prefer reusable primitive/API improvements.

## Research performed

Local project research:

- Read `docs/primitive-authoring.md` for layout root, alignment, sizing, decoration, progressive enhancement, and visual QA contracts.
- Read `docs/primitive-expansion.md` for Batch 2 quality bar and primitive roadmap.
- Inspected `registry/core/base/slide.css` to understand slide safe area, header/body rows, and scaling/export behavior.
- Inspected `examples/structured-content-gallery/index.html` to identify the exact markup causing reveal gaps and static progress.
- Inspected these affected primitive files:
  - `registry/layouts/metric-dashboard/metric-dashboard.css`
  - `registry/layouts/timeline-strip/timeline-strip.css`
  - `registry/components/metric/metric.css`
  - `registry/components/progress/progress.css`
  - `registry/components/table/table.css`
  - `registry/animations/reveal/reveal.css`
  - `registry/animations/step-focus/step-focus.css`
  - `registry/animations/scale-in/scale-in.css`
  - `registry/animations/highlight/highlight.css`
- Measured current layout behavior in browser via `npx agent-browser`:
  - metric dashboard metric cards stretch to about 375px tall, and internal metric rows distribute across that height;
  - timeline line is a background on `.ls-timeline-strip__track`, so it is visible independent of reveal state;
  - Q4 has no `.ls-reveal` / `data-step`, so it is always visible;
  - the base reveal CSS only has selectors through step 3 even though the runtime computes arbitrary max steps;
  - table caption is a `table-caption` inside a table with `overflow: hidden` and rounded clipping;
  - multiple slides reserve the full body safe area but top-pack content.

External research is not required. The required behavior uses project-local vanilla CSS/JS contracts and existing browser platform features already used by the project.

## Diagnosis

### Metric dashboard stretch

`metric-dashboard` defaults to `align-items: stretch`; its metric region fills the right side, and each child becomes a tall grid item. The `metric` component itself is `display: grid` without `align-content: start`, so its internal rows are stretched/distributed by the grid layout algorithm. The result is not a data-card default; it is a forced column fill.

### Timeline reveal mismatch

The current reveal system has a split contract:

- `slide-runtime.js` computes `getMaxStep()` from all `[data-step]` values and can navigate beyond three steps.
- `registry/animations/reveal/reveal.css` only contains hard-coded selectors for steps 1–3.

This creates a hidden failure mode: authors can add `data-step="4"`, the runtime will navigate to step 4, but CSS will not reveal it. The gallery avoided this accidentally by omitting `data-step` from Q4, causing the opposite failure: Q4 is always visible.

The timeline line is independent from reveal because it is a background image on `.ls-timeline-strip__track`, not an animatable/revealable child element.

### Process/progress animation gap

The process slide uses status styling but no reveal/animation markup. The progress primitive supports native and custom bars, but it does not currently provide a reveal-aware fill animation. Native `<progress>` is accessible but hard to animate consistently across browsers; the custom `.ls-progress__track` / `.ls-progress__bar` markup is better for fill animation.

### Table caption clipping

The table component puts `overflow: hidden` and `border-radius` directly on the semantic `<table>`. Captions participate in the table formatting context. Because the caption begins at the clipped table edge, glyph ink/antialiasing can be clipped at the left/top edge. This is especially visible on round uppercase/lowercase glyphs like “O”.

### Safe-area utilization

The slide shell has generous fixed padding and a header/body grid. Many structured layouts fill the body region but align their content to the top. This is correct for some dense slides but creates too much bottom whitespace for dashboard, timeline, and process examples. The issue should be solved with layout-level vertical composition APIs, not by globally shrinking safe area padding.

## Decisions

### Decision 1 — Fix reveal sequencing at the runtime contract level

Introduce runtime-managed reveal state attributes for `[data-step]` elements in the active slide, while keeping the existing `data-step` authoring API.

Proposed state:

```html
<div class="ls-reveal" data-step="4" data-ls-reveal-state="future|current|past"></div>
```

Runtime behavior:

- For active slide elements with `data-step`:
  - `future` when `elementStep > currentStep`.
  - `current` when `elementStep === currentStep`.
  - `past` when `elementStep < currentStep`.
- In export mode, set `data-ls-reveal-state="past"` or remove hiding so all content is visible.
- In inactive slides, state can be reset to `future` or left irrelevant because inactive slides are hidden/inert.
- Preserve existing `data-step` and `data-ls-step` attributes for compatibility.

CSS behavior:

- Update `animations/reveal` to hide `.ls-reveal[data-ls-reveal-state="future"]` generically.
- Show `current` and `past` generically.
- Remove the old step 1–3 state selectors after runtime-generated state is in place; no-runtime mode already shows all content via `.ls-deck:not([data-ls-ready])`.
- Update `step-focus` to dim `past` and `future` siblings generically instead of enumerating only steps 1–3.

Rationale: this removes the three-step ceiling. Combined with the opt-in auto-sequence API, 4+ item timelines/processes become safe without adding dependencies or changing the basic `.ls-reveal` authoring model.

### Decision 2 — Make stretch opt-in for metric/dashboard cards

Structured dashboard defaults should be content-aligned. Stretch should be available when a deck intentionally wants equal-height panels.

- Add `align-content: start` to `.ls-metric`.
- Add `align-content: start` to custom `.ls-progress` wrappers where appropriate.
- Change `metric-dashboard` defaults so metric cards do not stretch awkwardly by default.
- Preserve an opt-in stretch mode via `data-ls-valign="stretch"` or a documented variable/class.

Rationale: good defaults should avoid false visual hierarchy and odd spacing. Equal-height cards are useful, but not as the default for sparse metric content.

### Decision 3 — Make timeline strip line a real/reveal-aware part of the primitive

Do not keep the timeline line as an always-visible background for the validated animated example.

Preferred implementation:

- Add an internal/optional line element in recommended markup:

```html
<div class="ls-timeline-strip__line ls-reveal" data-step="1" aria-hidden="true"></div>
```

- Position it in normal layout context or as a safe pseudo/child within the track without overlapping essential content.
- Use transform/scale inline animation for the line when revealed.
- Respect `prefers-reduced-motion: reduce` by snapping the line to its final visible state instead of animating the scale/fill.
- Keep `data-ls-progress="true"` as a static fallback/default style for non-animated timelines, but document that animated timelines should use the line child.

Rationale: a visual progression line is meaningful content decoration in animated roadmaps; it should be revealable and controllable without creating motion requirements for reduced-motion users.

### Decision 4 — Add reveal-aware progress fill for custom bars, keep native progress accessible/static

Use custom progress markup for animated fills, with a documented accessible ARIA pattern.

- Add optional `data-ls-animate="fill"` or `.ls-progress[data-ls-animate="fill"]` behavior.
- Animate `.ls-progress__bar` from `transform: scaleX(0)` to `scaleX(1)` when the progress wrapper reveal state becomes `current`/`past`.
- Preserve native `<progress>` styling for static accessible bars; do not attempt complex native pseudo-element animation.
- Update README with two recipes:
  - native/static, simplest accessibility;
  - custom/animated, with `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, and visible label/value.

Rationale: progress fill animation is valuable, but native control animation is inconsistent. The primitive should guide users to the reliable pattern.

### Decision 5 — Fix table clipping by separating table semantics from clipped surface

Remove direct clipping from semantic `<table>` defaults and introduce an optional frame/wrapper for rounded surfaces.

- Add `.ls-table-frame` or `.ls-table__frame` as the recommended clipped/rounded surface wrapper.
- Keep `.ls-table` usable directly on `<table>` without clipping captions.
- Prefer `border-collapse: separate; border-spacing: 0;` and cell-corner radius rules over `overflow: hidden` on the table itself.
- Support caption either as native `<caption>` or outside in `<figure>/<figcaption>`.
- Update gallery to use the documented robust pattern.

Rationale: semantic table markup should not clip text. Rounded visuals should be handled by a surface wrapper or cell radii.

### Decision 6 — Improve safe-area use with layout composition APIs, not global padding changes

Do not reduce `.ls-slide__inner` padding globally in this fix. Instead:

- Add or complete `data-ls-valign` support on affected structured layouts/components:
  - `metric-dashboard`: `start|center|space-between|stretch`.
  - `timeline-strip`: `start|center|space-between`.
  - `two-column`: add/confirm `data-ls-valign` / `--ls-two-column-align-content` for body-level vertical composition where process slides use it.
- Use these APIs in the gallery to demonstrate better vertical/horizontal safe-area distribution.
- Document the pattern in the affected READMEs and `docs/primitive-authoring.md` if new guidance generalizes.

Rationale: some slides should be top-aligned, some centered, some distributed. The primitive library needs explicit composition controls rather than implicit top packing or global padding tweaks.

### Decision 7 — Treat the gallery as product-quality validation, not merely class coverage

Update `examples/structured-content-gallery` so it demonstrates safe defaults:

- Metric dashboard: content-aligned metric cards, no awkward internal stretch.
- Timeline: all four milestones reveal in the intended order; line reveal matches the narrative.
- Process: numbered steps, right-column timeline, divider, and custom progress fill animate in a coherent sequence.
- Table: caption is not clipped and table remains semantic.
- Slide bodies use documented vertical composition APIs to reduce excessive bottom voids.

### Decision 8 — Add an opt-in auto-sequence API for reveal groups

Runtime reveal state fixes the three-step ceiling, but it does not by itself prevent authors from forgetting `data-step` on one item. To make timeline/process defaults hard to misuse, add a small runtime-assisted opt-in sequence API:

```html
<div class="ls-timeline-strip__track ls-step-focus" data-ls-reveal-sequence>
  <article class="ls-timeline-strip__item ls-reveal">...</article>
  <article class="ls-timeline-strip__item ls-reveal">...</article>
  <article class="ls-timeline-strip__item ls-reveal">...</article>
  <article class="ls-timeline-strip__item ls-reveal">...</article>
</div>
```

Behavior:

- On initialization, the runtime assigns missing `data-step` values to direct `.ls-reveal` children in DOM order.
- Explicit `data-step` values remain respected, so authors can override sequence order when needed.
- The assigned values are plain attributes, visible in DevTools and compatible with existing reveal CSS/state.
- Scope is opt-in; existing decks do not get surprise sequencing.

Rationale: this directly addresses the Q4 failure mode. A copied timeline can add a fifth item without needing to remember the exact step number, while still preserving full manual control for advanced decks.

### Decision 9 — Flip poor defaults even if it is a small visual breaking change

For `metric-dashboard`, the current default `stretch` behavior is a poor default for sparse metric cards. Flip the default to content-aligned/start and keep stretch as an explicit `data-ls-valign="stretch"` option. Audit existing examples and document the change. This is acceptable because the project is still evolving as a registry and the new default better matches the reusable primitive goal.

### Decision 10 — Alignment naming convention remains semantic

Keep the existing convention from `docs/primitive-authoring.md`:

- `data-ls-align` controls inline-axis placement/alignment.
- `data-ls-valign` controls block-axis placement/alignment.

Where a current layout uses `data-ls-align` for vertical placement, treat that as a bug/legacy inconsistency and migrate it to `data-ls-valign`, with README notes. Do not add two parallel attributes for the same axis.

### Decision 11 — Table fix must not rely on a clipped wrapper around native captions

The default table solution is cell-corner radius with no `overflow: hidden` on the semantic `<table>`. A clipped wrapper is only safe when caption text is outside the clipped surface, e.g. `figure > figcaption + .ls-table-frame > table`. The default native `<caption>` path must remain unclipped.

## Alternatives considered

### Alternative A — Extend reveal CSS selectors from 3 to 8 or 10 steps

Rejected as the primary fix. It is simple and CSS-only, but it preserves the same footgun at a higher number. It also makes `reveal.css`, `step-focus.css`, and future reveal-compatible animations verbose and easy to desynchronize.

### Alternative B — Keep reveal unchanged and fix only the gallery markup

Rejected. Adding `data-step="1|2|3"` to visible items and leaving Q4 static would not address the underlying library problem. Adding docs warning about the three-step ceiling is not enough for a reusable primitive library.

### Alternative C — Introduce a new independent sequencing animation primitive

Rejected for this fix. A separate sequence system would duplicate the reveal contract and fragment authoring. The current reveal runtime already understands steps; it should expose enough state for CSS to target them robustly.

### Alternative D — Use CSS-only modern selectors to compare `data-step` to current slide step

Rejected. CSS cannot generally compare numeric attribute values between parent and child. Hard-coded selectors are the current limitation. Runtime-managed state is simpler and more robust.

### Alternative E — Globally reduce slide padding or body gap

Rejected. The empty-space issue is not uniform across all slide types. Sparse/editorial slides often benefit from the existing safe area. Dense structured slides need better composition controls, not global shrinkage.

### Alternative F — Animate native `<progress>` directly

Rejected as the recommended path. Browser pseudo-element support for native progress styling/animation is inconsistent. Keep native progress for static accessible bars; use custom ARIA markup for animated fills.

## Implementation phases

### Phase 1 — Baseline and focused regression capture

- [x] Confirm `git status --short` is clean or only contains this plan. Only the plan Markdown and generated HTML preview were untracked; removed generated preview before implementation.
- [x] Run `pnpm check` as baseline. Baseline failed only because generated `.plans/*.html` preview was unformatted/untracked; removed generated preview.
- [x] Start examples server and capture current screenshots for affected slides:
  - metric dashboard,
  - timeline strip at steps 0–4,
  - process/progress slide,
  - comparison table slide,
  - export mode.
- [x] Record current browser measurements for:
  - metric card heights/internal row distribution,
  - timeline item visibility at each step,
  - table caption bounding box/clipping,
  - bottom/right empty safe-area estimates.

### Phase 2 — Upgrade reveal runtime state safely

Affected files:

- `registry/core/base/slide-runtime.js`
- `registry/animations/reveal/reveal.css`
- `registry/animations/reveal/README.md`
- `registry/animations/step-focus/step-focus.css`
- `registry/animations/step-focus/README.md`
- possibly `registry/animations/scale-in/scale-in.css`
- possibly `registry/animations/highlight/highlight.css`

Tasks:

- [x] Add a helper in `slide-runtime.js` that updates reveal state for `[data-step]` descendants whenever slide state changes.
- [x] Keep the public author API unchanged: `.ls-reveal` plus `data-step="N"`.
- [x] Set `data-ls-reveal-state="future|current|past"` on stepped elements in the active slide.
- [x] Ensure export mode shows all stepped content.
- [x] Update `reveal.css` to use generic reveal-state selectors as the primary behavior.
- [x] Remove the old hard-coded 1–3 reveal selectors once generic reveal-state selectors are active.
- [x] Update `step-focus.css` to dim past items and keep current emphasized; future `.ls-reveal` items remain hidden by the base reveal contract to avoid exposing unrevealed content.
- [x] Update `highlight` and `scale-in` if needed so reveal-compatible variants work with generic reveal state.
- [x] Add `data-ls-reveal-sequence` runtime support that assigns missing `data-step` values to direct `.ls-reveal` children in DOM order while respecting explicit steps.
- [x] Update docs to explain runtime-generated reveal state and optional auto-sequencing.

Validation for this phase:

- [x] Test a gallery element with `data-step="4"` and confirm it reveals at step 4.
- [x] Test `data-ls-reveal-sequence` by omitting `data-step` on timeline children and confirming steps are assigned/revealed in order.
- [x] Confirm existing Batch 1 examples still reveal correctly.
- [x] Confirm export mode shows all reveal content.

### Phase 3 — Fix metric/dashboard stretching defaults

Affected files:

- `registry/components/metric/metric.css`
- `registry/components/metric/README.md`
- `registry/components/progress/progress.css`
- `registry/components/progress/README.md`
- `registry/layouts/metric-dashboard/metric-dashboard.css`
- `registry/layouts/metric-dashboard/README.md`

Tasks:

- [x] Add `align-content: start` to `.ls-metric` so internal metric rows do not distribute across tall cards by default.
- [x] Add `align-content: start` to custom `.ls-progress` wrappers when used as cards/regions.
- [x] Flip `.ls-metric-dashboard` default block-axis behavior from stretch to start/content-aligned.
- [x] Preserve equal-height/stretched metrics through explicit `data-ls-valign="stretch"` on `.ls-metric-dashboard`.
- [x] Audit current examples for any expected equal-height dashboard behavior before and after the default flip.
- [x] Document the default and stretch option.
- [x] Update the metric dashboard gallery slide to use the new default or explicit API, not inline hacks.

Validation for this phase:

- [x] Metric values/labels should visually cluster within cards instead of being distributed from top to bottom.
- [x] Optional stretch mode should still be available and visually acceptable.

### Phase 4 — Make timeline-strip sequencing robust

Affected files:

- `registry/layouts/timeline-strip/timeline-strip.css`
- `registry/layouts/timeline-strip/README.md`
- `examples/structured-content-gallery/index.html`

Tasks:

- [x] Add recommended support for an explicit `.ls-timeline-strip__line` child.
- [x] Make `.ls-timeline-strip__line` safe in normal flow or safely layered without overlapping text/markers.
- [x] Support line reveal/fill animation when combined with `.ls-reveal` and `data-step`.
- [x] Add reduced-motion handling so the line snaps to the final visible state when `prefers-reduced-motion: reduce` is active.
- [x] Decide whether `data-ls-progress="true"` remains a static-background convenience or maps to the line child only in new examples.
- [x] Update gallery timeline markup to use `data-ls-reveal-sequence` for the four milestones so Q1–Q4 are assigned/revealed in order without manual per-item step numbers.
- [x] Give the line an explicit reveal step or a sequence-compatible static position so line behavior matches the intended narrative.
- [x] Update `step-focus` behavior so current item is emphasized and past/future items are dimmed consistently for arbitrary steps.

Validation for this phase:

- [x] At step 0, no timeline items or line should be visible unless intentionally documented.
- [x] At each step, the intended item and line state should be visible.
- [x] Q4 should reveal at step 4 without custom selectors.
- [x] Export mode should show all four items and the full line.
- [x] Reduced-motion mode should show the correct line state without scale/fill animation.

### Phase 5 — Add reveal-aware progress fill and animate process slide

Affected files:

- `registry/components/progress/progress.css`
- `registry/components/progress/README.md`
- `examples/structured-content-gallery/index.html`
- possibly `registry/animations/reveal/reveal.css` if generic state support requires shared utility behavior

Tasks:

- [x] Add an opt-in animated custom bar API, e.g. `data-ls-animate="fill"` on `.ls-progress` custom wrapper.
- [x] Implement fill animation with `transform: scaleX(...)` and `transform-origin: left`, driven by reveal state where possible.
- [x] Respect reduced motion by snapping to the final value.
- [x] Preserve native `<progress>` as the static/simple accessible option.
- [x] Update the progress README with native/static and custom/animated examples.
- [x] Update process slide to use custom progress markup for animated fill with proper ARIA attributes and visible label/value.
- [x] Add `.ls-reveal` / `data-step` sequencing to numbered steps, divider, right-column timeline items, and progress.
- [x] Consider loading/using existing `animations/stagger` only if same-step stagger adds value without hiding essential content.

Validation for this phase:

- [x] Process slide should have a coherent staged entrance.
- [x] Progress fill should animate when its step appears.
- [x] Export mode should show the filled progress value.
- [x] Reduced motion should avoid distracting fill animation.

### Phase 6 — Fix table caption clipping at primitive level

Affected files:

- `registry/components/table/table.css`
- `registry/components/table/README.md`
- `examples/structured-content-gallery/index.html`

Tasks:

- [x] Remove or avoid `overflow: hidden` on `.ls-table` when it is applied directly to `<table>`.
- [x] Update table border/corner styling with `border-collapse: separate`, `border-spacing: 0`, and cell-corner radii so the visual surface remains polished without clipping captions.
- [x] Support native `<caption>` without clipping as the default path.
- [x] Optionally document `.ls-table-frame` only for tables whose caption is outside the clipped frame, such as `<figure><figcaption>...<div class="ls-table-frame"><table>...</table></div></figure>`.
- [x] Update gallery table slide to use the recommended robust pattern.

Validation for this phase:

- [x] Caption glyphs should not clip at top/left.
- [x] Rounded/striped table appearance should remain visually coherent.
- [x] Table semantics (`caption`, `scope`) must remain intact.

### Phase 7 — Improve safe-area composition APIs and gallery use

Affected files:

- `registry/layouts/metric-dashboard/metric-dashboard.css`
- `registry/layouts/timeline-strip/timeline-strip.css`
- `registry/layouts/two-column/two-column.css`
- respective READMEs
- `docs/primitive-authoring.md` if guidance generalizes
- `examples/structured-content-gallery/index.html`

Tasks:

- [x] First re-measure after the metric-dashboard, timeline, progress, and table fixes; do not add speculative APIs if defaults already improve safe-area use.
- [x] Add or complete `data-ls-valign` support for structured layouts where measured issues remain.
- [x] For `metric-dashboard`, support `start|center|space-between|stretch` composition if needed, with `start` as the new default.
- [x] For `timeline-strip`, migrate block-axis placement to `data-ls-valign="start|center|space-between"` if current `data-ls-align` is controlling vertical alignment.
- [x] For `two-column`, add a body-level vertical composition API only if the process slide still needs it after content sequencing/progress changes.
- [x] Use these APIs in the gallery rather than reducing global slide padding.
- [x] Document when to choose `start`, `center`, `space-between`, and `stretch`.
- [x] Keep sparse/editorial slides unaffected.

Validation for this phase:

- [x] Affected slides should use vertical space more intentionally.
- [x] No slide should feel artificially stretched or sparse.
- [x] Export mode should preserve composition.

### Phase 8 — Documentation and plan tracking

- [x] Update affected item READMEs with new APIs and examples.
- [x] Update `docs/primitive-authoring.md` with safe-area composition and reveal-state guidance if these become shared contracts.
- [x] Update `docs/primitive-expansion.md` quality bar with the Batch 2 polish lessons:
  - avoid stretch defaults for sparse content,
  - reveal sequencing must support realistic item counts,
  - captions should not be clipped by decorative surfaces,
  - safe-area utilization should be explicit.
- [ ] Update this plan with implementation notes, validation results, peer review outcome, and commit hashes when implemented.

### Phase 9 — Validation and visual review

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
curl -I http://localhost:4173/examples/primitive-gallery/
```

Browser/visual review:

- [x] Capture screenshots for all `structured-content-gallery` slides.
- [x] Capture focused screenshots for:
  - metric dashboard,
  - timeline steps 0–4,
  - process slide steps,
  - table caption,
  - export mode.
- [x] Verify Batch 1 `primitive-gallery` still initializes and reveals correctly after runtime reveal changes.
- [x] Use browser `eval` checks for:
  - `data-step="4"` reveal works,
  - export mode shows all reveal content,
  - table caption is not clipped,
  - no key dense elements overflow their containers.

### Phase 10 — Fresh peer review and commit

- [ ] Run fresh peer review after implementation, focused on:
  - reveal runtime compatibility,
  - primitive API quality,
  - avoiding one-off gallery hacks,
  - accessibility and semantic markup,
  - visual quality and safe-area use,
  - export mode behavior.
- [ ] Address blocking feedback.
- [ ] Ensure no screenshots, server logs, or temporary files are tracked.
- [ ] Commit with a concise message such as `Refine structured slide sequencing and layout defaults`.
- [ ] Mark this plan `Implemented` when complete.

## Expected files to change

Likely code/style files:

```text
registry/core/base/slide-runtime.js
registry/animations/reveal/reveal.css
registry/animations/step-focus/step-focus.css
registry/animations/scale-in/scale-in.css
registry/animations/highlight/highlight.css
registry/components/metric/metric.css
registry/components/progress/progress.css
registry/components/table/table.css
registry/layouts/metric-dashboard/metric-dashboard.css
registry/layouts/timeline-strip/timeline-strip.css
registry/layouts/two-column/two-column.css
examples/structured-content-gallery/index.html
```

Likely docs:

```text
registry/animations/reveal/README.md
registry/animations/step-focus/README.md
registry/components/metric/README.md
registry/components/progress/README.md
registry/components/table/README.md
registry/layouts/metric-dashboard/README.md
registry/layouts/timeline-strip/README.md
registry/layouts/two-column/README.md
docs/primitive-authoring.md
docs/primitive-expansion.md
.plans/2026-06-26-batch-2-structured-slide-polish.md
```

## Risks / rollback

- Risk: Runtime reveal-state changes regress existing reveal behavior. Mitigation: keep public `data-step` API, validate `examples/project-intro`, `primitive-gallery`, and `structured-content-gallery`, and avoid duplicate CSS selector systems.
- Risk: Auto-sequencing surprises authors if applied too broadly. Mitigation: make it explicit opt-in via `data-ls-reveal-sequence`, respect manually supplied `data-step`, and document scope.
- Risk: Flipping `metric-dashboard` default from stretch to start changes existing deck visuals. Mitigation: audit examples, document `data-ls-valign="stretch"` as the opt-in compatibility path, and prefer the better default for future copied decks.
- Risk: Adding reveal state feels like a larger runtime contract. Mitigation: document it as internal/runtime-generated state; users still author plain `data-step` markup.
- Risk: `step-focus` semantics may become too opinionated. Mitigation: keep it optional and variable-driven; export mode disables dimming.
- Risk: Animated progress may reduce accessibility if custom markup is incomplete. Mitigation: document required ARIA pattern and keep native progress as the default static option.
- Risk: Safe-area composition changes could alter existing layout feel. Mitigation: prefer opt-in APIs and update defaults only where current defaults are clearly poor.
- Rollback: revert the implementation commit(s). Changes should be confined to reveal runtime/CSS, affected Batch 2 primitives, the structured gallery, and docs.

## Implementation progress

- [x] Phase 1 — Baseline and focused regression capture.
- [x] Phase 2 — Reveal runtime state upgraded safely.
- [x] Phase 3 — Metric/dashboard stretching defaults fixed.
- [x] Phase 4 — Timeline-strip sequencing made robust.
- [x] Phase 5 — Reveal-aware progress fill and process animation added.
- [x] Phase 6 — Table caption clipping fixed at primitive level.
- [x] Phase 7 — Safe-area composition APIs and gallery use improved.
- [x] Phase 8 — Documentation and plan tracking updated.
- [x] Phase 9 — Validation and visual review completed.
- [ ] Phase 10 — Peer review and commit completed.

## Implementation notes

- Removed the generated HTML plan preview before implementation; only Markdown plans are tracked.
- Added runtime-generated `data-ls-reveal-state` for stepped elements and opt-in `data-ls-reveal-sequence` auto-numbering for direct `.ls-reveal` children.
- Removed hard-coded 1–3 reveal CSS selectors; reveal variants now key off runtime state.
- Kept future items hidden by base reveal even inside `step-focus`; past siblings dim and current siblings stay emphasized.
- Changed `metric-dashboard` to content-aligned/start by default and preserved stretch as explicit `data-ls-valign="stretch"`.
- Added reveal-aware timeline line and custom progress fill patterns.
- Fixed table caption clipping by removing table overflow clipping and using separate borders/cell radii; `.ls-table-frame` is documented for external captions.
- Updated the structured gallery to use reusable APIs rather than one-off layout hacks.

## Validation results

- `pnpm check` passed.
- `pnpm validate:registry` passed via `pnpm check` with 40 registry items.
- `node --check scripts/serve-examples.mjs` passed.
- Smoke tests returned 200 for `/examples/`, `/examples/structured-content-gallery/`, `/examples/structured-content-gallery/?export=1`, `/examples/primitive-gallery/`, and `/examples/project-intro/`.
- Browser review via `npx agent-browser` captured structured gallery screenshots, focused timeline step 0-4 screenshots, focused process step 0-6 screenshots, and export screenshot under `/tmp/ls-slides-polish-*.png`.
- Browser eval confirmed structured gallery initializes, timeline auto-sequence assigned steps `1..4`, export mode has no `future` reveal states, table caption has a non-zero box and is not clipped, key dense elements have no overflow candidates, and Batch 1 primitive gallery still initializes.
- Post-review fix validation confirmed `slide-up` now settles to `translateY(0)` for current reveal state, and `pnpm check` passed.

## Peer review outcome

- Fresh implementation review accepted the architecture but found one blocking regression: `animations/slide-up` still targeted `[data-step]`, so it overrode the new reveal-state show transform after elements became current/past.
- Fixed `slide-up` to target only `data-ls-reveal-state="future"`.
- Migrated `fade` to the reveal-state selector model for consistency.
- Updated `fade` and `slide-up` READMEs to mention the runtime reveal-state contract.

## Peer review summary

Fresh plan review confirmed the diagnoses and the runtime reveal-state direction. Required revisions incorporated before finalizing:

- Added explicit `data-ls-reveal-sequence` auto-sequencing because runtime reveal state alone would not prevent forgotten `data-step` values such as the Q4 bug.
- Chose to remove the old 1–3 fallback selector path after reveal state lands, because no-runtime decks already show all content.
- Reframed metric-dashboard work as a default flip from `stretch` to `start`, with audit and explicit stretch opt-in.
- Clarified the alignment attribute convention: `data-ls-align` for inline axis, `data-ls-valign` for block axis; fix current inconsistencies instead of adding parallel APIs.
- Corrected the table strategy: no clipped wrapper around native captions by default; use cell-corner radii/no overflow, and reserve frames for external figcaptions.
- Added reduced-motion handling for the timeline line animation and measurement-first safe-area API work.

No further user clarification is required: the user asked for best reusable primitive solutions, and the plan chooses the stronger defaults/API path accordingly.
