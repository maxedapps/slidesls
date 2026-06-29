# Primitive authoring contract

`slidesls` primitives are copyable blueprints, not hidden framework components. A copied layout should remain readable, editable, and robust in plain HTML/CSS.

## Layout roots

- Use `.ls-<layout>` for the layout root.
- Use `.ls-layout-<layout>` only when a whole-slide wrapper hook is useful.
- Layout roots must work both as a direct `.ls-slide__inner` layout and as a `.ls-slide__body` region when practical.

## Alignment API

Use data attributes for public layout alignment when a primitive needs it:

- `data-ls-align="start|center|end|stretch"` for inline placement and related text alignment.
- `data-ls-valign="start|center|end|space-between|stretch"` for block-axis placement.

If a layout exposes block-axis alignment, it must have explicit height propagation so the attribute does not silently no-op. Prefer explicit `data-ls-valign` values over top-packing dense structured slides by accident; use `start` for dense scans, `center` for compact compositions, `space-between` for narrative distribution, and `stretch` only when equal-height regions are intentional.

## Sizing API

Prefer item-local CSS variables with semantic-token fallbacks:

- `--ls-<layout>-max-inline`
- `--ls-<layout>-gap`
- region-specific variables such as `--ls-centered-statement-title-max-inline`

Variables should control real layout decisions, not expose every internal value.

## Decoration

Decorative effects should be opt-in or variable-controlled. Baseline layout CSS should not hard-code decorative gradients, floating ornaments, or visual noise that consumers must fight to remove.

## Progressive enhancement

Modern CSS is encouraged when it improves copyability, but baseline correctness must not depend on modern features.

- Container queries are fine after stable sizing is established.
- `:has()` is fine for optional child-aware styling.
- `color-mix()` is fine for token-derived surfaces.
- Anchor positioning, absolute positioning, and other out-of-flow enhancements must not create overlap or hide essential content. Prefer a separate explicit primitive for floating annotations.

## Reveal sequencing

Reveal primitives keep authoring simple with `.ls-reveal` and `data-step`. The core runtime may add internal `data-ls-reveal-state="future|current|past"` attributes so CSS recipes can support arbitrary step counts without hard-coded selectors.

Use `data-ls-reveal-sequence` on a group when direct `.ls-reveal` children should receive missing `data-step` values in DOM order. This is useful for timelines and process lists where forgotten step numbers would otherwise expose items too early.

Avoid muting layered structured components only with parent opacity when decorative layers sit behind child surfaces. Prefer child-level muting so markers, badges, and cards can remain opaque enough to mask connector lines or backgrounds.

## Visual QA

Every new or changed primitive should be validated in an example deck. Example slides should demonstrate credible defaults first, then intentional customization hooks. Avoid one-off inline hacks unless the inline value demonstrates a documented CSS variable.
