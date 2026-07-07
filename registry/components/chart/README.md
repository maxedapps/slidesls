# Chart

Dependency-free CSS mini-charts: horizontal bar rows, vertical column sets, and a donut for single proportions. Token-colored, no JavaScript, and honest by construction — geometry is proportional to the value on a fixed 0–100 scale.

## Usage

- `.ls-chart` — the root. Requires `role="img"` and an `aria-label` (see below).
- `.ls-chart__title` — small uppercase chart title.

Bar rows (default):

- `.ls-chart__row` — label / track / value grid row.
- `.ls-chart__label`, `.ls-chart__value` — text cells; always print the real value.
- `.ls-chart__track` > `.ls-chart__bar` — the bar; set `style="--ls-chart-value: NN"` (0–100) on the bar.

Column set (`.ls-chart--columns`):

- `.ls-chart__columns` — baseline-ruled column area (`--ls-chart-column-height`, default `300px`).
- `.ls-chart__column` — one column; set `--ls-chart-value` on it; contains a `.ls-chart__value` and `.ls-chart__label`.

Donut (`.ls-chart--donut`):

- `.ls-chart__donut` — conic ring sized by `--ls-chart-donut-size` (default `260px`); set `--ls-chart-value` on it and put the `.ls-chart__value` inside.

Override-safe variables: `--ls-chart-value` (0–100), `--ls-chart-color` (default `var(--ls-accent)`), `--ls-chart-label-width` (`220px`), `--ls-chart-bar-size` (`26px`), `--ls-chart-column-height`, `--ls-chart-donut-size`.

## Accessibility & honesty

- `role="img"` and `aria-label` are **required** on the chart root. The label must describe the data ("Bar chart: deploy frequency per team. Payments 82, Search 64, Mobile 38."), because the bars themselves are presentational markup.
- Values are 0–100 with a **fixed zero baseline**. There is no axis-minimum hook: bar and column geometry is always proportional to the full scale, so truncated, exaggerated bars are inexpressible. Normalize data to percentages of the axis maximum and print real values in `.ls-chart__value`.

## When not to use

- More than ~6 categories or a time series — export a real plot and frame it in `components/figure`.
- A single headline number — `components/stat` says it louder without fake precision.
- Exact-value lookups — `components/table` beats reading bar lengths.

## Copy

Copy `chart.css` after `core/base` styles.
