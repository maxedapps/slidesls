# executive-blue

Clean professional blue theme for product, SaaS, and business decks.

## Best for

- product decks
- business updates
- general professional introductions
- metric/dashboard-heavy stories

Recommended font pairing: `presets/fonts/system-humanist`.

## Usage

Load the theme CSS after `core/base/tokens.css` and set `data-ls-theme="executive-blue"` on the `<html>` element:

```html
<link rel="stylesheet" href="./slidesls/registry/presets/themes/executive-blue/theme.css" />
```

```html
<html lang="en" data-ls-theme="executive-blue"></html>
```

## Notes

- Use exactly one `data-ls-theme` per deck.
- Themes are deck-wide and belong on `<html>`.
- Font presets remain separate; add `data-ls-font` only when you want a font role remap.
- This theme intentionally uses solid surfaces, subtle borders, and restrained accents instead of heavy gradients.
