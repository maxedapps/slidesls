# Stat

An unboxed number. Display-size value, quiet label, optional delta — scale contrast does the work a border used to fake. Place a stat inside a `components/surface` only when the composition genuinely needs a frame.

## Usage

Key classes:

- `.ls-stat` — the container; content aligns to the start so sparse values stay grouped.
- `.ls-stat__value` — display-font, tabular-numeral value. Emphasize a span (e.g. the unit or the figure) with `<em>` or `.ls-accent-text`.
- `.ls-stat__label` — muted label in the label font.
- `.ls-stat__delta` — small bold delta. Defaults to the success color (up is good); set `data-ls-tone="down"` for regressions (danger color) or `data-ls-tone="neutral"` for judgment-free movement.

Modifiers:

- `.ls-stat--xl` — hero-size value for a single-stat slide.
- `.ls-stat--sm` — smaller value for dense KPI rows.
- `.ls-stat--center` — centers value, label, and delta.

Override-safe variable: `--ls-stat-value-size` (default `96px`; `--xl` uses `var(--ls-text-hero)`, `--sm` uses `64px`). Compact slide density shrinks the value automatically.

## When not to use

- Cross-category comparisons — use `components/chart`; a row of stats hides the relationship.
- More than 4 metrics — use `components/table` or a dashboard layout instead of shrinking stats.
- Numbers that need paragraphs of caveats — the stat's power is standing alone; reconsider the slide.

## Copy

Copy `stat.css` after `core/base` styles.
