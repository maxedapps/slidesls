# Step Focus

CSS-only reveal companion that dims non-current siblings in a grouped sequence.

## Usage

Add `.ls-step-focus` to a group and regular `.ls-reveal data-step="1|2|3"` to children. Optional manual states: `data-ls-focus="active|muted"`. Variables: `--ls-step-focus-muted-opacity`, `--ls-step-focus-scale`, `--ls-step-focus-blur`. Export mode disables dimming.

## Copy

Copy this item CSS after `registry/core/base` styles. Animation variants should load after `registry/animations/reveal`.
