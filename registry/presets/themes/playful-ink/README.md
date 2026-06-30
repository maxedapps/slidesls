# playful-ink

Friendly dark ink theme for workshops, education, community talks, and playful product demos.

## Best for

- workshops
- educational decks
- community presentations
- friendly product demos

Recommended font pairings: `presets/fonts/system-humanist`, optionally `presets/fonts/editorial-serif` for expressive title contrast.

## Usage

Load the theme CSS after `core/base/tokens.css` and set `data-ls-theme="playful-ink"` on the `<html>` element:

```html
<link rel="stylesheet" href="./slidesls/registry/presets/themes/playful-ink/theme.css" />
```

```html
<html lang="en" data-ls-theme="playful-ink"></html>
```

## Notes

- Use exactly one `data-ls-theme` per deck.
- Themes are deck-wide and belong on `<html>`.
- Font presets remain separate.
- The style is warm and rounded, but avoids neon, large decorative gradients, and glow-heavy effects.
