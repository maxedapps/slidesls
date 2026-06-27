# Registry contract

## Source of truth

- `registry.json` indexes item metadata paths.
- Each item has `registry/<category>/<item>/registry-item.json`.
- Item READMEs are concise usage contracts.
- Item CSS/JS files are the copyable implementation.

Scripts derive agent-facing catalogs from these files. Do not assume a `title` field exists; derive display labels from `name` and use `description` for intent.

## Item types

- `ls:core` — mandatory base assets.
- `ls:layout` — full-slide or region layout patterns.
- `ls:component` — reusable content blocks.
- `ls:animation` — optional reveal or emphasis recipes.
- `ls:preset` — scoped token/style remaps.

## Dependency semantics

- `registryDependencies` are other registry item names to copy/load, not npm packages.
- `dependencies` and `devDependencies` should remain empty unless a future item explicitly documents external requirements.
- `core/base` must load first.
- Animation variants generally require `animations/reveal` before the variant CSS.
- Layouts usually keep loose dependencies and document compatible components instead of requiring them.

## Load order

Recommended deck order:

1. `registry/core/base/reset.css`
2. `registry/core/base/tokens.css`
3. `registry/core/base/slide.css`
4. `registry/core/base/icons.css` if using icon wrappers
5. Preset CSS where scoped by an attribute such as `data-ls-font`
6. Layout CSS
7. Component CSS
8. `registry/animations/reveal/reveal.css`
9. Animation variant CSS
10. `registry/core/base/slide-runtime.js` as a module script

Scoped presets can also load later when their selectors are explicitly attribute-scoped, but keep this order in generated decks for consistency. Follow an item README when it gives a stricter order.

## Runtime/deck contract

The base runtime looks for `.ls-deck[data-ls-deck]`, marks it ready, scales slides, manages active slide state, computes reveal steps, assigns reveal sequence steps, supports export mode via `?export=1` or `?export=pdf`, and initializes Lucide icons if the global Lucide script is present.

## Icons

`icons.css` only provides generic sizing and wrappers. Elements using `data-lucide` require the Lucide browser script before `slide-runtime.js` initializes icons. For fully dependency-free decks, use inline SVG, emoji, or text markers instead.
