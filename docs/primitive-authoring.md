# Primitive authoring contract

`ls_slides` primitives are copyable blueprints, not hidden framework components. A copied layout should remain readable, editable, and robust in plain HTML/CSS.

## Layout roots

- Use `.ls-<layout>` for the layout root.
- Use `.ls-layout-<layout>` only when a whole-slide wrapper hook is useful.
- Layout roots must work both as a direct `.ls-slide__inner` layout and as a `.ls-slide__body` region when practical.

## Alignment API

Use data attributes for public layout alignment when a primitive needs it:

- `data-ls-align="start|center|end|stretch"` for inline placement and related text alignment.
- `data-ls-valign="start|center|end|space-between|stretch"` for block-axis placement.

If a layout exposes block-axis alignment, it must have explicit height propagation so the attribute does not silently no-op.

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

## Visual QA

Every new or changed primitive should be validated in an example deck. Example slides should demonstrate credible defaults first, then intentional customization hooks. Avoid one-off inline hacks unless the inline value demonstrates a documented CSS variable.
