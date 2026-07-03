# Validation

## Deck validation

`slidesls validate [dir]` checks config discovery, entry existence, required deck shell markup, local asset references, manifest files, removed layout macros, unknown `ls-*` class attributes, common missing registry-item usage for known classes, and targeted structural issues such as broken custom progress bars, raw timeline shorthand, incompatible reveal variants, reveal-highlight misuse, and very large code blocks.

Copied registry files are intentionally editable. Default validation reports changed copied files as `customizedFiles` in JSON data, not as warnings or errors. Use `--strict` when you need hash drift and deck-level structural warnings to fail validation.

## Design lint (advisory composition warnings)

`validate` also runs a structural composition lint. Its codes are always warnings — they are never promoted to errors, even under `--strict` — because they detect statistical signatures of weak composition, not provable defects:

- `many_cards_in_grid` — more than 4 cards/panels inside a column grid on one slide; wrapped rows of equal boxes read as filler. Hint: `templates/icon-grid`, `templates/feature-rows`, or a split layout.
- `stretched_grid_with_cards` — a stretch-to-fill grid (`.ls-grid--fill`, or any `.ls-grid` when the deck's copied assets predate content-sized grids) combined with 3+ cards; sparse cards will stretch and trap dead space.
- `card_grid_check_density` — a grid of 4+ text cards (3+ when the deck's copied assets predate content-sized grids) with no `data-ls-density` and no visual anchor (svg/img/code/metric/progress). This is a pointer, not a verdict: text volume is not statically measurable, so the hint defers to `slidesls visual-qa`.

Version-aware hints: `validate` reads the deck manifest's `cliVersion`. When copied assets predate the 0.5.0 grid change, hints start from the migration step (re-copy `utilities/layout` and `core/base`) instead of referencing classes the deck's CSS does not have.

Suppression: `data-ls-lint="off"` on a `section.ls-slide` suppresses design-lint codes for that slide only. It is not a general validation suppression mechanism, and `--strict` does not override it.

Limits: the static lint sees tag/attribute/count patterns per slide segment. Everything measured — fill ratios, computed type sizes, rendered geometry — lives in `slidesls visual-qa`.

## Browser-fact visual QA

`slidesls visual-qa` is the measured half of design QA. It has two modes:

- `slidesls visual-qa --eval` prints a dependency-free browser script. Pipe it into `agent-browser eval` (stdin mode) against a running preview opened with `?export=1` so all slides render.
- `slidesls visual-qa --analyze --input <collected.json> --json` analyzes the collected geometry and emits advisory warnings (`card_low_fill`, `equal_cards_sparse`, `body_text_small`, plus header-rhythm codes), a `perSlide` findings list with a deep link per slide, and `summary.slidesToInspect`.

`preview --json` returns `slideLinks` (per-slide `#slide=N` deep links) so per-slide screenshot capture is scriptable. The full agent loop is documented in the bundled skill (`references/preview-validation.md`).

Thresholds are calibrated against committed real geometry (`tests/fixtures/*-visual-qa.json`): the rebuilt eve-deck failure slides fire, every bundled snippet and the `examples/composition` deck stay clean. `node scripts/visual-qa-report.mjs` remains as a repo-path delegate for the same collect/analyze pair.

## Visual gate (release path)

`pnpm visual:gate` (part of `pnpm pack:check`) renders two pages via `agent-browser` — `examples/composition` and a generated gallery containing every bundled template snippet — collects rendered geometry with the visual-qa payload, and fails on any measured composition warning, missing slide, or broken collection — so a registry CSS change that reintroduces stretched sparse cards fails the release check. Without `agent-browser` on PATH it skips with a visible notice; the base toolchain stays dependency-free. Override the driver with `SLIDESLS_VISUAL_GATE_BROWSER`.

## Repo validation

- `slidesls validate-registry` checks registry metadata, authoring metadata, files, docs, snippets, dependency references/cycles, snippet dependency closure, official snippet structure, local JS syntax, registry CSS container-query contracts, and composition-metadata integrity (existing `alternatives[].use` targets, item-name tokens in guidance strings, `avoidWhen` ↔ `## When not to use` README pairing).
- `slidesls validate-examples` recursively checks `examples/**/*.html`, asset links, removed `ls-layout-*` usage, unsupported real `ls-*` class attributes, and targeted structure checks.
- `slidesls doctor` checks Node/package/config/registry/project write health.

## Static validation limits

Validation is a lightweight static check, not a full HTML parser, browser render, or visual regression tool. It catches common contract and asset issues in generated/plain decks, but it does not prove visual fit or typography. Use `slidesls preview` plus the `visual-qa` loop for rendered correctness; the per-slide recipe lives in the bundled skill's `references/preview-validation.md`.
