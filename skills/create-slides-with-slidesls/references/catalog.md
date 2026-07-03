# slidesls Agent Catalog

Generated from `registry.json` and per-item metadata. Do not edit manually; run `slidesls generate-catalog`.

Deep reference for per-item lookup only; it is large, so do not read it end-to-end. For normal authoring use `slidesls catalog --json` (brief) and `slidesls inspect <item> --json` (snippet) first, and open this file only to look up one item.

## Core

### core/base

- Label: Base
- Type: ls:core
- Description: Mandatory base styles and runtime for slidesls decks.
- Agent level: starter
- Agent recommended: yes
- Safe anywhere: yes
- Class groups:
  - `ls-page`: base only
  - `ls-deck`: base only
  - `ls-slide`: `ls-slide__inner`, `ls-slide__header`, `ls-slide__body`
- Classes: `ls-stage`, `ls-eyebrow`, `ls-title`, `ls-subtitle`, `ls-muted`, `ls-subtle`, `ls-accent-text`, `ls-icon`, `ls-icon-badge`, `ls-icon-mark`
- Data attributes: `data-ls-deck`, `data-step`, `data-ls-density=compact|spacious`, `data-ls-reveal-sequence`, `data-ls-sequence-skip`, `data-ls-slide-kind=content|hero|section`, `data-ls-lint=off`
- CSS variables: `--ls-slide-width` (default 1600px, not override-safe), `--ls-slide-height` (default 900px, not override-safe), `--ls-slide-bg` (default #111318, override-safe), `--ls-page-bg` (default #0b0d12, override-safe), `--ls-text` (default #f5f7fb, override-safe), `--ls-muted` (default #bcc3d0, override-safe), `--ls-accent` (default #3b82f6, override-safe), `--ls-accent-2` (default #22d3ee, override-safe), `--ls-accent-text` (default #bfdbfe, override-safe), `--ls-space-3` (default 16px, override-safe), `--ls-space-6` (default 48px, override-safe), `--ls-slide-padding-block` (default 92px, override-safe), `--ls-slide-padding-inline` (default 108px, override-safe), `--ls-title-line-height` (default 0.96, override-safe), `--ls-title-letter-spacing` (default -0.045em, override-safe), `--ls-card-padding` (default 24px, override-safe), `--ls-card-title-size` (default 28px, override-safe), `--ls-card-text-size` (default 21px, override-safe), `--ls-callout-padding` (default 22px 24px, override-safe), `--ls-callout-title-size` (default 27px, override-safe), `--ls-callout-text-size` (default 22px, override-safe), `--ls-font-heading` (default var(--ls-font-sans), override-safe), `--ls-font-body` (default var(--ls-font-sans), override-safe), `--ls-slide-header-gap` (default var(--ls-space-2), override-safe), `--ls-slide-header-max-inline-size` (default 1080px, override-safe)
- Usage: Use body.ls-page, a .ls-deck[data-ls-deck] wrapper, and one or more .ls-slide sections. Runtime state attributes such as data-ls-ready and data-active are managed by slide-runtime.js. Set data-ls-slide-kind on slides: content slides use .ls-slide\_\_header; hero/section slides may intentionally use centered full-slide layouts.
- Registry dependencies: none
- Files: registry/core/base/reset.css, registry/core/base/tokens.css, registry/core/base/slide.css, registry/core/base/icons.css, registry/core/base/slide-runtime.js
- Snippets: none
- Docs: registry/core/base/README.md

## Utilities

### utilities/layout

- Label: Layout
- Type: ls:utility
- Description: Reusable layout utilities for stacks, clusters, grids, centering, and fill behavior.
- Agent level: recommended
- Agent recommended: yes
- Root class: ls-stack
- Safe anywhere: no
- Composition:
  - Layout behavior: content-sized
  - Copy: Grids and stacks size rows to content by default; ls-grid--fill restores stretch for intentional full-area layouts.
  - Avoid when:
    - adding ls-grid--fill to grids of sparse text cards
  - Alternatives:
    - 4-6 short items need a grid: `templates/icon-grid`
    - 3-5 one-liner points need rows: `templates/feature-rows`
- Class groups:
  - `ls-stack`: `ls-stack--sm`, `ls-stack--lg`
    - Rule: Use one optional stack gap modifier.
  - `ls-grid`: `ls-grid--2`, `ls-grid--3`, `ls-grid--4`, `ls-grid--wide-left`, `ls-grid--wide-right`, `ls-grid--start`, `ls-grid--fill`
    - Rule: Use ls-grid with at most one column modifier; ls-grid--start and ls-grid--fill adjust vertical behavior and combine with column modifiers.
- Classes: `ls-cluster`, `ls-center`, `ls-center-start`, `ls-text-start`, `ls-fill`, `ls-slide-fill`, `ls-frame`
- Class metadata:
  - `ls-grid--fill`: scope `within-constrained-area`, safe anywhere no — Restores stretch-to-fill grid rows for intentional full-area layouts (frames, diagrams, dashboards). Not for sparse card grids — stretched sparse cards trap dead space.
  - `ls-slide-fill`: scope `direct-child-of-slide-inner`, safe anywhere no — Full-slide layouts that intentionally span the slide header/body rows. Not for ordinary content slides.
  - `ls-center`: scope `centers-content-cluster`, safe anywhere no — Intentional centering only (hero/section).
  - `ls-center-start`: scope `centers-content-cluster`, safe anywhere no — Intentional start-aligned centering (hero).
  - `ls-fill`: scope `within-constrained-area`, safe anywhere no — Fills a height-constrained parent area.
- CSS variables: `--ls-stack-gap` (default var(--ls-space-4), override-safe), `--ls-cluster-gap` (default var(--ls-space-3), override-safe), `--ls-cluster-align` (default center, override-safe), `--ls-grid-gap` (default var(--ls-space-5), override-safe), `--ls-grid-align-content` (default center, override-safe), `--ls-stack-align-content` (default start, override-safe), `--ls-frame-min-block-size` (default 320px, override-safe)
- Usage: Grid rows size to content and center vertically by default; add .ls-grid--fill only for grids that intentionally fill the body area (frames, diagrams, dashboards) and .ls-grid--start for top-anchored editorial layouts. Use .ls-grid--4 only for short, compact cards or metrics. Use .ls-slide-fill as a direct child of .ls-slide\_\_inner for full-slide centered layouts. Use .ls-fill only when content should intentionally fill the available slide/body area.
- Registry dependencies: core/base
- Files: registry/utilities/layout/layout.css
- Snippets: Basic utility layouts (registry/utilities/layout/snippets/basic.html)
- Docs: registry/utilities/layout/README.md

## Components

### components/badge

- Label: Badge
- Type: ls:component
- Description: Compact labels for slide metadata and short attributes.
- Agent level: recommended
- Agent recommended: yes
- Root class: ls-badge
- Safe anywhere: yes
- Class groups:
  - `ls-badge`: `ls-badge--accent`, `ls-badge--solid`
- Usage: Use for compact labels, statuses, or category markers.
- Registry dependencies: core/base
- Files: registry/components/badge/badge.css
- Snippets: Basic badge (registry/components/badge/snippets/basic.html)
- Docs: registry/components/badge/README.md

### components/callout

- Label: Callout
- Type: ls:component
- Description: Callout slide component.
- Agent level: recommended
- Agent recommended: yes
- Root class: ls-callout
- Safe anywhere: yes
- Class groups:
  - `ls-callout`: `ls-callout__icon`, `ls-callout__body`, `ls-callout__title`, `ls-callout__text`, `ls-callout--with-icon`
- Data attributes: `data-ls-tone=success|warning|danger`
- CSS variables: `--ls-callout-accent`, `--ls-callout-padding`, `--ls-callout-title-size`, `--ls-callout-text-size`
- Usage: Use data-ls-tone for semantic status callouts. Add .ls-callout--with-icon only when an .ls-callout\_\_icon is present.
- Registry dependencies: core/base
- Files: registry/components/callout/callout.css
- Snippets: Basic callout (registry/components/callout/snippets/basic.html)
- Docs: registry/components/callout/README.md

### components/card

- Label: Card
- Type: ls:component
- Description: Flat feature and explanation cards for slide content.
- Agent level: recommended
- Agent recommended: yes
- Root class: ls-card
- Safe anywhere: yes
- Composition:
  - Content density: balanced
  - Layout behavior: content-sized
  - Copy: 2-4 sentences or a visual per card; one-liner points fit components/icon-item better.
  - Avoid when:
    - a grid of cards where each holds only a title plus one short sentence
    - more than 4 cards in one grid
  - Alternatives:
    - one-liner points: `components/icon-item`
    - 4-6 short items in a grid: `templates/icon-grid`
- Class groups:
  - `ls-card`: `ls-card__body`, `ls-card__title`, `ls-card__text`, `ls-card--row`, `ls-card--center`
- CSS variables: `--ls-card-padding` (default 24px, override-safe), `--ls-card-title-size` (default 28px, override-safe), `--ls-card-text-size` (default 21px, override-safe)
- Usage: Use for content blocks inside grids or stacks; give each card 2-4 sentences or a visual. Add ls-card--center only when a card sits in a stretched context (ls-grid--fill) and its content should center vertically.
- Registry dependencies: core/base
- Files: registry/components/card/card.css
- Snippets: Basic card (registry/components/card/snippets/basic.html)
- Docs: registry/components/card/README.md

### components/code-block

- Label: Code Block
- Type: ls:component
- Description: Code Block slide component.
- Agent level: recommended
- Agent recommended: yes
- Root class: ls-code-block
- Safe anywhere: yes
- Class groups:
  - `ls-code-block`: `ls-code-block__header`
- Data attributes: `data-ls-density=dense`
- CSS variables: `--ls-code-max-block-size`, `--ls-code-font-size`, `--ls-code-padding`
- Usage: Use for short code excerpts that fit a slide without scrolling during presentation.
- Registry dependencies: core/base
- Files: registry/components/code-block/code-block.css
- Snippets: Basic code block (registry/components/code-block/snippets/basic.html)
- Docs: registry/components/code-block/README.md

### components/code-diff

- Label: Code Diff
- Type: ls:component
- Description: Compact static code-diff component for implementation change explanations.
- Agent level: advanced
- Agent recommended: no
- Root class: ls-code-diff
- Safe anywhere: yes
- Class groups:
  - `ls-code-diff`: `ls-code-diff__header`, `ls-code-diff__body`, `ls-code-diff__line`, `ls-code-diff__number`, `ls-code-diff__code`, `ls-code-diff__marker`
- Data attributes: `data-ls-density=compact`, `data-ls-diff=add|remove|focus`
- CSS variables: `--ls-code-diff-font-size`, `--ls-code-diff-padding-block`, `--ls-code-diff-max-block-size`
- Usage: Use for short static diffs; avoid dense, full-file excerpts on a slide.
- Registry dependencies: core/base
- Files: registry/components/code-diff/code-diff.css
- Snippets: Basic code diff (registry/components/code-diff/snippets/basic.html)
- Docs: registry/components/code-diff/README.md

### components/divider

- Label: Divider
- Type: ls:component
- Description: Content divider component.
- Agent level: recommended
- Agent recommended: yes
- Root class: ls-divider
- Safe anywhere: yes
- Class groups:
  - `ls-divider`: `ls-divider__label`
- Data attributes: `data-ls-density=compact|spacious`, `data-ls-orientation=vertical`, `data-ls-variant=accent|dashed`
- CSS variables: `--ls-divider-color`, `--ls-divider-thickness`, `--ls-divider-gap`
- Registry dependencies: core/base
- Files: registry/components/divider/divider.css
- Snippets: Basic divider (registry/components/divider/snippets/basic.html)
- Docs: registry/components/divider/README.md

### components/file-tree

- Label: File Tree
- Type: ls:component
- Description: Static file and folder tree component for project structure slides.
- Agent level: advanced
- Agent recommended: no
- Root class: ls-file-tree
- Safe anywhere: yes
- Class groups:
  - `ls-file-tree`: `ls-file-tree__item`, `ls-file-tree__name`, `ls-file-tree__meta`
- Data attributes: `data-ls-density=compact`, `data-ls-kind=folder|file`, `data-ls-state=active`
- CSS variables: `--ls-file-tree-font-size`, `--ls-file-tree-padding`
- Usage: Use for short static project structures; keep nesting shallow for slide fit.
- Registry dependencies: core/base
- Files: registry/components/file-tree/file-tree.css
- Snippets: Basic file tree (registry/components/file-tree/snippets/basic.html)
- Docs: registry/components/file-tree/README.md

### components/http-exchange

- Label: Http Exchange
- Type: ls:component
- Description: Static request and response blocks for API walkthrough slides.
- Agent level: advanced
- Agent recommended: no
- Root class: ls-http-exchange
- Safe anywhere: yes
- Class groups:
  - `ls-http-exchange`: `ls-http-exchange__block`, `ls-http-exchange__header`, `ls-http-exchange__method`, `ls-http-exchange__status`, `ls-http-exchange__url`
- Data attributes: `data-ls-density=compact`, `data-ls-tone=success|warning|danger`
- CSS variables: `--ls-http-font-size`, `--ls-http-padding`, `--ls-http-max-block-size`
- Usage: Use for compact static API request/response examples.
- Registry dependencies: core/base
- Files: registry/components/http-exchange/http-exchange.css
- Snippets: Basic HTTP exchange (registry/components/http-exchange/snippets/basic.html)
- Docs: registry/components/http-exchange/README.md

### components/icon-item

- Label: Icon Item
- Type: ls:component
- Description: Compact icon + title + one-liner tile for short-copy grids and rows.
- Agent level: recommended
- Agent recommended: yes
- Root class: ls-icon-item
- Pairs with: templates/icon-grid, templates/feature-rows
- Safe anywhere: yes
- Composition:
  - Content density: sparse
  - Layout behavior: content-sized
  - Copy: One short title and one sentence per item; longer copy belongs in components/card.
  - Avoid when:
    - a point needs multiple sentences of explanation or a large visual
  - Alternatives:
    - each point carries 2-4 sentences or a visual: `components/card`
- Class groups:
  - `ls-icon-item`: `ls-icon-item__body`, `ls-icon-item__title`, `ls-icon-item__text`, `ls-icon-item--boxed`
- CSS variables: `--ls-icon-item-padding` (default 20px, override-safe), `--ls-icon-item-title-size` (default 26px, override-safe), `--ls-icon-item-text-size` (default 21px, override-safe)
- Usage: Use for short points: one title plus one sentence, optionally with an icon glyph in .ls-icon-badge. Content-sized by design; grids and stacks of icon items compose as balanced bands.
- Registry dependencies: core/base
- Files: registry/components/icon-item/icon-item.css
- Snippets: Basic icon item (registry/components/icon-item/snippets/basic.html)
- Docs: registry/components/icon-item/README.md

### components/image-card

- Label: Image Card
- Type: ls:component
- Description: Image case-study card component.
- Agent level: recommended
- Agent recommended: yes
- Root class: ls-image-card
- Safe anywhere: yes
- Class groups:
  - `ls-image-card`: `ls-image-card__media`, `ls-image-card__content`, `ls-image-card__eyebrow`, `ls-image-card__title`, `ls-image-card__text`, `ls-image-card__meta`, `ls-image-card__badge`, `ls-image-card__caption`
- Data attributes: `data-ls-variant=plain|cover`, `data-ls-density=compact`, `data-ls-ratio=square|portrait`
- CSS variables: `--ls-image-card-aspect`, `--ls-image-card-gap`, `--ls-image-card-media-block`
- Registry dependencies: core/base
- Files: registry/components/image-card/image-card.css
- Snippets: Basic image card (registry/components/image-card/snippets/basic.html)
- Docs: registry/components/image-card/README.md

### components/metric

- Label: Metric
- Type: ls:component
- Description: Metric slide component.
- Agent level: recommended
- Agent recommended: yes
- Root class: ls-metric
- Safe anywhere: yes
- Composition:
  - Content density: sparse
  - Layout behavior: content-sized
  - Copy: One number plus a short label; the value carries the slide.
  - Avoid when:
    - narrative or multi-sentence content
  - Alternatives:
    - points need explanation: `components/card`
- Class groups:
  - `ls-metric`: `ls-metric__label`, `ls-metric__value`, `ls-metric__delta`
- Data attributes: `data-ls-compact=true`
- Usage: Use for one prominent KPI or numeric proof point.
- Registry dependencies: core/base
- Files: registry/components/metric/metric.css
- Snippets: Basic metric (registry/components/metric/snippets/basic.html)
- Docs: registry/components/metric/README.md

### components/panel

- Label: Panel
- Type: ls:component
- Description: Standalone visual panel for grouped slide content.
- Agent level: recommended
- Agent recommended: yes
- Root class: ls-panel
- Safe anywhere: yes
- Composition:
  - Content density: sparse, balanced
  - Layout behavior: content-sized
  - Copy: Use one panel as a visual anchor or grouped block; ls-panel--frame keeps visual mass for media.
  - Avoid when:
    - a grid of small text panels where each holds one short sentence
  - Alternatives:
    - several one-liner points: `components/icon-item`
- Class groups:
  - `ls-panel`: `ls-panel__title`, `ls-panel__text`, `ls-panel--muted`, `ls-panel--accent`, `ls-panel--center`, `ls-panel--fit`, `ls-panel--frame`
- CSS variables: `--ls-panel-gap`, `--ls-panel-padding`, `--ls-panel-border`, `--ls-panel-bg`, `--ls-panel-fit-min-block-size`, `--ls-panel-frame-min-block-size`
- Usage: Use muted/accent modifiers sparingly to create hierarchy. Use .ls-panel--fit for short text-only callouts that should not stretch to full column height. Use .ls-panel--frame for screenshots, diagrams, code, or media frames that should have visual mass.
- Registry dependencies: core/base
- Files: registry/components/panel/panel.css
- Snippets: Basic panel (registry/components/panel/snippets/basic.html)
- Docs: registry/components/panel/README.md

### components/progress

- Label: Progress
- Type: ls:component
- Description: Accessible progress component.
- Agent level: recommended
- Agent recommended: yes
- Root class: ls-progress
- Safe anywhere: yes
- Class groups:
  - `ls-progress`: `ls-progress__label`, `ls-progress__value`, `ls-progress__track`, `ls-progress__bar`
- Data attributes: `data-ls-tone=success|warning|danger`, `data-ls-density=compact|spacious`, `data-ls-animate=fill`
- CSS variables: `--ls-progress-value`, `--ls-progress-thickness`, `--ls-progress-label-size`
- Usage: Set --ls-progress-value to the fill percentage, e.g. 72%.
- Registry dependencies: core/base
- Files: registry/components/progress/progress.css
- Snippets: Basic progress (registry/components/progress/snippets/basic.html)
- Docs: registry/components/progress/README.md

### components/quote

- Label: Quote
- Type: ls:component
- Description: Quote slide component.
- Agent level: recommended
- Agent recommended: yes
- Root class: ls-quote
- Safe anywhere: yes
- Class groups:
  - `ls-quote`: `ls-quote__text`, `ls-quote__source`
- Registry dependencies: core/base
- Files: registry/components/quote/quote.css
- Snippets: Basic quote (registry/components/quote/snippets/basic.html)
- Docs: registry/components/quote/README.md

### components/table

- Label: Table
- Type: ls:component
- Description: Presentation-friendly table component.
- Agent level: recommended
- Agent recommended: yes
- Root class: ls-table
- Safe anywhere: yes
- Class groups:
  - `ls-table`: `ls-table__caption`, `ls-table__value`, `ls-table__muted`, `ls-table__note`
- Classes: `ls-table-frame`
- Data attributes: `data-ls-density=compact`, `data-ls-variant=striped|plain`, `data-ls-overflow=clip`
- CSS variables: `--ls-table-cell-padding`, `--ls-table-min-inline`, `--ls-table-accent`, `--ls-table-stripe-bg`
- Registry dependencies: core/base
- Files: registry/components/table/table.css
- Snippets: Basic table (registry/components/table/snippets/basic.html)
- Docs: registry/components/table/README.md

### components/terminal

- Label: Terminal
- Type: ls:component
- Description: Static terminal-style command and output component.
- Agent level: advanced
- Agent recommended: no
- Root class: ls-terminal
- Safe anywhere: yes
- Class groups:
  - `ls-terminal`: `ls-terminal__header`, `ls-terminal__controls`, `ls-terminal__control`, `ls-terminal__title`, `ls-terminal__body`, `ls-terminal__line`, `ls-terminal__prompt`, `ls-terminal__output`
- Data attributes: `data-ls-density=compact`, `data-ls-tone=danger|warning|success`
- CSS variables: `--ls-terminal-font-size`, `--ls-terminal-padding`, `--ls-terminal-max-block-size`
- Usage: Use for static CLI excerpts; do not imply interactive terminal behavior.
- Registry dependencies: core/base
- Files: registry/components/terminal/terminal.css
- Snippets: Basic terminal (registry/components/terminal/snippets/basic.html)
- Docs: registry/components/terminal/README.md

### components/timeline

- Label: Timeline
- Type: ls:component
- Description: Reusable timeline component.
- Agent level: recommended
- Agent recommended: yes
- Root class: ls-timeline
- Safe anywhere: yes
- Class groups:
  - `ls-timeline`: `ls-timeline__item`, `ls-timeline__marker`, `ls-timeline__body`, `ls-timeline__meta`, `ls-timeline__title`, `ls-timeline__text`
- Data attributes: `data-ls-density=compact`, `data-ls-orientation=horizontal`, `data-ls-progress=true`
- CSS variables: `--ls-timeline-gap`, `--ls-timeline-marker-size`, `--ls-timeline-accent`
- Registry dependencies: core/base
- Files: registry/components/timeline/timeline.css
- Snippets: Basic timeline (registry/components/timeline/snippets/basic.html)
- Docs: registry/components/timeline/README.md

## Animations

### animations/fade

- Label: Fade
- Type: ls:animation
- Description: Reveal-compatible fade animation utility.
- Agent level: starter
- Agent recommended: yes
- Safe anywhere: yes
- Class groups:
  - `ls-reveal-fade`: base only
- Usage: Combine with reveal sequencing classes/attributes for fade transitions. Combine with .ls-reveal and do not stack with another reveal transform variant.
- Registry dependencies: core/base, animations/reveal
- Files: registry/animations/fade/fade.css
- Snippets: Fade reveal sequence (registry/animations/fade/snippets/basic.html)
- Docs: registry/animations/fade/README.md

### animations/highlight

- Label: Highlight
- Type: ls:animation
- Description: Static or reveal-timed highlight emphasis.
- Agent level: advanced
- Agent recommended: no
- Safe anywhere: yes
- Class groups:
  - `ls-highlight`: base only
  - `ls-reveal-highlight`: base only
- CSS variables: `--ls-highlight-animation-duration`, `--ls-highlight-animation-accent`, `--ls-highlight-animation-spread`, `--ls-highlight-static-spread`
- Usage: Use .ls-highlight for static emphasis. Use .ls-reveal.ls-reveal-highlight with data-step for timed reveal highlights.
- Registry dependencies: core/base, animations/reveal
- Files: registry/animations/highlight/highlight.css
- Snippets: none
- Docs: registry/animations/highlight/README.md

### animations/reveal

- Label: Reveal
- Type: ls:animation
- Description: Vanilla CSS reveal transitions driven by the core slide runtime.
- Agent level: starter
- Agent recommended: yes
- Safe anywhere: yes
- Class groups:
  - `ls-reveal`: base only
- Data attributes: `data-step`, `data-ls-reveal-sequence`, `data-ls-sequence-skip`
- CSS variables: `--ls-duration`, `--ls-delay`, `--ls-ease`
- Usage: Use .ls-reveal with data-step or data-ls-reveal-sequence for progressive disclosure.
- Registry dependencies: core/base
- Files: registry/animations/reveal/reveal.css
- Snippets: Sequenced reveal (registry/animations/reveal/snippets/basic.html)
- Docs: registry/animations/reveal/README.md

### animations/scale-in

- Label: Scale In
- Type: ls:animation
- Description: Reveal-compatible scale-in animation.
- Agent level: recommended
- Agent recommended: yes
- Safe anywhere: yes
- Class groups:
  - `ls-reveal-scale-in`: base only
- CSS variables: `--ls-scale-in-duration`, `--ls-scale-in-ease`, `--ls-scale-in-start`
- Usage: Combine with .ls-reveal and do not stack with another reveal transform variant.
- Registry dependencies: core/base, animations/reveal
- Files: registry/animations/scale-in/scale-in.css
- Snippets: Scale-in reveal sequence (registry/animations/scale-in/snippets/basic.html)
- Docs: registry/animations/scale-in/README.md

### animations/slide-up

- Label: Slide Up
- Type: ls:animation
- Description: Reveal-compatible slide up animation utility.
- Agent level: starter
- Agent recommended: yes
- Safe anywhere: yes
- Class groups:
  - `ls-reveal-slide-up`: base only
- CSS variables: `--ls-slide-up-distance`, `--ls-slide-up-duration`, `--ls-slide-up-ease`
- Usage: Combine with .ls-reveal and do not stack with another reveal transform variant.
- Registry dependencies: core/base, animations/reveal
- Files: registry/animations/slide-up/slide-up.css
- Snippets: Slide-up reveal sequence (registry/animations/slide-up/snippets/basic.html)
- Docs: registry/animations/slide-up/README.md

## Presets

### presets/fonts/editorial-serif

- Label: Editorial Serif
- Type: ls:preset
- Description: Serif heading and display font role remap for editorial slide decks.
- Agent level: advanced
- Agent recommended: no
- Safe anywhere: yes
- Attributes: `data-ls-font="editorial-serif"`
- Usage: Apply deck-wide on body or scope to individual sections when mixing type systems.
- Registry dependencies: core/base
- Files: registry/presets/fonts/editorial-serif/font.css
- Snippets: none
- Docs: registry/presets/fonts/editorial-serif/README.md

### presets/fonts/system-humanist

- Label: System Humanist
- Type: ls:preset
- Description: Humanist system sans font role remap for professional slide decks.
- Agent level: advanced
- Agent recommended: no
- Safe anywhere: yes
- Attributes: `data-ls-font="system-humanist"`
- Usage: Apply deck-wide on body or scope to individual sections when mixing type systems.
- Registry dependencies: core/base
- Files: registry/presets/fonts/system-humanist/font.css
- Snippets: none
- Docs: registry/presets/fonts/system-humanist/README.md

### presets/fonts/technical-mono

- Label: Technical Mono
- Type: ls:preset
- Description: Monospace label font role remap for technical slide decks.
- Agent level: advanced
- Agent recommended: no
- Safe anywhere: yes
- Attributes: `data-ls-font="technical-mono"`
- Usage: Apply deck-wide on body or scope to individual sections when mixing type systems.
- Registry dependencies: core/base
- Files: registry/presets/fonts/technical-mono/font.css
- Snippets: none
- Docs: registry/presets/fonts/technical-mono/README.md

### presets/themes/executive-blue

- Label: Executive Blue
- Type: ls:preset
- Description: Clean professional blue theme for product and business decks.
- Agent level: starter
- Agent recommended: yes
- Theme attribute: executive-blue
- Style tone: professional dark blue
- Pairs with: presets/fonts/system-humanist
- Safe anywhere: yes
- Attributes: `data-ls-theme="executive-blue"`
- Usage: Apply exactly one theme per deck on the html element.
- Registry dependencies: core/base
- Files: registry/presets/themes/executive-blue/theme.css
- Snippets: none
- Docs: registry/presets/themes/executive-blue/README.md

### presets/themes/clean-light

- Label: Clean Light
- Type: ls:preset
- Description: Clean light theme for product, teaching, and print-friendly decks.
- Agent level: starter
- Agent recommended: yes
- Theme attribute: clean-light
- Style tone: clean professional light
- Pairs with: presets/fonts/system-humanist
- Safe anywhere: yes
- Attributes: `data-ls-theme="clean-light"`
- Usage: Apply exactly one theme per deck on the html element.
- Registry dependencies: core/base
- Files: registry/presets/themes/clean-light/theme.css
- Snippets: none
- Docs: registry/presets/themes/clean-light/README.md

### presets/themes/boardroom-navy

- Label: Boardroom Navy
- Type: ls:preset
- Description: Formal restrained navy theme for executive, strategy, and board decks.
- Agent level: recommended
- Agent recommended: yes
- Theme attribute: boardroom-navy
- Style tone: formal dark navy
- Pairs with: presets/fonts/system-humanist, presets/fonts/editorial-serif
- Safe anywhere: yes
- Attributes: `data-ls-theme="boardroom-navy"`
- Usage: Apply exactly one theme per deck on the html element.
- Registry dependencies: core/base
- Files: registry/presets/themes/boardroom-navy/theme.css
- Snippets: none
- Docs: registry/presets/themes/boardroom-navy/README.md

### presets/themes/technical-deep

- Label: Technical Deep
- Type: ls:preset
- Description: Precise high-contrast dark theme for engineering talks and code-heavy decks.
- Agent level: starter
- Agent recommended: yes
- Theme attribute: technical-deep
- Style tone: technical deep dark
- Pairs with: presets/fonts/technical-mono, presets/fonts/system-humanist
- Safe anywhere: yes
- Attributes: `data-ls-theme="technical-deep"`
- Usage: Apply exactly one theme per deck on the html element.
- Registry dependencies: core/base
- Files: registry/presets/themes/technical-deep/theme.css
- Snippets: none
- Docs: registry/presets/themes/technical-deep/README.md

### presets/themes/playful-ink

- Label: Playful Ink
- Type: ls:preset
- Description: Friendly dark ink theme for workshops, education, and playful product demos.
- Agent level: starter
- Agent recommended: yes
- Theme attribute: playful-ink
- Style tone: friendly dark ink
- Pairs with: presets/fonts/system-humanist, presets/fonts/editorial-serif
- Safe anywhere: yes
- Attributes: `data-ls-theme="playful-ink"`
- Usage: Apply exactly one theme per deck on the html element.
- Registry dependencies: core/base
- Files: registry/presets/themes/playful-ink/theme.css
- Snippets: none
- Docs: registry/presets/themes/playful-ink/README.md

## Templates

### templates/api-flow

- Label: Api Flow
- Type: ls:template
- Description: API flow slide combining HTTP exchange and focused code diff primitives.
- Agent level: advanced
- Agent recommended: no
- Safe anywhere: no
- Classes: `ls-slide`, `ls-slide__inner`, `ls-stack`, `ls-stack--sm`, `ls-eyebrow`, `ls-title`, `ls-grid`, `ls-grid--2`, `ls-http-exchange`, `ls-http-exchange__block`, `ls-http-exchange__header`, `ls-http-exchange__method`, `ls-http-exchange__status`, `ls-http-exchange__url`, `ls-code-diff`, `ls-code-diff__header`, `ls-code-diff__body`, `ls-code-diff__line`, `ls-code-diff__number`, `ls-code-diff__code`, `ls-code-diff__marker`
- Usage: Paste snippet HTML inside .ls-deck and copy its registryDependencies before use.
- Registry dependencies: core/base, utilities/layout, components/http-exchange, components/code-diff
- Files: none
- Snippets: API flow slide (registry/templates/api-flow/snippet.html)
- Docs: registry/templates/api-flow/README.md

### templates/code-plus-notes

- Label: Code Plus Notes
- Type: ls:template
- Description: Code-focused slide template with explanatory notes.
- Agent level: recommended
- Agent recommended: yes
- Safe anywhere: no
- Classes: `ls-slide`, `ls-slide__inner`, `ls-stack`, `ls-stack--sm`, `ls-eyebrow`, `ls-title`, `ls-grid`, `ls-grid--wide-left`, `ls-code-block`, `ls-card`, `ls-card__title`, `ls-card__text`, `ls-card__body`
- Usage: Paste snippet HTML inside .ls-deck and copy its registryDependencies before use. Keep code excerpts short; prefer dense code settings only after visual review.
- Registry dependencies: core/base, utilities/layout, components/code-block, components/card
- Files: none
- Snippets: Code plus notes slide (registry/templates/code-plus-notes/snippet.html)
- Docs: registry/templates/code-plus-notes/README.md

### templates/feature-rows

- Label: Feature Rows
- Type: ls:template
- Description: Stacked full-width rows template for 3-5 one-liner points.
- Agent level: starter
- Agent recommended: yes
- Safe anywhere: no
- Composition:
  - Content density: sparse
  - Layout behavior: content-sized
  - Item count: 3-5 one-liner points; for 4-6 very short items use templates/icon-grid.
  - Copy: One keyword or short title plus one sentence per row.
  - Avoid when:
    - points carry 2-4 sentences or visuals
    - there are more than 5 rows
  - Alternatives:
    - 3 items with 2-4 sentences or visuals each: `templates/three-cards`
    - 4-6 very short items: `templates/icon-grid`
- Classes: `ls-slide`, `ls-slide__inner`, `ls-slide__header`, `ls-eyebrow`, `ls-title`, `ls-grid`, `ls-icon-item`, `ls-icon-item--boxed`, `ls-icon-item__body`, `ls-icon-item__title`, `ls-icon-item__text`, `ls-icon-badge`
- Usage: Paste snippet HTML inside .ls-deck and copy its registryDependencies before use. Keep 3-5 rows with one sentence each; the single-column .ls-grid centers the block vertically.
- Registry dependencies: core/base, utilities/layout, components/icon-item
- Files: none
- Snippets: Feature rows slide (registry/templates/feature-rows/snippet.html)
- Docs: registry/templates/feature-rows/README.md

### templates/icon-grid

- Label: Icon Grid
- Type: ls:template
- Description: Compact icon-tile grid template for 4-6 short items.
- Agent level: starter
- Agent recommended: yes
- Safe anywhere: no
- Composition:
  - Content density: sparse
  - Layout behavior: content-sized
  - Item count: 4-6 short items; for 3 richer points use templates/three-cards, for one-liner rows use templates/feature-rows.
  - Copy: One title plus one sentence per tile; icons carry the visual weight.
  - Avoid when:
    - each item needs 2-4 sentences or a visual
    - there are more than 6 items (split across two slides instead)
  - Alternatives:
    - 3 items with 2-4 sentences or visuals each: `templates/three-cards`
    - 3-5 one-liner points that read as a list: `templates/feature-rows`
- Classes: `ls-slide`, `ls-slide__inner`, `ls-slide__header`, `ls-eyebrow`, `ls-title`, `ls-grid`, `ls-grid--3`, `ls-icon-item`, `ls-icon-item--boxed`, `ls-icon-item__body`, `ls-icon-item__title`, `ls-icon-item__text`, `ls-icon-badge`
- Usage: Paste snippet HTML inside .ls-deck and copy its registryDependencies before use. Use .ls-grid--3 for 5-6 items and .ls-grid--2 for 4 items; keep each tile to one title and one sentence.
- Registry dependencies: core/base, utilities/layout, components/icon-item
- Files: none
- Snippets: Icon grid slide (registry/templates/icon-grid/snippet.html)
- Docs: registry/templates/icon-grid/README.md

### templates/metric-dashboard

- Label: Metric Dashboard
- Type: ls:template
- Description: Dashboard template for metrics and progress indicators.
- Agent level: recommended
- Agent recommended: yes
- Safe anywhere: no
- Composition:
  - Content density: sparse, balanced
  - Layout behavior: content-sized
  - Item count: 2-4 metric or progress cells in one band; add a second row only when the data warrants it.
  - Copy: One number plus a short label per cell; explanation belongs in a split layout.
  - Avoid when:
    - the numbers need narrative explanation
    - only one metric matters
  - Alternatives:
    - numbers need a narrative next to them: `templates/split`
- Classes: `ls-slide`, `ls-slide__inner`, `ls-stack`, `ls-stack--sm`, `ls-eyebrow`, `ls-title`, `ls-grid`, `ls-grid--3`, `ls-panel`, `ls-metric`, `ls-metric__value`, `ls-metric__label`, `ls-progress`, `ls-progress__label`, `ls-progress__value`, `ls-progress__track`, `ls-progress__bar`
- Usage: Paste snippet HTML inside .ls-deck and copy its registryDependencies before use. Keep metric labels short; use the progress panel for one concise status indicator.
- Registry dependencies: core/base, utilities/layout, components/metric, components/progress, components/panel
- Files: none
- Snippets: Metric dashboard slide (registry/templates/metric-dashboard/snippet.html)
- Docs: registry/templates/metric-dashboard/README.md

### templates/section-divider

- Label: Section Divider
- Type: ls:template
- Description: Section break template for transitions between topics.
- Agent level: starter
- Agent recommended: yes
- Safe anywhere: no
- Classes: `ls-slide`, `ls-slide__inner`, `ls-center`, `ls-stack`, `ls-badge`, `ls-title`, `ls-subtitle`, `ls-slide-fill`
- Usage: Paste snippet HTML inside .ls-deck and copy its registryDependencies before use. Use .ls-slide-fill as the direct full-slide wrapper.
- Registry dependencies: core/base, utilities/layout, components/badge
- Files: none
- Snippets: Section divider slide (registry/templates/section-divider/snippet.html)
- Docs: registry/templates/section-divider/README.md

### templates/split

- Label: Split
- Type: ls:template
- Description: Two-column slide template for a visual plus supporting points.
- Agent level: starter
- Agent recommended: yes
- Safe anywhere: no
- Composition:
  - Content density: sparse, balanced
  - Layout behavior: content-sized
  - Copy: Put a real visual, diagram, or key statement in the panel column and 2-3 supporting cards in the stack.
  - Avoid when:
    - there is no real visual or anchor content for the panel column
  - Alternatives:
    - the slide is a plain list of short points: `templates/feature-rows`
- Classes: `ls-slide`, `ls-slide__inner`, `ls-stack`, `ls-stack--sm`, `ls-eyebrow`, `ls-title`, `ls-grid`, `ls-grid--wide-left`, `ls-panel`, `ls-panel--accent`, `ls-panel__text`, `ls-card`, `ls-card__title`, `ls-card__text`, `ls-panel--center`, `ls-card__body`
- Usage: Paste snippet HTML inside .ls-deck and copy its registryDependencies before use.
- Registry dependencies: core/base, utilities/layout, components/panel, components/card
- Files: none
- Snippets: Split slide (registry/templates/split/snippet.html)
- Docs: registry/templates/split/README.md

### templates/split-diagram

- Label: Split Diagram
- Type: ls:template
- Description: Asymmetric slide template for an explanatory diagram and notes.
- Agent level: recommended
- Agent recommended: yes
- Safe anywhere: no
- Classes: `ls-slide`, `ls-slide__inner`, `ls-stack`, `ls-stack--sm`, `ls-eyebrow`, `ls-title`, `ls-grid`, `ls-grid--wide-left`, `ls-panel`, `ls-callout`, `ls-callout__title`, `ls-callout__text`, `ls-panel--frame`, `ls-panel--center`, `ls-callout__body`
- Usage: Paste snippet HTML inside .ls-deck and copy its registryDependencies before use.
- Registry dependencies: core/base, utilities/layout, components/panel, components/callout
- Files: none
- Snippets: Split diagram slide (registry/templates/split-diagram/snippet.html)
- Docs: registry/templates/split-diagram/README.md

### templates/three-cards

- Label: Three Cards
- Type: ls:template
- Description: Three-card slide template for comparing related points.
- Agent level: starter
- Agent recommended: yes
- Safe anywhere: no
- Composition:
  - Content density: balanced
  - Layout behavior: content-sized
  - Item count: 3 cards; for 4-6 short items use templates/icon-grid.
  - Copy: Works when each card carries 2-4 sentences or a visual; for one-liners use templates/feature-rows.
  - Avoid when:
    - each card has only a title plus one short sentence and no visual
    - more than 4 items would wrap into stretched rows
  - Alternatives:
    - 4-6 short items: `templates/icon-grid`
    - 3-5 one-liner points: `templates/feature-rows`
- Classes: `ls-slide`, `ls-slide__inner`, `ls-stack`, `ls-stack--sm`, `ls-eyebrow`, `ls-title`, `ls-grid`, `ls-grid--3`, `ls-card`, `ls-card__title`, `ls-card__text`, `ls-card__body`
- Usage: Paste snippet HTML inside .ls-deck and copy its registryDependencies before use. Give each card 2-4 sentences or a visual; for one-liner points use templates/feature-rows and for 4-6 short items use templates/icon-grid.
- Registry dependencies: core/base, utilities/layout, components/card
- Files: none
- Snippets: Three cards slide (registry/templates/three-cards/snippet.html)
- Docs: registry/templates/three-cards/README.md

### templates/title-hero

- Label: Title Hero
- Type: ls:template
- Description: Opening slide template with a clear title, subtitle, and badges.
- Agent level: starter
- Agent recommended: yes
- Safe anywhere: no
- Composition:
  - Content density: sparse
  - Layout behavior: fills-area
  - Copy: One concise title, one subtitle, and a visual anchor; hero slides intentionally span the full slide.
  - Avoid when:
    - the slide is an ordinary content slide with a header/body shell
  - Alternatives:
    - presenting regular content under a header: `templates/split`
- Classes: `ls-slide`, `ls-slide__inner`, `ls-grid`, `ls-grid--wide-left`, `ls-grid--fill`, `ls-stack`, `ls-cluster`, `ls-badge`, `ls-title`, `ls-subtitle`, `ls-panel`, `ls-panel--accent`, `ls-eyebrow`, `ls-panel__text`, `ls-slide-fill`, `ls-center-start`, `ls-text-start`, `ls-panel--center`, `ls-panel--fit`
- Usage: Paste snippet HTML inside .ls-deck and copy its registryDependencies before use. Use .ls-slide-fill for full-slide centering; keep title copy concise enough for one or two lines. Use .ls-panel--fit for short text-only right panels; use .ls-panel--frame for screenshots, diagrams, or media anchors.
- Registry dependencies: core/base, utilities/layout, components/badge, components/panel
- Files: none
- Snippets: Title hero slide (registry/templates/title-hero/snippet.html)
- Docs: registry/templates/title-hero/README.md

### templates/technical-walkthrough

- Label: Technical Walkthrough
- Type: ls:template
- Description: Technical walkthrough slide combining a file tree with terminal output.
- Agent level: advanced
- Agent recommended: no
- Safe anywhere: no
- Classes: `ls-slide`, `ls-slide__inner`, `ls-stack`, `ls-stack--sm`, `ls-eyebrow`, `ls-title`, `ls-grid`, `ls-grid--wide-left`, `ls-file-tree`, `ls-file-tree__item`, `ls-file-tree__name`, `ls-file-tree__meta`, `ls-terminal`, `ls-terminal__header`, `ls-terminal__title`, `ls-terminal__body`, `ls-terminal__line`, `ls-terminal__prompt`, `ls-terminal__output`
- Usage: Paste snippet HTML inside .ls-deck and copy its registryDependencies before use.
- Registry dependencies: core/base, utilities/layout, components/file-tree, components/terminal
- Files: none
- Snippets: Technical walkthrough slide (registry/templates/technical-walkthrough/snippet.html)
- Docs: registry/templates/technical-walkthrough/README.md
