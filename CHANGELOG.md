# Changelog

## 1.0.1

### Added

- Generic `ls-hero-media` and `ls-hero-copy` primitives for cover-style slides that need grouped copy beside media without abusing aligned subgrid rows.
- `ls-figure--contain` for illustrations, diagrams, logos, and other assets that must remain fully visible instead of being cropped.

### Changed

- `title-hero` snippets and the minimal starter template now use grouped hero-copy primitives for tighter, more predictable title/subtitle spacing.
- Bundled skill guidance, registry docs, and generated catalog now steer agents toward the generic hero/media path and documented figure fit variants.

## 1.0.0

The v2 system is complete: discovery polish and the final sweep.

### Added

- `catalog --intent <intent>` (open, close, prove, compare, explain-process, teach, show-data, show-code, emphasize) and `catalog --style <name>` compatibility filtering.
- `inspect --brief` (decision payload: purpose, use/avoid, contract, motion, load tags — no markup) and `inspect --examples` (snippets only).
- Post-1.0 backlog recorded in PROJECT.md: GSAP recipes (opt-in, license-safe), View-Transitions shared-element recipes, more styles and archetypes (`timeline`, `checkpoint`, `case-study`, `decision-matrix`), image-generation integration, remote-registry hardening, PDF export helper.

## 0.9.0

Skill v2, measured QA v2, and reference decks.

### Added

- **Skill v2.** `SKILL.md` rewritten around process + taste: style brief → deck rhythm plan → build-to-contract → motion pass → QA loop → done criteria; hard rules map 1:1 to lint codes; new references (`style-directions`, `archetypes`, `motion`, `customization`, `qa`).
- **Measured QA v2.** The collector now captures archetype/motion/icon facts and composited foreground/background color pairs; the analyzer adds `low_contrast` (WCAG 4.5:1 body, 3:1 display) and deck variety stats. The lint immediately caught and drove fixes for six real token contrast defects across the five styles.
- **Deck scorecard.** `validate --report`: per-slide archetype map, variety distribution, motion coverage, icon consistency, lint summary — explicitly necessary-never-sufficient.
- **Reference decks.** Four-decks benchmark (`benchmarks/deck-brief.md` + `examples/benchmark-*`, identical content in four styles) plus a `pop` flagship; QA decks (`composition`, `stress-gallery`) rebuilt on v2.
- Docs rewritten for v2 (README, PROJECT, docs/\*).

## 0.8.0

Archetypes with content contracts, and the taste lints.

### Added

- **Nine archetypes** (`registry/archetypes/`): `title-hero`, `section`, `statement`, `big-stat`, `process-flow`, `comparison` (+ before/after variant), `evidence`, `walkthrough`, `dashboard` — complete slides with layout, furniture, and motion wired, zero placeholder visuals, and machine-checkable **content contracts** (slot counts + word ranges).
- **Contract lint** (`contract_slot_count`, `contract_copy_length`, `contract_unknown_archetype`) — advisory with precise hints; constrain the content, not the CSS.
- **Taste lints wave 1**: `placeholder_echo` (short figure/surface text that restates the slide's own heading — Jaccard ≥ 0.8 — or matches a placeholder phrase list), `archetype_monotony` (>50% share or 3 consecutive repeats), `icon_mix`, `motion_absent` (deck-wide motion-off is surfaced as a decision).
- Gallery + visual gate extended over archetypes × styles × densities.

## 0.7.0

Phase 1 of the v2 rebuild: the materials. **The v1 registry is deleted.**

### Breaking

- Removed: `templates/*`, `animations/*`, `presets/*` (themes and the already-removed font presets), `utilities/layout`, and the v1 components (`card`, `panel`, `callout`, `metric`, `icon-item`, `image-card`, `code-block`, `code-diff`, `terminal`, `file-tree`, `http-exchange`, `timeline`). Copied decks keep working (assets are copied); v1 decks validate against a frozen legacy rule set (manifest `cliVersion < 0.6.0`) with a clear notice.
- `init --theme` was removed; `init --style <name>` replaces it. `add` returns `applyStyle` instead of `applyTheme`.

### Added

- **Five art directions** (`registry/styles/`): `editorial`, `terminal`, `gallery`, `boardroom`, `pop` — each a full system: vendored typefaces, palette (contrast-checked), texture layer, shape, footer furniture treatment, abstract-figure art, and a motion signature. One `data-ls-style` attribute activates everything.
- **Fourteen components** (`registry/components/`): `surface` (the _only_ bordered container), `statement`, `stat` (unboxed), `figure` (with per-style `--abstract` art — the sanctioned no-asset fallback), `list` (check/arrow/numbered/timeline, CSS-drawn markers), `code` (block/diff/terminal in one), `chart` (honest by construction: 0–100 scale, fixed zero baseline, `role="img"` required), `flow` (adjacent-sibling connectors only), `media` (browser/window frames), plus re-specced `badge`, `divider`, `progress`, `quote` (unboxed pull-quote + evidence slot), `table`.
- **Layout system** (`registry/layouts/core`): subgrid column layouts with a declared heading/body/footer row skeleton — cross-column alignment by construction — plus `--free` opt-out, `statement`/`band`/`dashboard`/`gallery` compositions, region bleed, and region typography. Slide footers with runtime page numbers ship in core.
- v2 design lints: `many_surfaces_in_grid`, `surface_only_slide`; analyzer hints retargeted; compact-density legibility floor (18px) recognized as a deliberate trade.

## 0.6.0

Phase 0 of the v2 ground-up rebuild ("Foundations & physics"): good decks become physically possible. The v1 registry is untouched and remains the default authoring vocabulary; v2 items ship hidden behind `status: "preview"` until 0.7.0.

### Breaking

- The runtime script tag emitted by `init`/`add` is now `<script defer src=...>` instead of `<script type="module" src=...>`: module scripts are CORS-blocked over `file://` in Chromium, which silently disabled the entire runtime for double-click-opened decks. Both forms validate; existing decks keep working (module form still fine over http).
- The `data-ls-font` preset model is removed (`registry/presets/fonts/*`): font presets were linked-but-never-activated no-ops in practice. Typography now ships with v2 styles and real vendored typefaces. Existing decks keep their copied files; the removed links were inert.

### Added

- **Slide transitions (WAAPI).** Slides crossfade by default; `data-ls-transition="fade|rise|slide|none"` on the deck picks the kind (a style's `--ls-transition-kind` token is the default). Transitions are fully interruptible — arbitrary key-spam can never strand a slide mid-flight. `rise`/`slide` automatically degrade child stagger to opacity-only (choreography rule: nothing translates twice).
- **Auto-stagger entrances.** Children of the slide body settle in with a per-style cadence (`@starting-style` + transition delays via `--ls-enter-index`), assigned by a documented traversal (one level into `.ls-grid`/`.ls-stack`/`.ls-cluster`/`[data-ls-stagger]`, capped at 12). First load renders slide 1 static; entrances are keyed to `data-ls-navigated`.
- **Motion is core.** New `registry/core/base/motion.css` (step-reveal CSS included); export, print, `prefers-reduced-motion`, and `data-ls-motion="none"` (deck or slide) all collapse motion completely.
- **Icon system.** Curated Lucide subset (147 icons, ISC) in `registry/icons/`; decks carry an inline `<svg class="ls-sprite">` managed by the new `slidesls icons sync --dir <deck>` (rewrites the sprite to exactly the referenced `#ls-i-*` set; `--add` falls back to the pinned lucide-static version on npm CDNs when online). New lints: `unknown_icon` (error), `emoji_icon` (advisory, suppressible with `data-ls-icons="emoji"`).
- **Vendored variable webfonts.** Shared pool `registry/fonts/<family>/` — 8 OFL families (319 KB total), each with its own `OFL.txt`, `font.css`, and registry item; copied into decks once per family via style dependencies. Byte-exact copy path (binary assets no longer utf8 round-tripped).
- **First v2 art direction (preview): `styles/editorial`.** Warm paper, ink text, oxblood accent, Fraunces/Newsreader/JetBrains Mono, unhurried fade-and-settle motion signature. Activated by a single `data-ls-style="editorial"` on `<html>`; `init --style editorial` scaffolds a deck with fonts wired. New lints: `style_missing`, `style_conflict`.
- **Design-review harness.** `slidesls gallery` renders every snippet × style × density into `.gallery/`; the visual gate now measures the whole matrix, captures review stills into `.gallery-review/`, and runs scripted motion checks (timed entrance burst, stagger paint-in distinctness, key-spam interrupt run) per style. The gate hard-fails when no browser driver is available in the release flow (`SLIDESLS_RELEASE=1` in `pack:check`); `playwright-core` works as a driver alongside agent-browser. Motion review checklist in `docs/motion-review.md`.
- **Schema v2 metadata** (for upcoming archetypes/styles): `status`, `intent[]`, `styles`, `contract`, `motion`, `icons`, `styleAttribute`, `composition.useWhen` — validated shapes, reference-checked `pairsWith`. `catalog --preview` reveals preview items; they are hidden from default discovery.
- Slides now have a base font-size legibility floor (`--ls-text-sm`): unclassed text can no longer render at browser-default 16px on the 1600×900 canvas.
- Package-size budget assertion in `pack:check` (5 MB unpacked; currently ~1 MB).

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
