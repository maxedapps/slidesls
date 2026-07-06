# slidesls Project Vision

`slidesls` is an agent-primary authoring CLI, agent skill, and copyable registry for building slide decks as plain editable HTML/CSS/JS.

The CLI is **not** a runtime dependency for generated decks. It initializes deck folders, copies registry assets, validates markup/assets, and serves previews. Generated decks remain dependency-free by default and can be edited directly.

## Core goals

- Make slide authoring work through `slidesls init`, brief `slidesls catalog`, snippet-focused `slidesls inspect`, `slidesls add`, `slidesls validate`, and `slidesls preview`.
- Keep every generated deck vanilla HTML/CSS/JS: no mandatory framework, bundler, Tailwind, or runtime package.
- Preserve a shadcn-style copyable registry: assets are copied into downstream projects and can be modified.
- Optimize for AI agents with deterministic JSON output, snippets, manifests, validation, and clear docs.
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

- `registry/core/` — mandatory base assets: reset, tokens, shared slide CSS, icon helpers, and runtime behavior.
- `registry/utilities/` — hierarchy-light layout utilities such as stacks, clusters, grids, centering, and fill behavior.
- `registry/components/` — standalone visual/content primitives such as badges, cards, panels, metrics, tables, timelines, code blocks, quotes, and callouts.
- `registry/templates/` — paste-ready slide skeleton snippets composed from utilities and components.
- `registry/presets/` — optional token remaps and style presets, including fonts and deck-wide themes.
- `registry/animations/` — optional animation and transition recipes that compose with the base reveal contract.

Registry items are directories with `registry-item.json`, `README.md`, implementation files when needed, and optional `snippets/*.html`. The root `registry.json` indexes available item metadata.

## Design principle

A class should be one of:

- **Utility** — works anywhere, e.g. `.ls-grid`, `.ls-stack`.
- **Component** — owns its own internals, e.g. `.ls-card`, `.ls-panel`.
- **Runtime/deck shell class** — part of the required deck shell, e.g. `.ls-slide`, `.ls-deck`.

Templates are HTML snippets, not CSS layout contracts. Agent-primary authoring supports both template-first and primitive-first composition: themes are optional token presets, while utilities/components are first-class building blocks for custom slides. Avoid hidden ancestor-dependent APIs.

## Implemented tooling

- `bin/slidesls.mjs` — package-ready CLI entry point.
- `src/` — CLI, registry, deck, validation, server, skill, and shared modules.
- `slidesls init` — creates a plain deck project with `slidesls.json`, copied assets, starter HTML, manifest, and optional `--theme` support.
- `slidesls add` — copies registry items and prints load tags without mutating HTML by default.
- `slidesls catalog` / `slidesls inspect` — brief registry discovery and snippet/load-tag inspection for humans and agents; `--api` exposes rich authoring metadata.
- `slidesls skill info/show/install/link` — agent skill distribution for local and future package usage.
- `slidesls validate` — static deck validation for config, manifest, copied files, local assets, shell markup, and common missing registry item usage.
- `slidesls preview` — dependency-free local preview server.

## Technical direction

- Package manager: `pnpm`.
- Node engine: `>=22.18.0`.
- Runtime/build philosophy: vanilla HTML, modern CSS, and vanilla JavaScript.
- CSS philosophy: semantic classes, CSS custom properties, cascade layers, reusable theme tokens, progressive enhancement.
- Documentation direction: root README for quickstart; registry and skill docs serve as agent-readable API.
- Validation direction: static validation first; optional browser validation and snapshots later.

## Important constraints

- Do not make generated decks depend on the npm package at runtime.
- Do not add mandatory framework or build-system dependencies.
- Keep the copyable registry model central.
- Prefer snippets/templates and positive validation over fragile layout macros.
