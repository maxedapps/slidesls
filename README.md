# slidesls

Agent-primary slide authoring CLI and copyable registry for plain HTML/CSS/JS decks.

`slidesls` helps agents and humans initialize deck folders, copy registry primitives, validate decks, and preview them locally. The npm package is an authoring tool only; generated decks remain editable vanilla files with no runtime package dependency.

## Quickstart

```sh
npx slidesls init my-deck --title "My Deck"
cd my-deck
npx slidesls catalog
npx slidesls add layouts/two-column components/card
npx slidesls validate
npx slidesls preview
```

Local repo development:

```sh
node bin/slidesls.mjs init /tmp/my-deck --template minimal
node bin/slidesls.mjs add components/card --dir /tmp/my-deck
node bin/slidesls.mjs validate /tmp/my-deck
```

## Commands

- `slidesls init [dir]` — create/prepare a plain deck project with `slidesls.json`, copied assets, starter `index.html`, and `slidesls/manifest.json`.
- `slidesls add <items...>` — copy registry items into a project and print `<link>` / `<script>` tags; does not mutate HTML by default.
- `slidesls catalog` — list registry items; supports `--query`, `--type`, `--tag`, `--limit`, `--json`.
- `slidesls inspect <items...>` — show metadata, dependencies, files, and load guidance.
- `slidesls validate [dir]` — static validation for config, manifest, local assets, and required deck shell.
- `slidesls preview [dir]` — serve a deck locally.

All agent-facing commands support `--json`.

## Registry

Registry items live under `registry/` and are copied into downstream decks. Generated projects use `slidesls/` as the default copied asset directory and may freely edit those files.

## Validation

```sh
node --check bin/slidesls.mjs
node scripts/test-cli-smoke.mjs
pnpm validate:registry
pnpm validate:examples
```

`pnpm check` also includes lint/format checks, but requires the repo-pinned pnpm version.
