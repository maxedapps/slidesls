# slidesls

Agent-primary slide authoring CLI and copyable registry for plain HTML/CSS/JS decks.

`slidesls` helps agents and humans initialize deck folders, copy registry primitives, validate decks, and preview them locally. The npm package is an authoring tool only; generated decks remain editable vanilla files with no runtime package dependency.

Package: `@maxedapps/slidels` (binary: `slidesls`). Publishing remains manual until explicitly approved.

## Quickstart

After publish:

```sh
npx @maxedapps/slidels init my-deck --title "My Deck"
cd my-deck
npx @maxedapps/slidels catalog
npx @maxedapps/slidels add layouts/two-column components/card
npx @maxedapps/slidels validate
npx @maxedapps/slidels preview
```

Local repo development:

```sh
node bin/slidesls.mjs init /tmp/my-deck --template minimal
node bin/slidesls.mjs add components/card --dir /tmp/my-deck
node bin/slidesls.mjs validate /tmp/my-deck
```

## Commands

- `slidesls init [dir]` — create/prepare a plain deck project.
- `slidesls add <items...>` — copy registry items and print load tags.
- `slidesls catalog` — list registry items.
- `slidesls inspect <items...>` — show metadata, dependencies, files, and load guidance.
- `slidesls validate [dir]` — static deck validation.
- `slidesls preview [dir]` — serve a deck locally.
- `slidesls doctor [--dir <project>]` — check CLI/project health.
- `slidesls validate-registry` / `validate-examples` — repo/package checks.

Most agent-facing commands support `--json`.

## Registry

Registry items live under `registry/` and are copied into downstream decks. Generated projects use `slidesls/` as the default copied asset directory and may freely edit those files.

## Validation

```sh
pnpm check
npm pack --dry-run
```

`snapshot` is intentionally deferred to keep the base package lightweight.
