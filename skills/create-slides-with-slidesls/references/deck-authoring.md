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

## Composition and visual choices

Choose two independent axes before authoring:

- Composition: use templates for complete paste-ready slide skeletons, or compose primitives from `utilities/layout` plus standalone components.
- Visual styling: use default base tokens, choose exactly one theme preset, or override safe token variables in a deck-level `@layer tokens` block.

Primitive-first workflow:

```sh
slidesls init ./deck --template blank --title "Deck"
slidesls catalog --type component --json
slidesls inspect utilities/layout components/card components/panel --json
slidesls add utilities/layout components/card components/panel --dir ./deck --dry-run --json
slidesls add utilities/layout components/card components/panel --dir ./deck
```

Minimal primitive-authored content slide:

```html
<section class="ls-slide" data-ls-slide-kind="content" aria-label="Custom primitive slide">
  <div class="ls-slide__inner">
    <header class="ls-slide__header">
      <p class="ls-eyebrow">Primitive composition</p>
      <h2 class="ls-title">Compose from layout utilities and components.</h2>
    </header>
    <div class="ls-grid ls-grid--2">
      <article class="ls-card">
        <div class="ls-card__body">
          <h3 class="ls-card__title">Layout stays explicit</h3>
          <p class="ls-card__text">Use utilities for structure and components for content.</p>
        </div>
      </article>
      <div class="ls-panel ls-panel--frame ls-panel--center">
        <p class="ls-panel__text">Diagram or visual anchor</p>
      </div>
    </div>
  </div>
</section>
```

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

## Themes and default tokens

Themes are optional token presets. If you omit `data-ls-theme`, the deck still uses the default dark blue-accent base tokens from `core/base/tokens.css`; it is not unstyled. Choose exactly one theme per deck when a prebuilt visual direction is desired and set it on `<html>` with `data-ls-theme`. Do not stack multiple theme attributes.

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

`.ls-grid` sizes its rows to content and centers the row block vertically in the body area, so sparse content composes as a balanced band instead of stretched boxes. `.ls-grid--start` anchors content-sized rows to the top; `.ls-grid--fill` restores stretch-to-fill rows for grids that intentionally fill the body (frames, diagrams, dashboards, full-slide hero layouts) — never use it for sparse card grids. When a card must sit in a stretched context anyway, `.ls-card--center` centers its content vertically. `.ls-stack` rows are content-sized and top-anchored; set `--ls-stack-align-content: center` to center a stack inside a taller area.

## Density → layout decision table

Choose the layout from item count and copy length; each registry item's `composition` metadata (`avoidWhen`, `alternatives`) encodes the same rules at decision time.

| Content                                      | Layout                                                                          |
| -------------------------------------------- | ------------------------------------------------------------------------------- |
| 3-5 one-liner points                         | `templates/feature-rows` — full-width icon rows; not full-height cards          |
| 4-6 short items (title + one sentence)       | `templates/icon-grid` — compact tiles; never 5+ stretched cards                 |
| 3 items with 2-4 sentences or a visual each  | `templates/three-cards`                                                         |
| 1 big idea + sparse support                  | hero/section slide kind, or `templates/split` with `data-ls-density="spacious"` |
| A real visual/diagram plus supporting points | `templates/split` or `templates/split-diagram`                                  |
| KPIs and progress                            | `templates/metric-dashboard` — one centered band of 2-4 cells                   |
| Dense tables/code                            | `data-ls-density="compact"` plus the existing fit rules and visual review       |

Density variants scale the whole slide: `data-ls-density="spacious"` raises card/callout/icon-item type, padding, and gaps so short copy carries weight; `"compact"` scales down for dense slides. Both go on `section.ls-slide`.

## Change accent color and fonts

Customize by overriding token variables, switching presets, or both. Never redefine `.ls-*` selectors in deck CSS outside `@layer` — unlayered rules beat every layered component style and break the upgrade path. Token overrides in a deck-level `@layer tokens` block are the supported boundary:

```html
<style>
  @layer tokens {
    :root {
      --ls-accent: #e8590c;
      --ls-accent-2: #f7b267;
      --ls-accent-text: #ffd9c0;
      --ls-font-heading: "Avenir Next", var(--ls-font-sans);
    }
  }
</style>
```

- Themes: copy `presets/themes/<name>` and set `data-ls-theme="<name>"` on `<html>` (exactly one).
- Fonts: copy a `presets/fonts/*` preset and set `data-ls-font` when you want a font-role remap; or override `--ls-font-heading`/`--ls-font-body` directly as above.
- Which variables are safe: `slidesls inspect <item> --api --json` lists each item's `cssVariables` with defaults and an `overrideSafe` flag (`core/base` carries the token surface: accents, text colors, spacing, card/callout sizing).
- Local tuning: set variables on a single element instead of `:root`, e.g. `<div class="ls-grid ls-grid--3" style="--ls-grid-gap: 40px">`.

## Adding registry items

Use brief catalog and snippet inspect first:

```sh
slidesls catalog --json
slidesls catalog --starter --json
slidesls catalog --type component --json
slidesls catalog --type template --json
slidesls inspect templates/split --json
slidesls inspect components/card --json
slidesls inspect utilities/layout --api --json
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
- Short-copy lists: `templates/feature-rows` (3-5 one-liners), `templates/icon-grid` (4-6 short items), `components/icon-item`.
- Split explanation: `templates/split`, `utilities/layout`, `components/panel`, `components/card`.
- Comparison/cards: `templates/three-cards`, `components/card`, `components/table`.
- Dashboard: `templates/metric-dashboard`, `components/metric`, `components/progress`, `components/panel`.
- Timeline/process: `components/timeline`, `templates/three-cards`.
- Code explainer: `templates/code-plus-notes`, `components/code-block`, `components/callout`.
- Visual explanation: `templates/split-diagram`, `components/image-card`, `components/panel`.

Use `slidesls inspect <item> --json` and snippet metadata as the source of truth.
