# Metric

Single KPI/stat block.

## Usage

Key classes/attributes:

- `.ls-metric`
- `.ls-metric__value`
- `.ls-metric__label`
- `.ls-metric__delta`
- `data-ls-compact="true"`

Metric content aligns to the start by default so sparse values and labels stay visually grouped even inside taller dashboard regions.

## When not to use

- Narrative or multi-sentence content — metrics are for one number plus a short label; use `components/card` for explanations.

## Copy

Copy `metric.css` after `core/base` styles.
