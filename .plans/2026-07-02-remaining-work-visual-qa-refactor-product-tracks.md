# Remaining slidesls Work: Visual QA, Runtime/Product Tracks, and CLI Refactor

## Summary

Complete the work intentionally left after the audit-hardening commit `4a10228` (`Hardening pass for audit findings`, pushed to `origin/main`):

1. Run real browser visual QA for representative existing decks and fix any issues found.
2. Add runtime hash/deep-link navigation.
3. Add a clean light theme and improve existing print CSS behavior.
4. Add technical primitives in staged batches.
5. Perform the final behavior-preserving CLI refactor.

The work must preserve the core `slidesls` constraints:

- generated decks remain plain editable HTML/CSS/JS;
- the npm package remains an authoring tool, not a generated-deck runtime dependency;
- no mandatory framework, bundler, Tailwind, Playwright/Puppeteer, or browser dependency;
- registry assets remain copyable and editable;
- default validation remains offline and deterministic;
- agent workflows remain JSON-first and snippet/catalog driven.

No clarification is needed before implementation. Work should still be shipped in separate, reviewable commits/tracks.

## Claude review incorporated

The draft plan was reviewed with `claude -p --model claude-opus-4-8 --effort high`. Accepted feedback:

- Reframe browser QA as an initial visual audit with explicit pass predicates, not regression detection.
- Add a reusable browser-driven overflow/fit QA script instead of relying only on ad-hoc manual `eval` snippets.
- Recognize that print support already exists in `registry/core/base/slide.css`; do not add a `print-clean` theme/preset. Improve print as global `@media print` behavior layered over themes.
- For hash navigation, explicitly refactor the runtime around a shared `applyState()` path and test parse/format/clamp helpers deterministically via Node/vm without adding another copied runtime file.
- Use `replaceState` knowing it does not trigger `hashchange`; focus loop prevention on clean state ownership, not impossible self-trigger loops.
- Refactor CLI into fewer cohesive modules and make before/after golden command-output capture mandatory.
- Scope the first technical primitive batch to `terminal` and `code-diff`; plan later batches for the remaining primitives.
- State that existing generated decks do not automatically gain new runtime behavior; copied assets are user-owned.

## Research and current-state findings

### Local project findings

- `src/cli/commands.mjs` is still a large monolith containing command handlers, preview server, validation orchestration, text output, registry/theme helpers, and formatting.
- The direct test import surface for `commands.mjs` is narrow, but CLI behavior is broadly covered through subprocess tests and smoke tests. Keep a public façade anyway.
- `registry/core/base/slide-runtime.js` controls slide/step state, reveal sequencing, export mode, keyboard navigation, and scaling. It currently has closure-local `activeIndex/currentStep` state and no hash parsing/updating.
- `registry/core/base/slide.css` already contains `@media print` handling that makes all slides visible, resets transforms, and uses `break-after: page`. Print is not greenfield.
- Existing examples include `examples/template-gallery`, `examples/stress-gallery`, and `examples/theme-gallery`.
- Browser QA remains optional/manual and should use the existing `agent-browser` workflow or equivalent external browser automation without adding package dependencies.

### Web/platform findings

- MDN `History.replaceState(state, unused, url)` updates the current history entry without adding a new one. This fits slide/step URL updates without history spam.
  - https://developer.mozilla.org/en-US/docs/Web/API/History/replaceState
- MDN `hashchange` fires for fragment changes but not for `history.pushState()` or `history.replaceState()`. Runtime should update state directly for internal navigation and listen for external/manual hash edits.
  - https://developer.mozilla.org/en-US/docs/Web/API/Window/hashchange_event
- MDN print guidance confirms `@media print` is the correct mechanism for print/PDF-specific CSS layered over normal styles.
  - https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_media_queries/Printing
- Node's built-in test runner remains appropriate for deterministic unit/subprocess tests.
  - https://nodejs.org/api/test.html

## Chosen implementation strategy

Use five tracks, in this order:

1. **Initial browser visual audit and QA scripting** — verify the current hardening in a browser and create reusable QA helpers.
2. **Runtime deep-link feature** — touch the shared runtime before adding more registry items, then re-run visual QA once.
3. **Light theme and print CSS improvements** — add the genuinely new light theme and tune existing print behavior.
4. **Technical primitives in staged batches** — first `terminal` and `code-diff`, then remaining primitives/templates after the pattern is proven.
5. **Final CLI refactor** — behavior-preserving file moves after behavior/product changes settle.

Rationale:

- Visual QA is the only known validation gap from the previous commit.
- Hash navigation is the only remaining shared runtime feature; land it before QAing many new primitives.
- Print should be global media CSS, not a theme/preset axis.
- Technical primitives should meet the full registry quality bar one at a time.
- CLI refactor should be last to avoid mixing file moves with behavior changes.

## Alternatives considered

### Refactor `commands.mjs` first

Rejected. It creates broad churn before visual QA and product work. The refactor is valuable but not a correctness blocker.

### Add a mandatory browser test dependency

Rejected. Browser QA should remain optional/manual via `agent-browser` or equivalent external tooling. Deterministic checks can be scripts/tests without bundling a browser dependency.

### Add a print theme/preset

Rejected. Print is orthogonal to the selected theme. Existing `@media print` support should be improved globally and per theme where necessary.

### Extract runtime hash helpers into a second copied JS file

Rejected. That would change the deck contract and require another script tag. Keep generated decks simple with one runtime file; test pure helpers by evaluating them from `slide-runtime.js` in Node/vm if needed.

### Ship all technical primitives at once

Rejected. The first batch should prove naming, density, snippets, docs, and visual QA patterns. Later primitives/templates remain planned but should follow that pattern.

## Track 1 — Initial browser visual audit and QA scripting

### Goals

- Verify current hardening changes in actual rendered decks.
- Capture and inspect representative normal/export screenshots.
- Create a reusable, browser-driven overflow/fit QA script.
- Fix any visible clipping, overflow, centering, animation, print/export, or readability issues before product work.

### Explicit pass predicates

- Active slide is centered and scaled correctly at 1600×900.
- Deck native dimensions match expected 16:9 tokens (`--ls-slide-width`, `--ls-slide-height`).
- No unexpected `scrollWidth > clientWidth + 1` or `scrollHeight > clientHeight + 1` in reviewed slides, except intentional scroll containers such as table frames in normal mode.
- Export mode shows all intended content and reveal states.
- Dense/stress examples remain readable.
- Progress fill animation reaches the intended filled state when active.
- Tables do not silently clip in export/print contexts.
- Contrast appears readable across themes.

### Tasks

1. Run static baseline:
   - `pnpm check`
2. Add a reusable QA helper script, likely under `scripts/`:
   - accepts a preview URL or runs as an `agent-browser eval --stdin` payload;
   - reports native deck dimensions, active slide state, and overflow candidates;
   - outputs JSON for agent-friendly review;
   - has no package dependency on a browser.
3. Start preview servers one deck at a time and tear each down after inspection:
   - `examples/template-gallery`
   - `examples/stress-gallery`
   - `examples/theme-gallery`
   - representative themed intro examples as needed.
4. Use `agent-browser` at 1600×900:
   - inspect normal mode;
   - inspect `?export=1` / `exportUrl`;
   - navigate reveal steps with `ArrowRight`;
   - capture screenshots for title/section, densest content, table/timeline/progress/code, and theme examples.
5. Review screenshots manually; do not merely capture files.
6. Fix issues found in registry CSS/templates/examples/docs, keeping fixes minimal.
7. Delete transient screenshots or store them in a gitignored artifact path unless intentionally documenting QA.

### Likely files

- `scripts/*visual*` or `scripts/*qa*`
- `registry/components/*/*.css`
- `registry/core/base/slide.css`
- `registry/templates/*/snippet.html`
- `examples/**/*.html`
- `skills/create-slides-with-slidesls/references/preview-validation.md`

### Verification

- `pnpm check`
- Browser screenshots reviewed for:
  - title hero;
  - section divider;
  - template gallery;
  - stress gallery;
  - theme gallery;
  - progress normal/animated;
  - timeline/table/code slides;
  - export mode.

## Track 2 — Runtime hash/deep-link navigation

### Goals

- Add optional URL state for slides and reveal steps.
- Keep export mode behavior unchanged.
- Avoid history pollution and ambiguous formats.
- Make parse/format/clamp behavior deterministically tested.

### Chosen hash format

Use one canonical format:

```text
#slide=2&step=1
```

Rules:

- `slide` is 1-based for humans.
- `step` is 0-based because step 0 means initial slide state before reveal steps.
- Missing or invalid values clamp to safe defaults.
- Export mode ignores hash navigation and still shows all slides/content.
- Runtime updates the current URL with `history.replaceState`, not `pushState`.
- Existing copied decks do not automatically gain this behavior; users must recopy/update `slide-runtime.js` because generated decks are user-owned files.

### Tasks

1. Refactor `registry/core/base/slide-runtime.js` around a central state path:
   - add `applyState(nextIndex, nextStep, { updateHash })`;
   - keyboard handlers call `applyState`;
   - hash initialization and `hashchange` listener call `applyState`;
   - keep `setSlideState` focused on DOM state updates if useful.
2. Add pure helpers inside the same runtime file:
   - parse hash to requested `{ slide, step }`;
   - format state to hash;
   - clamp state against slide count and max step.
3. Initialize normal mode from hash after `assignRevealSequences(deck)`, because assigned `data-step` affects max step.
4. Update hash after keyboard/Home/End navigation via `history.replaceState`.
5. Listen for manual/external `hashchange` events and update slide state.
6. Preserve current behaviors:
   - `?export=1` and `?export=pdf` show all slides/reveals;
   - keyboard interactions still ignore form controls;
   - scaling and Lucide initialization remain unchanged.
7. Add deterministic tests:
   - read `slide-runtime.js` and evaluate pure helper functions in a Node `vm` context, or otherwise expose helpers only to the test context without changing copied deck scripts;
   - test parse, format, invalid values, clamping, and 1-based/0-based conventions.
8. Add/perform browser QA for browser-specific behavior:
   - `replaceState` updates URL without history spam;
   - manual hash edits trigger `hashchange` state updates;
   - export mode ignores hash state.
9. Update docs/skill guidance:
   - `docs/cli.md` or `docs/deck-contract.md` mention deep-link format;
   - preview-validation guidance may use deep links for representative QA.

### Verification

- `pnpm check`
- deterministic helper tests
- Browser QA:
  - open `/#slide=2&step=0` and confirm slide 2 initial state;
  - open `/#slide=1&step=999` and confirm clamping;
  - press `ArrowRight` and verify hash updates;
  - manually edit hash and verify state updates;
  - confirm `?export=1#slide=2&step=1` still shows all slides.

## Track 3 — Clean light theme and print CSS improvements

### Goals

- Add a clean light theme preset.
- Improve existing print behavior as global media CSS layered over selected themes.
- Do not add a `print-clean` theme or preset category.

### Tasks

1. Add `registry/presets/themes/clean-light/`:
   - `theme.css`
   - `README.md`
   - `registry-item.json`
   - readable light surfaces, subtle borders, and restrained accents.
2. Update `registry.json` item order.
3. Update theme docs and examples:
   - `registry/presets/themes/README.md`
   - `docs/cli.md`
   - `README.md` if theme lists/examples are present;
   - `examples/theme-gallery/index.html` and a `clean-light.html` page.
4. Audit existing print CSS:
   - `registry/core/base/slide.css` `@media print` block;
   - `registry/core/base/tokens.css` `--ls-print-bg` and text/surface tokens;
   - dark theme print contrast.
5. Add per-theme print overrides only if visual/contrast review shows dark themes print poorly:
   - prefer `@media print { :root[data-ls-theme="..."] { ... } }` in theme CSS;
   - keep normal screen appearance unchanged.
6. Visual QA:
   - clean-light normal/export;
   - print/PDF path if available via browser automation;
   - dark theme print/export contrast.

### Verification

- `pnpm validate:registry`
- `pnpm validate:examples`
- `node --test tests/theme-presets.test.mjs`
- browser screenshots/PDFs for clean-light and print/export examples.

## Track 4 — Technical primitive expansion, staged

### Goals

Add engineering-friendly primitives that agents can compose without inventing classes.

### Full planned set

- `components/terminal`
- `components/code-diff`
- `components/file-tree`
- `components/http-exchange` or `components/api-callout`
- `templates/technical-walkthrough`
- `templates/api-flow`

### First implementation batch

Implement first:

1. `components/terminal`
2. `components/code-diff`

Then validate/QA the full pattern before implementing the remaining primitives/templates.

### Design decisions before coding

- `code-diff` should be a standalone component if it has distinct structure and authoring metadata; it may depend on or pair with `components/code-block` only if snippets actually use that dependency.
- Use one icon convention. Prefer existing Lucide opt-in guidance where icons are useful, but do not require Lucide for the primitive to render acceptably.
- Keep `agentRecommended` false until each item passes docs/snippets/examples/visual QA.

### Quality bar for each item

Each registry item needs:

- CSS file(s), no runtime dependency unless truly necessary;
- `registry-item.json` with type, dependencies, docs, authoring metadata, snippets, tags/use cases;
- `README.md` with usage, load guidance, density/fit caveats;
- snippets using only dependency-closed known classes;
- examples in a gallery/stress deck;
- visual QA in normal and export mode;
- validation passing with no unknown classes.

### Tasks for first batch

1. Add `components/terminal`:
   - root `.ls-terminal`;
   - elements such as header/title/body/prompt/output;
   - compact density support;
   - copy/pasteable static markup, no fake interactivity.
2. Add `components/code-diff`:
   - root `.ls-code-diff` or equivalent;
   - line rows with added/removed/context modifiers;
   - line-number and content elements if useful;
   - strong line-count/visual-fit guidance.
3. Add snippets and docs.
4. Add examples to a technical gallery or stress gallery.
5. Regenerate catalog.
6. Run visual QA.

### Later batch tasks

After first-batch validation:

1. Add `components/file-tree`:
   - nested list structure;
   - folder/file states;
   - optional icon guidance consistent with existing icon policy.
2. Add API/HTTP primitive:
   - request/response blocks;
   - status badge/tone support;
   - safe wrapping for long URLs.
3. Add templates:
   - `technical-walkthrough`;
   - `api-flow`.
4. Repeat quality bar, catalog generation, examples, and visual QA.

### Verification

- `pnpm validate:registry`
- `pnpm validate:examples`
- `pnpm validate:skills`
- targeted tests for registry dependency closure and authoring metadata if new structures require validators;
- browser QA screenshots for each new primitive/template.

## Track 5 — Final behavior-preserving CLI refactor

### Goals

Reduce `src/cli/commands.mjs` size without changing public behavior.

### Module split

Prefer cohesive modules rather than one file per command:

- `src/cli/commands.mjs` — public façade and dispatcher, preserving exports.
- `src/cli/deck-commands.mjs` — `init`, `add`, catalog/inspect if cohesive.
- `src/cli/validation-commands.mjs` — `validate`, `validate-registry`, `validate-examples`, `generate-catalog`, and possibly `doctor` if shared validation context fits.
- `src/cli/preview-command.mjs` — preview server.
- `src/cli/skill-command.mjs` — skill subcommands.
- `src/cli/text-output.mjs` — `textFor` and text formatting.
- `src/cli/theme.mjs` — theme helpers.

Adjust exact boundaries during extraction if a different cohesive split is clearer. Avoid tiny modules that only wrap one-line helpers.

### Tasks

1. Snapshot behavior before refactor:
   - `pnpm check`
   - mandatory golden-output capture for representative text and `--json` commands:
     - `help`
     - `catalog --recommended --json`
     - `inspect templates/split --json`
     - `init --json` in temp dir;
     - `add --dry-run --json`;
     - `validate --json`;
     - `doctor --json`;
     - preview JSON startup shape.
2. Extract text formatting to `text-output.mjs`.
3. Extract theme helpers to `theme.mjs`.
4. Extract preview server to `preview-command.mjs` and run `tests/preview.test.mjs`.
5. Extract validation/repo-validation commands and run validation tests.
6. Extract deck/catalog/inspect/skill commands in small batches.
7. Keep `commands.mjs` as public façade exporting the same functions and `help`/`textFor` where applicable.
8. Diff golden outputs after refactor; any intentional difference must be documented, but the goal is zero behavior difference.
9. Do not change CLI UX or validation behavior during this track except for fixing refactor-introduced bugs.

### Verification

- Before and after:
  - `pnpm check`
  - golden output diff.
- Final:
  - `pnpm pack:check`
  - `git diff --check`.

## Files likely to change

### Runtime/style/registry

- `registry/core/base/slide-runtime.js`
- `registry/core/base/slide.css`
- `registry/core/base/tokens.css`
- `registry/core/base/README.md`
- `registry/components/*`
- `registry/templates/*`
- `registry/presets/themes/*`
- new technical component/template directories
- `registry.json`

### CLI/source

- `src/cli/commands.mjs`
- new `src/cli/*command*.mjs` modules
- `src/cli/text-output.mjs`
- `src/cli/theme.mjs`
- `scripts/*visual*` or `scripts/*qa*`

### Tests/examples/docs

- `tests/*.test.mjs`
- `examples/**/*.html`
- `docs/*.md`
- `README.md`
- `skills/create-slides-with-slidesls/references/*.md`
- `schemas/registry-item.schema.json` only if new metadata shape is needed.

## Testing and verification plan

Always run before final completion:

```sh
pnpm check
pnpm pack:check
git diff --check
```

Track-specific checks:

- Visual QA: browser screenshots reviewed manually; QA script JSON reviewed; no committed transient screenshots unless explicitly useful.
- Hash navigation: deterministic helper tests plus browser checks for hash initialization, update, clamping, external hash edits, and export mode.
- Themes/print: registry/example/theme tests and browser screenshots/PDFs.
- Technical primitives: registry validation, examples validation, catalog generation, browser QA.
- Refactor: mandatory before/after golden output diff and full pack check.

## Rollout and compatibility

- Runtime hash navigation is additive for newly copied runtime files. Existing generated decks keep their current copied runtime unless users recopy/update assets.
- New themes/primitives are additive registry items.
- Print improvements are CSS-only and layered over existing themes.
- CLI refactor must be behavior-preserving.
- Browser workflows remain optional and outside package dependencies.
- Semver intent:
  - hash navigation and new registry items: minor release;
  - behavior-preserving refactor only: patch-compatible.

## Risks and mitigations

| Risk                                   | Mitigation                                                                                       |
| -------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Browser QA finds many visual issues    | Fix smallest registry/template root cause first; avoid overfitting examples.                     |
| Hash navigation introduces state bugs  | Centralize state in `applyState`; deterministic helper tests; browser QA for actual URL events.  |
| Hash update pollutes history           | Use `history.replaceState`, not `pushState`.                                                     |
| Print contrast is poor for dark themes | Add scoped `@media print` token overrides per theme.                                             |
| Technical primitives become too broad  | Ship first batch (`terminal`, `code-diff`) before remaining primitives/templates.                |
| CLI refactor changes behavior          | Mandatory golden-output capture/diff; preserve façade; run targeted tests after each extraction. |
| Browser screenshots become repo noise  | Store temporary screenshots outside tracked paths or delete before commit.                       |
| Background preview servers leak        | Start one server at a time where possible and explicitly terminate each process.                 |

## Open questions

No blocking questions. Implementation-time choices:

1. Exact filename/API shape for the reusable visual QA helper script.
2. Whether `code-diff` should depend on `components/code-block` or remain fully standalone after concrete snippet design.
3. Which later technical primitives should become `agentRecommended`; default to false until visual QA is complete.
