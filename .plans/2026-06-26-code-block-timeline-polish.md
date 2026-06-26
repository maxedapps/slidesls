# Plan: Code Block and Timeline Marker Polish

Date: 2026-06-26
Status: Implemented
Project: ls_slides

## Context

Two visual issues remain in the Batch 2 structured content gallery and reveal broader primitive weaknesses:

1. The code explainer slide shows code text touching the left edge of the code frame. This is not only a gallery issue; copied code blocks should have reliable padding regardless of whether authors use `.ls-code-block` directly on `<pre>` or as a wrapper around a nested `<pre>`.
2. The timeline strip line visually cuts through muted timeline markers/badges. This is caused by the line running through marker centers while `step-focus` dims whole timeline items with parent opacity, making marker surfaces translucent and allowing the line to show through.

The fix should preserve the vanilla, copyable registry architecture and improve reusable primitive APIs instead of adding gallery-only hacks.

## Goals

- Make `code-block` robust for both supported markup shapes:
  - direct semantic root: `<pre class="ls-code-block"><code>...</code></pre>`;
  - wrapper root: `<figure|div class="ls-code-block"><pre><code>...</code></pre></figure|div>`.
- Preserve optional code block headers without double padding or broken scroll behavior.
- Prevent timeline connector lines from visually striking through timeline-strip markers when items are muted by `step-focus`.
- Keep timeline marker text/readability and connector semantics clear in current, past, future, and export states.
- Keep the existing reveal/runtime system unchanged.
- Update documentation and, only if needed, gallery examples so copied markup demonstrates safe defaults.
- Validate with automated checks and focused browser visual review in the live stepped state where the bug occurs.

## User constraints

- Use `pnpm` only.
- Preserve vanilla, copyable HTML/CSS/JS registry architecture.
- No framework, generator, runtime package, Tailwind, charting library, GSAP, or new root dependency.
- Use `ls-` prefixed classes and attributes.
- Prefer reusable primitive/API improvements over one-off gallery fixes.
- Keep fixes semantic, dependency-free, and useful beyond the demo deck.

## Research performed

Local files inspected:

- `registry/components/code-block/code-block.css`
- `registry/components/code-block/README.md`
- `registry/layouts/code-explainer/code-explainer.css`
- `registry/layouts/timeline-strip/timeline-strip.css`
- `registry/layouts/timeline-strip/README.md`
- `registry/animations/step-focus/step-focus.css`
- `examples/structured-content-gallery/index.html`
- User-provided screenshots:
  - `/var/folders/4v/7bbbwmbs74j24k0m0shppqb00000gn/T/pi-clipboard-6c66cd5c-7e5c-4ca6-9859-c172104b719a.png`
  - `/var/folders/4v/7bbbwmbs74j24k0m0shppqb00000gn/T/pi-clipboard-5d6ec48b-d64a-4dd3-b0fa-54bd35a9bde5.png`

Findings:

- `code-block.css` currently applies frame styles to `.ls-code-block`, but padding/scrolling only to `.ls-code-block pre`. The gallery uses `pre.ls-code-block`, so padding never applies.
- The README tells users to use semantic `pre` / `code` markup but does not distinguish the direct-root and wrapper-root patterns.
- `timeline-strip.css` places `.ls-timeline-strip__line` absolutely at `inset-block-start: 42px`, i.e. through marker centers.
- `step-focus.css` dims past direct `.ls-reveal` children via parent `opacity`, so the entire timeline item, including marker surface, becomes translucent. The line behind the marker then shows through.
- The issue is not simply z-index; parent opacity creates a composited translucent item, so a line behind the item can still bleed through its marker.
- `components/timeline` is a separate primitive from `layouts/timeline-strip`. It should be audited for a similar issue, but the reported bug and current line-overlay interaction are in `timeline-strip`.

No external research is needed. The required behavior is project-local CSS/HTML and current runtime/reveal contracts.

## Decisions

### Decision 1 — Fix `code-block` at the primitive level

Support both valid copyable markup patterns:

```html
<pre class="ls-code-block"><code>...</code></pre>
```

and:

```html
<figure class="ls-code-block">
  <figcaption class="ls-code-block__header">example.js</figcaption>
  <pre><code>...</code></pre>
</figure>
```

Implementation direction:

- Keep frame styles on `.ls-code-block`.
- Apply scroll/max-block-size/margin/padding to both `pre.ls-code-block` and `.ls-code-block pre`.
- Use a named public variable `--ls-code-padding` with default `24px`, because padding is a meaningful customization point for dense slides and large code examples.
- Avoid double padding by applying padding only to the actual `<pre>` scroll surface.
- Ensure `code` typography works for both direct and nested markup.

Rationale: The direct `<pre class="ls-code-block">` pattern is semantic and intuitive. The wrapper pattern is needed for headers/captions. A copyable primitive should handle both.

### Decision 2 — Fix timeline strike-through by making `step-focus` timeline-aware, not by rewriting connector geometry

Use a targeted timeline-strip focus fix as the primary solution:

- Keep the existing single reveal-aware `.ls-timeline-strip__line` and its left-to-right `scaleX()` fill animation.
- Stop applying parent opacity to `.ls-timeline-strip__item` past states.
- Instead, dim timeline-strip child text/accent parts while keeping the marker surface opaque enough to mask the line.
- Scope this rule narrowly to direct timeline-strip items inside `.ls-step-focus` so generic `step-focus` behavior remains unchanged for simple children.

Rationale: This directly fixes the observed strike-through while preserving the existing progress-fill animation. A segmented/gapped connector is more robust for hypothetical translucent marker variants, but it would be a larger rewrite and would complicate the line reveal animation. The current registry has opaque markers as the default, so preserving marker opacity is the best low-risk reusable fix.

### Decision 3 — Audit but do not automatically rewrite the separate `timeline` component

`registry/components/timeline` is a different primitive. During implementation, inspect whether its progress connector can interact badly with opacity/focus states. Only change it if the same issue is reproducible there.

Rationale: The user-reported screenshot and root cause involve `timeline-strip`. Changing unrelated timeline component behavior without a demonstrated defect risks unnecessary scope creep.

### Decision 4 — Keep reveal/runtime unchanged

The current issue does not require runtime changes. Use existing `data-ls-reveal-state`, `step-focus`, and timeline CSS. Avoid expanding runtime scope.

### Decision 5 — Treat the gallery as validation, not the only fix target

The structured gallery already uses the direct semantic code block pattern that should be supported, so it may not need markup changes for the code fix. Gallery changes should only be made if they are needed to demonstrate corrected APIs or to remove stale/unsafe markup.

## Alternatives considered

### Alternative A — Change only the gallery markup for code blocks

Example: wrap the existing `<pre class="ls-code-block">` in a `<div class="ls-code-block"><pre>...</pre></div>`.

Rejected as insufficient. It would hide the primitive bug and leave the intuitive direct semantic pattern broken for downstream users.

### Alternative B — Add padding directly to `.ls-code-block`

Rejected as the full solution. It would fix direct `pre.ls-code-block`, but wrapper mode with nested `<pre>` and optional headers would put padding on the frame instead of the scroll surface. The padding belongs on the actual `<pre>` code surface.

### Alternative C — Move the timeline line lower or higher

Rejected as fragile. It might avoid this specific screenshot at one font size, but it would be arbitrary and could conflict with different marker sizes or custom variables.

### Alternative D — Raise marker z-index above the line

Rejected as insufficient. Markers are already in an item with `z-index: 1`, while the line is `z-index: 0`. The visible strike-through comes from opacity compositing, not stacking order alone.

### Alternative E — Segment or gap the timeline connector line

Deferred. This is the most geometry-pure solution and may be worth a future timeline redesign, but it complicates the current single-element reveal/fill animation. For this fix, timeline-aware child-level dimming solves the actual bug with less risk.

### Alternative F — Disable `step-focus` on timeline strip

Rejected. The focus behavior is useful; the problem is the blunt parent opacity interacting with layered marker/line design.

## Implementation phases

### Phase 1 — Baseline and focused measurements

- [x] Confirm `git status --short` is clean or only contains this plan. Only this plan and its generated HTML preview were untracked; removed the preview before implementation.
- [x] Run `pnpm check` as baseline.
- [x] Start the examples server and capture focused screenshots of:
  - code explainer slide;
  - timeline strip at a live stepped state where at least one item is `past` and the strike-through is visible.
- [x] Use browser measurements to record:
  - computed padding on the code block scroll surface for `pre.ls-code-block`;
  - marker and line bounding boxes on the timeline strip;
  - computed opacity/transform of past/current timeline-strip items and their marker/text children.

### Phase 2 — Fix code-block API and CSS

Affected files:

- `registry/components/code-block/code-block.css`
- `registry/components/code-block/README.md`

Tasks:

- [x] Add `--ls-code-padding` with default `24px`.
- [x] Apply scroll/max-block-size/margin/padding to both `pre.ls-code-block` and `.ls-code-block pre`.
- [x] Ensure direct `pre.ls-code-block` remains both frame and scroll surface.
- [x] Ensure wrapper mode still supports `.ls-code-block__header` plus nested `pre` without double padding.
- [x] Keep dense mode font-size behavior. Only adjust dense padding if visual review shows it is necessary; document any density-specific padding behavior if added.
- [x] Update README with two explicit recipes: direct semantic pre and framed wrapper with header.

Validation:

- [x] Browser check confirms non-zero padding for `pre.ls-code-block` in the code explainer slide.
- [x] Code text no longer touches the frame border.
- [x] Wrapper mode selector is checked with a temporary DOM snippet or small local fixture/eval so nested `.ls-code-block pre` still pads correctly.

### Phase 3 — Fix timeline-strip focus behavior

Affected files:

- `registry/animations/step-focus/step-focus.css`
- `registry/animations/step-focus/README.md`
- possibly `registry/layouts/timeline-strip/timeline-strip.css` if the layout needs marker-specific variables or selectors for the focus fix.

Tasks:

- [x] Add a targeted rule so `.ls-step-focus > .ls-timeline-strip__item[data-ls-reveal-state="past"]` does not rely on parent opacity for muting.
- [x] Keep past timeline-strip item transform/filter behavior if it still improves focus without causing compositing artifacts.
- [x] Dim child text/accent elements instead of the whole item:
  - `.ls-timeline-strip__title`
  - `.ls-timeline-strip__text`
  - marker text/border/accent as needed
- [x] Keep `.ls-timeline-strip__marker` background opaque so it masks the line behind it.
- [x] Keep current item fully emphasized.
- [x] Confirm future items remain hidden by base reveal and are not made visible by timeline-specific focus rules.
- [x] Preserve generic step-focus behavior for non-timeline children.
- [x] Update README to note that complex components such as timeline-strip use child-level focus behavior to avoid opacity artifacts.

Validation:

- [x] Past timeline items are visually muted but markers remain legible and do not show the line through the label.
- [x] Current timeline item is clearly emphasized.
- [x] Generic step-focus use outside timeline remains unchanged.
- [x] Export mode remains fully readable.

### Phase 4 — Audit separate timeline component and gallery usage

Affected files:

- `registry/components/timeline/timeline.css` only if the issue is reproducible there.
- `examples/structured-content-gallery/index.html` only if markup needs to demonstrate corrected APIs or if the audit finds stale/unsafe markup.

Tasks:

- [x] Inspect `.ls-timeline[data-ls-progress="true"]` in the process slide for similar connector/opacity issues.
- [x] Confirm the generic timeline component is not affected by the timeline-strip-specific parent-opacity problem, or apply a similarly scoped fix if needed.
- [x] Keep gallery markup semantic and copyable.
- [x] Avoid changing gallery markup when the primitive CSS fix is sufficient.

### Phase 5 — Documentation and quality-bar note

Affected files:

- `registry/components/code-block/README.md`
- `registry/animations/step-focus/README.md`
- `registry/layouts/timeline-strip/README.md` only if marker/focus guidance belongs there.
- `docs/primitive-expansion.md` or `docs/primitive-authoring.md` only if a short reusable authoring lesson is warranted.

Tasks:

- [x] Document direct-root and wrapper-root code-block patterns.
- [x] Document `--ls-code-padding`.
- [x] Document timeline-strip + step-focus behavior if changed.
- [x] Add a short authoring lesson only if useful: avoid parent opacity on layered structured components when it can reveal decorative layers behind them.

### Phase 6 — Full validation and visual review

Run automated validation:

```sh
pnpm fmt
pnpm check
pnpm validate:registry
```

Smoke test examples:

```sh
pnpm serve:examples -- --port 4173
curl -I http://localhost:4173/examples/structured-content-gallery/
curl -I 'http://localhost:4173/examples/structured-content-gallery/?export=1'
curl -I http://localhost:4173/examples/primitive-gallery/
```

Browser/visual review:

- [x] Capture focused screenshot of the code explainer slide.
- [x] Capture focused screenshots of the timeline strip at live steps where Q1/Q2 are past and Q3 or Q4 is current.
- [x] Verify code padding visually and via computed styles.
- [x] Verify timeline line/marker rendering visually and via computed styles.
- [x] Verify no dense elements overflow.
- [x] Verify export mode remains readable.

Important validation note: export mode alone does not reproduce the timeline strike-through, because export disables step-focus dimming. The primary timeline validation must use the live ready deck at stepped states where some items have `data-ls-reveal-state="past"`.

### Phase 7 — Peer review and commit

- [x] Run fresh peer review focused on:
  - code-block API correctness;
  - timeline-strip + step-focus compatibility;
  - preserving reveal/fill animation behavior;
  - avoiding gallery-only hacks;
  - docs accuracy;
  - visual quality.
- [x] Address blocking feedback.
- [x] Ensure no screenshots, server logs, browser traces, or temporary files are tracked.
- [x] Commit with a concise message such as `Polish code blocks and timeline focus states`.
- [x] Mark this plan `Implemented` after implementation.

## Expected files to change

Likely:

```text
registry/components/code-block/code-block.css
registry/components/code-block/README.md
registry/animations/step-focus/step-focus.css
registry/animations/step-focus/README.md
.plans/2026-06-26-code-block-timeline-polish.md
```

Possible if implementation/audit warrants it:

```text
registry/layouts/timeline-strip/timeline-strip.css
registry/layouts/timeline-strip/README.md
registry/components/timeline/timeline.css
examples/structured-content-gallery/index.html
docs/primitive-authoring.md
docs/primitive-expansion.md
.plans/2026-06-26-batch-2-structured-slide-polish.md
```

## Risks / rollback

- Risk: Changing code-block selectors could double-pad wrapper mode. Mitigation: target the scroll surface (`pre`) carefully and validate both direct and wrapper patterns.
- Risk: Timeline-specific step-focus rules could affect generic step-focus. Mitigation: scope them narrowly to direct `.ls-timeline-strip__item` children inside `.ls-step-focus`.
- Risk: Keeping the single timeline line assumes opaque marker surfaces. Mitigation: preserve marker background opacity in focused/muted states and document child-level focus behavior; defer segmented connectors to a separate timeline redesign if translucent markers become a supported variant.
- Risk: Export screenshots could give false confidence for the timeline bug. Mitigation: validate live stepped states as the primary timeline check.
- Rollback: revert the implementation commit(s). Changes should be limited to code-block, step-focus/timeline-strip, optional docs/gallery updates, and this plan.

## Implementation progress

- [x] Phase 1 — Baseline and focused measurements completed.
- [x] Phase 2 — Code-block API and CSS fixed.
- [x] Phase 3 — Timeline-strip focus behavior fixed through scoped child-level dimming.
- [x] Phase 4 — Separate timeline component and gallery usage audited; no changes needed.
- [x] Phase 5 — Documentation and authoring notes updated.
- [x] Phase 6 — Full validation and visual review completed.
- [x] Phase 7 — Peer review and commit pending.

## Implementation notes

- Removed generated HTML preview from the working tree before implementation.
- `pre.ls-code-block` now receives the same scroll-surface padding/max-height behavior as wrapper `.ls-code-block pre`.
- Added public `--ls-code-padding` and documented direct-root and wrapper-root recipes.
- Timeline-strip items inside `.ls-step-focus` now keep parent opacity at `1` for past states and mute child text/marker colors instead, preserving opaque marker surfaces over the connector line.
- The separate `components/timeline` connector is item border-based and does not place a line behind translucent markers; no change needed.
- Gallery markup stayed unchanged; primitive CSS fixes corrected the observed issues.

## Validation results

- `pnpm fmt` passed.
- `pnpm check` passed.
- `pnpm validate:registry` passed with 40 registry items.
- Smoke tests returned 200 for `/examples/structured-content-gallery/`, `/examples/structured-content-gallery/?export=1`, and `/examples/primitive-gallery/`.
- Browser live-step validation confirmed timeline step 3 state: Q1 past item opacity stays `1`, title opacity is muted to `0.42`, marker opacity stays `1`, and Q3 is current.
- Browser code validation confirmed `pre.ls-code-block` computed padding is `24px`; temporary wrapper fixture confirmed nested `.ls-code-block pre` padding is also `24px`.
- Focused screenshots captured to `/tmp/ls-slides-timeline-focus-live-step3-final.png` and `/tmp/ls-slides-code-padding-live-final.png`.

## Peer review outcome

- Fresh review accepted the implementation as-is.
- Reviewer confirmed code-block direct and wrapper patterns are correctly padded without double padding, including specificity for `pre.ls-code-block` overriding frame overflow.
- Reviewer confirmed timeline-strip `step-focus` override is safely scoped, wins over generic parent opacity by specificity/source order, preserves future/current behavior, and keeps opaque markers above the connector line.
- Reviewer confirmed the separate `timeline` component does not reproduce the reported connector-through-marker issue and was correctly left unchanged.
- Non-blocking note: future primitives with similar marker/connector needs may prefer owning focus overrides in the layout CSS rather than the generic animation CSS.

## Commits

- `ac31ea8` — `Polish code blocks and timeline focus states`

## Peer review summary

Fresh plan review confirmed the root-cause diagnoses. Revisions incorporated before finalizing:

- Chose a single timeline fix path: timeline-aware child-level dimming in `step-focus`, preserving the existing single-line reveal/fill animation.
- Deferred segmented/gapped timeline connectors as a possible future redesign because they complicate the current `scaleX()` line reveal.
- Clarified that `components/timeline` should be audited but not changed unless the same issue is reproducible there.
- Reduced expected file scope and avoided unnecessary gallery/doc churn.
- Strengthened validation to focus on live stepped states, not export mode, because export disables the dimming that causes the strike-through.
- Clarified that `pnpm check` remains a project gate, but browser visual/eval review is the meaningful validation for CSS geometry.

No further user clarification is required.
