# slidesls Agent Catalog

Generated from `registry.json` and per-item metadata. Do not edit manually; run `slidesls generate-catalog`.

## Core

### core/base

- Label: Base
- Type: ls:core
- Description: Mandatory base styles and runtime for slidesls decks.
- Agent recommended: yes
- Safe anywhere: yes
- Class groups:
  - `ls-page`: base only
  - `ls-deck`: base only
  - `ls-slide`: `ls-slide__inner`, `ls-slide__header`, `ls-slide__body`
- Classes: `ls-stage`, `ls-eyebrow`, `ls-title`, `ls-subtitle`, `ls-muted`, `ls-subtle`, `ls-accent-text`, `ls-icon`, `ls-icon-badge`, `ls-icon-mark`
- Data attributes: `data-ls-deck`, `data-step`, `data-ls-density=compact`, `data-ls-reveal-sequence`, `data-ls-sequence-skip`
- CSS variables: `--ls-slide-width`, `--ls-slide-height`, `--ls-slide-bg`, `--ls-page-bg`, `--ls-text`, `--ls-muted`, `--ls-accent`, `--ls-accent-text`, `--ls-space-3`, `--ls-space-6`, `--ls-slide-padding-block`, `--ls-slide-padding-inline`, `--ls-title-line-height`, `--ls-title-letter-spacing`, `--ls-card-padding`, `--ls-card-title-size`, `--ls-card-text-size`, `--ls-callout-padding`, `--ls-callout-title-size`, `--ls-callout-text-size`, `--ls-font-heading`, `--ls-font-body`
- Usage: Use body.ls-page, a .ls-deck[data-ls-deck] wrapper, and one or more .ls-slide sections. Runtime state attributes such as data-ls-ready and data-active are managed by slide-runtime.js.
- Registry dependencies: none
- Files: registry/core/base/reset.css, registry/core/base/tokens.css, registry/core/base/slide.css, registry/core/base/icons.css, registry/core/base/slide-runtime.js
- Snippets: none
- Docs: registry/core/base/README.md

## Utilities

### utilities/layout

- Label: Layout
- Type: ls:utility
- Description: Reusable layout utilities for stacks, clusters, grids, centering, and fill behavior.
- Agent recommended: yes
- Root class: ls-stack
- Safe anywhere: yes
- Class groups:
  - `ls-stack`: `ls-stack--sm`, `ls-stack--lg`
    - Rule: Use one optional stack gap modifier.
  - `ls-grid`: `ls-grid--2`, `ls-grid--3`, `ls-grid--4`, `ls-grid--wide-left`, `ls-grid--wide-right`
    - Rule: Use ls-grid with at most one grid modifier.
- Classes: `ls-cluster`, `ls-center`, `ls-center-start`, `ls-text-start`, `ls-fill`, `ls-slide-fill`, `ls-frame`
- CSS variables: `--ls-stack-gap`, `--ls-cluster-gap`, `--ls-cluster-align`, `--ls-grid-gap`, `--ls-frame-min-block-size`
- Usage: Use .ls-grid--4 only for short, compact cards or metrics. Use .ls-slide-fill as a direct child of .ls-slide\_\_inner for full-slide centered layouts. Use .ls-fill only when content should intentionally fill the available slide/body area.
- Registry dependencies: core/base
- Files: registry/utilities/layout/layout.css
- Snippets: Basic utility layouts (registry/utilities/layout/snippets/basic.html)
- Docs: registry/utilities/layout/README.md

## Components

### components/badge

- Label: Badge
- Type: ls:component
- Description: Compact labels for slide metadata and short attributes.
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
- Agent recommended: yes
- Root class: ls-card
- Safe anywhere: yes
- Class groups:
  - `ls-card`: `ls-card__body`, `ls-card__title`, `ls-card__text`, `ls-card--row`
- CSS variables: `--ls-card-padding`, `--ls-card-title-size`, `--ls-card-text-size`
- Usage: Use for compact content blocks inside grids or stacks.
- Registry dependencies: core/base
- Files: registry/components/card/card.css
- Snippets: Basic card (registry/components/card/snippets/basic.html)
- Docs: registry/components/card/README.md

### components/code-block

- Label: Code Block
- Type: ls:component
- Description: Code Block slide component.
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

### components/divider

- Label: Divider
- Type: ls:component
- Description: Content divider component.
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

### components/image-card

- Label: Image Card
- Type: ls:component
- Description: Image case-study card component.
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
- Agent recommended: yes
- Root class: ls-metric
- Safe anywhere: yes
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
- Agent recommended: yes
- Root class: ls-panel
- Safe anywhere: yes
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

### components/timeline

- Label: Timeline
- Type: ls:component
- Description: Reusable timeline component.
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

### presets/themes/boardroom-navy

- Label: Boardroom Navy
- Type: ls:preset
- Description: Formal restrained navy theme for executive, strategy, and board decks.
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

### templates/code-plus-notes

- Label: Code Plus Notes
- Type: ls:template
- Description: Code-focused slide template with explanatory notes.
- Agent recommended: yes
- Safe anywhere: no
- Classes: `ls-slide`, `ls-slide__inner`, `ls-stack`, `ls-stack--sm`, `ls-eyebrow`, `ls-title`, `ls-grid`, `ls-grid--wide-left`, `ls-code-block`, `ls-card`, `ls-card__title`, `ls-card__text`, `ls-card__body`
- Usage: Paste snippet HTML inside .ls-deck and copy its registryDependencies before use. Keep code excerpts short; prefer dense code settings only after visual review.
- Registry dependencies: core/base, utilities/layout, components/code-block, components/card
- Files: none
- Snippets: Code plus notes slide (registry/templates/code-plus-notes/snippet.html)
- Docs: registry/templates/code-plus-notes/README.md

### templates/metric-dashboard

- Label: Metric Dashboard
- Type: ls:template
- Description: Dashboard template for metrics and progress indicators.
- Agent recommended: yes
- Safe anywhere: no
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
- Agent recommended: yes
- Safe anywhere: no
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
- Agent recommended: yes
- Safe anywhere: no
- Classes: `ls-slide`, `ls-slide__inner`, `ls-stack`, `ls-stack--sm`, `ls-eyebrow`, `ls-title`, `ls-grid`, `ls-grid--3`, `ls-card`, `ls-card__title`, `ls-card__text`, `ls-card__body`
- Usage: Paste snippet HTML inside .ls-deck and copy its registryDependencies before use. Use compact copy: one short title and one sentence per card.
- Registry dependencies: core/base, utilities/layout, components/card
- Files: none
- Snippets: Three cards slide (registry/templates/three-cards/snippet.html)
- Docs: registry/templates/three-cards/README.md

### templates/title-hero

- Label: Title Hero
- Type: ls:template
- Description: Opening slide template with a clear title, subtitle, and badges.
- Agent recommended: yes
- Safe anywhere: no
- Classes: `ls-slide`, `ls-slide__inner`, `ls-grid`, `ls-grid--wide-left`, `ls-stack`, `ls-cluster`, `ls-badge`, `ls-title`, `ls-subtitle`, `ls-panel`, `ls-panel--accent`, `ls-eyebrow`, `ls-panel__text`, `ls-slide-fill`, `ls-center-start`, `ls-text-start`, `ls-panel--center`, `ls-panel--fit`
- Usage: Paste snippet HTML inside .ls-deck and copy its registryDependencies before use. Use .ls-slide-fill for full-slide centering; keep title copy concise enough for one or two lines. Use .ls-panel--fit for short text-only right panels; use .ls-panel--frame for screenshots, diagrams, or media anchors.
- Registry dependencies: core/base, utilities/layout, components/badge, components/panel
- Files: none
- Snippets: Title hero slide (registry/templates/title-hero/snippet.html)
- Docs: registry/templates/title-hero/README.md
