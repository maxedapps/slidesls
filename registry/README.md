# Registry

Copyable slide-building blocks live here. Keep registry items framework-agnostic and dependency-light.

## Item model

Registry items are directories with:

- implementation files (`.css`, `.js`, etc.)
- `registry-item.json` metadata
- a concise `README.md`

The root `registry.json` indexes item metadata. This is shadcn-inspired, but not yet guaranteed to be shadcn CLI compatible.

## Copy model

Copy items by resolving `registryDependencies` first. Always copy/load `core/base` before layouts, components, animations, or presets because it declares the CSS cascade layer order.

Presets are optional token remaps. For example, font presets are loaded as ordinary CSS and activated with scoped attributes such as `data-ls-font="editorial-serif"`.
