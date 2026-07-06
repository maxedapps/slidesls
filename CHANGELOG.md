# Changelog

## 0.5.1

### Added

- `catalog --json` groups now include human-readable labels/purposes and render in task-logical order in text output, making registry building blocks easier to scan.
- Component registry metadata now includes more structured `tags`/`useCases`, and `catalog --query` searches those intent fields without matching freeform composition warnings.
- Bundled skill and docs now document template-first vs primitive-first composition and default-token/theme/custom-token visual choices.
- Init agent instructions are template-aware, with blank decks pointing to primitive composition commands and minimal decks keeping the template path plus a primitive alternative.
- Tests now cover primitive-only composition from a blank deck.

## 0.5.0

### Breaking

- `.ls-grid` rows now size to content and center vertically by default instead of stretching to fill the slide body. Sparse card grids compose as balanced bands; grids that intentionally fill (frames, diagrams, dashboards, hero layouts) opt back in with the new `.ls-grid--fill` modifier, and `.ls-grid--start` provides top-anchored content-sized rows. `.ls-stack` rows are explicitly content-sized and start-anchored (`--ls-stack-align-content` overrides per use). Published decks keep their copied CSS; the change applies to newly copied assets, repo examples, and template snippets (all audited with per-slide screenshots).

### Added

- Advisory design lint in `validate`: `many_cards_in_grid`, `stretched_grid_with_cards`, and `card_grid_check_density` flag structural signatures of weak composition. Warnings only (never promoted by `--strict`), suppressible per slide with `data-ls-lint="off"`, with manifest-version-aware hints so pre-0.5 decks get migration steps instead of classes their CSS lacks.
- `slidesls visual-qa` command: `--eval` prints a dependency-free browser collector (per-container fill ratios, computed body type sizes, grid child metrics), `--analyze` emits advisory per-slide findings (`card_low_fill`, `equal_cards_sparse`, `body_text_small`) with deep links and a `summary.slidesToInspect` list. Thresholds calibrated against committed real geometry; `scripts/visual-qa-report.mjs` stays as a delegate.
- Short-copy layout items: `components/icon-item`, `templates/icon-grid` (4-6 short items), and `templates/feature-rows` (3-5 one-liner rows) — the recommended alternatives to stretched sparse card grids.
- `data-ls-density="spacious"`: slide-level scaling up (card/callout/icon-item type, padding, gaps) for sparse slides, completing the density pair with `compact`.
- `composition` registry metadata (`contentDensity`, `layoutBehavior`, `avoidWhen`, `alternatives`) surfaced by brief `catalog --json` (`avoidWhen`) and default `inspect --json` (full object), with registry integrity checks (alternatives must exist, item-name tokens in guidance strings must resolve, `avoidWhen` requires a `## When not to use` README section).
- `authoring.cssVariables` entries can be `{ name, default, overrideSafe }` objects so token override points are discoverable from CLI output; `core/base` documents its full token surface including `--ls-accent-2`.
- `.ls-card--center` for cards in intentionally stretched contexts.
- `preview --json` now returns per-slide `slideLinks` deep links and QA `nextCommands`; text preview output gained parity.
- Release-path visual gate (`pnpm visual:gate`, part of `pack:check`): measures the rendered `examples/composition` deck via agent-browser and fails on composition regressions; skips visibly when no browser driver is available.
- Skill/docs rewrite: per-slide machine-driven QA loop, density → layout decision table, measurable visual-quality checklist, accent/font customization recipe, deduplicated recipes (SKILL.md is now a router), and the theme list includes `clean-light`.

### Changed

- `validate` groups repeated findings (`missing_registry_item_for_class`, asset errors) into single entries with item/path lists instead of repeating identical hints.
- Generated `references/catalog.md` renders per-item `Composition:` blocks and enriched CSS-variable defaults/safety, and its header marks it as per-item lookup only.

## 0.4.0

### Breaking

- `catalog --json` is now brief and selection-focused by default. Use `catalog --api --json` for the previous rich authoring metadata.
- `inspect <item> --json` is now snippet/load-tag focused by default. Use `--api` for authoring metadata and `--with-dependencies` for dependency detail entries.
- Unknown CLI flags now fail with exit code 2 instead of being treated as implicit value options.
- Registry metadata no longer stores `agentRecommended`; it is computed from the new `agentLevel` (`starter`/`recommended`).

### Fixed

- `validate` no longer reports a false `copied_asset_not_loaded` warning for module scripts (including `slide-runtime.js`) on every generated deck, and now detects loaded-but-unlisted JS assets via `loaded_asset_missing_manifest_item`.

### Added

- `agentLevel` metadata with `--starter` and `--level <level>` catalog filters.
- `authoring.classMetadata` for class-scoped safety/scope guidance.
- `data-ls-slide-kind` and static validation warnings for full-slide layout misuse.
- Canonical content-slide `.ls-slide__header` rhythm variables.
- Visual rhythm collection/analysis via `scripts/visual-qa-report.mjs --eval` and `--analyze`.
- Skill-first, brief-first agent guidance across CLI output, docs, and bundled skill references.
