# Deck contract

Generated decks are plain HTML/CSS/JS. The stable deck API keeps the existing `.ls-*` classes and `data-ls-*` attributes.

## Required shell

- `<body class="ls-page">`
- `.ls-deck[data-ls-deck]`
- one or more `.ls-slide` elements
- `slide-runtime.js` loaded as a module script

## Asset model

`slidesls init` and `slidesls add` copy assets into `slidesls/` by default. Deck authors may edit copied files directly. The manifest records copied files and hashes for validation.

## Runtime dependency

The npm package is not a runtime dependency. A deployed deck only needs its copied HTML/CSS/JS/assets.
