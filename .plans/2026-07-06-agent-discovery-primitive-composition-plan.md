# Improve Agent Discovery and Primitive-First Slide Composition

## Summary

Improve `slidesls` so agents can quickly detect and understand all available slide-building blocks, confidently compose slides from primitives without relying on prebuilt templates, and optionally build with default/custom tokens instead of prebuilt themes.

The current system is already agent-friendly: `catalog`, `inspect`, registry metadata, snippets, `agentInstructions`, validation, and the bundled skill are strong. The gap is mainly **framing and first-hop discovery**: the highest-visibility workflow over-emphasizes template/theme-first authoring, while primitive-first and no-theme/custom-token workflows are supported but less actively advocated.

This plan therefore prioritizes low-risk improvements to metadata, query, skill/docs framing, and existing catalog output before adding any new CLI command surface.

## Confirmed requirements

- Help agents quickly detect available building blocks.
- Help agents quickly understand when to use templates, utilities, components, animations, themes, and font presets.
- Make primitive-only composition a first-class documented workflow.
- Make no-theme/custom-token visual direction explicitly supported.
- Keep existing safe template/theme workflows intact.
- Preserve the project model: copyable registry, plain HTML/CSS/JS, no framework/runtime dependency, source-of-truth snippets, validation, and visual QA.

## Assumptions

- Templates and themes remain useful fast-path conveniences, not requirements.
- Existing `catalog --json` should remain the canonical complete lightweight inventory unless evidence shows a new command is needed.
- `catalog --starter --json` should remain the smallest fast-start set, not the all-building-blocks overview.
- Guidance should avoid stale or intentionally banned primary commands.
- The new user-facing model should separate two independent choices:
  - **composition axis:** templates vs primitives;
  - **visual axis:** default tokens vs theme preset vs custom token overrides.

## Research / review findings

### Codebase findings

- `registry.json` indexes 43 registry items across core, utilities, components, templates, animations, and presets.
- `src/registry/source.mjs` has two summary levels:
  - `summarizeItemBrief()` for default catalog output;
  - `summarizeItem()` / `mergeBriefAndRich()` for API-rich output.
- `src/cli/deck-commands.mjs` implements `catalog` and `inspect`.
- `catalog --json` is already complete and compact enough for agents: current output is ~12.4 KB and tested below 14 KB in `tests/cli-output.test.mjs`.
- `catalog --starter --json` is only ~5.6 KB but intentionally omits `utilities/layout` and all components, making it poor as a complete building-block inventory.
- `catalog --recommended --json` currently gives a better overview than `starter`, but guidance files intentionally forbid recommending it.
- Existing `catalogGroups()` only returns `{ type, count }`; this can be enhanced with labels/purposes without adding a new command.
- `catalog --query` currently searches name/title/description/tags, but not `useCases`; this causes misses for natural intent queries, e.g. KPI/metric intent.

Relevant files:

- `registry.json`
- `src/registry/source.mjs`
- `src/cli/deck-commands.mjs`
- `src/cli/agent-instructions.mjs`
- `src/cli/text-output.mjs`
- `tests/cli-output.test.mjs`

### Skill/docs findings

- `skills/create-slides-with-slidesls/SKILL.md` currently says “Choose exactly one theme early,” making themes feel mandatory.
- The default skill example uses `--template minimal --theme executive-blue`.
- The skill and docs explain primitives, but template-first recipes and the density table are more prominent.
- `references/deck-authoring.md` includes a minimal shell, token override guidance, layout utilities, and density guidance — good foundations for primitive/no-theme workflows.
- `references/copy-workflow.md` correctly says templates expose snippet HTML through `inspect`; `add` copies assets and does not edit HTML.

Relevant files:

- `skills/create-slides-with-slidesls/SKILL.md`
- `skills/create-slides-with-slidesls/references/deck-authoring.md`
- `skills/create-slides-with-slidesls/references/copy-workflow.md`
- `skills/create-slides-with-slidesls/references/registry-contract.md`
- `docs/agent-workflow.md`
- `docs/deck-contract.md`
- `README.md`

### Existing guardrail discovered during review

`tests/cli-output.test.mjs` has a guardrail test named `agent guidance avoids stale primary commands` that asserts guidance files do **not** contain:

```txt
catalog --recommended --json
```

`git blame` points this to commit `dfb3f0e` / surrounding work named “Make agent workflow skill-first with brief discovery and stable layout contracts.” Therefore this plan should not simply start recommending `catalog --recommended --json`. If the implementation team later decides `--recommended` should be restored as primary guidance, that must be a deliberate product decision with the test updated accordingly.

This revised plan keeps `catalog --json` as the canonical full lightweight inventory and avoids recommending `catalog --recommended --json` in guidance.

### Claude review incorporated

The first draft proposed a new `catalog --map` command as Phase 1. Claude review flagged that as likely overengineering because:

- `catalog --json` is already compact and complete.
- `catalogGroups()` already exists and can be enriched.
- mode-selection belongs largely in `agentInstructions` and skill/docs.
- adding `--map` risks duplicating catalog behavior and creating a new schema before evidence shows it is needed.

This revised plan therefore demotes a new command to a future optional follow-up and prioritizes metadata, query, existing catalog grouping, and guidance fixes.

## Chosen strategy

Use existing catalog/inspect surfaces and make them better:

1. Preserve `catalog --json` as the canonical complete lightweight inventory.
2. Enrich `groups` in catalog JSON/text output with labels and purposes.
3. Improve query matching and registry metadata so natural intent searches work.
4. Revise skill/docs around two independent axes:
   - composition: templates vs primitives;
   - visual styling: default tokens vs theme presets vs custom token overrides.
5. Update `agentInstructions` so blank decks and primitive composition get appropriate next commands.
6. Add tests that lock in the new agent-facing behavior.
7. Only consider a new `catalog --overview` / `slidesls blocks` command later if evidence shows existing catalog output remains insufficient.

## Alternatives considered

### Alternative A: Add `catalog --map` / `--building-blocks` immediately

Rejected for v1. It duplicates much of `catalog --json`, adds command/docs/test surface, and risks schema churn. It may be reconsidered after simpler improvements are evaluated. If added later, `--overview` or a dedicated `slidesls blocks` command is clearer than `--map`.

### Alternative B: Promote `catalog --recommended --json` as the primary inventory

Rejected for now because the test suite intentionally forbids this in guidance. The implementation should first understand and respect that guardrail. If the product decision changes, update the test explicitly.

### Alternative C: Only update docs/skill, no CLI changes

Partially insufficient. Docs are important, but `catalog --query` misses relevant intent terms and `groups` are too bare. Small CLI improvements have high value and low risk.

### Alternative D: De-emphasize templates/themes globally

Rejected. Existing template/theme paths help agents build safe, polished decks quickly. The goal is to add first-class primitive/no-theme paths, not replace the template/theme path.

## Implementation plan

### Phase 0 — Confirm guidance command policy

Goal: avoid fighting existing guidance guardrails.

1. Keep the current ban on `catalog --recommended --json` in guidance unless the product decision explicitly changes.
2. Document in implementation notes that the canonical full inventory remains:

   ```sh
   slidesls catalog --json
   ```

3. Use `catalog --starter --json` only for smallest fast-start discovery.
4. Use filtered catalog commands for focused discovery:

   ```sh
   slidesls catalog --type component --json
   slidesls catalog --type template --json
   slidesls catalog --type preset --tag theme --json
   ```

5. Add or adjust tests so guidance points agents at the intended inventory command and does not regress to stale commands.

Files likely changed:

- `tests/cli-output.test.mjs`
- `src/cli/agent-instructions.mjs`
- skill/docs only if command wording changes

### Phase 1 — Improve existing catalog overview without new command surface

Goal: make `catalog --json` and text output easier to scan as a building-block inventory.

1. Enhance `catalogGroups()` in `src/registry/source.mjs` so each group includes:

   ```js
   {
     type: "ls:component",
     count: 17,
     label: "Components",
     purpose: "Standalone content, data, media, technical, and visual primitives."
   }
   ```

2. Suggested group purposes:

   - `ls:core`: required shell, tokens, runtime, icon helpers.
   - `ls:utility`: layout/helper classes that compose anywhere.
   - `ls:component`: standalone content/visual primitives.
   - `ls:template`: paste-ready full-slide skeleton snippets.
   - `ls:animation`: optional reveal/emphasis recipes.
   - `ls:preset`: optional theme/font token remaps.

3. Update catalog text output in `src/cli/text-output.mjs` to print grouped sections instead of one long flat list, while preserving concise output.

4. Update `catalogAgentInstructions()` in `src/cli/agent-instructions.mjs`:

   - Clarify that `catalog --json` is the complete lightweight inventory.
   - Clarify that `catalog --starter --json` is the smallest fast-start set.
   - Add primitive-first next commands using filtered catalog and `inspect`, not `--recommended`.

5. Keep JSON backward compatible: existing fields remain; group objects gain optional extra fields.

6. Tests:

   - `catalog --json` groups include labels/purposes.
   - `catalog --json` still remains under the context budget or adjust budget only if justified.
   - text catalog output includes group headings and `For AI agents:`.
   - group counts still match item counts.

Files likely changed:

- `src/registry/source.mjs`
- `src/cli/text-output.mjs`
- `src/cli/agent-instructions.mjs`
- `tests/cli-output.test.mjs`

### Phase 2 — Improve intent search and registry metadata

Goal: make natural queries find the right primitives/templates quickly.

1. Expand `catalog --query` matching in `src/cli/deck-commands.mjs` to include structured intent fields only:

   - `useCases`
   - `tags`
   - existing name/title/description

2. Do **not** initially search freeform composition prose (`copyGuidance`, `avoidWhen`, `alternatives[].when`). That would make common terms like “card” noisy because many items mention cards as alternatives or anti-patterns.

3. Add missing `useCases` and/or tags for recommended components:

   - `components/card`: feature/explanation card, 2–4 sentence point, comparison block.
   - `components/panel`: visual anchor, grouped explanation, diagram/screenshot/code frame.
   - `components/callout`: key takeaway, warning/success/status note.
   - `components/metric`: KPI, stat, numeric proof point.
   - `components/progress`: progress, completion, migration/status indicator.
   - `components/quote`: quote, testimonial, cited principle.
   - `components/table`: compact comparison, small data table, feature matrix.
   - `components/timeline`: roadmap, process, sequence, milestones.
   - `components/image-card`: screenshot, case study, visual example.
   - `components/divider`: separator, section grouping, labeled break.
   - `components/code-block`: code excerpt, implementation example.

4. Consider improving overly generic descriptions:

   - `components/metric`: “KPI/stat primitive for one prominent number plus label.”
   - `components/callout`: “Emphasized takeaway/status block with optional semantic tone.”
   - `components/code-block`: “Static code excerpt component for short implementation examples.”

5. Regenerate generated catalog docs whenever rendered fields change:

   ```sh
   node bin/slidesls.mjs generate-catalog
   node bin/slidesls.mjs generate-catalog --check
   ```

6. Tests:

   - `catalog --query kpi --json` finds `components/metric` and/or `templates/metric-dashboard`.
   - `catalog --query one-liner --json` finds `components/icon-item` and `templates/feature-rows`.
   - `catalog --query api --json` continues to find `components/http-exchange` and `templates/api-flow`.
   - Add at least one negative query/precision test to ensure query expansion does not match unrelated items.

Files likely changed:

- `src/cli/deck-commands.mjs`
- `registry/components/*/registry-item.json`
- maybe `registry/templates/*/registry-item.json`
- `skills/create-slides-with-slidesls/references/catalog.md`
- `tests/cli-output.test.mjs` or `tests/registry-resolution.test.mjs`

### Phase 3 — Reframe the bundled skill around two independent axes

Goal: make the bundled skill actively support primitive/no-theme workflows without bloating `SKILL.md`.

1. Keep `SKILL.md` concise. Add a short “Choose composition and visual direction” section near the top:

   - Composition direction:
     - Template-first: fastest for polished complete slides.
     - Primitive-first: use `utilities/layout` + standalone components when custom structure is desired.
   - Visual direction:
     - Default tokens: no theme required; default is a dark blue-accent visual baseline from `core/base/tokens.css`.
     - Theme preset: choose exactly one theme when a prebuilt style is desired.
     - Custom tokens: override safe variables in `@layer tokens`.

2. Replace hard theme wording:

   Current:

   > Choose exactly one theme early

   Revised:

   > Use default tokens, or choose exactly one theme early when a prebuilt style is desired. If choosing a theme, do not stack themes.

3. Preserve the theme list formatting with backticked theme names because tests assert every bundled theme appears in `SKILL.md`.

4. Add primitive-first commands to the fast discovery map without using `catalog --recommended --json`:

   ```sh
   slidesls catalog --json
   slidesls catalog --type component --json
   slidesls inspect utilities/layout --api --json
   slidesls inspect components/card --json
   ```

5. Keep detailed command recipes in `references/deck-authoring.md` rather than bloating `SKILL.md`.

6. Tests:

   - `SKILL.md` still lists all themes.
   - guidance command sweep still passes.
   - `catalog --recommended --json` remains absent unless deliberately approved.
   - documented flags remain parser-valid.

Files likely changed:

- `skills/create-slides-with-slidesls/SKILL.md`
- `tests/cli-output.test.mjs`
- `tests/skill-command.test.mjs` if skill snapshots/expectations require updates

### Phase 4 — Add first-class primitive and no-theme recipes to references/docs

Goal: make custom composition copy-pasteable and safe.

1. Update `skills/create-slides-with-slidesls/references/deck-authoring.md` with a new “Composition and visual choices” section:

   - Composition choices:
     - template-first;
     - primitive-first.
   - Visual choices:
     - default tokens / no theme;
     - one prebuilt theme;
     - custom token overrides.

2. Add a primitive-first workflow:

   ```sh
   slidesls init ./deck --template blank --title "Deck"
   slidesls catalog --type component --json
   slidesls inspect utilities/layout components/card components/panel --json
   slidesls add utilities/layout components/card components/panel --dir ./deck --dry-run --json
   slidesls add utilities/layout components/card components/panel --dir ./deck
   ```

3. Add a minimal primitive-authored slide example using real classes only:

   ```html
   <section class="ls-slide" data-ls-slide-kind="content" aria-label="Custom primitive slide">
     <div class="ls-slide__inner">
       <header class="ls-slide__header">
         <p class="ls-eyebrow">Primitive composition</p>
         <h2 class="ls-title">Compose from layout utilities and components.</h2>
       </header>
       <div class="ls-grid ls-grid--2">
         <article class="ls-card">
           <div class="ls-card__body">
             <h3 class="ls-card__title">Layout stays explicit</h3>
             <p class="ls-card__text">Use utilities for structure and components for content.</p>
           </div>
         </article>
         <div class="ls-panel ls-panel--frame ls-panel--center">
           <p class="ls-panel__text">Diagram or visual anchor</p>
         </div>
       </div>
     </div>
   </section>
   ```

4. Add a no-theme/custom-token workflow:

   - Explain that omitting `data-ls-theme` uses default dark base tokens, not an unstyled deck.
   - Show a small deck-level `@layer tokens` override.
   - Point to `inspect <item> --api --json` for `cssVariables` and `overrideSafe`.

5. Update `docs/agent-workflow.md`:

   - Fast/template path.
   - Primitive/custom path.
   - Use `catalog --json` for complete inventory.
   - Use filtered catalog for focused selection.

6. Update `docs/deck-contract.md`:

   - Templates are optional convenience snippets.
   - Utilities/components are first-class building blocks.
   - Themes are optional token presets.

7. Update `README.md`:

   - Add “Primitive composition without templates” short section.
   - Add “No theme required” note to theming section.

8. Optionally update `PROJECT.md` to capture product direction:

   > Agent-primary authoring supports both template-first and primitive-first composition; themes are optional token presets.

Files likely changed:

- `skills/create-slides-with-slidesls/references/deck-authoring.md`
- `docs/agent-workflow.md`
- `docs/deck-contract.md`
- `README.md`
- optionally `PROJECT.md`

### Phase 5 — Make agent instructions context-aware

Goal: CLI JSON guidance should match how the deck was initialized and what the user is trying to do.

1. Add command recipes in `src/cli/agent-instructions.mjs`:

   ```js
   catalogComponentsJson: "slidesls catalog --type component --json";
   catalogTemplatesJson: "slidesls catalog --type template --json";
   inspectLayoutApiJson: "slidesls inspect utilities/layout --api --json";
   inspectPrimitiveJson: "slidesls inspect utilities/layout components/card components/panel --json";
   ```

2. Update `agentHelpBlock()` to distinguish:

   - complete inventory: `catalog --json`;
   - fast-start set: `catalog --starter --json`;
   - primitive discovery: `catalog --type component --json` and `inspect utilities/layout --api --json`;
   - template discovery: `catalog --type template --json` and `inspect templates/<name> --json`;
   - theme discovery: `catalog --type preset --tag theme --json`.

3. Update `initAgentInstructions()` to accept the chosen init template:

   ```js
   initAgentInstructions(root, { template });
   ```

4. In `src/cli/deck-commands.mjs`, pass the selected `template` into `initAgentInstructions()`.

5. If `template === "blank"`, recommend primitive-first next commands:

   - `slidesls catalog --json`
   - `slidesls catalog --type component --json`
   - `slidesls inspect utilities/layout components/card components/panel --json`
   - `slidesls validate <deck> --json`

6. If `template === "minimal"`, keep template-oriented next commands but also include a primitive alternative.

7. Tests:

   - `init --template blank --json` includes primitive next commands.
   - `init --template minimal --json` includes template next commands.
   - command recipe execution test still passes with placeholder substitution.

Files likely changed:

- `src/cli/agent-instructions.mjs`
- `src/cli/deck-commands.mjs`
- `src/cli/text-output.mjs`
- `tests/cli-output.test.mjs`

### Phase 6 — Add a primitive workflow smoke fixture/test

Goal: prove primitive-first composition is not merely documented.

1. Add a test that creates a temporary blank deck:

   ```sh
   node bin/slidesls.mjs init <tmp> --template blank --title "Primitive Test" --json
   node bin/slidesls.mjs add utilities/layout components/card components/panel --dir <tmp> --json
   ```

2. Programmatically insert returned load tags and a primitive-authored slide into `index.html`.

3. Run:

   ```sh
   node bin/slidesls.mjs validate <tmp> --json
   ```

4. Assert:

   - validation succeeds;
   - no unknown `ls-*` classes;
   - no design-lint warnings for the primitive slide;
   - load tags are correct.

5. If feasible, add this to an existing test file. If it becomes too large, create `tests/primitive-workflow.test.mjs`.

Files likely changed:

- `tests/cli-output.test.mjs` or new `tests/primitive-workflow.test.mjs`

### Phase 7 — Optional future command only if needed

Goal: leave room for a dedicated overview command without committing prematurely.

After phases 1–6, evaluate actual CLI output and agent usability. If agents still struggle to detect building blocks quickly, consider one of:

- `slidesls catalog --overview --json`
- `slidesls blocks --json`

Acceptance criteria before adding:

- Existing `catalog --json` + enhanced groups still feels too noisy in practice.
- The new command has a clearly distinct purpose, not just a reformat.
- Output schema is compact and stable.
- Tests lock in purpose and size.

Do not implement this in the first pass unless the user explicitly asks for a dedicated command.

## Verification plan

Run focused checks during implementation:

```sh
node --test tests/cli-output.test.mjs
node --test tests/authoring-api.test.mjs
node bin/slidesls.mjs validate-registry
node bin/slidesls.mjs generate-catalog --check
```

Run full project checks:

```sh
pnpm check
```

Manually inspect key outputs:

```sh
node bin/slidesls.mjs --help
node bin/slidesls.mjs catalog --json
node bin/slidesls.mjs catalog --type component --json
node bin/slidesls.mjs catalog --query kpi --json
node bin/slidesls.mjs inspect utilities/layout components/card --json
node bin/slidesls.mjs inspect utilities/layout --api --json
node bin/slidesls.mjs skill show
```

If docs or skill references changed, ensure command-flag sweep still passes and no stale guidance commands are introduced.

## Backward compatibility

- Existing commands remain valid.
- Existing JSON fields remain valid; group objects only gain optional metadata.
- Existing template/theme workflows remain supported.
- Query expansion is additive but can change result counts; tests should capture expected behavior.
- Skill/docs wording changes do not affect generated decks.
- No generated deck runtime behavior changes are required.

## Risks and mitigations

### Risk: Query expansion becomes noisy

Mitigation: search only structured fields (`name`, `title`, `description`, `tags`, `useCases`) in v1. Avoid matching freeform composition prose.

### Risk: Skill becomes too long

Mitigation: keep only high-level two-axis guidance in `SKILL.md`; put recipes in `references/deck-authoring.md`.

### Risk: Primitive-first guidance encourages bad custom layouts

Mitigation: keep snippet/API-first guidance, validation, visual QA, density rules, and no-invented-classes rules.

### Risk: No-theme decks appear “unstyled” or surprising

Mitigation: explicitly document that no-theme uses default dark base tokens from `core/base/tokens.css`; it is not unstyled.

### Risk: Generated catalog drifts

Mitigation: run `generate-catalog` after metadata/description changes and include generated `references/catalog.md` updates.

### Risk: Existing stale-command guardrail blocks intended guidance

Mitigation: avoid `catalog --recommended --json` in guidance unless intentionally changing that product decision and updating the test.

## Open questions

None blocking for the revised plan.

Optional decisions:

1. Should `PROJECT.md` be updated in the same implementation? Recommended: yes, briefly.
2. Should a dedicated overview command be considered after this pass? Recommended: defer until after simpler changes are evaluated.

## Recommended implementation order

1. Preserve/clarify guidance command policy.
2. Enhance existing catalog groups/text output.
3. Expand query matching to `useCases` and enrich registry metadata.
4. Reframe skill around composition and visual axes.
5. Add primitive/no-theme recipes to references/docs.
6. Make init agent instructions template-aware.
7. Add primitive workflow smoke test.
8. Run full validation.
9. Reassess whether a dedicated overview command is still needed.

---

## Implementation Progress

Started: 2026-07-06
Plan path: `.plans/2026-07-06-agent-discovery-primitive-composition-plan.md`

### Decomposition / parallelism

- [x] Read full plan before editing.
- [x] Created retained tracker in this plan file.
- [x] Decided implementation should be mostly sequential because phases touch shared CLI/docs/tests files.
- [x] Subagent availability inspected with `subagent list`; independent review passes will use Claude CLI per skill preference.

### Phase status

- [x] Phase 0 — Confirm guidance command policy (kept `catalog --json` canonical; no `catalog --recommended --json` guidance added).
- [x] Phase 1 — Improve existing catalog overview without new command surface (group labels/purposes + grouped text output).
- [x] Phase 2 — Improve intent search and registry metadata (`useCases` query matching + component metadata).
- [x] Phase 3 — Reframe the bundled skill around two independent axes.
- [x] Phase 4 — Add first-class primitive and no-theme recipes to references/docs.
- [x] Phase 5 — Make agent instructions context-aware for blank/minimal init.
- [x] Phase 6 — Add primitive workflow smoke fixture/test.
- [x] Phase 7 — Reassessed optional overview command; not implemented because enhanced existing catalog appears sufficient.

### Validation log

- `node bin/slidesls.mjs generate-catalog` — passed; regenerated `skills/create-slides-with-slidesls/references/catalog.md`.
- `node bin/slidesls.mjs generate-catalog --check` — passed.
- `node --test tests/cli-output.test.mjs` — passed (25 tests).
- `node --test tests/authoring-api.test.mjs` — passed (10 tests).
- `node bin/slidesls.mjs validate-registry` — passed (43 items).
- Initial `pnpm check` failed on formatting; ran `pnpm fmt`.
- `pnpm check` — passed (lint, format check, 142 tests, registry validation, skill catalog check, example validation, CLI smoke).
- Manual output inspection passed for `--help`, `catalog --json`, `catalog --type component --json`, `catalog --query kpi --json`, `inspect utilities/layout components/card --json`, `inspect utilities/layout --api --json`, and `skill show`.

### Independent review log

- Claude review session `93eb6dc3-8728-45e8-ad8a-6af2f58c7869` reviewed the implementation diff and validation. Verdict: solid/low-risk; minor findings only.
- Incorporated review fixes: updated catalog budget comment, changed group order to Core → Utilities → Components → Templates → Animations → Presets, and added primitive inspect to minimal init top-level `nextSteps`.
- Claude follow-up confirmed all material concerns resolved; leaving generated `references/catalog.md` without tags/useCases is accepted because JSON catalog is the intended selection surface.
- Final Claude review session `3f7423fd-25be-4275-818c-b59e084ebb93` performed a full plan/diff/validation review. Verdict: ship-ready; no blockers or regressions. Non-blocking notes: catalog text output format changed intentionally; `initAgentInstructions` and top-level `nextSteps` duplicate command lists but are currently consistent.

### Deviations

- Did not add a new `catalog --overview` / `slidesls blocks` command; per plan, deferred because existing catalog output was enhanced.
- Raised the brief catalog byte-budget test from 14 KB to 16 KB because group metadata plus structured use cases increased useful agent-facing context to ~14.8 KB.
