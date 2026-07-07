# Big stat

One to three numbers at display size, each with a quiet label, grounded by a single context line that says where the numbers come from. Unboxed by design: scale contrast, not borders, makes the values land.

## Contract

- stats: 1–3; four numbers is a dashboard
- statValue: ≤ 6 characters ("3.4×", "99.99%", "12ms") — units in `<em>`
- statLabel: ≤ 8 words
- context: optional, one line, ≤ 16 words

## Motion

The core entrance stagger lands the numbers one after another; never add `data-step` to stats.

## When not to use

- Four or more metrics: use `archetypes/dashboard` before the values shrink into a grid of noise.
- The story is a trend or distribution, not a point value: use `components/chart` so the shape is honest.
