# Title hero

The deck opener: badges for context, a display-size claim, one support line, and an optional figure. The title is the promise of the deck — write it as the conclusion, not the topic.

The figure variant uses `ls-hero-media` + `ls-hero-copy` so badges, title, and subtitle stay grouped. Do not place grouped hero copy directly into aligned subgrid regions; those layouts are for heading/body/footer rows.

## Contract

- title: exactly one, ≤ 10 words, phrased as a claim
- subtitle: optional, ≤ 20 words
- badges: 0–3, ≤ 3 words each
- figure: optional — follow the image-sourcing ladder (real asset → authored diagram → `ls-figure--abstract` → the statement variant)

## Motion

The core entrance stagger is the choreography; a title slide never needs `data-step`.

## When not to use

- Mid-deck content: use `archetypes/section` for chapter breaks, `archetypes/statement` for claims, or a content archetype for actual material.
- When no honest figure exists and the abstract art fights the style: use the statement variant instead of forcing a visual.
