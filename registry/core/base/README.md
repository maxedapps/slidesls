# core/base

Mandatory base item for slidesls decks.

Copy/load order:

1. `reset.css` — declares cascade layer order and reset rules.
2. `tokens.css` — default dark theme, dimensions, spacing, semantic font roles, type, motion tokens, and theme override surface.
3. optional theme preset CSS — token overrides scoped with `:root[data-ls-theme="..."]`.
4. `slide.css` — stage, deck, slide shell, scaling, fallback, export styles.
5. `icons.css` — generic icon wrappers and generated SVG sizing.
6. `slide-runtime.js` — keyboard navigation, reveal state, scaling, export mode, optional Lucide initialization.

Load this item before layouts, components, animations, and presets. It establishes the cascade layer contract.

## Slide shell

Use either a header/body shell (`.ls-slide__header` plus `.ls-slide__body`) or a full-slide wrapper (`.ls-slide__inner > .ls-slide-fill` from `utilities/layout`). Direct `.ls-fill` does not span the shell rows.

`section.ls-slide[data-ls-density="compact"]` scopes smaller type, spacing, and padding tokens for dense but visually reviewed slides. `section.ls-slide[data-ls-density="spacious"]` scales card/callout type, spacing, and grid gaps up for sparse slides (one big idea, few short points) so short copy still carries visual weight.

## Font roles

`tokens.css` exposes raw font stacks (`--ls-font-sans`, `--ls-font-serif`, `--ls-font-mono`) plus semantic roles (`--ls-font-body`, `--ls-font-heading`, `--ls-font-display`, `--ls-font-label`, `--ls-font-code`). Layouts and components use semantic roles so optional font presets can remap typography without editing component CSS. Title metrics are adjustable through `--ls-title-line-height` and `--ls-title-letter-spacing`.
