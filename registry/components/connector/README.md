# Connector

SVG-first line/arrow connector primitive.

## Usage

Use `.ls-connector` on an inline SVG or simple wrapper. Style paths with `.ls-connector__path`; optional `__label` and `__marker`. Attributes: `data-ls-variant`, `data-ls-tone`, `data-ls-orientation`. Variables: `--ls-connector-stroke`, `--ls-connector-stroke-width`, `--ls-connector-dash`. Decorative connectors should use `aria-hidden="true"`; meaningful connectors need text labels/descriptions. The `data-ls-variant="arrow"` recipe expects an SVG `<marker id="ls-connector-arrow">` definition in the copied SVG.

## Copy

Copy this item CSS after `registry/core/base` styles. Animation recipes that compose with reveals should load after `registry/animations/reveal`.
