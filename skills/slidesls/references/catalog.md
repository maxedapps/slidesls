# slidesls Agent Catalog

Generated from `registry.json` and per-item metadata. Do not edit manually; run `slidesls generate-catalog`.

## Core

### core/base

- Label: Base
- Type: ls:core
- Description: Mandatory base styles and runtime for slidesls decks.
- Agent recommended: yes
- Safe anywhere: yes
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
- Registry dependencies: core/base, animations/reveal
- Files: registry/animations/fade/fade.css
- Snippets: none
- Docs: registry/animations/fade/README.md

### animations/highlight

- Label: Highlight
- Type: ls:animation
- Description: Subtle highlight emphasis animation.
- Agent recommended: no
- Safe anywhere: yes
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
- Registry dependencies: core/base
- Files: registry/animations/reveal/reveal.css
- Snippets: none
- Docs: registry/animations/reveal/README.md

### animations/scale-in

- Label: Scale In
- Type: ls:animation
- Description: Reveal-compatible scale-in animation.
- Agent recommended: yes
- Safe anywhere: yes
- Registry dependencies: core/base, animations/reveal
- Files: registry/animations/scale-in/scale-in.css
- Snippets: none
- Docs: registry/animations/scale-in/README.md

### animations/slide-up

- Label: Slide Up
- Type: ls:animation
- Description: Reveal-compatible slide up animation utility.
- Agent recommended: yes
- Safe anywhere: yes
- Registry dependencies: core/base, animations/reveal
- Files: registry/animations/slide-up/slide-up.css
- Snippets: none
- Docs: registry/animations/slide-up/README.md

## Presets

### presets/fonts/editorial-serif

- Label: Editorial Serif
- Type: ls:preset
- Description: Serif heading and display font role remap for editorial slide decks.
- Agent recommended: no
- Safe anywhere: yes
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
- Registry dependencies: core/base
- Files: registry/presets/fonts/technical-mono/font.css
- Snippets: none
- Docs: registry/presets/fonts/technical-mono/README.md

## Templates

### templates/code-plus-notes

- Label: Code Plus Notes
- Type: ls:template
- Description: Code-focused slide template with explanatory notes.
- Agent recommended: yes
- Safe anywhere: no
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
- Registry dependencies: core/base, utilities/layout, components/badge, components/panel
- Files: none
- Snippets: Title hero slide (registry/templates/title-hero/snippet.html)
- Docs: registry/templates/title-hero/README.md
