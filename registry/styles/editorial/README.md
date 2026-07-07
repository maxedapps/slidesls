# Editorial

Magazine field-guide art direction: warm paper (`#faf7f2`), ink text, a single oxblood accent, Fraunces display type over Newsreader body text, JetBrains Mono for labels and code, crisp print corners, and an unhurried fade-and-settle motion signature.

## Activation

```html
<html lang="en" data-ls-style="editorial">
  ...
  <link rel="stylesheet" href="./slidesls/registry/fonts/fraunces/font.css" />
  <link rel="stylesheet" href="./slidesls/registry/fonts/newsreader/font.css" />
  <link rel="stylesheet" href="./slidesls/registry/fonts/jetbrains-mono/font.css" />
  <link rel="stylesheet" href="./slidesls/registry/styles/editorial/style.css" />
</html>
```

Exactly one style per deck. The style wins through tokens only — no markup changes are required to switch styles.

## Voice

- Treat every slide like a spread: one focal idea, generous margins, hairline rules.
- Prefer typographic markers (numbered kickers, asterisks) over icon grids; icons, when used, are sparse ink-colored sprite icons.
- Motion stays understated: slow crossfades, children settling like paragraphs. Do not add bouncy or springy recipes.

## When not to use

- Dense technical dashboards or terminal-heavy walkthroughs (a dark, engineered direction will fit better).
- Content that must read as a product pitch rather than an essay.
