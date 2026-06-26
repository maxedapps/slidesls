# core/base

Mandatory base item for ls_slides decks.

Copy/load order:

1. `reset.css` — declares cascade layer order and reset rules.
2. `tokens.css` — default dark theme, dimensions, spacing, type, motion tokens.
3. `slide.css` — stage, deck, slide shell, scaling, fallback, export styles.
4. `icons.css` — generic icon wrappers and generated SVG sizing.
5. `slide-runtime.js` — keyboard navigation, reveal state, scaling, export mode, optional Lucide initialization.

Load this item before layouts, components, and animations. It establishes the cascade layer contract.
