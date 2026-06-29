# Deck authoring

## Minimal shell

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Slide deck</title>
    <link rel="stylesheet" href="./slidesls/registry/core/base/reset.css" />
    <link rel="stylesheet" href="./slidesls/registry/core/base/tokens.css" />
    <link rel="stylesheet" href="./slidesls/registry/core/base/slide.css" />
    <link rel="stylesheet" href="./slidesls/registry/animations/reveal/reveal.css" />
    <script type="module" src="./slidesls/registry/core/base/slide-runtime.js"></script>
  </head>
  <body class="ls-page">
    <main class="ls-deck" data-ls-deck aria-label="Slide deck">
      <section class="ls-slide" aria-label="Opening slide">
        <div class="ls-slide__inner">
          <header class="ls-slide__header">
            <p class="ls-eyebrow">Topic</p>
            <h1 class="ls-title">A clear opening statement</h1>
          </header>
          <div class="ls-slide__body">
            <p class="ls-subtitle ls-reveal" data-step="1">Supporting point.</p>
          </div>
        </div>
      </section>
    </main>
  </body>
</html>
```

`.ls-stage` can wrap `.ls-deck` when a target project wants an extra stage element, but the runtime only requires `.ls-deck[data-ls-deck]`.

## Required shell pieces

- `body.ls-page` for page background and typography.
- `.ls-deck[data-ls-deck]` for runtime initialization.
- `.ls-slide` for each slide.
- `.ls-slide__inner` for base padding/grid/safe area.
- `.ls-slide__header` and `.ls-slide__body` where the chosen layout expects them.
- `slide-runtime.js` as a module script.

## Reveal contract

- Add `.ls-reveal` and `data-step="N"` to elements that should reveal.
- Runtime writes `data-ls-step` on the active slide.
- Runtime writes `data-ls-reveal-state="future|current|past"` on stepped elements.
- `data-ls-reveal-sequence` on a parent auto-assigns missing `data-step` values to direct `.ls-reveal` children.
- `data-ls-sequence-skip` excludes a child from auto-sequencing.
- Load animation variants after `animations/reveal`.
- Export mode (`?export=1` or `?export=pdf`) shows all slides and reveal content.

## Icons

If markup uses `data-lucide`, include the Lucide browser script before or alongside `slide-runtime.js` so runtime can call `lucide.createIcons()`.

For offline/dependency-free decks, prefer inline SVG or text markers.

## Slide recipes by intent

- Opening/title: `layouts/title-hero`, `layouts/centered-statement`, `components/badge`.
- Comparison: `layouts/comparison-grid`, `components/table`, `components/card`.
- Dashboard: `layouts/metric-dashboard`, `components/metric`, `components/stat-grid`, `components/progress`.
- Timeline/process: `layouts/timeline-strip`, `components/timeline`, `components/numbered-step`, `animations/step-focus`.
- Code explainer: `layouts/code-explainer`, `components/code-block`, `components/callout`, `components/highlight-text`.
- Quote/editorial: `layouts/quote-feature`, `components/quote`, `animations/spotlight`.
- Annotated visual: `layouts/layered-canvas`, `components/annotation`, `components/connector`, `components/image-card`, `components/legend`.

Use examples only as visual references; item READMEs and registry metadata are the source of truth.
