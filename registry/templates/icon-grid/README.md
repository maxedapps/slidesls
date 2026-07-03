# templates/icon-grid

Compact tile grid for 4-6 short items: icon + title + one-liner per tile. Rows size to content and the grid centers vertically, so short copy composes as a balanced band instead of six stretched cards.

Composed from `utilities/layout` (`.ls-grid--3`) and `components/icon-item`.

Use `.ls-grid--3` for 5-6 items (two rows) and `.ls-grid--2` for 4 items. Keep every tile to one title and one sentence.

## When not to use

- Do not use icon-grid when each point needs 2-4 sentences or a visual; use `templates/three-cards` (3 items) or a `split` layout.
- Do not exceed 6 tiles; split the content across two slides instead.
