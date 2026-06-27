# Preview validation

## Run a deck server

```sh
node skills/ls-slides/scripts/serve-deck.mjs \
  --root /path/to/target-deck \
  --entry index.html \
  --host 127.0.0.1 \
  --port 4173 \
  --json
```

Open the reported URL. The server only serves files under `--root`.

## Live checks

- Confirm slide 1 appears and deck has `data-ls-ready="true"`.
- Navigate with ArrowRight / Space and ArrowLeft.
- Check every reveal step and any `data-ls-reveal-sequence` groups.
- Check dense slides: tables, code blocks, dashboards, timelines, annotations, and overlays.
- Check export mode: `/?export=1`.
- Inspect the browser console when possible.
- Capture screenshots for visual regressions when browser automation is available.

## Common failure modes

- Missing `.ls-deck[data-ls-deck]`: runtime never initializes.
- Missing `body.ls-page`: base page styles are absent.
- Missing `core/base` CSS or wrong order: tokens/layers/layout shell break.
- Animation variant loaded before `animations/reveal`: variant hidden states may be overridden.
- Missing `data-step`: reveal item is visible from the start unless auto-sequenced.
- Missing Lucide script for `data-lucide` icons: icons stay as empty placeholders.
- Clipped content: check safe-area usage, `minmax(0, ...)`, and component density attributes.
- Unsafe overlays: annotations/connectors should remain baseline-safe and decorative connectors should be `aria-hidden="true"`.

## Smoke tests

```sh
curl -I http://127.0.0.1:4173/
curl -I http://127.0.0.1:4173/index.html
curl -I 'http://127.0.0.1:4173/?export=1'
```
