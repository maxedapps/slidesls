# Tackle All Review Findings for slidesls

## Summary

Implement a comprehensive hardening plan for `slidesls` that covers **both** sources of findings:

1. The current deep audit report from this conversation (CLI/validation/docs/agent UX/runtime/style gaps).
2. The repository-tracked primitive/layout audit in `FINDINGS.md`.

Important note: several `FINDINGS.md` issues appear already fixed in the current codebase (for example `title-hero` now uses `ls-slide-fill`, progress snippets now include track/bar, timeline snippets now use marker/body, quote snippets now use quote element classes, and example validation is recursive). The plan therefore does not blindly reimplement stale findings; it requires an explicit closeout pass that verifies each finding, preserves or adds regression coverage, updates stale tracking docs, and implements any still-open gap.

The work must preserve the project constraints from `PROJECT.md`:

- Generated decks remain plain editable HTML/CSS/JS.
- The npm package is an authoring tool, not a runtime dependency.
- No mandatory framework, bundler, Tailwind, or heavy browser dependency for generated decks.
- Registry assets remain copyable and editable.
- Agent workflows remain deterministic and JSON-first.

## Clarifications and assumptions

No blocking clarification is needed.

Assumptions:

1. “All findings” means concrete bugs, stale/unverified findings, validation gaps, docs/skill gaps, maintainability concerns, and missing pieces identified in both the chat report and `FINDINGS.md`.
2. Fixes should be shipped incrementally; do not combine every phase into one giant diff.
3. Browser/snapshot workflows may be improved only as optional authoring workflows.
4. Existing decks should not start failing except for unsafe paths, invalid required shell, or explicit `--strict` checks.
5. If a `FINDINGS.md` item is already fixed, the implementation task is to verify, add/confirm regression coverage, and update the tracking document.

## Claude review incorporated

The draft plan was reviewed with `claude -p --model claude-opus-4-8 --effort high`. Key accepted feedback:

- Add explicit traceability against `FINDINGS.md` instead of only covering the chat report.
- Front-load primitive/snippet correctness and visual-regression safeguards.
- Do not add large product-expansion items before current defects are closed.
- Treat `npx slidesls` as a high-priority docs/supply-chain issue.
- Avoid making `validate` network-dependent by default when manifests point to remote registries.
- Keep command refactor either first or last; choose last to avoid mixing refactor with fixes.
- Add real browser/DOM visual QA for runtime/style changes where static assertions are insufficient.

## Current codebase notes relevant to stale findings

Observed current-state fixes that must be preserved with tests/docs:

- `registry/templates/title-hero/snippet.html` uses `ls-slide-fill`.
- `registry/templates/section-divider/snippet.html` uses `ls-slide-fill`.
- `registry/utilities/layout/layout.css` defines `.ls-slide-fill`.
- `registry/components/progress/snippets/basic.html` includes `ls-progress__track` and `ls-progress__bar`.
- `registry/templates/metric-dashboard/snippet.html` includes a proper progress track/bar.
- `registry/components/timeline/snippets/basic.html` uses `ls-timeline__marker` and `ls-timeline__body`.
- `registry/components/quote/snippets/basic.html` uses `ls-quote__text`, `ls-quote__source`, and `cite`.
- `src/validation/examples.mjs` recursively collects example HTML files.
- `registry/components/callout/callout.css` currently does not use `:has()`.
- `registry/utilities/layout/layout.css` currently does not contain inactive `@container` rules.
- `registry/components/image-card/snippets/basic.html` currently does not use `.ls-panel`.

These need regression tests / tracking closeout rather than duplicate fixes.

## Finding traceability matrix

### `FINDINGS.md` primitive/layout audit

| #   | Finding summary                                        | Current likely status                   | Plan action                                                      |
| --- | ------------------------------------------------------ | --------------------------------------- | ---------------------------------------------------------------- |
| 1   | `title-hero` / `.ls-fill` centering broken             | likely fixed via `ls-slide-fill`        | Phase 1 verify + add regression + update docs/tracker            |
| 2   | `.ls-fill` underspecified                              | partially open                          | Phase 1 document contexts; prefer `ls-slide-fill`; validate/docs |
| 3   | inactive layout `@container` rules                     | likely fixed/removed                    | Phase 1 verify absence; add CSS contract test if relevant        |
| 4   | fixed large typography / no density                    | open                                    | Phase 6 density/content-budget support                           |
| 5   | competing slide composition models                     | open/partially mitigated                | Phase 1/6 clarify shell models + metadata/docs                   |
| 6   | component snippets omit canonical wrappers             | mostly fixed for known snippets         | Phase 2 snippet-contract tests for all components                |
| 7   | callout `:has()` undocumented                          | likely stale                            | Phase 2 verify; docs if reintroduced                             |
| 8   | fixed optimistic component text sizing                 | open                                    | Phase 6 component density vars/metadata                          |
| 9   | panel visual-frame/center behavior                     | partially fixed via variants            | Phase 1/6 verify variants/docs/examples                          |
| 10  | code blocks scroll silently                            | partially covered by large-code warning | Phase 6 add stronger docs/validation/dense examples              |
| 11  | image-card undeclared panel dependency                 | likely fixed                            | Phase 2 dependency-closure regression                            |
| 12  | inconsistent container-query support                   | likely stale except metrics             | Phase 1 verify; registry CSS contract test                       |
| 13  | divider docs mention animation                         | open until verified                     | Phase 4 docs cleanup                                             |
| 14  | progress basic snippet no bar                          | fixed in current snippet                | Phase 2 regression + update tracker                              |
| 15  | progress docs unsupported `comfortable`                | verify/open                             | Phase 3 docs/metadata alignment                                  |
| 16  | progress docs unsupported `accent`                     | verify/open                             | Phase 3 docs/metadata alignment                                  |
| 17  | quote snippet lacks styled classes                     | fixed                                   | Phase 2 regression + update tracker                              |
| 18  | quote `:has(cite)` / cite mismatch                     | likely fixed snippet; verify CSS        | Phase 2/4 verify docs                                            |
| 19  | timeline snippet/CSS broken                            | fixed canonical snippet                 | Phase 2 structural validation + visual regression                |
| 20  | timeline progress markerless issue                     | open if markerless allowed              | Phase 2 decide unsupported vs supported; validate/docs           |
| 21  | table frame empty/clipping behavior                    | open                                    | Phase 3 table frame/layout fix + examples                        |
| 22  | animation transform variants conflict                  | partially covered by validation         | Phase 3/5 strengthen validation/docs/snippets                    |
| 23  | highlight reveal future content visible                | partially covered by validation warning | Phase 5 enforce docs/snippet/validation                          |
| 24  | generic animation README text                          | open                                    | Phase 4 docs cleanup                                             |
| 25  | font preset scope mismatch                             | open                                    | Phase 4 docs/metadata/schema alignment                           |
| 26  | serif preset overflow risk                             | open                                    | Phase 6 serif-safe/density guidance/tokens                       |
| 27  | themes not density systems                             | design decision open                    | Phase 6 density presets separate from themes                     |
| 28  | custom gradients against themes                        | docs/skill guidance open                | Phase 4 skill/docs guidance                                      |
| 29  | title/section templates broken `ls-fill`               | fixed                                   | Phase 1 regression + tracker update                              |
| 30  | dashboard broken progress                              | fixed                                   | Phase 2 regression + tracker update                              |
| 31  | templates only short happy-path copy                   | open                                    | Phase 6 stress examples + content budgets                        |
| 32  | template metadata lacks constraints/budgets            | open                                    | Phase 6 metadata usage/structural guidance                       |
| 33  | templates rely on inline alignment styles              | likely fixed via utilities              | Phase 1 verify no critical inline alignment; docs                |
| 34  | metric dashboard double padding                        | open/needs design                       | Phase 3/6 adjust template or metric variant                      |
| 35  | examples repeat broken full-slide pattern              | likely fixed partly                     | Phase 1 recursively verify examples + visual regression          |
| 36  | examples under-test overflow                           | open                                    | Phase 6 realistic stress examples                                |
| 37  | template gallery broken progress                       | likely fixed? verify                    | Phase 2 update gallery + regression                              |
| 38  | `.ls-grid--4` fragile for real copy                    | open                                    | Phase 6 compact card/grid recipe + guidance                      |
| 39  | metadata cannot express child structure                | open                                    | Phase 2 minimal structural contracts                             |
| 40  | registry validation misses canonical snippet classes   | open                                    | Phase 2 snippet-contract validation                              |
| 41  | nested theme-gallery pages not validated               | fixed recursively                       | Phase 2 regression + tracker update                              |
| 42  | preview/screenshot not enforced                        | open                                    | Phase 7 stronger skill/optional visual QA                        |
| 43  | catalog says snippets are source-of-truth while unsafe | open until all snippets verified        | Phase 2 then regenerate catalog                                  |
| 44  | snippets use undeclared deps                           | likely fixed for listed cases           | Phase 2 dependency closure regression                            |

### Chat audit findings

| Finding                                                             | Plan action                                       |
| ------------------------------------------------------------------- | ------------------------------------------------- |
| `add` can mark item present even when CSS/JS not loaded             | Phase 8 load-tag validation                       |
| Progress `data-ls-animate="fill"` hides forever without `data-step` | Phase 3 progress behavior fix                     |
| Reveal variants can be used without `.ls-reveal`                    | Phase 5 validation/docs/snippets                  |
| `validate` always uses bundled registry                             | Phase 9 deterministic registry-source handling    |
| README `npx slidesls` quickstart issue                              | Phase 4 immediate docs fix                        |
| Schemas too weak                                                    | Phase 10 schema tightening                        |
| Table frame clips/empty space risk                                  | Phase 3 table fix                                 |
| Missing validation for `srcset`, `poster`, CSS `url(...)`           | Phase 8 asset validation                          |
| Regex false positives in validation                                 | Phase 8 parser/helper hardening                   |
| Accessibility guidance/checks thin                                  | Phase 11 accessibility validation/guidance        |
| Visual QA optional but not strongly enforced                        | Phase 7 optional visual QA workflow               |
| Runtime hash/deep-link missing                                      | Deferred Phase 15 separate feature after defects  |
| Light/print themes missing                                          | Deferred Phase 16 product expansion after defects |
| Technical primitives missing                                        | Deferred Phase 17 product expansion after defects |
| `commands.mjs` monolith                                             | Final Phase 18 behavior-preserving refactor       |
| Metadata-driven class truth can drift                               | Phase 2 and Phase 10/12 registry validation       |
| Config-root ambiguity                                               | Phase 13 CLI UX warnings/JSON fields              |
| Remote registry determinism                                         | Phase 9 opt-in/no-network-by-default validation   |
| Preview server hardening                                            | Phase 14                                          |

## Implementation strategy

Work in ship-ready tracks:

1. **Track A — Close primitive/snippet defects and stale `FINDINGS.md` items**: Phases 1–6.
2. **Track B — Strengthen validation and agent workflow**: Phases 7–14.
3. **Track C — Optional/product expansion**: Phases 15–17, only after A/B are stable.
4. **Track D — Maintainability refactor**: Phase 18, last, behavior-preserving.

This prioritizes current breakage and trust in snippets before infrastructure and product expansion.

## Alternatives considered

### Big refactor first

Rejected. The test suite is good, but behavior changes are more important and `commands.mjs` refactor would create churn before the defects are closed. Refactor last.

### Full parser dependencies immediately

Partially rejected. Avoid mandatory runtime/deck dependencies, but dev-only validation dependencies may be acceptable. Start with targeted helpers for current checks; if CSS/HTML parsing grows brittle, add dev/runtime CLI dependency deliberately. The project constraint forbids generated-deck runtime dependencies, not necessarily CLI dev dependencies.

### Auto-edit HTML in `slidesls add`

Rejected as default because `PROJECT.md` says `add` copies assets and does not mutate HTML. Prefer validation that detects missing tags. Consider an explicit future `apply-tags` command only after validation is reliable.

### Implement product expansion in same pass as fixes

Rejected. Light themes, print presets, hash navigation, and technical primitives are valuable but must not delay fixing current registry/validation trust issues.

## Phase 1 — Reconcile and close full-slide/layout findings

### Goals

- Close `FINDINGS.md` 1, 2, 3, 5, 9, 29, 33, 35 where already fixed or still open.
- Preserve the fixed `ls-slide-fill` model.
- Make composition models explicit for agents.

### Tasks

1. Audit current layout/template/example usage:
   - Search for direct `.ls-slide__inner > ... ls-fill` full-slide patterns.
   - Search for important inline alignment styles in templates/examples.
   - Search for inactive `@container` rules in layout utilities.
2. If any old pattern remains:
   - Replace with `.ls-slide-fill` for full-slide direct children.
   - Use `.ls-slide__header` + `.ls-slide__body` for header/body templates.
   - Keep `.ls-fill` for generic definite-size contexts only.
3. Update docs and metadata:
   - `registry/utilities/layout/README.md`
   - `registry/utilities/layout/registry-item.json`
   - `docs/deck-contract.md`
   - `docs/primitive-authoring.md`
   - skill `deck-authoring.md`
4. Clarify utility contract:
   - `.ls-slide-fill`: direct child of `.ls-slide__inner`, spans full shell.
   - `.ls-fill`: generic fill only when parent has definite block size.
   - `.ls-slide__header`/`.ls-slide__body`: canonical header/body model.
5. Add regression tests:
   - Existing test `full-slide registry templates use ls-slide-fill...` should remain.
   - Add examples/templates check that direct `ls-fill` full-slide pattern is absent.
   - Add generated catalog check includes `ls-slide-fill` guidance.
6. Update `FINDINGS.md` with status markers or replace stale entries with a “resolved in current tree / regression covered” note.

### Verification

- `pnpm validate:registry`
- `pnpm validate:examples`
- Browser screenshot for title-hero and section-divider at 1600×900 and `?export=1`.

## Phase 2 — Make snippets canonical, self-contained, and structurally validated

### Goals

Close `FINDINGS.md` 6, 7, 11, 12, 14, 17, 18, 19, 20, 30, 37, 39, 40, 41, 43, 44.

### Tasks

1. Audit every snippet:
   - `registry/components/*/snippets/*.html`
   - `registry/utilities/*/snippets/*.html`
   - `registry/animations/*/snippets/*.html`
   - `registry/templates/*/snippet.html`
2. Enforce dependency closure:
   - Existing `validateRegistryAuthoringCoverage` already catches undeclared snippet dependency; confirm current cases (`utilities/layout`, `image-card`) stay fixed.
   - Add tests with real current items to avoid regressions.
3. Add minimal structural metadata or rule definitions for high-risk components:
   - progress: track/bar required for custom progress, or native `<progress>` allowed.
   - timeline: each item requires marker + body unless explicitly supporting markerless mode.
   - quote: text/source classes required.
   - callout/card: canonical body wrappers recommended; decide whether raw shorthand is supported.
4. Extend `validateSnippetStructure()`:
   - Validate official snippets use canonical classes for progress/timeline/quote.
   - Add markerless timeline warning/error unless CSS explicitly supports it.
   - Add dashboard template progress validation.
5. Add a registry-wide snippet contract test:
   - Every `agentRecommended` component/utility/template has at least one snippet unless intentionally exempted.
   - Every snippet’s `ls-*` classes are known and dependency-closed.
   - Every high-risk component snippet passes structural rules.
6. Add browser/DOM smoke gallery for snippets/templates:
   - If using existing `agent-browser`, document and run manually.
   - For CI, keep static tests unless optional browser tooling is approved.
7. Regenerate skill catalog after snippet/metadata changes.
8. Update `FINDINGS.md` status for stale fixed items.

### Verification

- `pnpm validate:registry`
- `pnpm validate:skills`
- `pnpm validate:examples`
- Browser QA: template gallery, progress, timeline, quote.

## Phase 3 — Fix still-open component/style behavior bugs

### Goals

Address open style bugs from both audits:

- table frame clipping / misleading empty space;
- progress `data-ls-animate="fill"` hidden forever;
- progress docs/metadata tone+density drift;
- metric dashboard double padding if current template still overboxes;
- code block scroll guidance.

### Tasks

#### Progress behavior

1. Update `registry/components/progress/progress.css` so animated progress without `data-step` fills when its slide becomes active:
   - Add a ready active-slide selector with `:not([data-step])`.
   - Preserve reveal-timed fill when `data-step` is present.
   - Preserve export mode and reduced-motion behavior.
2. Align docs/metadata:
   - `data-ls-density`: either only `compact|spacious`, or add explicit `comfortable` no-op consistently.
   - `data-ls-tone`: either document default accent only, or add explicit `accent` support consistently.
3. Add tests for CSS contract and validation behavior.

#### Table frame

1. Update `.ls-table-frame`:
   - Prefer `overflow: auto` over `hidden`, or introduce a `data-ls-overflow="clip|scroll"` contract.
   - Avoid direct full-height stretching in template usage unless intended.
2. Update table snippets/docs with recommended wrapper behavior.
3. Add a table example with wider content.

#### Metric/dashboard spacing

1. Review `metric-dashboard` current layout.
2. If metrics are inside panels unnecessarily, simplify:
   - use standalone `.ls-metric` cards in grid;
   - use `.ls-panel` only for grouped progress/status.
3. Add metadata guidance about nesting metrics.

#### Code blocks

1. Keep scrollability available but warn strongly:
   - Code should fit visible slide area.
   - Use `data-ls-density="dense"` and shorter excerpts.
2. Strengthen large-code validation thresholds if needed.
3. Add docs for export/PDF limitation of scrollable blocks.

### Verification

- `pnpm test`
- Browser QA for progress animation, table frame, metric dashboard, code slide.

## Phase 4 — Documentation, README, skill, and metadata cleanup

### Goals

Address docs issues early, including the `npx slidesls` supply-chain/incorrect-package risk.

### Tasks

1. Fix README quickstart:
   - Replace unscoped `npx slidesls ...` with `npx -y @maxedapps/slidesls@latest ...`, or explicitly install the package first.
2. Clean stale/generic docs:
   - divider README animation sentence;
   - animation README load-order language;
   - font preset scope mismatch (`html`, `body`, `section` if all are supported);
   - theme guidance against heavy custom backgrounds after selecting a theme;
   - callout/quote `:has()` support notes only if relevant.
3. Update skill workflow:
   - Stronger “preview/screenshot unless user opts out” language.
   - Load-tag validation guidance.
   - Accessibility checklist.
   - Theme authority / avoid decorative inline backgrounds.
4. Update generated catalog after metadata changes.
5. Add doc tests for removed stale command examples and unscoped `npx slidesls` in install-from-npm sections.

### Verification

- `pnpm validate:skills`
- `pnpm test`
- Manual grep for `npx slidesls` and stale terms (`comfortable`, `accent`, etc.) where unsupported.

## Phase 5 — Animation contract hardening

### Goals

Address `FINDINGS.md` 22, 23, 24 and chat reveal-variant findings.

### Tasks

1. Add snippets for recommended variant items:
   - `animations/fade`
   - `animations/slide-up`
   - `animations/scale-in`
2. Add validation rules:
   - multiple transform/fade variants on one element => existing warning/strict error;
   - variant class without `.ls-reveal` => warning/strict error;
   - `.ls-reveal-highlight` without `.ls-reveal` => existing warning/strict error, ensure docs align.
3. Decide highlight naming/semantics:
   - Keep `.ls-highlight` for static emphasis.
   - Require `.ls-reveal.ls-reveal-highlight` for timed highlight.
   - Do not make highlight itself hide content unless intentionally changing semantics.
4. Standardize animation READMEs around:
   - base reveal first;
   - exactly one transform variant;
   - highlight requires `.ls-reveal` for timing.

### Tests

- Validate warnings for variant without reveal.
- Inspect each animation item returns snippet.
- Registry validation catches incompatible official snippets.

## Phase 6 — Density, content budgets, and realistic stress examples

### Goals

Address `FINDINGS.md` 4, 8, 10, 26, 27, 31, 32, 36, 38 and style/visual-fit gaps.

### Tasks

1. Define official density model:
   - Keep existing `section.ls-slide[data-ls-density="compact"]`.
   - Consider adding `data-ls-density="dense"` or `comfortable` only if distinct from default.
   - Expose density guidance in core metadata.
2. Add component-level density variables/attributes where useful:
   - cards;
   - panels;
   - callouts;
   - tables;
   - timelines;
   - code blocks.
3. Add content-budget guidance to template metadata:
   - recommended max title lines;
   - recommended card count and copy length;
   - table/timeline/code warnings.
4. Serif-safe guidance:
   - Update editorial-serif preset docs.
   - Consider conservative token tweaks for serif display if visual QA supports it.
5. Add stress examples:
   - longer title hero;
   - three/four cards with realistic technical copy;
   - timeline with longer labels;
   - table with wider columns;
   - code block with dense mode;
   - serif title slide.
6. Ensure visual QA covers stress examples.

### Tests

- Example validation includes stress examples.
- Large code block warning still works.
- No unknown classes from new density attributes/classes.

## Phase 7 — Enforce/enable visual QA without mandatory browser dependency

### Goals

Address `FINDINGS.md` 42 and chat visual QA gaps.

### Tasks

1. Strengthen skill and docs:
   - After creating or materially editing slides, preview and inspect representative slides unless user opts out.
   - Require actual screenshot inspection for agents, not just screenshot capture.
2. Improve preview JSON:
   - Add `exportUrl` alongside `url`.
   - Include `agentInstructions.longRunningCommands` if missing.
3. Add a documented visual QA checklist:
   - title/section centering;
   - densest content;
   - timeline/table/progress/code slides;
   - normal mode reveal steps;
   - export mode.
4. Optional future command only after approval:
   - `slidesls snapshot` with dynamic external tool detection, no mandatory dependency.

### Tests

- Preview JSON includes `exportUrl`.
- CLI help/docs mention visual QA workflow.

## Phase 8 — Validation hardening for load tags, assets, and false positives

### Goals

Address chat audit validation gaps.

### Tasks

#### Load tags

1. Add HTML helpers for stylesheet/script extraction.
2. Derive expected load tags from registry items + manifest baseDir.
3. Warn when:
   - item class is used and item is copied but expected CSS/JS is not loaded;
   - item CSS/JS is loaded but manifest lacks the item, where mapping is clear.
4. Keep `add` copy-only.

#### Assets

1. Extend local asset validation to:
   - `poster`;
   - `srcset` candidates;
   - inline `style url(...)`;
   - local stylesheet `url(...)` references.
2. Keep external/data/blob URLs ignored.
3. Preserve encoded traversal protection.

#### False positives

1. Replace raw removed-layout regex with parsed class-token checks.
2. Strip/ignore `<code>`, `<pre>`, `<script>`, and `<style>` for text-based class warnings.
3. Add targeted tests for escaped examples.

### Tests

- Copied-but-unloaded component warning.
- `srcset`, `poster`, CSS URL missing asset errors.
- Code example containing old `ls-layout-*` does not error.
- Minimal initialized deck remains warning-free.

## Phase 9 — Registry source handling for validation without nondeterministic default network I/O

### Goals

Fix bundled-registry-only validation while preserving deterministic agent workflows.

### Chosen behavior

- `validate` uses bundled/local registry by default.
- Explicit `--registry-root` / `--registry-url` overrides.
- If manifest references a local registry root that exists, validation may use it or report it clearly.
- If manifest references a remote registry, do **not** fetch by default unless explicit `--registry-url` or `--use-manifest-registry` is provided.

### Tasks

1. Add validation source reporting:
   - `registrySourceUsed`;
   - `registrySourceHint` if manifest differs.
2. Add explicit flags if needed:
   - `--registry-root`;
   - `--registry-url`;
   - optional `--use-manifest-registry`.
3. Avoid surprise network calls in normal `slidesls validate`.
4. Add docs explaining deterministic default.

### Tests

- Explicit custom registry is honored.
- Remote manifest does not trigger network fetch by default.
- Explicit remote URL timeout remains bounded.

## Phase 10 — Schema and metadata contract tightening

### Goals

Address schema drift and metadata limitations without overfitting.

### Tasks

1. Tighten `schemas/slidesls.schema.json`:
   - safe relative path patterns;
   - descriptions/defaults;
   - no unnecessary required fields if runtime defaults are intended.
2. Tighten `schemas/manifest.schema.json`:
   - typed `registrySource`;
   - typed `copiedFiles[]`;
   - explicit optional `skipped`.
3. Tighten `schemas/registry-item.schema.json`:
   - add `tags`, `useCases`, `title`, `styleTone`, `pairsWith`, `themeAttribute`;
   - add optional structural metadata if Phase 2 introduces it.
4. Decide validation mechanism:
   - Prefer existing hand-written runtime checks for package minimalism.
   - If schema validation grows, add `ajv` as a CLI/dev dependency only after approval.
5. Ensure `init` copies updated schemas.

### Tests

- Existing registry validates.
- Init copies schemas.
- Manifest shape tests.

## Phase 11 — Accessibility validation and guidance

### Goals

Add lightweight, agent-friendly a11y checks.

### Tasks

1. Add `src/validation/accessibility.mjs` warning-first checks:
   - images require `alt` unless decorative;
   - slides need `aria-label`, `aria-labelledby`, or a clear heading;
   - duplicate slide labels warn;
   - deck should have accessible label;
   - icon-only controls require accessible names.
2. Integrate with `validate`; strict mode escalates where appropriate.
3. Update templates/examples if warnings appear.
4. Add skill/docs checklist.

### Tests

- Missing image alt warns.
- Decorative alt accepted.
- Slide heading accepted.
- Duplicate labels warn.
- Minimal deck remains clean.

## Phase 12 — Registry metadata/class truth hardening

### Goals

Prevent CSS/metadata drift.

### Tasks

1. Run a discovery extractor over current CSS to list public-looking `.ls-*` selectors.
2. Compare selectors to `authoring` metadata.
3. For gaps:
   - add metadata if public;
   - rename/internalize if private;
   - add allowlist only if justified.
4. Add registry validation warning/error for future gaps.
5. Include dependency selector cases carefully, e.g. component CSS intentionally styling child/dependency classes.

### Tests

- Synthetic CSS public class missing metadata fails.
- Current registry passes after updates.

## Phase 13 — Config-root ambiguity and manifest drift UX

### Goals

Improve agent understanding of where commands operate and what manifest drift means.

### Tasks

1. Add fields to relevant JSON outputs:
   - `start`;
   - `root`;
   - `configPath`;
   - `configDiscovery: explicit|ancestor|default`.
2. Warn when `validate` or `preview` discovers ancestor config from a nested start path.
3. Keep `add --dir` exact-directory behavior.
4. Improve manifest drift summary:
   - `customizedFilesCount`;
   - `manifestPresent`;
   - `manifestBaseDir`.
5. Warn for manifest items unknown to the active registry source.

### Tests

- Nested validate reports ancestor config.
- Existing `add --dir does not inherit ancestor config` remains.
- Strict drift behavior unchanged.

## Phase 14 — Preview server hardening

### Goals

Preserve and strengthen local server safety/UX.

### Tasks

1. Add tests for:
   - HEAD requests;
   - directory request behavior;
   - no-store cache headers for authoring freshness;
   - additional MIME types (`.woff2`, `.avif`, `.ico`) if useful.
2. Keep symlink-outside-root and malformed URL tests.
3. Include `exportUrl` from Phase 7.

### Tests

- Extend `tests/preview.test.mjs`.

## Phase 15 — Runtime hash/deep-link navigation as separate optional feature

### Status

This is a missing piece from the chat audit, not a defect from `FINDINGS.md`. Do this only after Phases 1–14 are stable.

### Tasks

1. Decide hash format once:
   - prefer `#slide=2&step=1` for clarity;
   - avoid supporting multiple ambiguous formats initially.
2. Update `slide-runtime.js`:
   - parse initial hash;
   - clamp slide/step;
   - update via `history.replaceState`;
   - listen to `hashchange`;
   - export mode still shows all content.
3. Add real browser QA, not just string assertions.

### Tests

- If no browser test harness is added, keep this feature deferred.

## Phase 16 — Light/print preset expansion as separate product track

### Status

Valuable, but not needed to fix current defects.

### Tasks

1. Add `presets/themes/clean-light`.
2. Decide whether print is a theme or separate preset category.
3. Add theme gallery pages.
4. Update docs/skill theme lists.
5. Visual QA both normal and export mode.

## Phase 17 — Technical primitive expansion as separate product track

### Status

Valuable, but not needed to close current findings. Do after validation/snippet trust is improved.

### Candidate batch

- `components/terminal`
- `components/file-tree`
- `components/http-exchange` or `api-callout`
- `components/code-diff`
- `templates/technical-walkthrough`
- `templates/api-flow`

### Quality bar

Each item needs metadata, docs, snippets, dependency closure, examples, and visual QA before being marked `agentRecommended`.

## Phase 18 — Final behavior-preserving command refactor

### Goals

Address `commands.mjs` monolith only after behavior changes are stable.

### Tasks

1. Split modules under `src/cli/commands/`:
   - `init.mjs`
   - `add.mjs`
   - `catalog.mjs`
   - `inspect.mjs`
   - `skill.mjs`
   - `validate.mjs`
   - `preview.mjs`
   - `doctor.mjs`
   - `repo-validation.mjs`
2. Move text formatting to `src/cli/text-output.mjs`.
3. Move theme helpers to `src/cli/theme.mjs`.
4. Keep existing public exports from `src/cli/commands.mjs`.
5. Run full test suite before/after; no behavior changes in this phase.

## Files likely to change

### Source

- `src/cli/commands.mjs`
- later new `src/cli/commands/*.mjs`
- later new `src/cli/text-output.mjs`
- later new `src/cli/theme.mjs`
- `src/shared/html.mjs`
- possible new `src/shared/css.mjs`
- `src/deck/manifest.mjs`
- `src/deck/copy.mjs`
- `src/registry/source.mjs`
- `src/validation/authoring-api.mjs`
- `src/validation/markup-structure.mjs`
- `src/validation/registry.mjs`
- `src/validation/examples.mjs`
- new `src/validation/load-tags.mjs`
- new `src/validation/assets.mjs`
- new `src/validation/accessibility.mjs`

### Registry

- `registry/core/base/slide.css`
- `registry/core/base/tokens.css`
- `registry/core/base/slide-runtime.js` only in Phase 15
- `registry/utilities/layout/*`
- `registry/components/progress/*`
- `registry/components/table/*`
- `registry/components/code-block/*`
- `registry/components/timeline/*`
- `registry/components/quote/*`
- `registry/components/divider/README.md`
- `registry/animations/*`
- `registry/presets/fonts/*`
- `registry/presets/themes/*`
- `registry/templates/*`
- `registry.json`

### Schemas/docs/skills/tests

- `schemas/*.json`
- `README.md`
- `docs/*.md`
- `skills/create-slides-with-slidesls/SKILL.md`
- `skills/create-slides-with-slidesls/references/*.md`
- `FINDINGS.md`
- `tests/*.test.mjs`
- `examples/**`

## Testing and verification plan

### Always-run checks

```sh
pnpm check
pnpm pack:check
```

### Targeted checks per phase

- Registry/snippet work: `pnpm validate:registry && pnpm validate:skills`.
- Examples: `pnpm validate:examples`.
- CLI output/docs: `node --test tests/cli-output.test.mjs`.
- Preview: `node --test tests/preview.test.mjs`.
- HTML validation: `node --test tests/html-validation.test.mjs`.

### Visual QA checklist

Run preview and inspect screenshots/browser output for:

- title hero;
- section divider;
- template gallery;
- stress gallery;
- theme gallery nested pages;
- progress normal and animated;
- timeline vertical/progress/horizontal;
- table frame with wide content;
- code block dense/long examples;
- export mode `?export=1`.

Recommended commands:

```sh
node bin/slidesls.mjs preview examples/template-gallery --host 127.0.0.1 --port 4321 --json
# inspect normal mode and http://127.0.0.1:4321/?export=1 with agent-browser or a browser
```

## Rollout and compatibility

- Default `validate` should remain offline/deterministic.
- New deck-level checks should be warnings by default and strict-mode errors where appropriate.
- Existing copied assets remain editable; hash drift default behavior remains non-error.
- `add` remains copy-only.
- Optional browser/snapshot workflows remain optional.

## Open questions for implementation time

1. Should unsupported markerless timeline markup be explicitly supported with fallback CSS, or rejected/guided toward marker/body structure? Recommendation: reject/guide; keep one canonical contract.
2. Should `progress` support explicit `data-ls-tone="accent"` and `data-ls-density="comfortable"`, or should docs remove those? Recommendation: remove unsupported explicit values unless there is a concrete need.
3. Should structural metadata be added to registry schema, or should high-risk structural validation remain hard-coded? Recommendation: start hard-coded for progress/timeline/quote, then generalize only if patterns repeat.
4. Should optional snapshot support live in this package or a companion package? Recommendation: defer until visual QA docs and preview `exportUrl` are improved.
