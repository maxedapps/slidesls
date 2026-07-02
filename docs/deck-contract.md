# Deck contract

Generated decks are plain HTML/CSS/JS. The stable deck API is the shell, copied registry assets, and `.ls-*` classes provided by those assets.

## Required shell

- `<body class="ls-page">`
- `.ls-deck[data-ls-deck]`
- one or more `.ls-slide` elements
- `slide-runtime.js` loaded as a module script

## Composition model

Use:

- utilities for layout (`.ls-stack`, `.ls-grid`, `.ls-center`, `.ls-fill`);
- standalone components for content (`.ls-card`, `.ls-panel`, `.ls-metric`, etc.);
- template snippets for complete slide skeletons.

Avoid hidden ancestor-dependent layout classes. Templates should be pasted as HTML and then edited directly.

## Asset model

`slidesls init` and `slidesls add` copy assets into `slidesls/` by default. Deck authors may edit copied files directly. The manifest records copied files and hashes for validation.

## Runtime dependency

The npm package is not a runtime dependency. A deployed deck only needs its copied HTML/CSS/JS/assets.

## Deep links

Normal-mode runtime URLs may include `#slide=2&step=1`:

- `slide` is 1-based for humans.
- `step` is 0-based, where `0` is the initial unrevealed slide state.
- Missing or invalid values clamp to safe defaults.
- Export mode (`?export=1` or `?export=pdf`) ignores hash state and renders all slides/reveals.

This behavior lives in copied `slide-runtime.js`; existing generated decks must recopy/update that owned file to opt in.
