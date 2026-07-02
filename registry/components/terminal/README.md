# Terminal

Static terminal-style command/output blocks for CLI demos and tooling walkthroughs.

## Usage

```html
<figure class="ls-terminal" data-ls-density="compact">
  <figcaption class="ls-terminal__header">
    <span class="ls-terminal__controls" aria-hidden="true">
      <span class="ls-terminal__control" data-ls-tone="danger"></span>
      <span class="ls-terminal__control" data-ls-tone="warning"></span>
      <span class="ls-terminal__control" data-ls-tone="success"></span>
    </span>
    <span class="ls-terminal__title">deploy-preview.sh</span>
  </figcaption>
  <div class="ls-terminal__body">
    <p class="ls-terminal__line">
      <span class="ls-terminal__prompt">$</span> pnpm slidesls validate --json
    </p>
    <p class="ls-terminal__line ls-terminal__output">{ "ok": true }</p>
  </div>
</figure>
```

Key classes/attributes:

- `.ls-terminal`
- `.ls-terminal__header`
- `.ls-terminal__controls`
- `.ls-terminal__control`
- `.ls-terminal__title`
- `.ls-terminal__body`
- `.ls-terminal__line`
- `.ls-terminal__prompt`
- `.ls-terminal__output`
- `data-ls-density="compact"`
- `data-ls-tone="danger|warning|success"` on controls

Variables:

- `--ls-terminal-font-size`
- `--ls-terminal-padding`
- `--ls-terminal-max-block-size`

Keep terminal excerpts short enough to fit a slide. The body scrolls as an authoring safety net, but screenshots/PDFs should be visually reviewed when content is dense.

## Copy

Copy `terminal.css` after `core/base` styles.
