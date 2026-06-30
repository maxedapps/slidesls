# technical-deep

Precise high-contrast dark theme for engineering talks, architecture walkthroughs, and code-heavy decks.

## Best for

- technical talks
- architecture walkthroughs
- CLI/tooling demos
- agent/software engineering decks

Recommended font pairings: `presets/fonts/technical-mono`, optionally `presets/fonts/system-humanist`.

## Usage

Load the theme CSS after `core/base/tokens.css` and set `data-ls-theme="technical-deep"` on the `<html>` element:

```html
<link rel="stylesheet" href="./slidesls/registry/presets/themes/technical-deep/theme.css" />
```

```html
<html lang="en" data-ls-theme="technical-deep" data-ls-font="technical-mono"></html>
```

## Notes

- Use exactly one `data-ls-theme` per deck.
- Themes are deck-wide and belong on `<html>`.
- Font presets remain separate.
- The fine grid and code colors are restrained and intended to support content hierarchy, not decoration.
