# slidesls Agent Catalog

Generated from `registry.json` and per-item metadata. Do not edit manually; run `slidesls generate-catalog`.

## Core

### core/base

- Label: Base
- Type: ls:core
- Description: Mandatory base styles and runtime for slidesls decks.
- Registry dependencies: none
- Files: registry/core/base/reset.css, registry/core/base/tokens.css, registry/core/base/slide.css, registry/core/base/icons.css, registry/core/base/slide-runtime.js
- Docs: registry/core/base/README.md

## Layouts

### layouts/title-hero

- Label: Title Hero
- Type: ls:layout
- Description: Opening slide layout with large title, subtitle, badges, and visual mark area.
- Registry dependencies: core/base
- Files: registry/layouts/title-hero/title-hero.css
- Docs: registry/layouts/title-hero/README.md

### layouts/detail-split

- Label: Detail Split
- Type: ls:layout
- Description: Asymmetric detail slide layout with a visual panel and explanatory stack.
- Registry dependencies: core/base
- Files: registry/layouts/detail-split/detail-split.css
- Docs: registry/layouts/detail-split/README.md

### layouts/asymmetric-feature

- Label: Asymmetric Feature
- Type: ls:layout
- Description: Asymmetric Feature slide layout.
- Registry dependencies: core/base
- Files: registry/layouts/asymmetric-feature/asymmetric-feature.css
- Docs: registry/layouts/asymmetric-feature/README.md

### layouts/centered-statement

- Label: Centered Statement
- Type: ls:layout
- Description: Centered Statement slide layout.
- Registry dependencies: core/base
- Files: registry/layouts/centered-statement/centered-statement.css
- Docs: registry/layouts/centered-statement/README.md

### layouts/comparison-grid

- Label: Comparison Grid
- Type: ls:layout
- Description: Comparison Grid slide layout.
- Registry dependencies: core/base
- Files: registry/layouts/comparison-grid/comparison-grid.css
- Docs: registry/layouts/comparison-grid/README.md

### layouts/image-spotlight

- Label: Image Spotlight
- Type: ls:layout
- Description: Image Spotlight slide layout.
- Registry dependencies: core/base
- Files: registry/layouts/image-spotlight/image-spotlight.css
- Docs: registry/layouts/image-spotlight/README.md

### layouts/section-divider

- Label: Section Divider
- Type: ls:layout
- Description: Section Divider slide layout.
- Registry dependencies: core/base
- Files: registry/layouts/section-divider/section-divider.css
- Docs: registry/layouts/section-divider/README.md

### layouts/two-column

- Label: Two Column
- Type: ls:layout
- Description: Two Column slide layout.
- Registry dependencies: core/base
- Files: registry/layouts/two-column/two-column.css
- Docs: registry/layouts/two-column/README.md

### layouts/three-column

- Label: Three Column
- Type: ls:layout
- Description: Three-column slide layout.
- Registry dependencies: core/base
- Files: registry/layouts/three-column/three-column.css
- Docs: registry/layouts/three-column/README.md

### layouts/metric-dashboard

- Label: Metric Dashboard
- Type: ls:layout
- Description: Dashboard layout for headline insights and metrics.
- Registry dependencies: core/base
- Files: registry/layouts/metric-dashboard/metric-dashboard.css
- Docs: registry/layouts/metric-dashboard/README.md

### layouts/timeline-strip

- Label: Timeline Strip
- Type: ls:layout
- Description: Full-slide horizontal timeline layout.
- Registry dependencies: core/base
- Files: registry/layouts/timeline-strip/timeline-strip.css
- Docs: registry/layouts/timeline-strip/README.md

### layouts/code-explainer

- Label: Code Explainer
- Type: ls:layout
- Description: Code-and-notes explainer layout.
- Registry dependencies: core/base
- Files: registry/layouts/code-explainer/code-explainer.css
- Docs: registry/layouts/code-explainer/README.md

### layouts/quote-feature

- Label: Quote Feature
- Type: ls:layout
- Description: Full-slide quote feature layout.
- Registry dependencies: core/base
- Files: registry/layouts/quote-feature/quote-feature.css
- Docs: registry/layouts/quote-feature/README.md

### layouts/layered-canvas

- Label: Layered Canvas
- Type: ls:layout
- Description: Layered visual canvas layout.
- Registry dependencies: core/base
- Files: registry/layouts/layered-canvas/layered-canvas.css
- Docs: registry/layouts/layered-canvas/README.md

## Components

### components/badge

- Label: Badge
- Type: ls:component
- Description: Compact labels for slide metadata and short attributes.
- Registry dependencies: core/base
- Files: registry/components/badge/badge.css
- Docs: registry/components/badge/README.md

### components/card

- Label: Card
- Type: ls:component
- Description: Flat feature and explanation cards for slide content.
- Registry dependencies: core/base
- Files: registry/components/card/card.css
- Docs: registry/components/card/README.md

### components/diagram

- Label: Diagram
- Type: ls:component
- Description: Simple flow and file-tree diagram primitives for concept slides.
- Registry dependencies: core/base
- Files: registry/components/diagram/diagram.css
- Docs: registry/components/diagram/README.md

### components/bullet-list

- Label: Bullet List
- Type: ls:component
- Description: Bullet List slide component.
- Registry dependencies: core/base
- Files: registry/components/bullet-list/bullet-list.css
- Docs: registry/components/bullet-list/README.md

### components/callout

- Label: Callout
- Type: ls:component
- Description: Callout slide component.
- Registry dependencies: core/base
- Files: registry/components/callout/callout.css
- Docs: registry/components/callout/README.md

### components/code-block

- Label: Code Block
- Type: ls:component
- Description: Code Block slide component.
- Registry dependencies: core/base
- Files: registry/components/code-block/code-block.css
- Docs: registry/components/code-block/README.md

### components/media-frame

- Label: Media Frame
- Type: ls:component
- Description: Media Frame slide component.
- Registry dependencies: core/base
- Files: registry/components/media-frame/media-frame.css
- Docs: registry/components/media-frame/README.md

### components/metric

- Label: Metric
- Type: ls:component
- Description: Metric slide component.
- Registry dependencies: core/base
- Files: registry/components/metric/metric.css
- Docs: registry/components/metric/README.md

### components/quote

- Label: Quote
- Type: ls:component
- Description: Quote slide component.
- Registry dependencies: core/base
- Files: registry/components/quote/quote.css
- Docs: registry/components/quote/README.md

### components/stat-grid

- Label: Stat Grid
- Type: ls:component
- Description: Stat Grid slide component.
- Registry dependencies: core/base
- Files: registry/components/stat-grid/stat-grid.css
- Docs: registry/components/stat-grid/README.md

### components/table

- Label: Table
- Type: ls:component
- Description: Presentation-friendly table component.
- Registry dependencies: core/base
- Files: registry/components/table/table.css
- Docs: registry/components/table/README.md

### components/timeline

- Label: Timeline
- Type: ls:component
- Description: Reusable timeline component.
- Registry dependencies: core/base
- Files: registry/components/timeline/timeline.css
- Docs: registry/components/timeline/README.md

### components/numbered-step

- Label: Numbered Step
- Type: ls:component
- Description: Numbered step component.
- Registry dependencies: core/base
- Files: registry/components/numbered-step/numbered-step.css
- Docs: registry/components/numbered-step/README.md

### components/progress

- Label: Progress
- Type: ls:component
- Description: Accessible progress component.
- Registry dependencies: core/base
- Files: registry/components/progress/progress.css
- Docs: registry/components/progress/README.md

### components/logo-strip

- Label: Logo Strip
- Type: ls:component
- Description: Logo strip component.
- Registry dependencies: core/base
- Files: registry/components/logo-strip/logo-strip.css
- Docs: registry/components/logo-strip/README.md

### components/highlight-text

- Label: Highlight Text
- Type: ls:component
- Description: Inline highlight text component.
- Registry dependencies: core/base
- Files: registry/components/highlight-text/highlight-text.css
- Docs: registry/components/highlight-text/README.md

### components/divider

- Label: Divider
- Type: ls:component
- Description: Content divider component.
- Registry dependencies: core/base
- Files: registry/components/divider/divider.css
- Docs: registry/components/divider/README.md

### components/annotation

- Label: Annotation
- Type: ls:component
- Description: Annotation component for diagrams and visual explanations.
- Registry dependencies: core/base
- Files: registry/components/annotation/annotation.css
- Docs: registry/components/annotation/README.md

### components/connector

- Label: Connector
- Type: ls:component
- Description: SVG/CSS connector component.
- Registry dependencies: core/base
- Files: registry/components/connector/connector.css
- Docs: registry/components/connector/README.md

### components/image-card

- Label: Image Card
- Type: ls:component
- Description: Image case-study card component.
- Registry dependencies: core/base
- Files: registry/components/image-card/image-card.css
- Docs: registry/components/image-card/README.md

### components/legend

- Label: Legend
- Type: ls:component
- Description: Diagram legend component.
- Registry dependencies: core/base
- Files: registry/components/legend/legend.css
- Docs: registry/components/legend/README.md

## Animations

### animations/reveal

- Label: Reveal
- Type: ls:animation
- Description: Vanilla CSS reveal transitions driven by the core slide runtime.
- Registry dependencies: core/base
- Files: registry/animations/reveal/reveal.css
- Docs: registry/animations/reveal/README.md

### animations/fade

- Label: Fade
- Type: ls:animation
- Description: Reveal-compatible fade animation utility.
- Registry dependencies: core/base, animations/reveal
- Files: registry/animations/fade/fade.css
- Docs: registry/animations/fade/README.md

### animations/slide-up

- Label: Slide Up
- Type: ls:animation
- Description: Reveal-compatible slide up animation utility.
- Registry dependencies: core/base, animations/reveal
- Files: registry/animations/slide-up/slide-up.css
- Docs: registry/animations/slide-up/README.md

### animations/stagger

- Label: Stagger
- Type: ls:animation
- Description: Reveal-compatible stagger animation utility.
- Registry dependencies: core/base, animations/reveal
- Files: registry/animations/stagger/stagger.css
- Docs: registry/animations/stagger/README.md

### animations/scale-in

- Label: Scale In
- Type: ls:animation
- Description: Reveal-compatible scale-in animation.
- Registry dependencies: core/base, animations/reveal
- Files: registry/animations/scale-in/scale-in.css
- Docs: registry/animations/scale-in/README.md

### animations/step-focus

- Label: Step Focus
- Type: ls:animation
- Description: CSS-only step focus animation companion.
- Registry dependencies: core/base, animations/reveal
- Files: registry/animations/step-focus/step-focus.css
- Docs: registry/animations/step-focus/README.md

### animations/highlight

- Label: Highlight
- Type: ls:animation
- Description: Subtle highlight emphasis animation.
- Registry dependencies: core/base, animations/reveal
- Files: registry/animations/highlight/highlight.css
- Docs: registry/animations/highlight/README.md

### animations/pulse

- Label: Pulse
- Type: ls:animation
- Description: Subtle pulse animation.
- Registry dependencies: core/base, animations/reveal
- Files: registry/animations/pulse/pulse.css
- Docs: registry/animations/pulse/README.md

### animations/spotlight

- Label: Spotlight
- Type: ls:animation
- Description: Spotlight focus animation.
- Registry dependencies: core/base, animations/reveal
- Files: registry/animations/spotlight/spotlight.css
- Docs: registry/animations/spotlight/README.md

### animations/connector-grow

- Label: Connector Grow
- Type: ls:animation
- Description: Connector growth animation.
- Registry dependencies: core/base, animations/reveal
- Files: registry/animations/connector-grow/connector-grow.css
- Docs: registry/animations/connector-grow/README.md

### animations/path-draw

- Label: Path Draw
- Type: ls:animation
- Description: SVG path drawing animation.
- Registry dependencies: core/base, animations/reveal
- Files: registry/animations/path-draw/path-draw.css
- Docs: registry/animations/path-draw/README.md

## Presets

### presets/fonts/editorial-serif

- Label: Editorial Serif
- Type: ls:preset
- Description: Serif heading and display font role remap for editorial slide decks.
- Registry dependencies: core/base
- Files: registry/presets/fonts/editorial-serif/font.css
- Docs: registry/presets/fonts/editorial-serif/README.md

### presets/fonts/technical-mono

- Label: Technical Mono
- Type: ls:preset
- Description: Monospace label font role remap for technical slide decks.
- Registry dependencies: core/base
- Files: registry/presets/fonts/technical-mono/font.css
- Docs: registry/presets/fonts/technical-mono/README.md

### presets/fonts/system-humanist

- Label: System Humanist
- Type: ls:preset
- Description: Humanist system sans font role remap for professional slide decks.
- Registry dependencies: core/base
- Files: registry/presets/fonts/system-humanist/font.css
- Docs: registry/presets/fonts/system-humanist/README.md
