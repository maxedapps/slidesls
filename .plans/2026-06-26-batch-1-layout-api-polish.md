# Plan: Batch 1 primitive architecture polish

Date: 2026-06-26
Status: Implemented
Project: ls_slides

## Context

Batch 1 added a useful first primitive set, but visual review exposed that several primitives are not yet good enough as reusable copyable blueprints:

- `centered-statement` visually collapses into a too-narrow content box and appears off-center.
- `section-divider` is not vertically balanced for the shown content and ships hard-coded decorative gradient spots that are not easy enough to remove or recolor.
- `asymmetric-feature` breaks in browsers that support the attempted anchor-positioning enhancement: the annotation overlaps the first card in the right column.

These are not isolated screenshot bugs. They show an architectural gap: the new layouts do not yet share a clear public API for alignment, sizing, decorative effects, and progressive enhancement safety. The corrective work should therefore be a clean primitive design pass, not quick CSS patches.

## Goals

- Turn Batch 1 layouts into reliable, reusable slide blueprints with reasonable defaults and explicit customization hooks.
- Define and document a consistent layout primitive contract for alignment, sizing, regions, decorative effects, and progressive enhancement.
- Rework `centered-statement`, `section-divider`, and `asymmetric-feature` from the ground up where needed.
- Keep the copyable-registry model central: vanilla CSS, `ls-` classes/attributes, item-local CSS variables, and concise per-item docs.
- Preserve modern CSS usage only where it improves the copied code without making baseline layout fragile.
- Update `examples/primitive-gallery` so it demonstrates product-quality defaults and intentional customization, not just class coverage.
- Validate visually and with project checks before declaring Batch 1 complete.

## User constraints

- No quick fixes or dirty workarounds.
- Big changes are welcome if they produce cleaner architecture.
- Preserve the flexible, reusable slide blueprint/component-registry vision.
- Use `pnpm` only.
- Keep registry items vanilla and dependency-free.
- No framework, generator, runtime package, Tailwind, or extra monorepo tooling.
- Use `ls-` prefixed classes/attributes.
- Prefer reasonable defaults plus easy customization.

## Research performed

Project files inspected:

- `docs/primitive-expansion.md`
- `docs/modern-platform-strategy.md`
- `.plans/2026-06-26-batch-1-primitive-expansion.md`
- `registry/core/base/slide.css`
- `registry/layouts/centered-statement/centered-statement.css`
- `registry/layouts/section-divider/section-divider.css`
- `registry/layouts/asymmetric-feature/asymmetric-feature.css`
- relevant layout READMEs
- `examples/primitive-gallery/index.html`

Visual evidence inspected:

- Centered statement screenshot: content block is effectively too narrow and visually shifted.
- Section divider screenshot: content should be vertically centered and decorative gradient spots are too opinionated as a default.
- Asymmetric feature screenshot: right-column annotation/card content overlaps.

No new external library/API research is required. The relevant modern CSS guidance is already captured in `docs/modern-platform-strategy.md`; this plan mainly corrects project-local primitive architecture and usage contracts.

## Diagnosis

### `centered-statement`

The current content wrapper combines `container: ... / inline-size` with no explicit `inline-size`. Inline-size containment changes sizing behavior and can make the grid item behave like it has no intrinsic width. The title then overflows from an effectively collapsed content area, producing a narrow/off-center composition. The primitive also lacks a clear public sizing API.

### `section-divider`

The current primitive hard-codes decorative radial/linear background gradients into the baseline layout. That violates the desired blueprint model because decoration cannot be removed or recolored through a documented API. The vertical layout also defaults to `align-content: space-between`, which is useful for some chapter divider designs but is a poor default for the shown slide content.

### `asymmetric-feature`

The attempted anchor-positioning enhancement changed normal-flow stack behavior by making the annotation absolutely positioned when supported. That makes progressive enhancement affect core layout and causes overlap. For this primitive, robust normal-flow stacked content should be the baseline. Floating/anchored annotations should be a separate explicit opt-in pattern or future component, not a hidden default.

## Decisions

### User decisions for this corrective pass

- Remove `data-ls-anchor` / floating annotation behavior from `asymmetric-feature` cleanly. Delete all related CSS, example markup, and README guidance; do not keep unused future-facing code around. If floating annotations are needed later, create a dedicated primitive with its own plan.
- Deeply fix the three broken layouts now: `centered-statement`, `section-divider`, and `asymmetric-feature`. For other Batch 1 layouts, run an audit only and defer non-blocking retrofits to a future plan.
- Make `section-divider` clean and vertically centered by default. Preserve `space-between` and decorative ambience as explicit opt-ins.

### Define a reusable layout primitive contract

Add documented guidance, ideally in a new `docs/primitive-authoring.md`, and link it from `docs/README.md` and/or `docs/primitive-expansion.md`.

Layout primitives should follow these rules:

- Root class: `.ls-<layout>`.
- Optional slide wrapper class: `.ls-layout-<layout>` only where useful for whole-slide shell targeting.
- Public alignment attributes:
  - `data-ls-align="start|center|end|stretch"` for inline alignment / text alignment where relevant.
  - `data-ls-valign="start|center|end|space-between|stretch"` for block-axis placement where relevant.
  - When an existing attribute changes semantics, document the breaking change in the item README and update examples.
- Public sizing variables:
  - `--ls-<layout>-max-inline`
  - region-specific max widths where useful, e.g. `--ls-centered-statement-title-max-inline`.
  - `--ls-<layout>-gap` for the major spacing rhythm.
  - Item-local variables must fall back to semantic tokens or safe literals, e.g. `var(--ls-centered-statement-gap, var(--ls-space-4))`.
- Baseline layout must work with or without `.ls-slide__header`.
- Block-axis alignment must be backed by explicit height propagation. If a layout supports `data-ls-valign`, it must fill its intended slide region in both common modes: as a direct `.ls-slide__inner` layout and as a `.ls-slide__body`/body-region layout. Do not add vertical-alignment attributes that silently no-op because the root has indefinite block size.
- Baseline layout must not depend on anchor positioning, absolute positioning, or browser support for a modern feature.
- Modern CSS enhancements may improve presentation, but they must not change normal flow in a way that can overlap essential content. Progressive enhancement must not be required for baseline correctness.
- Decorative effects must be opt-in or variable-controlled.

### Redesign `centered-statement`

Make it a reliable centered statement blueprint.

Default behavior:

- Horizontally centered.
- Vertically centered.
- Generous content width.
- Title constrained for readability, not accidentally narrow.
- Works as direct `.ls-slide__inner.ls-centered-statement` and as a body/root region.

Public API:

- `data-ls-align="start|center|end"`
- `data-ls-valign="start|center|end"`
- optional `data-ls-size="compact|default|hero"`
- `--ls-centered-statement-max-inline`
- `--ls-centered-statement-title-max-inline`
- `--ls-centered-statement-support-max-inline`
- `--ls-centered-statement-gap`

Implementation direction:

- Remove the sizing bug by giving `.ls-centered-statement__content` a real width: `inline-size: min(100%, var(--ls-centered-statement-max-inline, ...))`.
- Keep container queries only after a stable width exists.
- Use `place-items` / `align-content` driven by attributes, not hard-coded single behavior.
- Replace the current narrow title literal with `--ls-centered-statement-title-max-inline` and a sane default so common phrases do not wrap into awkward narrow columns after the container sizing bug is fixed.

### Redesign `section-divider`

Separate structure from decoration.

Default behavior:

- Clean, professional section divider with centered content by default.
- No gradient spots by default, or ambient effect opacity set to zero by default.
- Optional footer/meta can appear without forcing an unbalanced `space-between` layout unless explicitly requested.

Public API:

- `data-ls-align="start|center|end"`
- `data-ls-valign="start|center|end|space-between"`
- `data-ls-ambient="none|radial|wash"` or equivalent opt-in design.
- `--ls-section-divider-max-inline`
- `--ls-section-divider-title-max-inline`
- `--ls-section-divider-gap`
- `--ls-section-divider-bg`
- `--ls-section-divider-accent`
- `--ls-section-divider-ambient-opacity`

Implementation direction:

- Baseline background should be `var(--ls-section-divider-bg, transparent)`.
- Add ambient background only for `data-ls-ambient` values.
- Derive ambient color from `--ls-section-divider-accent` and opacity from `--ls-section-divider-ambient-opacity`.
- Default vertical alignment should be `center` for the common chapter-divider case.
- `space-between` should be an explicit choice for designs with header/footer separation.

### Redesign `asymmetric-feature`

Make it a robust two-region editorial layout.

Default behavior:

- Statement and stack are vertically centered as a pair.
- Stack children stay in normal flow.
- Annotation is a normal stack item by default.
- No anchor positioning in this primitive's baseline CSS.

Public API:

- `data-ls-ratio="statement-wide|balanced|stack-wide"`
- `data-ls-valign="start|center|end|stretch"`
- optional `data-ls-stack-align="start|center|end|stretch"`
- `--ls-asymmetric-feature-statement-fr`
- `--ls-asymmetric-feature-stack-fr`
- `--ls-asymmetric-feature-gap`
- `--ls-asymmetric-feature-stack-gap`
- `--ls-asymmetric-feature-headline-max-inline`

Implementation direction:

- Remove `data-ls-anchor` behavior from the default primitive.
- Remove the anchor-positioning block unless a truly safe, opt-in non-overlapping pattern is designed.
- If anchored/floating annotations are still desired, defer them to a future `components/annotation` or `components/floating-label` item instead of mixing them into this layout.
- Ensure the layout fills the available slide body whether or not a separate header exists.
- Keep responsive/container behavior simple and readable.

### Treat gallery as visual QA, not only coverage

`examples/primitive-gallery` should show final states that make the registry look credible. It should demonstrate:

- reasonable defaults first,
- one or two explicit customization hooks where helpful,
- no accidental inline hacks,
- no overlapping content,
- no blank-looking or badly balanced slides in the reviewed reveal state.

For the three affected slides:

- Centered statement: show a broader, truly centered hero statement.
- Section divider: show clean default center alignment; optionally add a second small element showing an opt-in ambient accent if it still looks good.
- Asymmetric feature: show normal-flow right stack with cards and annotation that do not overlap.

## Alternatives considered

### Alternative A — Patch only the screenshot bugs

Rejected. This would fix the immediate screenshots but leave unclear primitive APIs and likely create future regressions.

### Alternative B — Add utility classes for every alignment/decorative case

Rejected for now. Utility classes can become noisy and framework-like. Data attributes plus item-local CSS variables fit the copyable blueprint model better.

### Alternative C — Move all alignment behavior into `core/base`

Rejected for this pass. Some shared guidance belongs in docs, but each layout has different semantics. Core should not become a layout framework prematurely.

### Alternative D — Keep anchor positioning in `asymmetric-feature`

Rejected. The user explicitly chose to remove `data-ls-anchor` and all related unused code from `asymmetric-feature`. Anchor positioning remains valuable for future primitives, but it should return only in a dedicated item with a safe normal-flow fallback and a clear API.

### Alternative E — Split decorative `section-divider` ambience into a separate preset item immediately

Deferred. A separate decorative preset may make sense later, but Batch 1 can first expose a clean opt-in `data-ls-ambient` and variables inside the layout item. If decorative options grow, extract them later.

## Implementation phases

### Phase 1 — Baseline audit and contract definition

- [x] Check `git status --short` and identify any unrelated changes.
- [x] Run `pnpm check` to confirm the current baseline.
- [x] Re-inspect the three failing screenshots and reproduce the affected states in `examples/primitive-gallery`.
- [x] Inspect affected `registry-item.json` files and confirm whether descriptions or docs paths need updates. Current manifests do not encode CSS variables/API metadata, so changes are expected to be README/CSS-focused unless descriptions become inaccurate.
- [x] Add `docs/primitive-authoring.md` with the layout primitive contract:
  - root class conventions,
  - alignment attributes,
  - sizing variables,
  - decoration rules,
  - progressive enhancement rules,
  - visual QA expectations.
- [x] Link the new authoring doc from `docs/README.md` and `docs/primitive-expansion.md`.

### Phase 2 — Rework `centered-statement`

Affected files:

- `registry/layouts/centered-statement/centered-statement.css`
- `registry/layouts/centered-statement/README.md`
- `examples/primitive-gallery/index.html`

Tasks:

- [x] Replace the collapsed/implicit content sizing with explicit, variable-driven width.
- [x] Add documented alignment attributes for inline and block placement.
- [x] Add documented sizing variables for content, title, support text, and gap.
- [x] Make default title width and sizing reasonable for real slide titles.
- [x] Ensure the primitive works as a whole-slide inner layout and as a body region.
- [x] Update the README with minimal markup, attributes, variables, and examples.
- [x] Update the gallery slide to demonstrate clean defaults and at least one safe customization if useful.

### Phase 3 — Rework `section-divider`

Affected files:

- `registry/layouts/section-divider/section-divider.css`
- `registry/layouts/section-divider/README.md`
- `examples/primitive-gallery/index.html`

Tasks:

- [x] Remove hard-coded gradient spots from the default baseline.
- [x] Add a clean default background and default vertical centering.
- [x] Add `data-ls-valign` behavior for `start`, `center`, `end`, and `space-between`.
- [x] Add `data-ls-align` behavior for `start`, `center`, and `end`.
- [x] Add opt-in ambient variants such as `data-ls-ambient="radial"` and/or `data-ls-ambient="wash"`.
- [x] Make ambient color and strength controlled by documented variables.
- [x] Update README with no-ambient default, opt-in ambient examples, and variable reference.
- [x] Update the gallery to remove unwanted spots by default and show a balanced section divider.

### Phase 4 — Rework `asymmetric-feature`

Affected files:

- `registry/layouts/asymmetric-feature/asymmetric-feature.css`
- `registry/layouts/asymmetric-feature/README.md`
- `examples/primitive-gallery/index.html`

Tasks:

- [x] Remove `data-ls-anchor` behavior and all anchor-positioning CSS from this primitive. Do not leave unused future-facing hooks.
- [x] Remove `data-ls-anchor` from gallery markup and grep the repository to ensure no stale references remain except in historical plan notes if intentionally left. Keep the generic anchor-positioning guidance in `docs/modern-platform-strategy.md`; that document is future-facing platform strategy, not stale `asymmetric-feature` API.
- [x] Keep annotation content in normal stack flow by default.
- [x] Add documented ratio and vertical-alignment APIs.
- [x] Add documented stack gap and region sizing variables.
- [x] Ensure no overlap in modern browsers with anchor positioning support.
- [x] Ensure the layout works with and without a separate slide header.
- [x] Update README to remove `data-ls-anchor` guidance, note the cleanup/breaking change, and describe normal-flow annotations.
- [x] Update the gallery slide to demonstrate a clean, balanced editorial layout.

### Phase 5 — Cross-layout audit only

Affected files may include docs/plan notes only unless an audit finds a true blocker.

Tasks:

- [x] Audit other Batch 1 layouts for the new contract, but do not retrofit them in this corrective pass unless they have a blocking defect comparable to the three user-reported issues.
- [x] Record follow-up recommendations for non-blocking inconsistencies.
- [x] Confirm all changed layout READMEs document their meaningful attributes and CSS variables.
- [x] Confirm decorative effects in changed layouts are either baseline-safe or opt-in.

### Phase 6 — Gallery visual quality pass

Affected files:

- `examples/primitive-gallery/index.html`
- `examples/primitive-gallery/README.md` if needed

Tasks:

- [x] Make the gallery a product-quality example, not just a checklist.
- [x] Avoid one-off inline styles unless demonstrating documented CSS-variable customization.
- [x] Check that slides look good in the default revealed state.
- [x] Decide and document gallery reveal posture before editing: preferred direction is primary slide content visible by default, with reveals reserved for supporting content only where it improves the demo. Keep this decision consistent across the updated affected slides.
- [x] Ensure the gallery still covers every Batch 1 primitive.

### Phase 7 — Documentation and plan tracking

- [x] Update `PROJECT.md` if the primitive contract becomes a notable project guideline.
- [x] Update `docs/primitive-expansion.md` to reflect the cleaned-up Batch 1 quality bar.
- [x] Update affected layout READMEs with real API contracts.
- [x] Update `.plans/2026-06-26-batch-1-primitive-expansion.md` or add a short implementation note linking to this corrective plan, if useful.
- [x] Update this plan during implementation with progress, validation results, peer-review outcome, and commit hashes.

### Phase 8 — Validation and visual review

Run automated validation:

```sh
pnpm check
```

Serve and smoke-test examples:

```sh
pnpm serve:examples -- --port 4173
curl -I http://localhost:4173/examples/
curl -I http://localhost:4173/examples/primitive-gallery/
curl -I 'http://localhost:4173/examples/primitive-gallery/?export=1'
```

Browser/visual validation:

- [x] Capture screenshots for every primitive gallery slide in normal mode using `npx agent-browser` or equivalent.
- [x] Capture export mode screenshot(s), preferably at full slide dimensions because normal mode scales slides via `--ls-scale`.
- [x] Inspect the three previously failing slides specifically:
  - centered statement truly centered with non-collapsed width,
  - section divider vertically balanced and no unwanted ambient spots,
  - asymmetric feature right column has no overlap.
- [x] Inspect documented alignment variants for the affected primitives, either in temporary test markup or a small dedicated gallery section/state. Do not commit temporary test files unless they become intentional examples.
- [x] Check reduced-motion behavior where reveal variants are involved.
- [x] Confirm no generated screenshots, server logs, or HTML previews are accidentally tracked.

### Phase 9 — Peer review and commit

- [x] Run fresh peer review after implementation.
- [x] Ask reviewer to focus on:
  - architecture vs quick fixes,
  - flexibility and API clarity,
  - visual defaults,
  - progressive enhancement safety,
  - docs accuracy,
  - gallery quality.
- [x] Address blocking feedback.
- [x] Commit with a message such as `Refine Batch 1 primitive layout APIs`.

## Validation

Minimum validation before declaring done:

```sh
pnpm check
```

Required example smoke tests:

```sh
pnpm serve:examples -- --port 4173
curl -I http://localhost:4173/examples/
curl -I http://localhost:4173/examples/primitive-gallery/
curl -I 'http://localhost:4173/examples/primitive-gallery/?export=1'
```

Required visual validation:

- normal-mode screenshot review for all gallery slides,
- export-mode screenshot review,
- targeted inspection of the three user-flagged slides,
- verification that documented alignment/decorative customization hooks work.

## Risks / rollback

- Risk: Introducing a shared alignment contract can overgeneralize layouts. Mitigation: document common conventions but keep each layout's implementation semantic and small.
- Risk: Reworking gallery markup could reduce primitive coverage. Mitigation: maintain an explicit coverage checklist.
- Risk: Removing anchor-positioning from `asymmetric-feature` may feel like stepping back from modern CSS. Mitigation: document that modern CSS must be baseline-safe; reserve anchored/floating behavior for a dedicated future primitive.
- Risk: `section-divider` ambient options may still be too decorative. Mitigation: default to no ambient effect and make ambience opt-in.
- Rollback: revert the corrective implementation commit. Changes should be confined to docs, three layout items, gallery markup, and possibly small consistency updates.

## Implementation progress

- [x] Phase 1 — Baseline audit and primitive contract documentation.
- [x] Phase 2 — `centered-statement` reworked with explicit sizing/alignment API.
- [x] Phase 3 — `section-divider` reworked with clean default and opt-in ambience.
- [x] Phase 4 — `asymmetric-feature` reworked with normal-flow annotation and no anchor-positioning hook.
- [x] Phase 5 — Cross-layout audit completed; no other Batch 1 blocking layout defects found.
- [x] Phase 6 — Gallery updated for product-quality defaults on affected slides; primary content is visible by default there, with reveal reserved for supporting badges/cards/notes.
- [x] Phase 7 — Docs and plan tracking updated.
- [x] Phase 8 — Automated validation, smoke tests, browser screenshots, and variant checks completed.
- [x] Phase 9 — Peer review and commit pending.

## Implementation notes

- Baseline `pnpm check` failed only because generated `.plans/*.html` preview was unformatted/untracked; removed preview before implementation.
- Affected `registry-item.json` files did not need changes because item names, file paths, dependencies, and docs paths stayed valid.
- `data-ls-anchor` remains only in this historical plan and an asymmetric-feature README migration note; active registry CSS and gallery markup no longer use it. Generic anchor-positioning strategy remains in `docs/modern-platform-strategy.md`.
- Other Batch 1 layouts audited for comparable blockers; no further changes made to keep scope bounded. Future consistency work could retrofit the shared alignment contract more broadly.
- Validation: `pnpm fmt`, `pnpm check`, registry validation, curl smoke tests, normal-mode screenshots for all gallery slides, export-mode screenshot, and browser `eval` checks for alignment/ambient/ratio hooks passed.

## Peer review outcome

- First implementation review found one blocking issue: `centered-statement` and `section-divider` were still top-biased because the row reset targeted child markup but the gallery uses the class on `.ls-slide__inner` itself.
- Fixed by setting `grid-template-rows: none` on the main layout root selectors and correcting centered-statement action alignment.
- Second review found no blockers and confirmed the prior issue was resolved.
- Commit: `e852084`.

## Peer review summary

Initial peer review found the plan direction architecturally sound and verified the three technical diagnoses. Required revisions were incorporated:

- Added explicit user decisions about removing `data-ls-anchor`, limiting scope to deep fixes for three layouts, and making `section-divider` clean/centered by default.
- Called out breaking alignment/API semantics and README documentation requirements.
- Added affected `registry-item.json` inspection.
- Bounded the cross-layout phase to audit-only.
- Strengthened visual validation with screenshot requirements and stale-reference greps.
- Added item-local CSS variable fallback convention.
- Added a shared height-propagation requirement for layouts that expose block-axis alignment.
- Made the centered-statement title width fix definite instead of optional.
- Clarified that generic anchor-positioning strategy docs should remain even while removing the asymmetric-feature hook.

No further user clarification is pending.
