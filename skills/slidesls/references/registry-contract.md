# Registry contract

## Source of truth

- `registry.json` indexes item metadata paths.
- Each item has `registry/<category>/<item>/registry-item.json`.
- Item READMEs are concise usage contracts.
- Item CSS/JS files are copied implementation.
- Item snippets are paste-ready HTML returned by `slidesls inspect --json`.

The CLI is the authoritative discovery surface for agents: use `slidesls catalog --recommended --json` and `slidesls inspect <item> --readme --json` instead of guessing from file names.

## Item types

- `ls:core` — mandatory base assets.
- `ls:utility` — layout/helper classes that work anywhere.
- `ls:component` — standalone content/visual blocks.
- `ls:template` — full slide skeleton snippets composed from utilities/components.
- `ls:animation` — optional reveal or emphasis recipes.
- `ls:preset` — scoped token/style remaps.

## Dependency semantics

- `registryDependencies` are other registry item names to copy/load, not npm packages.
- `dependencies` and `devDependencies` should remain empty unless a future item explicitly documents external requirements.
- `core/base` must load first.
- Templates should list all assets needed by their snippet.
- Template snippets live in `snippets`, not `files`, so `add` does not copy snippet HTML into deck assets.

## Load order

Use `slidesls add` and returned load tags whenever possible. Manual deck order usually is:

1. `registry/core/base/reset.css`
2. `registry/core/base/tokens.css`
3. `registry/core/base/slide.css`
4. `registry/core/base/icons.css` if using icon wrappers
5. Presets where scoped by an attribute such as `data-ls-font`
6. Components and animations as needed
7. `registry/utilities/layout/layout.css`
8. `registry/core/base/slide-runtime.js` as a module script

Utilities intentionally load late so their classes can be applied anywhere.

## Runtime/deck contract

The base runtime looks for `.ls-deck[data-ls-deck]`, marks it ready, scales slides, manages active slide state, computes reveal steps, assigns reveal sequence steps, supports export mode via `?export=1` or `?export=pdf`, and initializes Lucide icons if the global Lucide script is present.

## Icons

`icons.css` only provides generic sizing and wrappers. Elements using `data-lucide` require the Lucide browser script before `slide-runtime.js` initializes icons. For fully dependency-free decks, use inline SVG, emoji, or text markers instead.
