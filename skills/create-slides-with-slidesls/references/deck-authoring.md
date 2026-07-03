# Deck authoring

## Starting a deck

Use a dedicated deck folder. From inside that folder:

```sh
slidesls init --template minimal --theme executive-blue --title "My Deck"
```

Inside a larger project, prefer an explicit deck path:

```sh
slidesls init ./slides/my-deck --template minimal --theme executive-blue --title "My Deck"
```

`slidesls init` writes `slidesls.json`, `index.html`, and `slidesls/` into the target directory, so only run it at a project root if the root itself is meant to be the deck.

## Minimal shell

```html
<!doctype html>
<html lang="en" data-ls-theme="executive-blue">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Slide deck</title>
    <link rel="stylesheet" href="./slidesls/registry/core/base/reset.css" />
    <link rel="stylesheet" href="./slidesls/registry/core/base/tokens.css" />
    <link rel="stylesheet" href="./slidesls/registry/presets/themes/executive-blue/theme.css" />
    <link rel="stylesheet" href="./slidesls/registry/core/base/slide.css" />
    <link rel="stylesheet" href="./slidesls/registry/utilities/layout/layout.css" />
    <link rel="stylesheet" href="./slidesls/registry/animations/reveal/reveal.css" />
    <script type="module" src="./slidesls/registry/core/base/slide-runtime.js"></script>
  </head>
  <body class="ls-page">
    <main class="ls-deck" data-ls-deck aria-label="Slide deck">
      <section class="ls-slide" data-ls-slide-kind="content" aria-label="Opening slide">
        <div class="ls-slide__inner">
          <header class="ls-slide__header">
            <p class="ls-eyebrow">Topic</p>
            <h1 class="ls-title">A clear opening statement</h1>
            <p class="ls-subtitle ls-reveal" data-step="1">Supporting point.</p>
          </header>
        </div>
      </section>
    </main>
  </body>
</html>
```

## Required shell pieces

- `body.ls-page` for page background and typography.
- `.ls-deck[data-ls-deck]` for runtime initialization.
- `.ls-slide` for each slide.
- `.ls-slide__inner` for base padding/grid/safe area.
- `slide-runtime.js` as a module script.

## Themes

Choose exactly one theme per deck and set it on `<html>` with `data-ls-theme`. Do not stack multiple theme attributes.

- Product/professional: `executive-blue` + `templates/title-hero` + `templates/split` + `templates/metric-dashboard`.
- Board/business: `boardroom-navy` + `templates/section-divider` + `templates/metric-dashboard` + `components/table`/`components/quote`.
- Technical: `technical-deep` + `presets/fonts/technical-mono` + `templates/code-plus-notes` + `templates/split-diagram`.
- Workshop/playful: `playful-ink` + `templates/three-cards` + `components/callout` + `components/image-card`.

Prefer spacing, hierarchy, and solid surfaces over decorative gradients or glow-heavy effects.

## Composition model

Use:

- templates for complete slide skeletons, e.g. `templates/split`;
- utilities for layout, e.g. `utilities/layout` with `.ls-stack` and `.ls-grid`;
- standalone components for content, e.g. `components/card` and `components/panel`.

Do not use `ls-layout-*` classes or hidden ancestor-dependent layout contracts. Content slides use `data-ls-slide-kind="content"`, a top `.ls-slide__header`, and body layout below it. Hero and section slides must be marked with `data-ls-slide-kind="hero"` or `"section"` and may intentionally use `.ls-slide-fill` with centering utilities. Do not use `.ls-slide-fill` on ordinary content slides. Centering utilities such as `.ls-center` and `.ls-center-start` center the content cluster; they should not strand headings, subtitles, and badges at opposite ends of a full-height column. Use `.ls-panel--fit` for short text-only callouts and `.ls-panel--frame` for screenshots, diagrams, code, or media frames that intentionally need visual mass.

## Adding registry items

Use brief catalog and snippet inspect first:

```sh
slidesls catalog --starter --json
slidesls catalog --type template --json
slidesls inspect templates/split --json
slidesls inspect components/card --json
```

Use `slidesls catalog --api --json` or `slidesls inspect <item> --api --json` only for low-level public classes, modifiers, data attributes, and CSS variables. Do not invent `ls-*` classes; validation warns for unknown `ls-*` classes and strict validation errors.

Use `add --dry-run --json` before copying. After copying, add any returned `<link>` or `<script>` tags to the entry HTML. `add` does not mutate HTML for you.

## Animation and reveal contract

Unless the user asks for a static deck, prefer progressive disclosure with `animations/reveal` and one subtle variant:

```sh
slidesls add animations/reveal animations/slide-up --dir <deck> --dry-run --json
slidesls add animations/reveal animations/slide-up --dir <deck>
```

```html
<div data-ls-reveal-sequence>
  <article class="ls-card ls-reveal ls-reveal-slide-up">...</article>
  <article class="ls-card ls-reveal ls-reveal-slide-up">...</article>
</div>
```

Use animation to reveal ideas, not decorate every element. Prefer `slide-up` for cards/lists, `fade` for captions/secondary notes, and `scale-in` sparingly for metrics/hero callouts. Do not stack transform variants.

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

- Opening/title: `templates/title-hero`, `templates/section-divider`, `components/badge`.
- Split explanation: `templates/split`, `utilities/layout`, `components/panel`, `components/card`.
- Comparison/cards: `templates/three-cards`, `components/card`, `components/table`.
- Dashboard: `templates/metric-dashboard`, `components/metric`, `components/progress`, `components/panel`.
- Timeline/process: `components/timeline`, `templates/three-cards`.
- Code explainer: `templates/code-plus-notes`, `components/code-block`, `components/callout`.
- Visual explanation: `templates/split-diagram`, `components/image-card`, `components/panel`.

Use `slidesls inspect <item> --json` and snippet metadata as the source of truth.
