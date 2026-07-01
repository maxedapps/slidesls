# Font presets

Scoped font-family token remaps for slidesls decks.

Font presets are optional registry items. They do not load web fonts and they do not change the deck globally when copied or linked. Load the preset CSS, then opt in with `data-ls-font`.

## Semantic roles

`core/base` defines raw stacks and semantic roles:

- `--ls-font-sans`
- `--ls-font-serif`
- `--ls-font-mono`
- `--ls-font-body`
- `--ls-font-heading`
- `--ls-font-display`
- `--ls-font-label`
- `--ls-font-code`

Layouts and components use the semantic roles so a preset can change the deck personality without editing each component.

## Load order

Load font presets after `core/base/tokens.css` and before or alongside other registry CSS:

```html
<link rel="stylesheet" href="./registry/core/base/tokens.css" />
<link rel="stylesheet" href="./registry/presets/fonts/editorial-serif/font.css" />
```

## Global deck usage

```html
<html data-ls-font="editorial-serif">
  <body class="ls-page"></body>
</html>
```

You may also scope deck-wide font presets to `body.ls-page` if that better matches your project shell.

## Per-slide usage

```html
<section class="ls-slide" data-ls-font="technical-mono"></section>
```

## Font stacks vs. font loading

These initial presets only remap CSS font stacks and work without network access. If a deck needs web fonts, add explicit font loading in the consuming project or use a future font-loading preset.
