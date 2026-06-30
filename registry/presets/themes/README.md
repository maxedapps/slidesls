# Theme presets

Deck-wide visual token remaps for slidesls decks.

Theme presets are copied like other registry items, but they are inert until the deck opts in with `data-ls-theme` on the `<html>` element.

```html
<link rel="stylesheet" href="./slidesls/registry/presets/themes/executive-blue/theme.css" />
<html lang="en" data-ls-theme="executive-blue"></html>
```

## Themes

- `executive-blue` — balanced professional/product decks.
- `boardroom-navy` — formal strategy, executive, and reporting decks.
- `technical-deep` — engineering, architecture, and code-heavy decks.
- `playful-ink` — friendly workshop/community/product decks.

## Design rules

- Use exactly one theme per deck.
- Keep fonts separate with `presets/fonts/*`.
- Prefer solid surfaces, subtle borders, restrained shadows, and minimal texture.
- Avoid heavy gradients, glow stacks, neon fog, and backgrounds that compete with slide content.
