# core/base

Mandatory base item for slidesls decks.

Copy/load order:

1. `reset.css` — declares cascade layer order and reset rules.
2. `tokens.css` — default dark theme, dimensions, spacing, semantic font roles, type, and motion tokens.
3. `slide.css` — stage, deck, slide shell, scaling, fallback, export styles.
4. `icons.css` — generic icon wrappers and generated SVG sizing.
5. `slide-runtime.js` — keyboard navigation, reveal state, scaling, export mode, optional Lucide initialization.

Load this item before layouts, components, animations, and presets. It establishes the cascade layer contract.

## Font roles

`tokens.css` exposes raw font stacks (`--ls-font-sans`, `--ls-font-serif`, `--ls-font-mono`) plus semantic roles (`--ls-font-body`, `--ls-font-heading`, `--ls-font-display`, `--ls-font-label`, `--ls-font-code`). Layouts and components use semantic roles so optional font presets can remap typography without editing component CSS.
