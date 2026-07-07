# Layouts

Slide-body compositions with alignment guarantees, plus the low-level utilities used inside them.

## The alignment contract

Aligned layouts (`--split`, `--columns-3`, `--columns-4`, `--wide-start`, `--wide-end`) declare a three-row skeleton — heading / body / footer — and every `.ls-layout__region` is a subgrid item spanning it. Region children map to the rows in DOM order, so headings, bodies, and footers **align across columns by construction**. Surplus vertical space lands inside the body row; footers stay anchored to the bottom edge.

The tradeoff is explicit: region markup must follow the skeleton (up to three children, in order). When columns are genuinely irregular, add `ls-layout--free` — regions become simple top-aligned stacks and the alignment guarantee is traded away deliberately, not silently.

## Compositions

- `ls-layout--split` / `--columns-3` / `--columns-4` — aligned columns; `--wide-start`/`--wide-end` skew a split.
- `ls-layout--statement` — one claim at the optical center; the whitespace is the design.
- `ls-layout--band` — a full-width horizontal sequence crossing the middle of the body.
- `ls-layout--dashboard` / `--gallery` — filling grids for dense data or media (`--ls-layout-columns` sets the count).
- `ls-layout__region--bleed` — the region escapes slide padding on the inline-end and block-end (edge-running media in a split).

Region typography (`ls-layout__heading`, `ls-layout__text`, `ls-layout__note`) covers skeleton rows without a boxed component; components (surface, stat, figure, …) drop into regions as body-row children.

## Utilities

`ls-stack`, `ls-cluster`, `ls-grid` (+ column modifiers), `ls-center`, `ls-center-start`, `ls-fill`, `ls-slide-fill`, `ls-frame` — arrange content _inside_ a region. Prefer `ls-layout--*` for the slide-body skeleton itself.

## When not to use

- A single content-sized group is enough — use `ls-stack` or `ls-grid` directly in the body.
- Columns have genuinely irregular content — use `ls-layout--free` instead of fighting the skeleton.
