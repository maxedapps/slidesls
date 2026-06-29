# Registry

Copyable slidesls building blocks live here. Items are framework-agnostic, dependency-light, and editable after copying.

## Item anatomy

Each item directory should include:

- implementation files such as `.css` or `.js`;
- `registry-item.json` metadata;
- `README.md` with item-specific usage/API notes.

The root `registry.json` indexes metadata files.

## Categories

- `core/base` — required reset, tokens, slide shell, and runtime assets.
- `layouts/` — full-slide composition patterns.
- `components/` — reusable content, data, media, technical, and visual primitives.
- `animations/` — optional reveal-compatible animation recipes.
- `presets/` — scoped token/style remaps such as font-family presets.

## Copy model

Use `slidesls add <items...>` to resolve `registryDependencies`, copy files safely, and update the deck manifest. Manual copying is supported, but load `core/base` before other items.

Recommended CSS order:

1. `core/base/reset.css`
2. `core/base/tokens.css`
3. `core/base/slide.css`
4. optional presets
5. layouts
6. components
7. animations

Font presets are ordinary CSS files activated with scoped attributes such as `data-ls-font="editorial-serif"`.

## Validation

Run `slidesls validate-registry` after changing metadata or registry files.
