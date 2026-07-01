# utilities/layout

Reusable layout utilities for safe slide composition. These classes work anywhere and do not depend on hidden slide-layout ancestors.

## Classes

- `.ls-stack` — vertical rhythm using CSS grid.
- `.ls-stack--sm` / `.ls-stack--lg` — smaller or larger stack gap.
- `.ls-cluster` — wrapping inline cluster.
- `.ls-grid` — generic grid container.
- `.ls-grid--2` / `.ls-grid--3` / `.ls-grid--4` — equal column grids. Use `.ls-grid--4` only for short, compact cards or metrics.
- `.ls-grid--wide-left` / `.ls-grid--wide-right` — asymmetric two-column grids.
- `.ls-center` — center content in both axes.
- `.ls-center-start` — center vertically while aligning inline content to the start.
- `.ls-text-start` — start-align text when composing with centering utilities.
- `.ls-fill` — fill the available block size inside a known parent area.
- `.ls-slide-fill` — direct child of `.ls-slide__inner` for true full-slide content that spans the shell rows.
- `.ls-frame` — centered media/visual frame.

## Slide shell models

Use one of two safe models:

1. Header/body: `.ls-slide__header` plus `.ls-slide__body`.
2. Full-slide: `.ls-slide__inner > .ls-slide-fill`.

Do not use direct `.ls-fill` as a full-slide shortcut; it fills only the current grid area and will not span the slide shell. Standard decks are fixed 1600×900 and transform-scaled, so layout utilities intentionally avoid misleading container-query fallbacks. For dense four-column content, shorten copy, use compact component density, or lower `--ls-grid-gap`.

Use CSS variables like `--ls-grid-gap` and `--ls-stack-gap` for local tuning.
