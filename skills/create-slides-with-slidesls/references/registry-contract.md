# Registry contract

## Source of truth

- `registry.json` indexes item metadata paths.
- Each item has `registry/<category>/<item>/registry-item.json`.
- Item READMEs are concise usage contracts.
- Item CSS/JS files are copied implementation.
- Item snippets are paste-ready HTML returned by `slidesls inspect --json`.

The CLI is the authoritative discovery surface for agents: use `slidesls catalog --starter --json`, `slidesls catalog --json`, and `slidesls inspect <item> --json` instead of guessing from file names. Add `--api` when you need public classes, class groups/modifiers, data attributes, CSS variables, theme/font attributes, and short usage rules. Use those values or snippet markup; do not invent `ls-*` classes.

## Composition metadata

Items may declare a `composition` object: `contentDensity` (sparse/balanced/dense), `layoutBehavior` (content-sized/fills-area/fixed), `itemCountGuidance`, `copyGuidance`, `avoidWhen` (conditions under which the item composes badly), and `alternatives` (`{ when, use }` pointers to better-fitting items). Brief `catalog --json` carries `avoidWhen`; default `inspect <item> --json` carries the full object. Check `avoidWhen` before using a template; when it matches your content, use the alternative it names. Items with `avoidWhen` also document the same rules in a `## When not to use` README section.

`authoring.cssVariables` entries are either bare `--name` strings or `{ name, default, overrideSafe }` objects. `overrideSafe: true` marks tokens an agent may freely override in deck CSS (in a deck-level `@layer tokens` block or per element); `overrideSafe: false` marks supported-but-structural knobs such as slide dimensions.

## Item types

- `ls:core` — mandatory base assets.
- `ls:utility` — layout/helper classes that work anywhere.
- `ls:component` — standalone content/visual blocks.
- `ls:template` — full slide skeleton snippets composed from utilities/components.
- `ls:animation` — optional reveal or emphasis recipes.
- `ls:preset` — scoped token/style remaps, including fonts and deck-wide themes.

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
3. Theme presets such as `registry/presets/themes/executive-blue/theme.css` when using `data-ls-theme`
4. `registry/core/base/slide.css`
5. `registry/core/base/icons.css` if using icon wrappers
6. Font presets where scoped by `data-ls-font`
7. Components and animations as needed
8. `registry/utilities/layout/layout.css`
9. `registry/core/base/slide-runtime.js` as a module script

Utilities intentionally load late so their classes can be applied anywhere.

## Theme contract

Theme presets live under `presets/themes/*`, scope CSS with `:root[data-ls-theme="..."]`, and apply deck-wide on `<html>`. They control visual tokens only; templates remain structural and fonts remain separate presets.

## Runtime/deck contract

The base runtime looks for `.ls-deck[data-ls-deck]`, marks it ready, scales slides, manages active slide state, computes reveal steps, assigns reveal sequence steps, supports export mode via `?export=1` or `?export=pdf`, and initializes Lucide icons if the global Lucide script is present.

## Icons

`icons.css` only provides generic sizing and wrappers. Elements using `data-lucide` require the Lucide browser script before `slide-runtime.js` initializes icons. For fully dependency-free decks, use inline SVG, emoji, or text markers instead.
