# List

Styled lists: the sanctioned form for short items, replacing "grid of one-line boxes" as the default answer to 3–6 bullets. Markers are drawn in CSS — no glyph soup, no emoji.

## Usage

Apply to a `<ul>` or `<ol>`:

- `.ls-list` — the list container; resets list styling and manages the counter.
- `<li>` — single-line items take copy directly; markers are positioned in the item's indent.
- `.ls-list__title` — heading-font first line for two-line items.
- `.ls-list__text` — muted second line.

Marker modifiers (pick exactly one):

- `.ls-list--check` — accent-colored CSS checkmark.
- `.ls-list--arrow` — accent-colored chevron.
- `.ls-list--numbered` — label-font `01 02 03` counters in the accent text color.
- `.ls-list--timeline` — accent dots on a running rail between items.

Override-safe variables: `--ls-list-gap` (default `var(--ls-space-3)`), `--ls-list-indent` (`52px`; timeline uses `44px`), `--ls-list-title-size` (`27px`), `--ls-list-text-size` (`22px`). Compact slide density tightens all of them.

## When not to use

- Items needing multi-sentence explanations — give each a `components/surface` instead of overloading bullets.
- A real process with stages and hand-offs — `components/flow` draws markers and connectors.
- More than 6 items — split across slides or columns; long lists read as a document, not a slide.

## Copy

Copy `list.css` after `core/base` styles.
