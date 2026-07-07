# Validation

`slidesls validate [dir]` is offline and deterministic. Findings come in two severities:

- **Errors** — provable defects; `valid: false`. Fix all of them.
- **Warnings** — advisory findings, usually with a `hint` that names the fix or the command to run.

Three modifiers shape severity:

- `--strict` promotes a small, fixed set of warnings to errors (noted per code below). The advisory composition, contract, and taste lints are **never** promoted, even under `--strict`: they detect statistical signatures of weak composition, not provable defects.
- `data-ls-lint="off"` on a `section.ls-slide` suppresses the per-slide advisory lints for that slide only. It is a deliberate-deviation mechanism, not a general suppression switch.
- Copied-file edits are reported as informational `customizedFiles` in JSON data — not warnings; `--strict` turns hash drift into the `manifest_hash_drift` error.

Everything measured (fill ratios, computed type sizes, contrast) lives in the browser-fact path (`slidesls visual-qa`), not in static validation.

## Errors

Shell and assets:

- `missing_entry` — the configured entry HTML file does not exist.
- `missing_body_class` — `body.ls-page` is required.
- `missing_deck` — `.ls-deck[data-ls-deck]` is required.
- `missing_slide` — at least one `.ls-slide` is required.
- `missing_runtime` — `slide-runtime.js` must be loaded as a classic `defer` or module script. Hint: `slidesls add core/base --dir <deck> --dry-run --json` returns the tag.
- `asset_outside_project` — local asset references (HTML and CSS `url()`) resolve outside the project (grouped, with a `paths` list).
- `missing_asset` — referenced local assets do not exist; paths resolve relative to the file that references them (grouped, with a `paths` list).

Icons and styles:

- `unknown_icon` — the entry HTML references `#ls-i-<name>` icons missing from the inline sprite; they render as empty space. Hint: `slidesls icons sync --dir <deck> --json`.
- `style_conflict` — multiple `registry/styles/<name>/style.css` stylesheets are linked; a deck uses exactly one style.
- `style_missing` — `data-ls-style` is set but the matching style stylesheet is not linked, or a style stylesheet is linked but not activated on `<html>`.
- `style_fonts_missing` — the active style depends on font families whose `font.css` is not linked; text silently falls back to system fonts.

Manifest:

- `manifest_missing_file` — a file listed in the manifest is missing from disk.
- `manifest_hash_drift` — **`--strict` only**: a copied file differs from its manifest hash. Default runs report the same fact as `customizedFiles` data.

## Warnings promoted to errors by `--strict`

- `unknown_ls_class` — an `ls-*` class is not in the authoring API catalog. Hint: `slidesls catalog --api --json`.
- Deck structure (from markup checks):
  - `invalid_slide_kind` — `data-ls-slide-kind` must be `content`, `hero`, or `section`.
  - `content_slide_full_height_layout` — content slides should not use full-slide `ls-slide-fill` layouts.
  - `missing_slide_kind` — full-slide centered layouts should declare `data-ls-slide-kind`.
  - `progress_structure` — custom `.ls-progress` markup needs `.ls-progress__track` and `.ls-progress__bar` per progress component.
  - `timeline_structure` — timeline items should use `.ls-timeline__marker`/`.ls-timeline__body` instead of raw strong/span shorthand.
  - `reveal_highlight_without_reveal` — `.ls-reveal-highlight` needs `.ls-reveal` (use `.ls-highlight` for static emphasis).
  - `reveal_variant_without_reveal` — reveal transform variants (`ls-reveal-fade`, `ls-reveal-slide-up`, `ls-reveal-scale-in`) require `.ls-reveal`.
  - `multiple_reveal_transform_variants` — at most one reveal transform variant per element.
- Accessibility (only these two promote):
  - `image_missing_alt` — images need `alt` text, `alt=""` for decorative images, or `aria-hidden`/`role="presentation"`.
  - `control_accessible_name` — icon-only controls need an accessible name.

## Warnings (never promoted)

Accessibility:

- `deck_accessible_name` — `.ls-deck` should have `aria-label` or `aria-labelledby`.
- `slide_accessible_name` — `.ls-slide` should have `aria-label`/`aria-labelledby` or a clear heading.
- `duplicate_slide_label` — two slides share the same accessible label.

Config and registry plumbing:

- `missing_config` — no `slidesls.json` found; defaults are used for explicit validation.
- `ancestor_config_discovered` — `slidesls.json` was found in an ancestor directory of the start path; run from the deck root or pass the deck directory explicitly.
- `registry_source_unavailable` — the validation registry source could not be loaded; class, load-tag, and dependency checks may be incomplete.
- `manifest_unknown_item` — the manifest lists an item the active registry source does not know.

Load tags and class/dependency cross-checks:

- `copied_asset_not_loaded` — an asset copied by `add` is not loaded in the entry HTML (`add` copies files only; insert the returned load tags).
- `loaded_asset_missing_manifest_item` — an item's assets are loaded but the manifest does not list the item; re-run `add` or reconcile the manifest.
- `missing_registry_item_for_class` — the HTML uses classes owned by registry items that were never added (grouped; includes the exact `slidesls add` command).

Content and motion pointers:

- `large_code_block` — a code block exceeds ~18 lines / 1800 characters and needs visual fit review.
- `reveal_steps` — `.ls-reveal` appears without `data-step` or `data-ls-reveal-sequence`.
- `lucide_missing` — `data-lucide` appears without a Lucide script (external icon scripts are opt-in and discouraged; use the sprite).
- `emoji_icon` — icon slots contain emoji instead of sprite icons. Suppress deck-wide only by declaring an intentionally emoji-styled deck with `data-ls-icons="emoji"` on the deck element.

## Advisory composition, contract, and taste lints

All warnings, never promoted, and (except where noted) suppressible per slide with `data-ls-lint="off"`.

Composition (v2 vocabulary, `src/validation/design-lint.mjs`):

- `many_surfaces_in_grid` — more than 4 `ls-surface` boxes in a column grid; wrapped rows of equal boxes read as filler. Hint: the unboxed vocabulary — `components/list` (short items), `components/stat` (numbers), `components/flow` (sequences).
- `surface_only_slide` — a slide body composed entirely of 3+ bordered surfaces; mix in unboxed content or drop the boxes.

Contracts (`src/validation/contract-lint.mjs`, for slides marked `data-ls-archetype`):

- `contract_unknown_archetype` — the declared archetype is not a registry archetype.
- `contract_slot_count` — a contract slot has fewer/more items than its `min`/`max`.
- `contract_copy_length` — slot copy breaks its `maxWords`, `minWords`, or `maxChars` constraint. Cut the copy to the contract instead of shrinking type.

Taste signatures (`src/validation/taste-lint.mjs`):

- `archetype_monotony` — one archetype exceeds half of the content slides, or three consecutive slides share an archetype. Deck-level; not slide-suppressible.
- `placeholder_echo` — a figure/surface whose short visible text is a placeholder phrase or restates the slide's own eyebrow/badge/title. Follow the image ladder: real asset → authored diagram → `ls-figure--abstract` → the archetype's no-figure variant.
- `icon_mix` — sprite icons mixed with emoji in icon slots; one icon system per deck (deck-level).
- `motion_absent` — the deck disables all motion (`data-ls-motion="none"`); fine when deliberate, surfaced so it stays a decision (deck-level).

### Legacy routing (changed in v2)

Decks whose manifest `cliVersion` predates 0.6.0 were authored with the v1 vocabulary (card/panel grids) and are routed to a frozen legacy lint module instead of the v2 composition rules. They receive `legacy_deck_rules` (with a re-init hint) plus the frozen codes `many_cards_in_grid`, `stretched_grid_with_cards`, and `card_grid_check_density`. These codes never fire for v2 decks.

## Browser-fact visual QA (`slidesls visual-qa`)

`--eval` prints a dependency-free collector script to run in a browser against a preview opened with `?export=1`; `--analyze --input <collected.json> --json` judges the collected facts. All findings are advisory and carry per-slide deep links (`perSlide`, `summary.slidesToInspect`):

- `content_header_offset` — a content slide's header starts away from its expected top position (tolerance 24px).
- `content_header_too_low` — a content slide's header starts below 30% of slide height.
- `content_header_median_deviation` — a content slide's header rhythm deviates from the content-slide median.
- `card_low_fill` — tall containers (≥340px) with content filling under 45% of their height; dead space is trapped inside the box.
- `equal_cards_sparse` — a grid of 3+ sparse boxes (under ~140 characters each) averaging over 240px tall; equal boxes with one short line each read as filler.
- `body_text_small` — body copy renders below the 20px legibility floor for the 1600×900 canvas (18px on slides that opt into `data-ls-density="compact"`).
- `low_contrast` — a composited text/background pair falls below the WCAG floor: 4.5:1 for body copy, 3:1 for display-size text (≥32px, or bold ≥24px). Fix at the style-token level; contrast failures usually repeat everywhere the pair appears.
- `collection_incomplete` — some or all slides were not rendered during collection, so measured checks skipped them; re-collect on the export URL.

The analyzer also returns deck facts: variety (archetype distribution, longest run), motion (transition, kill switch, slides with steps), and icon usage.

Thresholds are calibrated against committed real geometry (`tests/fixtures/*-visual-qa.json`).

## Scorecard (`validate --report`)

`--report` adds a `report` object: per-slide archetype map (label, archetype, kind, step count), variety distribution and longest run, motion coverage (deck transition, kill switch, slides with steps), icon consistency (sprite references, emoji slots, emoji opt-in), and a lint-count summary. The scorecard gates structure and honesty only — it is necessary, never sufficient. A clean scorecard is not "done": run the visual-qa pass and review rendered slides before calling the deck finished.

## Repo validation

- `slidesls validate-registry` — validates registry metadata against the item contract (types, status, intent, contract, motion, icons, composition integrity), file existence, snippet structure (e.g. `invalid_progress_structure`, `invalid_timeline_structure`, `invalid_quote_structure`), authoring metadata against item CSS, dependency references and cycles, snippet dependency closure, and `@container` usage contracts. Findings carry `severity` + `code`; the full code set lives in `src/validation/registry.mjs`.
- `slidesls validate-examples` — recursively validates `examples/**/*.html`: asset links, unsupported `ls-*` classes, targeted structure checks.
- `slidesls doctor` — environment checks (`node_version`, `package_metadata`, `config_parse`, `config_paths`, `entry_exists`, `project_writable`, `registry_available`, plus the advisory `browser_optional`).

## Limits

Static validation is a lightweight scanner, not a browser render or full HTML parser. It proves structure and honesty; it cannot prove visual fit or taste. The rendered pass — `slidesls preview` plus the `visual-qa` loop and per-slide screenshots — decides when a deck is done. The full recipe lives in the bundled skill (`slidesls skill show --reference qa`).
