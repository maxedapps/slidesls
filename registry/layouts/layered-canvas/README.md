# Layered Canvas

Full-slide visual canvas for layered cards, annotations, media, and connectors.

## Usage

Root `.ls-layered-canvas`; regions `__stage`, `__layer`, `__item`, `__caption`, `__safe`. Attributes: `data-ls-valign`, `data-ls-variant`, `data-ls-overlap`; item layers use `data-ls-layer="base|overlay|floating"`. Variables: `--ls-layered-canvas-gap`, `--ls-layered-canvas-min-block`, `--ls-layered-canvas-overlap`. Baseline is grid/flow; absolute positioning should be an explicit copied customization.

## Copy

Copy this item CSS after `registry/core/base` styles. Animation recipes that compose with reveals should load after `registry/animations/reveal`.
