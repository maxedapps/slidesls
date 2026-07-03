# Registry contract

Registry items are copyable primitives indexed by `registry.json`.

## Item metadata

Each item has `registry-item.json` with:

- `name` — stable item id, e.g. `components/card`.
- `type` — one of `ls:core`, `ls:utility`, `ls:component`, `ls:animation`, `ls:preset`, or `ls:template`.
- `description`, `tags`, and optional `useCases`.
- Theme presets may also use `styleTone`, `pairsWith`, and `themeAttribute` metadata.
- `registryDependencies` — other registry item names that must be copied first.
- `files` — repo-relative implementation files copied by `slidesls add`.
- `docs` — item README path.
- `rootClass` — primary class for utilities/components when applicable.
- `safeAnywhere` — whether the item can be used without a specific parent structure.
- `agentLevel` — `starter`, `recommended`, `advanced`, or `experimental`; `catalog --recommended` computes inclusion from `starter|recommended`.
- `snippets` — paste-ready HTML examples loaded by `inspect --json`.
- `authoring` — public, agent-facing authoring API surfaced by `catalog --api --json` and `inspect --api --json`.

Templates must use `files: []` and expose HTML only through `snippets` so `add templates/x` does not copy snippet files into deck assets.

## Authoring metadata

`authoring` is the source of truth for public classes, data attributes, CSS variables, and usage rules. Agents should use classes/data attributes listed in `authoring` or copied from snippets; do not invent new `ls-*` classes.

Supported fields:

- `classGroups` — base classes plus related BEM elements/modifiers, e.g. `ls-grid` with `ls-grid--2`.
- `classes` — standalone public classes.
- `dataAttributes` — public `data-*` attributes and allowed values when enumerable.
- `cssVariables` — intended local customization knobs.
- `attributes` — important deck-level attributes such as `data-ls-theme` or `data-ls-font`.
- `usage` — short authoring rules for agents.
- `classMetadata` — optional per-class scope/safety metadata keyed by declared public class token.

Registry validation checks authoring shape and, for local CSS-backed items, verifies listed classes exist in item CSS. It also checks snippet dependency closure, targeted canonical snippet structures, and `@container` usage without a query-container contract. Example validation recursively fails on unsupported real `ls-*` class attributes.

## Theme presets

Theme presets live under `registry/presets/themes/<theme-name>/` and use type `ls:preset`. A theme should list exactly one copied stylesheet:

```txt
registry/presets/themes/<theme-name>/theme.css
```

Theme CSS belongs in `@layer tokens` and must scope overrides to the deck root:

```css
@layer tokens {
  :root[data-ls-theme="executive-blue"] {
    --ls-page-bg: #07111f;
    --ls-slide-bg: #0d1b2d;
  }
}
```

Apply themes deck-wide on `<html>`:

```html
<html lang="en" data-ls-theme="executive-blue"></html>
```

Themes control visual language: colors, surfaces, backgrounds, borders, radii, shadows, code colors, table striping, status colors, and progress accents. They must not encode slide structure or force font families. Font presets remain separate and may be recommended with `pairsWith` metadata.

Theme CSS should prefer solid colors, subtle borders, restrained shadows, and minimal texture. Avoid overriding `--ls-slide-bg-image` or adding large gradient blobs, neon fog, glow stacks, and decorative backgrounds that compete with content unless explicitly requested. Themes are not density systems; use slide-scoped density attributes or component variables for dense content.

## Copy/load order

Use `slidesls add`; it resolves dependencies, copies files, and updates the manifest. Manual copies should load `core/base` first, then presets/components/animations/utilities as needed. Utilities intentionally load late so layout helpers can be applied anywhere.

## Snippets

Snippets are source-of-truth markup examples and must declare/copy all registry dependencies for any `ls-*` classes they contain. Agents should prefer:

```sh
slidesls inspect templates/split --json
slidesls inspect components/card --json
```

and paste/edit returned snippet HTML instead of guessing structure.
