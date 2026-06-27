# ls_slides Project Vision

`ls_slides` is an agent-primary copyable registry of vanilla HTML, CSS, and JavaScript building blocks for creating slide decks as web pages.

It is not a slide generator, framework, runtime package, CLI product, npm dependency, or component-library package. It should stay closer to a shadcn-style registry: AI agents use the project skill to discover remote or local registry items, fetch/copy files into downstream slide projects, compose decks there, preview them locally, and customize the copied code directly. Human-readable files support review and debugging, but the primary product surface is agent operation.

## Core goals

- Provide reusable visual, layout, content, data, media, annotation, and animation building blocks for web-based presentations.
- Keep every registry item copyable, readable, dependency-light, and easy to modify.
- Optimize the repository for AI agents as the primary consumers while keeping files readable for human review.
- Prefer modern platform features over framework abstractions, including modern CSS and browser APIs when they improve copyability or expressiveness.
- Avoid implying that consumers must install this repository as a runtime dependency.

## Registry model

Copyable registry items live under `registry/`:

- `registry/core/` — mandatory base assets such as reset styles, cascade layers, tokens, shared slide CSS contracts, icon styles, and minimal runtime behavior.
- `registry/layouts/` — slide layout patterns for title, split, grid, dashboard, timeline, code, quote, visual-canvas, and editorial compositions.
- `registry/components/` — individual slide building blocks such as badges, cards, metrics, tables, timelines, code blocks, media frames, annotations, connectors, and legends.
- `registry/presets/` — optional token remaps and presentation-style presets, currently including scoped font-family presets.
- `registry/animations/` — copyable animation and transition recipes that compose with the base reveal contract and use vanilla CSS/JavaScript by default.

Registry items are directories with implementation files, `registry-item.json` metadata, and a concise `README.md`. The root `registry.json` indexes available item metadata. This model is shadcn-inspired, but it is not currently shadcn CLI compatible.

Supporting folders are intentionally top-level and are not registry items:

- `docs/` — project documentation and future documentation-site content; secondary to agent-readable references.
- `examples/` — example slide projects and demos.
- `skills/` — agent-facing usage instructions, references, and helper scripts; the primary consumption path for the registry.
- `scripts/` — project automation scripts.
- `.plans/` — retained implementation and architecture plans that are still useful historically; completed batch-specific plans have been consolidated into project docs and removed.

## Current implementation

The registry foundation and three primitive expansion waves are implemented and consolidated into the current catalog.

### Core and presets

- `registry.json` — root registry index.
- `registry/core/base` — reset, tokens, slide shell/scaling styles, icon styles, and slide runtime.
- Font presets:
  - `registry/presets/fonts/editorial-serif`
  - `registry/presets/fonts/technical-mono`
  - `registry/presets/fonts/system-humanist`

### Layouts

Implemented layouts:

- `title-hero`
- `detail-split`
- `centered-statement`
- `section-divider`
- `two-column`
- `comparison-grid`
- `asymmetric-feature`
- `image-spotlight`
- `three-column`
- `metric-dashboard`
- `timeline-strip`
- `code-explainer`
- `quote-feature`
- `layered-canvas`

### Components

Implemented components:

- `badge`
- `card`
- `diagram`
- `callout`
- `metric`
- `stat-grid`
- `bullet-list`
- `code-block`
- `media-frame`
- `quote`
- `table`
- `timeline`
- `numbered-step`
- `progress`
- `logo-strip`
- `highlight-text`
- `divider`
- `annotation`
- `connector`
- `image-card`
- `legend`

### Animations

Implemented animations:

- `reveal`
- `fade`
- `slide-up`
- `stagger`
- `scale-in`
- `step-focus`
- `highlight`
- `pulse`
- `spotlight`
- `connector-grow`
- `path-draw`

All optional animation variants compose with `animations/reveal` where appropriate and do not replace the core reveal/runtime contract.

### Examples and tooling

Implemented examples:

- `examples/project-intro` — two-slide validation deck for the initial registry foundation.
- `examples/primitive-gallery` — gallery for foundational layout/component/animation primitives.
- `examples/structured-content-gallery` — gallery for structured content and data primitives.
- `examples/visual-narrative-gallery` — gallery for visual narrative and annotation primitives.

Implemented tooling:

- `skills/ls-slides` — Agent Skill for discovering, inspecting, copying/fetching, authoring, and previewing decks with the registry.
- `skills/ls-slides/scripts/*` — dependency-free agent helper scripts for local/remote registry discovery, safe copying, generated catalog validation, and arbitrary target-folder deck preview.
- `scripts/serve-examples.mjs` and `pnpm serve:examples` — dependency-free examples server with automatic example discovery.
- `scripts/validate-registry.mjs` and `pnpm validate:registry` — registry metadata, path, and dependency validation included in `pnpm check`.
- `pnpm validate:skills` — verifies the generated agent catalog is in sync with registry metadata.

## Technical direction

- Package manager: `pnpm` only.
- Workspace tooling: pnpm workspaces only; no Turborepo, Nx, Rush, Changesets, or other monorepo tooling.
- Root project: private pnpm-managed project, currently not a publishable package.
- Runtime/build philosophy: vanilla HTML, modern CSS, and vanilla JavaScript.
- CSS philosophy: no Tailwind; prefer semantic classes, CSS custom properties, cascade layers, reusable tokens, container queries, `:has()`, subgrid, anchor positioning, typed custom properties, and modern color functions where useful.
- Primitive API philosophy: expose clear `ls-` class/attribute APIs, opt-in decoration, variable-driven sizing, semantic markup, and baseline-safe progressive enhancement.
- Typography direction: core exposes semantic font role tokens; optional scoped presets remap those roles via `data-ls-font` without global side effects.
- Animation direction: prefer CSS animations, View Transitions, and Web Animations API where they fit; GSAP should not be added as a root dependency unless a concrete future registry item genuinely needs timeline orchestration.
- Documentation direction: agent-readable skill references first; any future Astro docs site is secondary and should not displace the skill-driven consumption workflow.
- Linting: Oxlint.
- Formatting: Oxfmt.
- Config style: JSON configs for Oxlint/Oxfmt initially.
- Compatibility posture: modern-first and progressively enhanced; use `@supports` and feature detection for uneven browser capabilities instead of adding transpilers or framework dependencies by default.

## Current setup details

- Root `package.json` is private, ESM, and pins `packageManager` to `pnpm@11.1.1`.
- Node engine is `>=22.18.0`.
- `pnpm-workspace.yaml` stores project-level pnpm settings, but intentionally has no `packages` list yet.
- Conservative pnpm settings:
  - `minimumReleaseAge: 1440`
  - `trustPolicy: no-downgrade`
  - `pmOnFail: error`
- `pnpm-lock.yaml` should be committed.
- Generated/dependency output such as `node_modules/`, `dist/`, `.astro/`, screenshots, server logs, and temporary pnpm lock files should stay ignored or untracked.

## Current quality lessons

- Defaults should look product-quality in galleries; decoration should be opt-in.
- Modern CSS enhancements must not alter normal flow in ways that can overlap essential content.
- Dense tables, timelines, progress, code explainers, and dashboards need semantic markup, explicit labels/values, and conservative overflow handling before visual flourish.
- Reveal sequencing should support realistic item counts through runtime state rather than hard-coded CSS ceilings.
- Captions should not be clipped by decorative table surfaces.
- Safe-area utilization should be controlled through explicit layout APIs, not global padding hacks.
- Avoid parent opacity on layered structured components when child surfaces must remain opaque over lines or connectors.
- Annotations default to normal flow; floating/overlay behavior should be explicit.
- Connectors use hand-authored SVG/CSS geometry, not auto-routing.
- Legends must provide text and shape cues instead of relying on color alone.
- Layered canvases should make overlap/floating explicit and baseline-safe.

## Important constraints

- Do not add or significantly change registry item formats, registry components, docs pages, scripts, or examples without an explicit plan.
- Preserve the established registry item model: copyable item directories with metadata, docs, and dependency declarations.
- Do not add framework dependencies for registry items by default.
- Do not turn skill scripts into a public package, generator, framework, or clone-first workflow.
- Do not add `docs` to workspace packages until `docs/package.json` exists.
- Do not use `.gitkeep` placeholders; prefer concise README files when a directory must be tracked.
- Keep the copyable-registry model central in all future architecture decisions.
