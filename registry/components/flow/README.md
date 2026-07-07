# Flow

Linear step sequences with CSS connectors drawn between adjacent siblings: a horizontal band by default, a vertical rail with `--vertical`. Deliberately scoped — flow is not a node-graph engine; branching or cyclic diagrams are authored SVG inside a `components/figure`.

## Usage

- `.ls-flow` — the band; steps share equal columns and connectors are drawn automatically between adjacent steps.
- `.ls-flow__step` — one stage.
- `.ls-flow__marker` — the numbered/token marker box; connectors align to the marker row.
- `.ls-flow__title` — heading-font step title.
- `.ls-flow__text` — muted step copy.

Modifier:

- `.ls-flow--vertical` — vertical rail; the marker spans the title/text rows and connectors run downward. Prefer it when step copy is longer than a phrase.

Override-safe variables: `--ls-flow-gap` (default `56px` horizontal, `44px` vertical — the connector length derives from it), `--ls-flow-title-size` (`27px`), `--ls-flow-text-size` (`21px`). Compact slide density tightens all three.

## When not to use

- Branching, looping, or multi-path diagrams — author SVG in `components/figure`; connectors here only join adjacent siblings.
- Label-only steps with no explanation — `components/list` with numbered markers is lighter.
- More than 5 steps — split the process across slides or switch to the vertical rail.

## Copy

Copy `flow.css` after `core/base` styles.
