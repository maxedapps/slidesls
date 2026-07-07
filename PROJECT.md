# slidesls — contributor guide

slidesls is a skill-guided slide design system for AI agents: an authoring CLI, a copyable registry (styles, layouts, components, archetypes, fonts, icons), and a bundled agent skill. Generated decks are plain editable HTML/CSS/JS with no runtime dependency on the package.

This document is for people working on this repository. User-facing docs live in [README.md](./README.md) and [docs/](./docs/README.md); the authoring workflow itself lives in the bundled skill (`skills/create-slides-with-slidesls/`).

## Repo layout

- `bin/slidesls.mjs` — CLI entry point.
- `src/` — implementation modules:
  - `cli/` — command implementations and `option-specs.mjs`, the single source of truth for every command's flags (tests sweep help text and docs against it).
  - `deck/` — init/add/copy logic, config, manifest.
  - `registry/` — registry source loading (bundled, `--registry-root`, `--registry-url`) and catalog-doc generation.
  - `icons/` — inline sprite parsing/rewriting and curated icon resolution.
  - `validation/` — deck validation modules (see [docs/validation.md](./docs/validation.md)); `validation/legacy/` holds the frozen v1 lint rules applied to decks whose manifest `cliVersion` predates 0.6.0.
  - `server/`, `skill/`, `shared/` — preview server, skill distribution, shared helpers.
- `registry/` — the copyable design system: `core/`, `layouts/`, `components/`, `archetypes/`, `styles/`, `fonts/`, `icons/`, `motion/` (see [registry/README.md](./registry/README.md)).
- `skills/create-slides-with-slidesls/` — the bundled agent skill (`SKILL.md` + `references/`). The skill is the canonical authoring workflow; docs must not contradict it.
- `schemas/` — JSON schemas for `slidesls.json`, the deck manifest, and `registry-item.json`.
- `scripts/` — repo automation:
  - `fonts-sync.mjs` — regenerates `registry/fonts/*` from pinned `@fontsource-variable/*` devDependencies (never hand-edit vendored font files).
  - `icons-sync.mjs` — regenerates the curated `registry/icons/*` symbols from the pinned `lucide-static` devDependency.
  - `visual-gate.mjs` — release-path rendered composition + motion gate (see below).
  - `check-pack-size.mjs` — asserts the unpacked npm tarball stays under the 5 MB budget (fonts and icons must never balloon the package).
  - `test-cli-smoke.mjs`, `validate-registry.mjs`, `validate-examples.mjs`, `visual-qa-report.mjs`, `serve-examples.mjs`.
- `tests/` — `node --test` suites, including the docs sweeps (documented flags must exist in `option-specs.mjs`; stale command recipes fail).
- `examples/` — validated example decks (benchmark decks in four styles, composition and stress-gallery QA decks).
- `benchmarks/` — the shared deck brief used by the benchmark decks.

## Gallery review workflow

`slidesls gallery` generates `.gallery/` — HTML pages rendering every registry snippet under every style and density. `scripts/visual-gate.mjs` renders those pages, measures them with the visual-qa payload, and captures a still per style/density combo into `.gallery-review/<combo>.png`. Humans record rubric verdicts (composition and motion, per style) in `.gallery-review/REVIEW.md`; the motion checklist is [docs/motion-review.md](./docs/motion-review.md). Registry CSS changes are reviewed gallery-first: the gallery shows every snippet in every art direction, so a regression cannot hide in the one deck you happened to test.

## Checks and release flow

```sh
pnpm check        # lint + fmt:check + tests + validate-registry + validate-skills + validate-examples + cli:smoke
pnpm visual:gate  # rendered gate; skips with a notice when no browser driver is available
pnpm pack:check   # pnpm check + SLIDESLS_RELEASE=1 visual gate + pack-size budget + npm pack --dry-run
```

The visual gate needs `agent-browser` on PATH (or a `playwright-core` resolution; override the driver with `SLIDESLS_VISUAL_GATE_BROWSER`). Outside release mode a missing driver skips the gate with a visible notice; with `SLIDESLS_RELEASE=1` (set by `pack:check`) a missing browser fails, so the taste/motion gate can never silently no-op on a release. It fails on measured composition defects on default-density pages and on any motion-check failure (entrance opacity ramp, stagger paint-in distinctness, key-spam interrupt run).

Release: bump the version, update `CHANGELOG.md`, run `pnpm pack:check`, smoke-test the tarball, `npm publish --access public` — details in [docs/publishing.md](./docs/publishing.md).

## Design principles

- **Fix physics in the defaults.** Alignment, content-sized grids, motion choreography (transition and stagger never both translate), export/print/reduced-motion kill switches, and honest chart geometry are built into copied CSS and the runtime — not left as guidance an author can miss.
- **Encode taste in lints.** Every hard rule in the skill maps to a lint code with a precise hint. Errors are provable defects; taste signatures stay advisory and per-slide suppressible (`data-ls-lint="off"`), so deviations are deliberate rather than forbidden.
- **Gallery-first review.** Registry visual changes are judged against every snippet × style × density in the generated gallery, with screenshots and a human rubric, before they ship.
- **Contracts over prose.** Archetypes constrain content with machine-checked slot counts and word limits instead of paragraphs of advice; agents write to a visible spec.

Constraints that still hold from v1: generated decks never depend on the npm package at runtime; no mandatory framework, bundler, or build step; the copyable registry model stays central; CLI output stays deterministic and JSON-friendly; browser workflows stay optional for the base toolchain.

## Post-1.0 backlog

- GSAP motion recipes (opt-in, license-safe).
- View-Transitions shared-element recipes.
- More styles and archetypes (`timeline`, `checkpoint`, `case-study`, `decision-matrix`).
- Image-generation integration for figure slots.
- Remote-registry hardening.
- PDF export helper.

## Technical direction

- Package manager: `pnpm`. Node engine: `>=22.18.0`.
- Vanilla HTML, modern CSS (cascade layers, container queries, subgrid, `@starting-style`), vanilla JS (Web Animations API in the runtime).
- Formatting/linting: `oxfmt` / `oxlint`.
