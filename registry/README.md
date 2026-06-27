# Registry

Copyable slide-building blocks live here. Keep registry items framework-agnostic, dependency-light, and easy to modify after copying.

## Item model

Registry items are directories with:

- implementation files (`.css`, `.js`, etc.)
- `registry-item.json` metadata
- a concise `README.md`

The root `registry.json` indexes item metadata. This is shadcn-inspired, but not yet guaranteed to be shadcn CLI compatible.

## Categories

- `core/base` — required reset, token, slide shell, icon, and runtime assets.
- `layouts/` — full-slide composition patterns.
- `components/` — reusable content, data, media, technical, and visual primitives.
- `animations/` — optional reveal-compatible animation recipes.
- `presets/` — scoped token/style remaps such as font-family presets.

## Copy model

Agents should normally use `skills/ls-slides/scripts/copy-items.mjs` to resolve `registryDependencies`, copy files safely, and write a manifest. Manual copying is still supported: resolve dependencies first and always copy/load `core/base` before layouts, components, animations, or presets because it declares the CSS cascade layer order.

Recommended CSS order:

1. `core/base/reset.css`
2. `core/base/tokens.css`
3. `core/base/slide.css`
4. `core/base/icons.css` if icon wrappers are used
5. optional presets
6. layouts
7. components
8. `animations/reveal/reveal.css`
9. optional animation variants

Presets are optional token remaps. For example, font presets are loaded as ordinary CSS and activated with scoped attributes such as `data-ls-font="editorial-serif"`.

## Current catalog

See category READMEs for the current item list:

- [Layouts](./layouts/README.md)
- [Components](./components/README.md)
- [Animations](./animations/README.md)

Example decks under `examples/` validate the implemented primitives together.
