# utilities/layout

Reusable layout utilities for safe slide composition. These classes work anywhere and do not depend on hidden slide-layout ancestors.

## Classes

- `.ls-stack` — vertical rhythm using CSS grid.
- `.ls-stack--sm` / `.ls-stack--lg` — smaller or larger stack gap.
- `.ls-cluster` — wrapping inline cluster.
- `.ls-grid` — generic grid container.
- `.ls-grid--2` / `.ls-grid--3` / `.ls-grid--4` — equal column grids. Use `.ls-grid--4` for short, compact cards or metrics.
- `.ls-grid--wide-left` / `.ls-grid--wide-right` — asymmetric two-column grids.
- `.ls-center` — center content in both axes.
- `.ls-fill` — fill available block size.
- `.ls-frame` — centered media/visual frame.

Use CSS variables like `--ls-grid-gap` and `--ls-stack-gap` for local tuning.
