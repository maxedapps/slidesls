# Design-quality agent guidance plan

Status: proposed (plan only, no implementation)
Date: 2026-07-03
Target release: 0.5.0
Reviewed: independent critique via Claude Opus 4.8 (high effort); major findings incorporated — see "Review notes" at the end. Second pass: full codebase audit (Claude Fable 5, 2026-07-03) — Phase 1 audit corrections and Phases 2.6/3/4.6 additions; see "Review notes (second pass)".

## Problem statement

A real agent-built deck (eve framework, built with slidesls 0.3.0) was structurally valid, passed `slidesls validate`, and passed the agent's own visual review — yet several slides were compositionally weak: 3-up and 6-up card grids with tall equal-height cards, sparse copy pinned at the top of each card, large dead areas inside cards, and body text that reads small relative to the slide.

Analysis of the deck HTML and the current repo (0.4.0) shows this is not primarily an "agent didn't read the docs" failure. The failure is layered, and every layer contributed:

1. **CSS defaults guarantee the failure mode for sparse content.**
   `.ls-slide__inner` uses `grid-template-rows: auto 1fr` (`registry/core/base/slide.css:78`), so the content block always receives the full remaining slide height. `.ls-grid` (`registry/utilities/layout/layout.css:24`) sets no `align-content`, `align-items`, or `grid-auto-rows`, so its implicit rows split that full height and every grid item stretches. `.ls-card` uses `align-content: start` (`registry/components/card/card.css:4`), pinning content to the card top. Result: sparse copy + card grid = tall cards, top-packed text, empty bottoms — deterministically. `.ls-panel--fit` exists as a stretch opt-out; there is no equivalent for `.ls-grid` rows or `.ls-card`. The same mechanism latently affects `.ls-stack` (`layout.css:2`, also no `align-content`) when a stack of cards sits in a stretched grid cell (e.g. the `split` template's support column).
2. **The canonical template reproduces the bug by construction.**
   `templates/three-cards` `authoring.usage` says "Use compact copy: one short title and one sentence per card" — the eve deck followed this exactly and got the failure. Guidance and CSS are in direct tension.
3. **The documented QA loop cannot see the problem.**
   `docs/agent-workflow.md` step 10 and `references/preview-validation.md` recommend one full-export screenshot at a 1600×900 viewport. For a 9-slide deck each slide renders at roughly 170px tall in the capture; per-slide composition is invisible. Deep links (`#slide=N&step=M`) exist but are only documented for reveal-step checks, not per-slide composition review. The existing visual-quality checklist already forbids "giant empty panels/cards" — prose alone did not survive contact with an agent optimizing for "valid and coherent".
4. **The existing design-quality tooling is out-of-band and narrow.**
   `src/validation/visual-rhythm.mjs` + `scripts/visual-qa-report.mjs` (added in 0.4.0) measure only header offsets (`content_header_offset`, `content_header_too_low`, `content_header_median_deviation`). They are not wired into `validate`, not part of the primary skill workflow, and don't measure card fill, whitespace, or type sizes.
5. **Registry metadata has no density/composition dimension.**
   No field expresses "this layout stretches to fill", "avoid for sparse copy", or "for 6 short items use X instead". `catalog`/`inspect` projections are explicit allowlists (`src/registry/source.mjs:107,125`), so new fields also need plumbing.
6. **Typography guidance is absent and one-directional.**
   `data-ls-density="compact"` scales type down for dense slides (`slide.css:132`); nothing scales up for sparse slides, and no prose states legibility floors.
7. **Accent/font customization is real but under-documented.**
   `--ls-accent`, `--ls-font-heading`, `--ls-font-body`, `data-ls-theme`, `data-ls-font` all work, but appear only as bare variable names in the generated `references/catalog.md`; no worked override example exists.

## Goals

- An agent that follows the bundled skill verbatim should produce well-composed slides for sparse, balanced, and dense content — not just valid ones.
- Make the sparse-card failure mode impossible-by-default or loudly flagged: fix layout defaults where safe, add opt-in variants where not, and warn statically and in browser-fact QA when it still happens.
- Give agents a deterministic decision procedure: item count × copy length → recommended layout, encoded in machine-readable metadata and in the skill.
- Upgrade the visual QA loop from "one full export screenshot" to "per-slide screenshots + machine-readable per-slide findings + concrete checklist".
- Give the rendered fix an automated gate, within the no-heavy-dependency constraint.
- Document accent/font customization as a first-class path.

## Non-goals

- No headless-browser dependency in the base CLI or default `pnpm check`. Browser-fact QA stays on the existing `agent-browser`/eval-script model (dependency-free, per PROJECT.md constraints); the visual gate is a scripted release-time step, not a hard CI dependency.
- No runtime dependency for generated decks; all fixes remain copyable vanilla CSS/HTML.
- No pixel-diff visual regression infrastructure (explicitly deferred post-MVP in `docs/validation.md`); geometry assertions, not screenshot diffs.
- No attempt to score "aesthetics" — heuristics target measurable proxies (structure counts, geometry, computed sizes) and stay advisory.
- No layout macros or frameworks (PROJECT.md constraint).

## Current-state findings (file references)

- CLI dispatch: `bin/slidesls.mjs`, `src/cli/commands.mjs:53`; option specs centralized in `src/cli/option-specs.mjs`; exit 1 when `data.valid === false`. Warnings never fail a run unless `--strict` promotes specific codes.
- Validate orchestration: `src/cli/validation-commands.mjs:33` (`validateCommand`), rule modules in `src/validation/` (`markup-structure.mjs`, `accessibility.mjs`, `authoring-api.mjs`, `assets.mjs`, `load-tags.mjs`). Severity routing via `deckIssue({strict, errors, warnings, ...})` (`markup-structure.mjs:94`). Human output via `src/cli/text-output.mjs:74-97`; agent guidance via `src/cli/agent-instructions.mjs:132`.
- **HTML scanning is a flat regex tag stream, not a DOM tree** (`src/shared/html.mjs` start-tag records + slide segmentation). Existing heuristics are single-tag or attribute-presence checks (`large_code_block` at `markup-structure.mjs:169-180`, slide-kind rules). There is no parent/child model; any lint requiring per-subtree content aggregation is architecturally out of reach without a parser. This constrains Phase 3a below.
- Existing browser-fact path: `analyzeVisualRhythm` (`src/validation/visual-rhythm.mjs`) consumed by `scripts/visual-qa-report.mjs` (`--eval` emits a browser IIFE for `agent-browser eval --stdin`; `--analyze` reads collected JSON, prints `{warnings, slides, summary}`). Ships in the npm package (`package.json` `files`) but is repo-path-relative, awkward for `npx` users. Tunable constants at module top are the established pattern.
- Registry metadata: schema `schemas/registry-item.schema.json` is documentation-only, `additionalProperties: true` at top level; runtime enforcement in `src/validation/registry.mjs` (`validateItemMetadata` does not reject unknown keys). Projections: `summarizeItemBrief` (`src/registry/source.mjs:107`), `summarizeItem` (`:125`), merged under `--api`; catalog doc rendering in `src/registry/catalog-doc.mjs:91` (`authoringLines`); generated output `skills/create-slides-with-slidesls/references/catalog.md` via `generate-catalog` (checked by `generate-catalog --check` in `pnpm check`).
- Deck manifests record the copying CLI version (`slidesls/manifest.json` → `cliVersion`; the eve deck shows `0.3.0`), so `validate` can know whether a deck's copied assets predate a registry change.
- Skill: static files in `skills/create-slides-with-slidesls/` (SKILL.md 173 lines + 5 references; only `references/catalog.md` is generated). `skill show --reference <name>` maps via `src/skill/agent-skill.mjs:69-75`. Visual-quality checklist at `references/preview-validation.md:46-60`.
- CSS: tokens in `registry/core/base/tokens.css` (`--ls-accent`, `--ls-font-*`, type scale); slide shell + `data-ls-density="compact"` in `registry/core/base/slide.css`; grid/stack utilities in `registry/utilities/layout/layout.css`; card in `registry/components/card/card.css`.
- Registry inventory: 9 templates (`three-cards`, `split`, `split-diagram`, `title-hero`, `metric-dashboard`, `section-divider`, `api-flow`, `code-plus-notes`, `technical-walkthrough`), 16 components, 1 layout utility item, 5 themes, 3 font presets.
- Tests: `node --test tests/**/*.test.mjs`; relevant: `visual-rhythm.test.mjs`, `catalog-doc.test.mjs`, `registry-resolution.test.mjs`, `html-validation.test.mjs`, `skill-command.test.mjs`, `cli-output.test.mjs`; repo gates `validate-registry`, `generate-catalog --check`, `validate-examples`, `scripts/test-cli-smoke.mjs`.

## Chosen strategy and rationale

Fix the failure at four reinforcing layers, in this order of leverage:

1. **Layout/CSS first** — content-sized, vertically balanced grids become the default for card grids; add a spacious density. The best guidance is defaults that don't produce the bug.
2. **Machine-readable composition metadata** — so `catalog`/`inspect` (what agents actually call) carry density guidance, anti-patterns, and alternatives at decision time, not buried in a 700-line reference.
3. **Measurable QA with a clean static/browser split** — static lint stays structural (what a flat tag scanner can genuinely detect); everything measurable (fill ratios, computed type sizes, per-card geometry) lives in the browser-fact path, promoted to a first-class `slidesls visual-qa` command whose output is machine-readable per slide.
4. **Skill/docs workflow** — per-slide screenshot loop driven by machine output (not prose alone), density→layout decision table, typography floors, customization recipe.

Rationale: the eve case shows prose alone fails (the checklist already forbade "giant empty cards"; the agent still shipped them because the capture workflow hid them and the templates produced them). Each layer covers the previous one's escape hatches: good defaults → metadata warns when defaults are overridden → lint warns when metadata is ignored → per-slide QA measures what lint can't, and hands the agent a specific list of slides to fix.

### Alternatives considered and rejected

- **Docs/skill-only fix** (no CSS or CLI changes). Rejected: this interaction proves prose checklists don't survive contact with an agent optimizing for "valid and coherent"; the templates would still render the anti-pattern by default.
- **A separate `slidesls design-lint` command for static heuristics.** Rejected in favor of folding static checks into `validate` (agents already run it after every edit; a separate command is one more step to skip). The browser-fact half does get its own command (`visual-qa`) because it genuinely has a different execution model (needs a live preview + agent-browser).
- **Full headless-browser rendering inside the CLI** (Playwright/puppeteer dependency) for true pixel measurement. Rejected: violates the lightweight/no-heavy-dependency constraint in PROJECT.md and `docs/validation.md`. The `--eval`/`--analyze` split already gives real rendered geometry without the dependency.
- **Changing `.ls-slide__inner` to `auto auto` rows.** Rejected: breaks the established full-height composition contract that hero/section slides, `ls-slide-fill`, and frame/diagram templates rely on; far larger blast radius than scoping the fix to `.ls-grid`/`.ls-stack` behavior.
- **Static text-volume/font-size lint (word counts per card, font-size regex).** Considered in the first draft; dropped after review. Per-card text aggregation needs subtree bracket-matching the flat scanner can't do reliably, and font-size regexes over `<style>` blocks are high-false-positive. The browser-fact path measures both for real; static lint keeps only structural signals.
- **An LLM-based "design judge" step.** Out of scope for the CLI; the skill's per-slide checklist effectively is this, run by the authoring agent itself with better inputs.

## Proposed changes

### Phase 1 — Layout/CSS: make sparse content compose well by default

Files: `registry/utilities/layout/layout.css`, `registry/components/card/card.css`, `registry/core/base/slide.css`, matching `registry-item.json` + README + snippets, `registry/templates/*/snippet.html`, `registry.json`, `examples/`.

1. **Grid vertical behavior — decision: content-sized and vertically centered by default.**
   - `.ls-grid` gains `align-content: var(--ls-grid-align-content, center)`: implicit rows size to content instead of splitting the full `1fr` body height, and the grid's row block centers vertically in the body area, distributing leftover space above/below instead of trapping it inside cards. (Centering is the recommended sparse-slide look; making anything else the default while recommending `center` would be incoherent. When content fills the area, `center` is visually identical to today.)
   - New modifiers: `.ls-grid--start` (content-sized, top-anchored under the header, for editorial layouts that want top alignment) and `.ls-grid--fill` (restores today's stretch for grids that intentionally fill: frames, diagrams, dashboards).
   - `.ls-stack` gets the same treatment where it acts as a slide-body block: `align-content: var(--ls-stack-align-content, start)` plus documented `--ls-stack-align-content` override; audit stacks-in-stretched-grid-cells (`split` and `code-plus-notes` snippets; `technical-walkthrough` has no `.ls-stack` — its grid cells hold `file-tree`/`terminal` directly) — a stack of sparse cards inside a stretched cell exhibits the same stretch/top-pin failure and must be verified per template. (Stacks default to `start`, not `center`: they usually sit inside an already-sized column where top alignment is correct; the variable makes per-use centering trivial.)
   - This is a **behavior change for newly copied assets only** (decks copy CSS; published decks keep their copies). Every bundled template snippet and example is audited with per-slide screenshots before/after (see Test strategy). Per-template audit, verified against the actual snippets:
     - `title-hero` — the only bundled fill-intent grid (`ls-grid--wide-left` + `ls-slide-fill`, `title-hero/snippet.html:3`). Its children self-center (`ls-center-start`, `ls-panel--fit`), so it survives the default change today, but add `.ls-grid--fill` to the snippet explicitly for intent clarity and to stay safe for future multi-row hero variants.
     - `split` — uses `ls-panel--accent ls-panel--center` (**not** `--frame`); `--center` carries no min height, so the panel column **will** shrink to content height under the new default. Decide via before/after screenshots whether the centered, content-sized row is the better composition (expected) or the snippet needs `.ls-grid--fill` + `.ls-card--center`.
     - `split-diagram` — panel `--frame` keeps `min-block-size: 320px` (`panel.css:37`); safe under the new default.
     - `metric-dashboard` — add `.ls-grid--fill`. Note: within one implicit row, cells still equalize to the tallest cell (the progress panel), and `.ls-metric`'s own `align-content: start` (`metric.css:5`) re-creates a bounded top-pin inside metric cells — verify, and center metric internals if screenshots show dead space.
     - `api-flow`, `code-plus-notes`, `technical-walkthrough` — content-sized children; verify the centered composition is an improvement, no `--fill` expected.
2. **Card variants.** In `components/card`:
   - `.ls-card--center` (`align-content: center`) for the case a card must remain in a stretched context (`--fill` grids, un-migrated decks).
   - Keep `align-content: start` as base (correct once rows are content-sized).
3. **Spacious density — complete the half-shipped variant.** `[data-ls-density="spacious"]` already exists at component level (`progress.css:76`, `divider.css:43`) but not in the slide shell, and `core/base/registry-item.json` `dataAttributes` allows only `["compact"]`. In `core/base/slide.css`, add `.ls-slide[data-ls-density="spacious"]` scaling type/spacing up for sparse slides (e.g. `--ls-card-title-size: 32px`, `--ls-card-text-size: 24px`, larger `--ls-space-5/6` and `--ls-grid-gap`), mirroring how `compact` scales down; extend the `core/base` metadata `values` allowlist to `["compact", "spacious"]`; audit the two pre-existing component variants for consistency with the new slide-level scaling. Document everywhere `compact` is documented; the visual-qa `--eval` payload already collects `data-ls-density`.
4. **New registry items for short-copy layouts** (the "6 short items" and "3 short concepts" cases):
   - `components/icon-item` (name TBD): compact icon + title + one-liner tile/row — the building block the eve deck hand-rolled as a custom `eve-card-top` cluster. Content-sized, works with or without a card border.
   - `templates/icon-grid`: 2×3 / 3×2 compact tiles for 4–6 short items; content-sized rows, vertically centered block.
   - `templates/feature-rows`: stacked full-width rows (icon/keyword left, one-liner right) for 3–5 short points — the alternative to `three-cards` when copy is one sentence.
   - Update `templates/three-cards`: snippet uses the new default grid; snippet copy demonstrates the intended text volume (2–4 sentences or a visual per card); `usage` no longer says "use compact copy" (see Phase 2.3).
   - Each new item ships `registry-item.json` (with Phase 2 metadata), README, snippet(s); regenerate catalog.

### Phase 2 — Registry metadata: density and composition guidance at decision time

Files: `schemas/registry-item.schema.json`, `docs/registry-contract.md`, `src/validation/registry.mjs`, `src/registry/source.mjs`, `src/registry/catalog-doc.mjs`, `src/cli/deck-commands.mjs`, all `registry/**/registry-item.json` that need guidance, `tests/registry-*.test.mjs`, `tests/catalog-doc.test.mjs`.

1. **New optional top-level `composition` object** on registry items (documentation schema + runtime shape check in `validateItemMetadata`):

   ```jsonc
   "composition": {
     "contentDensity": ["sparse", "balanced"],      // densities this item suits
     "layoutBehavior": "content-sized",             // or "fills-area" | "fixed"
     "itemCountGuidance": "3 cards; for 4-6 short items use templates/icon-grid",
     "copyGuidance": "Works when each card carries 2-4 sentences or a visual; for one-liners use templates/feature-rows",
     "avoidWhen": [
       "each card has only a title plus one short sentence and no visual",
       "more than 4 items would wrap into stretched rows"
     ],
     "alternatives": [
       { "when": "4-6 short items", "use": "templates/icon-grid" },
       { "when": "3-5 one-liner points", "use": "templates/feature-rows" }
     ]
   }
   ```

   Kept top-level (not inside `authoring`) because `authoring` is the class/attribute API surface with `additionalProperties: false` sub-shapes; `composition` is advisory prose+pointers. Schema stays permissive; `validate-registry` gains shape checks.

2. **Drift protection (integrity checks in `validate-registry`):**
   - `alternatives[].use` must name an existing registry item.
   - Additionally, scan **all** `composition` string fields (and `authoring.usage` strings) for `templates/…` / `components/…` / `utilities/…` tokens and fail if the referenced item does not exist — freeform guidance strings must not silently rot when items are renamed (item names are still TBD, so this check lands before the prose does).
   - If an item declares `composition.avoidWhen`, its README must contain a `## When not to use` heading (presence check) so README and metadata stay paired.
3. **Plumbing:**
   - `summarizeItemBrief` adds `avoidWhen` (short, decision-critical) — brief output is what `catalog --json` and default `inspect --json` return.
   - `summarizeItem` adds the full `composition` object; default (non-`--api`) `inspect` also includes full `composition` — it is small and exactly what an agent needs when grabbing a snippet.
   - `catalog-doc.mjs` renders a `Composition:` block per item so the generated `references/catalog.md` carries it.
   - `agentInstructions` in catalog/inspect output add: "check composition.avoidWhen before using a template".
4. **Author metadata** for at least: `templates/three-cards`, `templates/metric-dashboard`, `templates/split`, `templates/title-hero`, `components/card`, `components/panel`, `components/metric`, `utilities/layout` (grid modifiers), plus all new Phase 1 items. Fix the `three-cards` tension: copy-volume guidance consistent with the content-sized grid replaces "use compact copy".
5. **README convention:** standardized `## When not to use` section for component/template READMEs (mirrors `avoidWhen`; enforced by the pairing check above); document the convention in `docs/registry-contract.md` and `docs/primitive-authoring.md`.
6. **Customization-boundary metadata for CSS variables.** `authoring.cssVariables` entries are today bare name strings, so `catalog`/`inspect` advertise override points with no values and no safety signal — and the skill's only customization guidance is prohibitions. Extend entries to `{ name, default, overrideSafe }` objects (keep accepting the legacy string form in `validateItemMetadata` so existing registry items and older CLIs stay valid); add the missing `--ls-accent-2` to `core/base`; plumb the enriched shape through `summarizeItem`/`--api` projections and `catalog-doc.mjs` rendering. This makes the fine-tuning boundary (which tokens an agent may freely override, and their defaults) discoverable from the CLI output agents actually decide from — the Phase 4 customization recipe then documents the _how_, not the only source of the _what_.

### Phase 3 — Static structural lint + measurable browser-fact QA

**Division of labor (firm):** static lint detects _structure_ a flat tag scanner can prove (tag/attribute/count patterns per slide segment); the browser-fact path owns _everything measured_ (text volume as rendered, fill ratios, computed font sizes, geometry). No word-count or font-size proxies in static lint.

**3a. Static design-lint warnings in `validate`.**
Files: new `src/validation/design-lint.mjs`, wiring in `src/cli/validation-commands.mjs`, hints in `src/cli/agent-instructions.mjs`, tests in new `tests/design-lint.test.mjs`.

Advisory warnings (never errors, even under `--strict` — documented severity carve-out). All are per-slide-segment counts over start-tag records — feasible with the existing scanner:

- `many_cards_in_grid`: more than 4 `.ls-card`/`.ls-panel` open-tags within one slide segment that also opens a `.ls-grid--2/3/4` — wrapping rows of equal boxes. Hint: `templates/icon-grid`, `templates/feature-rows`, or a `split` layout.
- `stretched_grid_with_cards`: a slide segment combining `.ls-grid--fill` (post-migration; plain `.ls-grid` when the deck's copied assets predate 0.5 — see version-aware hints below) with ≥3 card open-tags. This is the static signature of the eve failure; the hint defers measurement to `visual-qa`.
- `card_grid_check_density`: ≥3 cards in a grid and the slide sets no `data-ls-density` and no visual-anchor tags appear in the segment (`<svg`, `<img`, `.ls-metric`, `<code`, `.ls-progress` — tag-presence within the segment, no tree needed). Phrased as "verify composition in visual-qa", not as a verdict; this is deliberately a pointer, not a judgment, because text volume is not statically measurable here.
- **Version-aware hints:** `validate` reads the deck manifest's `cliVersion`. When copied assets predate the grid change, class-based hints are prefixed with the migration step ("re-copy `utilities/layout` (slidesls add utilities/layout --force) to get content-sized grids, then …") so remediation never references classes the deck's own CSS lacks.
- `deck_css_overrides_registry_selector` (stretch goal; ship only if calibration shows an acceptable false-positive rate): warn when deck-authored CSS (entry-file `<style>` blocks, non-copied CSS files) redefines a `.ls-*` selector outside `@layer`. Unlayered rules beat all layered component CSS — this is the one unguarded hole in the customization boundary; the hint recommends token overrides (`@layer tokens`) instead. Detection is regex-level over CSS text; if too noisy, demote to documentation-only guidance in the Phase 4 customization recipe.
- **Suppression:** `data-ls-lint="off"` on a `section.ls-slide` suppresses design-lint codes for that slide. Plumbing spec: added to `core/base` `authoring.dataAttributes` (name, values `["off"]`, scope `section.ls-slide`), recognized by `design-lint.mjs`, unaffected by `--strict` (suppression always wins), documented in `docs/validation.md` and the skill. Not a general validate-suppression mechanism — design-lint codes only.
- Thresholds/constants at module top with derivations in comments (pattern from `visual-rhythm.mjs`); see calibration note in 3b.

**3b. Browser-fact metrics: extend the collector/analyzer, promote to `slidesls visual-qa`.**
Files: `src/validation/visual-rhythm.mjs` (extend or add sibling `src/validation/visual-metrics.mjs`), `scripts/visual-qa-report.mjs` (kept as thin delegate), new `src/cli/visual-qa-command.mjs` (+ `option-specs.mjs`, `commands.mjs`, help text), `tests/visual-rhythm.test.mjs` + new fixtures.

- `--eval` collector additions per slide: for each `.ls-card`, `.ls-panel`, `.ls-metric`, `.ls-callout` — container rect vs. content bounding box (union of child rects) → `contentFillRatio`; computed `font-size` of `.ls-card__text`/`.ls-subtitle`/paragraph copy; grid child counts and per-child text lengths; slide-level text totals; `data-ls-density`.
- `--analyze` new advisory warnings: `card_low_fill` (fill ratio below threshold and card height above threshold — primarily a backstop for `--fill` grids and un-migrated decks once Phase 1 lands; expectations right-sized accordingly), `body_text_small` (computed size below floor), `equal_cards_sparse` (grid where all cards sparse + tall). Existing rhythm codes kept.
- **Threshold calibration (explicit implementation step, not an afterthought):** derive constants from canvas math — body-row height = 900 − 2×`--ls-slide-padding-block` − header height − gap; expected card height = (body height − gaps) / rows — and calibrate against (a) the eve deck markup, (b) all bundled template snippets, (c) the new `examples/composition/` decks, tuning until the eve slides fire and every bundled snippet is clean. Record the calibration table in the module comments.
- **Machine-readable per-slide output:** `--analyze` (and the new command) emit, per slide, `{ index, aria-label, warnings[], inspect: boolean, deepLink }` so an agent gets a concrete "screenshot and fix slides 2 and 5" list instead of a global verdict. `preview --json` adds a `slideLinks` array (per-slide deep-link URLs) to make per-slide capture trivially scriptable.
- New command `slidesls visual-qa --eval|--analyze [--json]` wrapping the same logic so `npx -y @maxedapps/slidesls` users get it without repo paths; `scripts/visual-qa-report.mjs` stays as a delegate for back-compat.
- `validate` output's `agentInstructions` and `preview --json` both point at `visual-qa` so agents discover it in-flow (this, plus the per-slide findings list, is the enforcement answer to "prose checklists get skipped").
- **Close the preview end of the loop.** `previewAgentInstructions` (`src/cli/preview-command.mjs:63-70`) currently has no `nextCommands` — the command that starts the QA cycle never tells the agent to screenshot, run `visual-qa`, or re-`validate`. Add `nextCommands` (visual-qa eval/analyze, re-validate after fixes) and give text-mode `preview` output parity: `text-output.mjs:127` today prints only the serving line, dropping `exportUrl` and the entire agent-guidance block that the JSON path carries.
- **Deduplicate repeated hints in `validate` output before adding design-lint codes.** Today identical `hint`/`command` strings repeat per finding (e.g. nine `asset_outside_project` findings each carrying the same verbatim hint; same for `missing_registry_item_for_class`, `validation-commands.mjs:331-341`). Group findings per code with one hint plus a `paths[]`/`slides[]` list so the new advisory codes don't multiply the bloat in agent-facing JSON.

### Phase 4 — Skill, docs, and QA workflow

Files: `skills/create-slides-with-slidesls/SKILL.md`, `references/preview-validation.md`, `references/deck-authoring.md`, regenerate `references/catalog.md`, `docs/agent-workflow.md`, `docs/validation.md`, `docs/cli.md`, root `README.md`.

1. **Per-slide QA loop, machine-driven** (replaces "one export screenshot" as the norm) in `preview-validation.md` + SKILL.md step 12:
   - Full export capture once, for overview and cross-slide rhythm;
   - run `slidesls visual-qa` eval/analyze; it returns per-slide findings and deep links;
   - per-slide screenshots via `preview --json` `slideLinks` for **every content slide** on decks ≤ ~15 slides (flagged + representative slides beyond that), inspected at full size against the checklist;
   - fix or explicitly justify every advisory finding; re-run until clean;
   - explicit instruction: "Do not judge composition from the full-export overview."
2. **Density → layout decision table** in `deck-authoring.md` (summarized in SKILL.md):
   - 3–4 items, one-liners → `feature-rows` or compact cards with the centered grid; not full-height cards.
   - 4–6 short items → `icon-grid`; never 6 stretched cards.
   - 3 items with 2–4 sentences or visuals each → `three-cards`.
   - 1 big idea + sparse support → hero/section kind or `split`, `data-ls-density="spacious"`.
   - Dense tables/code → `compact` density, existing rules.
3. **Sharpened visual-quality checklist** (`preview-validation.md`): measurable phrasing — "text occupies well under half of a card's height → restructure", "body copy should render ≥ ~20px on the 1600×900 canvas", "same-size boxes with one short sentence each is an anti-pattern", "whitespace belongs between groups, not trapped inside boxes".
4. **Customization recipe**: new short section in `deck-authoring.md` ("Change accent color and fonts"): worked example overriding `--ls-accent`/`--ls-accent-2`/`--ls-accent-text` in a deck-level `@layer tokens` block, `data-ls-theme`/`data-ls-font` switching, pointer to font presets. Mentioned in SKILL.md's fast discovery map.
5. **`docs/validation.md`**: document design-lint codes, advisory severity, suppression, version-aware hints, and limits; `docs/cli.md` documents `visual-qa` and new flags.
6. **Documentation deduplication and drift fixes** (do this as part of the Phase 4 rewrite, not after — every duplicated block touched by Phases 1–3 otherwise needs 3–4 synchronized edits):
   - The agent-browser QA recipe exists near-verbatim in four places (SKILL.md:107-125, `references/preview-validation.md`, `docs/validation.md`, `docs/agent-workflow.md`); the workflow step list in three (SKILL.md, `docs/agent-workflow.md`, `docs/cli.md`); the animation recipe in two. Consolidate: each recipe lives in exactly one reference; SKILL.md becomes a router (decision table, boundaries, pointers) and stops inlining recipes it duplicates.
   - Fix live drift: SKILL.md lists only 4 of the 5 themes (`clean-light` missing at SKILL.md:66-69). Prefer generating the theme list from the registry (same mechanism as `generate-catalog`) over hand-maintaining it in the skill.
   - Guard `references/catalog.md` against wholesale ingestion: it is ~8k tokens today and grows by roughly the full `composition` payload across all items (~32 KB → ~56 KB) after Phase 2. Strengthen its header and the SKILL.md fast-discovery-map wording to "per-item lookup only; use `catalog --json` / `inspect <item> --json` first" so agents don't burn context reading it end-to-end.

### Phase 5 — Tests, examples, gates, rollout

See Test strategy and Rollout below.

## Files/modules likely to change (consolidated)

- CSS/registry: `registry/utilities/layout/layout.css`, `registry/components/card/card.css`, `registry/core/base/slide.css`, `registry/core/base/registry-item.json` (density values, enriched `cssVariables`, `--ls-accent-2`), `registry/templates/three-cards/*`, `registry/templates/title-hero/snippet.html` (explicit `--fill`), new `registry/components/icon-item/*`, `registry/templates/icon-grid/*`, `registry/templates/feature-rows/*`, touched `registry-item.json` + READMEs across templates/components, `registry.json` index.
- Source: `src/validation/design-lint.mjs` (new), `src/validation/visual-rhythm.mjs` (extend, possibly split out `visual-metrics.mjs`), `src/validation/registry.mjs`, `src/registry/source.mjs`, `src/registry/catalog-doc.mjs`, `src/cli/validation-commands.mjs`, `src/cli/deck-commands.mjs`, `src/cli/preview-command.mjs` (slideLinks), `src/cli/visual-qa-command.mjs` (new), `src/cli/commands.mjs`, `src/cli/option-specs.mjs`, `src/cli/text-output.mjs`, `src/cli/agent-instructions.mjs`, `scripts/visual-qa-report.mjs`.
- Schema/docs: `schemas/registry-item.schema.json`, `docs/registry-contract.md`, `docs/validation.md`, `docs/cli.md`, `docs/agent-workflow.md`, `docs/primitive-authoring.md`, root `README.md`.
- Skill: `skills/create-slides-with-slidesls/SKILL.md`, `references/preview-validation.md`, `references/deck-authoring.md`, regenerated `references/catalog.md`.
- Tests/gates: new `tests/design-lint.test.mjs`, extended `tests/visual-rhythm.test.mjs`, `tests/catalog-doc.test.mjs`, `tests/registry-resolution.test.mjs`, `tests/cli-output.test.mjs`, `tests/skill-command.test.mjs`, smoke additions in `scripts/test-cli-smoke.mjs`, new `scripts/visual-gate.mjs`, new/updated `examples/composition/`.

## Backwards compatibility

- **Generated decks are unaffected at render time**: registry assets are copied at init/add; published decks keep their CSS. Changes apply to newly copied assets only.
- **`validate` against old decks is not unaffected** — new lint warnings fire on old markup patterns whose copied CSS lacks the new classes. Mitigation is the version-aware hint mechanism (Phase 3a): the manifest `cliVersion` gates hint wording so remediation always starts from a step the deck can actually take (re-copy `utilities/layout`), never from a class it doesn't have.
- **`.ls-grid` default change** alters visual output for _newly generated_ decks relative to 0.4.x and for repo `examples/`. Mitigations: `.ls-grid--fill`/`--start` escape hatches; all bundled templates/examples audited and updated in the same change; CHANGELOG "Breaking" entry (0.4.0 set the precedent); the static lint + visual-qa flag legacy patterns when old decks are re-validated.
- **Metadata additions are additive**; schema already permits unknown fields; older CLIs reading newer registry items ignore `composition` (spread-then-project architecture).
- **New warnings are advisory** and never flip `valid` to false; existing CI/agent loops keyed on exit codes keep passing. Design-lint codes are excluded from `--strict` promotion (documented carve-out). `data-ls-lint` suppression always wins.
- `scripts/visual-qa-report.mjs` CLI surface kept as a delegate to the new command.

## Test strategy

1. **Unit tests** (`node --test`):
   - `design-lint.test.mjs`: fixtures per code — 6 sparse cards in `--3` grid (fires `many_cards_in_grid`), `--fill` grid with cards (fires `stretched_grid_with_cards`), icon-anchored grid (does not fire `card_grid_check_density`), `data-ls-lint="off"` suppression, old-manifest `cliVersion` producing migration-prefixed hints, boundary counts.
   - `visual-rhythm.test.mjs` extensions: fixtures for `card_low_fill`, `body_text_small`, `equal_cards_sparse`; per-slide output shape (`inspect`, `deepLink`); existing rhythm tests keep passing.
   - `registry-resolution.test.mjs`/`catalog-doc.test.mjs`: `composition` plumbed to brief/rich projections; integrity checks (bad `alternatives[].use`, bad item token in a guidance string, `avoidWhen` without README section) fail `validate-registry`; catalog.md rendering includes Composition blocks.
   - `cli-output.test.mjs`/`skill-command.test.mjs`: `visual-qa` help/JSON shapes; `preview --json` `slideLinks`; option-spec sweep covers new flags.
2. **Committed geometry fixtures**: real collected `--eval` JSON for the `examples/composition/` decks (captured once via agent-browser, committed under `tests/fixtures/`) drive analyzer unit tests — the analyzer is tested against _real_ geometry, not only synthetic shapes. Documented caveat: committed fixtures go stale when CSS changes; the visual gate below is what re-measures.
3. **Scripted visual gate (`scripts/visual-gate.mjs`)** — the automated check on the _rendered_ fix, honest about its dependency: when `agent-browser` is available it starts `preview` over `examples/composition/` (sparse 3-card, 6-item icon-grid, feature-rows, spacious-density, and an intentional `--fill` diagram deck), runs the eval collector live, and asserts thresholds (no `card_low_fill`, no `body_text_small`, fill ratios within committed ranges) — failing loudly on regression; when no browser is available it skips with a visible notice. Wired into `pack:check` (release path) and runnable standalone; deliberately not in default `pnpm check` to keep base CI dependency-free. This is the acceptance gate: a future `layout.css` edit that reintroduces stretch fails the release check, not just a manual review.
4. **Regression case (eve)**: rebuild the eve "Composable files" (6 sparse cards) and "repeated plumbing" (3 sparse cards) slides as fixtures; assert `validate` flags the 0.3-style markup (`many_cards_in_grid` / `card_grid_check_density`), `visual-qa --analyze` on captured geometry fires `equal_cards_sparse`/`card_low_fill` for the old CSS, and the recommended `icon-grid`/`feature-rows` rewrites are clean end-to-end.
5. **Repo gates** stay green: `pnpm check` (lint, fmt, tests, `validate-registry`, `generate-catalog --check`, `validate-examples`, CLI smoke); `generate-catalog --check` enforces catalog regeneration after metadata edits.

## Rollout plan

1. Phase 1 + Phase 2 land together (CSS defaults + metadata + template updates + catalog regeneration) — one coherent story for new decks. The `.ls-grid` default decision is made here (centered content-sized rows), not deferred.
2. Phase 3a (static structural lint) next; its hints use Phase 1/2 vocabulary and version-aware wording.
3. Phase 3b (`visual-qa` command + metric extensions + calibration + geometry fixtures + visual gate), then Phase 4 (skill/docs rewrite pointing at everything).
4. Release as **0.5.0** with a "Breaking" changelog entry for the grid default, following the 0.4.0 changelog format; update npm README; regenerate `references/catalog.md`.
5. Post-release validation: rerun the original eve prompt end-to-end with a fresh agent against 0.5.0 and compare per-slide screenshots against the 0.3.0 deck — the concrete acceptance test for "did the tool push the agent right".

## Risks, edge cases, mitigations

- **Grid default change breaks an intentional stretch layout** not caught by the audit → per-template screenshot audit, `--fill`/`--start` escape hatches, visual gate over an intentional-`--fill` example, pre-1.0 versioning.
- **Centered-by-default grids fight the header-rhythm checks** (`visual-rhythm` measures header offsets; content position now varies) → rhythm checks target the header block, which is unaffected (`auto` row); verify via existing rhythm tests over the updated examples; adjust `MAX_CONTENT_HEADER_RATIO` only if calibration shows drift.
- **Lint false positives annoy agents into ignoring warnings** → structural-only static checks (low-FP by design), advisory severity, per-slide suppression, calibrated browser-side thresholds, hints that always name a concrete next step.
- **Five surfaces of guidance drift apart** (CSS defaults, metadata, lint constants, READMEs, skill) → integrity checks tie metadata↔READMEs and metadata↔item names; catalog is generated; lint hints reference metadata vocabulary; remaining prose duplication is bounded to the skill decision table and called out for review when metadata changes.
- **Per-slide screenshots increase QA cost** → bounded guidance (all slides ≤ ~15; flagged + representative beyond); `visual-qa` per-slide findings prioritize which slides need attention.
- **Skill grows and agents skim** → SKILL.md gets the decision table + pointers only; depth stays in references (existing skill-first structure).

## Open questions / decisions for the maintainer

1. Naming: `slidesls visual-qa` vs `slidesls qa`; `composition` vs `designGuidance`; final names for `icon-grid` / `feature-rows` / `icon-item`. (Integrity checks land before guidance prose, so renames stay cheap.)
2. Does the spacious density change type sizes only, or also `--ls-grid-gap`/paddings? Plan assumes both, mirroring `compact`.
3. Is `card_grid_check_density` (the static "pointer" warning) too chatty for decks that legitimately use 3 text cards? Option: fire only when ≥4 cards or no `data-ls-density` — tune during calibration; could ship disabled-by-default behind later evidence.
4. Should the visual gate eventually move into default `pnpm check` once agent-browser availability in CI is settled? (Plan keeps it release-path-only for now.)
5. Whether `.ls-stack` default should also become configurable-center in slide-body position, or stay `start`-anchored (plan assumes `start` + variable override; revisit if the audit shows centered stacks are the common want).
6. Tokenize card typography while touching `slide.css`/`card.css`? `--ls-card-title-size`/`--ls-card-text-size` today exist only as magic `var()` fallbacks (28px/21px in `card.css:27,35`), set at `:root` nowhere and assigned only under `compact`; component body sizes are ad hoc across the scale (card 21 / callout 22 / metric label 22 / panel 30). Spacious density stacks a third override layer on this untokenized base if skipped. Small scope-add, high coherence payoff.
7. Fix theme accent/status collisions in the same release? `playful-ink` `--ls-accent` equals `--ls-status-danger` (`#ff7a90`, `playful-ink/theme.css:22,34`) and `boardroom-navy` `--ls-accent-2` equals `--ls-status-warning` (`#d8bf7c`) — danger/warning elements are indistinguishable from accent elements in those themes.

## Review notes (Claude Opus 4.8 critique, incorporated)

- **Accepted (High):** the rendered fix needed an automated gate → committed geometry fixtures + scripted release-path visual gate (`scripts/visual-gate.mjs`); testing only lint/plumbing would have shipped the composition fix on faith.
- **Accepted (High):** `start`-default vs `center`-recommended incoherence → default is now `center`; decision made in-plan instead of deferred to an open question that blocked Phase 1.
- **Accepted (High):** static word-count/font-size lint overreached what a flat regex tag scanner can do → static lint reduced to structural counts; all measurement moved to the browser-fact path.
- **Accepted (Med):** guidance-string drift → item-token integrity scan across all composition/usage strings; README↔metadata pairing check.
- **Accepted (Med):** lint hints referenced classes old decks don't have → manifest `cliVersion`-aware hint wording.
- **Accepted (Med):** per-slide inspection was prose-only enforcement → machine-readable per-slide findings + `preview --json` deep links; skill instructs from tool output, not memory.
- **Accepted (Med):** uncalibrated thresholds → explicit canvas-math derivation + calibration step against eve deck, bundled snippets, and examples.
- **Accepted (Low/Med):** `.ls-stack` latent stretch; `data-ls-lint` plumbing spec; `card_low_fill` right-sized as a backstop.

## Review notes (second pass — full codebase audit, Claude Fable 5, 2026-07-03)

Audit covered: skill/docs token budget (all references measured), CLI output surfaces (real command runs, byte-measured), and every registry CSS file / template snippet. Corrections and additions incorporated above:

- **Corrected (High):** Phase 1 template audit — `title-hero` (the only true fill-intent grid, `ls-slide-fill`) was missing entirely; `split` was mislabeled as using panel `--frame` (it uses `--center`, which has no min height and _will_ shrink under the new default); `technical-walkthrough` was wrongly listed as a stack case (no `.ls-stack` in its snippet); `metric-dashboard` metric cells still top-pin even under `--fill` (row equalizes to tallest cell + `metric.css:5` `align-content: start`).
- **Corrected (Med):** `data-ls-density="spacious"` already half-exists (`progress.css:76`, `divider.css:43`) but is absent from the slide shell and the `core/base` metadata allowlist; Phase 1.3 now reconciles the half-migrated state instead of adding the variant fresh.
- **Added (High):** Phase 2.6 customization-boundary metadata — `cssVariables` enriched with defaults + override-safety flag, missing `--ls-accent-2` added, so fine-tuning boundaries are discoverable from `catalog`/`inspect` (where agents decide), not only from the Phase 4 prose recipe. Today the vars are bare names and the skill's customization guidance is prohibitions only.
- **Added (High):** Phase 4.6 documentation deduplication — the QA recipe exists in 4 files, the workflow in 3, with live drift already (SKILL.md lists 4 of 5 themes; `clean-light` missing); SKILL.md becomes a router; catalog.md gets an anti-wholesale-ingestion guard (it grows ~32 KB → ~56 KB with Composition blocks).
- **Added (Med):** Phase 3b preview-loop closure — `preview` had no `nextCommands` (the QA cycle's entry point was a guidance dead-end) and its text output drops the agent-guidance block; plus validate hint deduplication (identical hint strings repeated per finding) before new advisory codes multiply the pattern.
- **Added (Low):** stretch-goal lint `deck_css_overrides_registry_selector` for unlayered `.ls-*` selector overrides (the one unguarded customization hole); open questions 6–7 for card-size tokenization and theme accent/status color collisions.
- **Measured (context for Phase 2 sizing):** brief `catalog --json` ≈ 10.4 KB / 40 items; `avoidWhen`-only-in-brief keeps growth ≈ +15%; full `composition` in default `inspect` ≈ +19% per item; `catalog --api --json` ≈ 47 KB → ~71 KB. The brief/rich split holds — the largest growth lands in the generated reference doc, not the hot JSON path.
