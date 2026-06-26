# Metric Dashboard

Dashboard composition for a headline insight plus metric/card regions.

## Usage

Root `.ls-metric-dashboard`; regions:

- `.ls-metric-dashboard__hero`
- `.ls-metric-dashboard__metrics`
- `.ls-metric-dashboard__panel`
- `.ls-metric-dashboard__footer`

Attributes:

- `data-ls-variant="hero-left|hero-top|balanced"`
- `data-ls-density="compact|comfortable"`
- `data-ls-valign="start|center|space-between|stretch"`

The default is content-aligned/start so sparse metric cards do not stretch awkwardly. Use `data-ls-valign="stretch"` when equal-height metric regions are intentional.

Variables:

- `--ls-metric-dashboard-gap`
- `--ls-metric-dashboard-hero-size`
- `--ls-metric-dashboard-metric-min-inline`

## Copy

Copy `metric-dashboard.css` after `core/base` styles.
