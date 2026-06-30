# boardroom-navy

Formal restrained navy theme for executive, strategy, and board decks.

## Best for

- board updates
- strategy reviews
- financial/business reporting
- stakeholder presentations

Recommended font pairings: `presets/fonts/system-humanist`, optionally `presets/fonts/editorial-serif` for report-like title contrast.

## Usage

Load the theme CSS after `core/base/tokens.css` and set `data-ls-theme="boardroom-navy"` on the `<html>` element:

```html
<link rel="stylesheet" href="./slidesls/registry/presets/themes/boardroom-navy/theme.css" />
```

```html
<html lang="en" data-ls-theme="boardroom-navy"></html>
```

## Notes

- Use exactly one `data-ls-theme` per deck.
- Themes are deck-wide and belong on `<html>`.
- Font presets remain separate.
- This theme keeps decoration minimal: dark navy surfaces, quiet steel-blue accents, and no visible glow-heavy effects.
