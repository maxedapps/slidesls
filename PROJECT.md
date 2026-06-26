# ls_slides Project Vision

`ls_slides` is a copyable registry of vanilla HTML, CSS, and JavaScript building blocks for creating slide decks as web pages.

It is not a slide generator, framework, runtime package, or component-library package. It should stay closer to a shadcn-style registry: users and AI agents copy code from this repository into downstream slide projects, then customize it directly.

## Core goals

- Provide reusable visual and layout building blocks for web-based presentations.
- Keep every registry item copyable, readable, and easy to modify.
- Make the repository useful for both humans and AI agents.
- Prefer modern platform features over framework abstractions.
- Avoid implying that consumers must install this repository as a runtime dependency.

## Registry model

Copyable registry items live under `registry/`:

- `registry/core/` — mandatory base assets such as reset styles, cascade layers, tokens, shared slide CSS contracts, and minimal runtime behavior.
- `registry/layouts/` — slide layout patterns such as title slides, centered titles, two-column layouts, three-column layouts, and asymmetric content grids.
- `registry/components/` — individual slide building blocks such as badges, charts, highlighted text, bullet lists, callouts, infoboxes, code blocks, and media frames.
- `registry/presets/` — optional token remaps and presentation-style presets for the same underlying components, including scoped font-family presets.
- `registry/animations/` — copyable animation and transition recipes, expected to use vanilla JavaScript and GSAP where useful.

Registry items are directories with implementation files, `registry-item.json` metadata, and a concise `README.md`. The root `registry.json` indexes available item metadata. This model is shadcn-inspired, but it is not currently shadcn CLI compatible.

Supporting folders are intentionally top-level and are not registry items:

- `docs/` — future Astro documentation/discovery site.
- `examples/` — example slide projects and demos.
- `skills/` — agent-facing usage instructions and best practices.
- `scripts/` — project automation scripts when a concrete workflow exists.
- `.plans/` — implementation and architecture plans.

## Current registry foundation

The first registry slice is implemented:

- `registry.json` — root registry index.
- `registry/core/base` — reset, tokens, slide shell/scaling styles, icon styles, and slide runtime.
- `registry/animations/reveal` — vanilla reveal-step transitions.
- `registry/layouts/title-hero` and `registry/layouts/detail-split` — initial slide layout patterns.
- `registry/components/badge`, `registry/components/card`, and `registry/components/diagram` — initial reusable slide components.
- `examples/project-intro` — two-slide validation deck.
- `scripts/serve-examples.mjs` and `pnpm serve:examples` — dependency-free examples server with automatic example discovery.

## Technical direction

- Package manager: `pnpm` only.
- Workspace tooling: pnpm workspaces only; no Turborepo, Nx, Rush, Changesets, or other monorepo tooling.
- Root project: private pnpm-managed project, currently not a publishable package.
- Runtime/build philosophy: vanilla HTML, modern CSS, and vanilla JavaScript.
- CSS philosophy: no Tailwind; prefer semantic classes, CSS custom properties, cascade layers, and reusable tokens.
- Typography direction: core exposes semantic font role tokens; optional scoped presets remap those roles via `data-ls-font` without global side effects.
- Animation direction: GSAP may be used by future animation recipes, but it should not be added as a root dependency until a concrete registry item needs it.
- Documentation direction: Astro docs site later, only once `docs/` is initialized with its own package manifest.
- Linting: Oxlint.
- Formatting: Oxfmt.
- Config style: JSON configs for Oxlint/Oxfmt initially.

## Current setup details

- Root `package.json` is private, ESM, and pins `packageManager` to `pnpm@11.1.1`.
- Node engine is `>=22.18.0`.
- `pnpm-workspace.yaml` stores project-level pnpm settings, but intentionally has no `packages` list yet.
- Conservative pnpm settings:
  - `minimumReleaseAge: 1440`
  - `trustPolicy: no-downgrade`
  - `pmOnFail: error`
- `pnpm-lock.yaml` should be committed.
- Generated/dependency output such as `node_modules/`, `dist/`, `.astro/`, and temporary pnpm lock files should stay ignored.

## Important constraints

- Do not add or significantly change registry item formats, registry components, docs pages, scripts, or examples without an explicit plan.
- Preserve the established registry item model: copyable item directories with metadata, docs, and dependency declarations.
- Do not add framework dependencies for registry items by default.
- Do not add `docs` to workspace packages until `docs/package.json` exists.
- Do not use `.gitkeep` placeholders; prefer concise README files when a directory must be tracked.
- Keep the copyable-registry model central in all future architecture decisions.
