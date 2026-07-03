# components/icon-item

Compact icon + title + one-liner tile for short-copy layouts. This is the building block for `templates/icon-grid` and `templates/feature-rows`: it stays content-sized, so grids and stacks of icon items compose as balanced bands instead of stretched boxes.

Requires `core/base` (the `.ls-icon-badge` wrapper comes from there).

Useful classes:

- `.ls-icon-item` — icon left, body right; content-sized.
- `.ls-icon-item--boxed` — adds card-style surface, border, and padding.
- `.ls-icon-item__body`
- `.ls-icon-item__title`
- `.ls-icon-item__text`

Sizing variables: `--ls-icon-item-padding`, `--ls-icon-item-title-size`, `--ls-icon-item-text-size`. Slide density (`compact`/`spacious`) scales them with the rest of the slide.

Use any icon inside the badge cell: an inline SVG, a Lucide icon (when the deck loads Lucide), or a text glyph.

## When not to use

- Do not use icon items for points that need 2-4 sentences of explanation; use `components/card` so the copy has room.
- Do not mix boxed and unboxed icon items in the same grid; pick one surface treatment per slide.
