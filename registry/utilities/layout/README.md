# utilities/layout

Reusable layout utilities for safe slide composition. These classes work anywhere and do not depend on hidden slide-layout ancestors.

## Classes

- `.ls-stack` — vertical rhythm using CSS grid. Rows size to content and anchor to the start; set `--ls-stack-align-content: center` to center a stack inside a taller area.
- `.ls-stack--sm` / `.ls-stack--lg` — smaller or larger stack gap.
- `.ls-cluster` — wrapping inline cluster.
- `.ls-grid` — generic grid container. Rows size to content and the row block centers vertically in the available area by default, so sparse content composes as a balanced band instead of stretched boxes.
- `.ls-grid--2` / `.ls-grid--3` / `.ls-grid--4` — equal column grids. Use `.ls-grid--4` only for short, compact cards or metrics.
- `.ls-grid--start` — content-sized rows anchored to the top, for editorial layouts that want top alignment under the header.
- `.ls-grid--fill` — restores stretch-to-fill rows for grids that intentionally fill the body area (frames, diagrams, dashboards, full-slide hero layouts). Do not use it for sparse card grids; stretched sparse cards trap dead space.
- `.ls-grid--wide-left` / `.ls-grid--wide-right` — asymmetric two-column grids.
- `.ls-center` — center the content cluster in both axes.
- `.ls-center-start` — center the content cluster vertically while aligning inline content to the start.
- `.ls-text-start` — start-align text when composing with centering utilities.
- `.ls-fill` — fill the available block size inside a known parent area.
- `.ls-slide-fill` — direct child of `.ls-slide__inner` for true full-slide content that spans the shell rows.
- `.ls-frame` — centered media/visual frame.

## Slide shell models

Use one of two safe models:

1. Header/body: `.ls-slide__header` plus `.ls-slide__body`.
2. Full-slide: `.ls-slide__inner > .ls-slide-fill`.

Do not use direct `.ls-fill` as a full-slide shortcut; it fills only the current grid area and will not span the slide shell. Standard decks are fixed 1600×900 and transform-scaled, so layout utilities intentionally avoid misleading container-query fallbacks. For dense four-column content, shorten copy, use compact component density, or lower `--ls-grid-gap`.

Use CSS variables like `--ls-grid-gap` and `--ls-stack-gap` for local tuning, and `--ls-grid-align-content` / `--ls-stack-align-content` for one-off vertical alignment overrides.

## When not to use

- Do not add `.ls-grid--fill` to grids of text cards with short copy; the cards stretch to fill the body and pin their text to the top. Keep the default content-sized rows, or restructure with `templates/icon-grid` / `templates/feature-rows`.
- Do not use `.ls-grid--4` for cards that carry more than a title and a couple of short lines; use fewer columns or split the slide.
