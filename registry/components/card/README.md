# components/card

Flat feature and explanation cards for slide content.

Requires `core/base`.

Useful classes:

- `.ls-card`
- `.ls-card--row`
- `.ls-card--center` — center content vertically when the card sits in a stretched context (`.ls-grid--fill` grids or decks copied before content-sized grids).
- `.ls-card__body`
- `.ls-card__title`
- `.ls-card__text`

Sizing variables: `--ls-card-padding`, `--ls-card-title-size`, `--ls-card-text-size`. Compact slide density scopes smaller defaults for dense card grids; spacious density scales card type and padding up for sparse slides.

## When not to use

- Do not build a grid of cards that each carry only a title plus one short sentence; use `templates/feature-rows` (one-liner rows) or `templates/icon-grid` (compact tiles) instead.
- Do not use more than 4 cards in one grid; wrapped rows of equal boxes read as filler.
