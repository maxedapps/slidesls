# Registry contract (v2)

Registry items are copyable directories indexed by the root `registry.json`. Each item has a `registry-item.json` described by `schemas/registry-item.schema.json` (documentation schema; runtime enforcement lives in `src/validation/registry.mjs` and runs via `slidesls validate-registry`).

## Core fields

- `name` — stable item id, e.g. `components/stat`, `styles/editorial`, `archetypes/big-stat`.
- `type` — one of `ls:core`, `ls:layout`, `ls:component`, `ls:archetype`, `ls:style`, `ls:font`, `ls:icons`, `ls:motion` (plus the pre-v2 values `ls:utility`, `ls:animation`, `ls:preset`, `ls:template`, kept in the enum for legacy decks).
- `status` — lifecycle marker: `stable` (default when absent), `preview` (hidden from catalog output unless `--preview` is passed), or `deprecated`.
- `description`, `title`, `tags`, `useCases` — discovery metadata; `useCases` is what the brief catalog surfaces.
- `agentLevel` — `starter`, `recommended`, `advanced`, or `experimental`; drives `catalog --recommended` inclusion (`starter|recommended`).
- `registryDependencies` — other item names copied first (e.g. styles depend on their `fonts/*` families, archetypes on the components they compose).
- `files` — repo-relative implementation files copied by `slidesls add`; `dependencies`/`devDependencies` — npm deps (always empty for copied items).
- `docs` — item README path; `snippets` — `{ label, path }` paste-ready HTML examples returned by `inspect --json`.
- `rootClass`, `safeAnywhere` — primary class and placement safety for layout/component items.

## v2 metadata

- `intent` — narrative intents the item serves (`open`, `close`, `prove`, `compare`, `explain-process`, `teach`, `show-data`, `show-code`, `emphasize`); drives `catalog --intent` discovery.
- `contract` — archetypes only: the content contract, a map of slot name to constraints `{ min, max, minWords, maxWords, maxChars, description }`. Enforced against `data-ls-archetype` slides by the contract lint (`contract_slot_count`, `contract_copy_length`).
- `motion` — `{ default, notes }`: the item's recommended motion (e.g. a style's signature, or an archetype's `stagger`/`steps`/`transition` default and where `data-step` belongs).
- `icons` — `{ guidance, suggested[] }`: icon stance for the item (styles say how sparse and in which tones).
- `styleAttribute` — styles only: the `data-ls-style` value the style responds to.
- `styleTone` — short tone description surfaced by the catalog.
- `styles` — per-style compatibility notes, keyed by style name; items without style notes are compatible with every style (`catalog --style` filters on this).

Example (`registry/styles/editorial/registry-item.json`, abridged):

```json
{
  "name": "styles/editorial",
  "type": "ls:style",
  "styleAttribute": "editorial",
  "styleTone": "warm, humane, literary; light backgrounds",
  "registryDependencies": [
    "core/base",
    "fonts/fraunces",
    "fonts/newsreader",
    "fonts/jetbrains-mono"
  ],
  "motion": { "default": "fade", "notes": "Slow crossfades; children settle in like paragraphs." },
  "icons": { "guidance": "Sparse, hairline sprite icons in ink or oxblood." }
}
```

## Composition metadata

`composition` carries decision-time guidance surfaced by `catalog` and `inspect`:

- `useWhen` / `avoidWhen` — conditions under which the item composes well or badly. Agents check `avoidWhen` before committing to an item.
- `alternatives` — `{ when, use }` pointers to better-fitting items.
- `contentDensity` (`sparse`/`balanced`/`dense`), `layoutBehavior` (`content-sized`/`fills-area`/`fixed`), `itemCountGuidance`, `copyGuidance`.

Integrity checks in `validate-registry`: every `alternatives[].use` must name an existing item; any `category/name` token inside composition strings or `authoring.usage` must resolve to an existing item, so guidance cannot silently rot; an item that declares `avoidWhen` must have a `## When not to use` section in its README.

## Authoring metadata

`authoring` is the source of truth for the public API, surfaced by `catalog --api --json` and `inspect <item> --api --json`. Agents use classes and attributes listed here or copied from snippets; inventing `ls-*` classes fails validation (`unknown_ls_class`).

- `classGroups` — base class plus BEM `elements`/`modifiers` and an optional `rule` (e.g. `ls-list` with `ls-list--numbered`, `ls-list--timeline`).
- `classes` — standalone public classes.
- `classMetadata` — per-class `{ scopeType, safeAnywhere, description }` placement metadata.
- `dataAttributes` — public `data-*` attributes with `values`, `scope`, and `description` (e.g. `data-ls-variant` on code, `data-ls-density` on slides).
- `cssVariables` — customization knobs as `{ name, default, overrideSafe }` objects (bare `--name` strings are legacy). `overrideSafe: true` marks variables intended for deck-level `@layer tokens` overrides.
- `attributes` — deck-level attributes such as `data-ls-style` with `scope` and `value`.
- `usage` — short authoring rules.

Registry validation verifies authoring shape and, for CSS-backed items, that listed classes exist in the item's CSS and that public CSS classes carry authoring metadata.

## Registry groups

See [registry/README.md](../registry/README.md) for the group overview (core, layouts, components, archetypes, styles, fonts, icons, motion) and each group's own README for conventions.

Changed in v2: the v1 groups `utilities/`, `templates/`, `presets/` (themes and fonts), and `animations/` — and v1 components such as `card`, `panel`, `callout`, and `metric` — no longer exist. Styles replace theme presets (activation moved from `data-ls-theme` to `data-ls-style`), `layouts/core` replaces `utilities/layout`, archetypes replace templates, core motion replaces the animation items, and the bordered-box components collapsed into `components/surface`. Decks copied before 0.6.0 keep working and are validated with frozen legacy rules (`legacy_deck_rules`).

## Copy model

`slidesls add` resolves `registryDependencies`, copies files under the deck's base directory, updates the manifest, and returns the load tags to insert. Load order is core first, then fonts, style, layouts, components — `add`/`init` compute it from the dependency graph; a family shared by several styles is copied exactly once. Snippets are source-of-truth markup: prefer `slidesls inspect <item> --json` and paste the returned HTML instead of guessing structure.
