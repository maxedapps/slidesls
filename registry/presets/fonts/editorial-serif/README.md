# editorial-serif

Scoped font preset for narrative, editorial, or strategy-oriented decks.

This preset remaps heading and display roles to the core serif stack while keeping body, label, and code roles unchanged.

## Usage

```html
<link rel="stylesheet" href="./registry/presets/fonts/editorial-serif/font.css" />
<html data-ls-font="editorial-serif"></html>
```

For one slide only:

```html
<section class="ls-slide" data-ls-font="editorial-serif"></section>
```

The preset also relaxes title line-height and letter-spacing through `--ls-title-line-height` and `--ls-title-letter-spacing`; still visually review very large serif titles.
