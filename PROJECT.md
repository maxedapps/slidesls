# slidesls Project Vision

`slidesls` is an agent-primary npm authoring CLI, agent skill, and copyable registry for building slide decks as plain editable HTML/CSS/JS.

The CLI is **not** a runtime dependency for generated decks. It initializes deck folders, copies registry assets, validates markup/assets, and serves previews. Generated decks remain dependency-free by default and can be edited directly.

## Core goals

- Make slide authoring as easy as `slidesls init`, `slidesls add`, `slidesls validate`, and `slidesls preview`.
- Keep every generated deck vanilla HTML/CSS/JS: no mandatory framework, bundler, Tailwind, or runtime package.
- Preserve a shadcn-style copyable registry: assets are copied into downstream projects and can be modified.
- Optimize for AI agents with deterministic JSON output, manifests, validation, and clear docs.
- Keep browser/snapshot workflows optional so the base authoring tool stays lightweight.

## Product model

- CLI binary: `slidesls`.
- Project config: `slidesls.json`.
- Copied asset directory: `slidesls/` by default.
- Registry source: bundled/local by default during development; remote registry support is available through CLI options.
- Schema files ship in `schemas/` until stable hosted schema URLs exist.
- External icon CDNs are not used by default; icon libraries such as Lucide remain opt-in.

## Registry model

Copyable registry items live under `registry/`:

- `registry/core/` — mandatory base assets such as reset styles, cascade layers, tokens, shared slide CSS contracts, icon styles, and runtime behavior.
- `registry/layouts/` — slide layout patterns for title, split, grid, dashboard, timeline, code, quote, visual-canvas, and editorial compositions.
- `registry/components/` — slide building blocks such as badges, cards, metrics, tables, timelines, code blocks, media frames, annotations, connectors, and legends.
- `registry/presets/` — optional token remaps and presentation-style presets, including scoped font-family presets.
- `registry/animations/` — copyable animation and transition recipes that compose with the base reveal contract.

Registry items are directories with implementation files, `registry-item.json` metadata, and `README.md`. The root `registry.json` indexes available item metadata.

## Implemented tooling

- `bin/slidesls.mjs` — package-ready CLI entry point.
- `src/` — CLI, registry, deck, validation, server, and shared modules.
- `slidesls init` — creates a plain deck project with `slidesls.json`, copied assets, starter HTML, and manifest.
- `slidesls add` — copies registry items and prints load tags without mutating HTML by default.
- `slidesls catalog` / `slidesls inspect` — registry discovery for humans and agents.
- `slidesls validate` — static deck validation for config, manifest, copied files, local assets, and shell markup.
- `slidesls preview` — dependency-free local preview server.
- Existing validation scripts remain during migration.

## Technical direction

- Package manager: `pnpm`.
- Node engine: `>=22.18.0`.
- Runtime/build philosophy: vanilla HTML, modern CSS, and vanilla JavaScript.
- CSS philosophy: semantic classes, CSS custom properties, cascade layers, reusable tokens, progressive enhancement.
- Documentation direction: root README for quickstart; registry and skill docs serve as agent-readable API.
- Validation direction: static validation first; optional browser validation and snapshots later.

## Important constraints

- Do not make generated decks depend on the npm package at runtime.
- Do not add mandatory framework or build-system dependencies.
- Keep the copyable registry model central.
- Prefer small, reviewable CLI/refactor slices with smoke tests.
