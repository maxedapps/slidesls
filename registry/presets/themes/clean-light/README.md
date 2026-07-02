# clean-light

Clean light theme for readable product, teaching, and report decks.

## Best for

- product walkthroughs
- education and workshops
- reports that need print-friendly contrast
- decks mixed with screenshots or diagrams

Recommended font pairing: `presets/fonts/system-humanist`.

## Usage

Load the theme CSS after `core/base/tokens.css` and set `data-ls-theme="clean-light"` on the `<html>` element:

```html
<link rel="stylesheet" href="./slidesls/registry/presets/themes/clean-light/theme.css" />
```

```html
<html lang="en" data-ls-theme="clean-light"></html>
```

## Notes

- Use exactly one `data-ls-theme` per deck.
- Themes are deck-wide and belong on `<html>`.
- Font presets remain separate; add `data-ls-font` only when you want a font role remap.
- This theme intentionally keeps surfaces bright, borders subtle, and accents restrained.
