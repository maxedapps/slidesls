# slidesls CLI

`slidesls` is an authoring CLI. It copies registry assets into a deck project, but generated decks do not need the package at runtime.

## Commands

- `slidesls init [dir] --template blank|minimal --title <text>` — create a plain deck project.
- `slidesls add <items...> --dir <project>` — copy registry items and update the manifest.
- `slidesls catalog [--type <type>] [--tag <tag>] [--query <text>] [--limit <n>]` — list items.
- `slidesls inspect <items...> [--readme]` — show metadata and load guidance.
- `slidesls validate [dir] [--strict]` — validate deck config, entry markup, local assets, and manifest drift.
- `slidesls preview [dir] [--host <host>] [--port <port>]` — serve a local preview.
- `slidesls doctor [--dir <project>]` — check Node/package/config/registry/project health.
- `slidesls validate-registry` — repo/package registry validation.
- `slidesls validate-examples` — repo example/template validation.
- `slidesls generate-catalog [--check]` — internal agent catalog generation/check.

All commands support `--help`. Agent-facing commands support `--json` where useful.

## Naming

Prefer:

- `--dir` for deck/project directory.
- `--registry-root` for a local registry checkout.
- `--registry-url` for a raw remote registry source.

`snapshot` is intentionally post-MVP; browser screenshot workflows should remain optional and must not add a mandatory Playwright/Puppeteer dependency to the base package.
