# Plan: Skill-first agent workflow, incremental discovery, and stable slide layout contracts

## Summary

`slidesls` is architecturally an agent-primary authoring CLI, but its agent-facing surface violates its own thesis: the default outputs dump the full authoring API (~70 KB) at the first decision point, the "recommended" tier covers 30 of 40 items, `safeAnywhere` claims contextual utilities are universal, and the layout system has two competing header idioms with no way to tell an intentional hero apart from a broken content slide.

The fix is a defaults change, not a docs change. For agent consumers, the default _is_ the documentation.

Target model:

1. **Skill first** — agents install/link/read the bundled skill before authoring; `skill show --all` is a fallback export, not the front door.
2. **Brief by default** — `catalog --json` and `inspect <item> --json` return concise, selection-oriented payloads. All extra data is opt-in and **additive**: a flag only ever adds fields, never reshapes the response.
3. **Full API on demand** — rich `authoring` metadata stays the validation-backed source of truth, exposed via `--api`.
4. **Stable content-slide contract** — content slides use `.ls-slide__header`; hero/section slides are explicitly marked centered exceptions via `data-ls-slide-kind`.
5. **Misuse caught where agents already look** — mandatory static `validate` warns on content-slide misuse of full-slide utilities; optional browser QA measures actual rhythm.
6. **Strict CLI parsing** — unknown flags fail loudly with suggestions, because a typo that silently changes output shape is a correctness bug for an agent.

Non-negotiable constraints (unchanged from PROJECT.md):

- Generated decks stay plain editable HTML/CSS/JS with no runtime dependency on the package.
- No mandatory framework, bundler, or browser dependency; browser QA stays optional.
- Copyable registry model and validation-backed `authoring` metadata remain central.
- `add` does not auto-edit deck HTML.
- No old `layouts/*` / `ls-layout-*` APIs.

Because the package is pre-1.0 (currently 0.3.0) and its primary consumers follow instructions emitted by this same CLI, **default JSON output intentionally changes**. This ships as 0.4.0 with a changelog entry (Slice 8).

---

## Verified problem statements

All numbers re-measured against the current tree.

### P1 — Default discovery output is too large

- `catalog --json`: 70,333 bytes / ~2,395 lines (full `authoring` for all 40 items).
- `catalog --recommended --json`: 52,610 bytes (30 items still carry full `authoring`).
- `inspect templates/split --json`: 14,073 bytes (resolves the dependency closure and returns full summaries for every dependency).
- `skill show --all`: ~54 KB (SKILL.md + all references including the 30 KB generated catalog).

Agents need, in order: which item → exact snippet → load tags → (rarely) class-level API. The first three fit in a few KB.

### P2 — `inspect` load tags are per-item, hence wrong for templates

`inspectCommand()` calls `planCopies({ items: [item] })` per resolved item (`src/cli/deck-commands.mjs:290`). Template items have `files: []` (enforced by the `template_files` rule in `src/validation/registry.mjs`), so the requested template's own `load` is empty and the real tags are scattered across dependency entries. Correct paste guidance requires tags aggregated over the requested item's dependency closure.

### P3 — `agentRecommended` is too broad and would drift as a second field

30/40 items are `agentRecommended`. A `starter` tier is needed. Since every item will get an `agentLevel`, storing `agentRecommended` alongside it creates a permanent two-field invariant. Decision: **`agentLevel` is the only stored field; `agentRecommended` is computed** (`starter|recommended → true`) in summaries for output compatibility. Repo registry validation errors if the stored field remains after migration.

Note: enforcement lives in the hand-rolled `validateItemMetadata()` in `src/validation/registry.mjs` — `schemas/registry-item.schema.json` is referenced by no code and is documentation only. Both get updated, but the validator is the change that matters.

### P4 — `safeAnywhere` is item-level but safety is class-level

`utilities/layout` is `safeAnywhere: true` yet exposes `.ls-slide-fill` (only meaningful as a direct child of the `.ls-slide__inner` grid) and `.ls-center`/`.ls-center-start` (intentional-centering only). Class-scope metadata must live **inline with the item's authoring data keyed by class token**, not in a parallel array that can drift. Validation must check keys against `authoringClasses(item)` from `src/validation/authoring-api.mjs` — the union of `authoring.classes` and flattened `classGroups` — because some items (e.g. `components/card`) declare classes only via `classGroups`.

### P5 — Header/title offsets jump between slides, and that is half-intentional

Measured at 1600×900: hero/title slides put the title at ~333–410px (via `ls-slide-fill` + centering), content slides at ~124–128px. The hero offset is intentional; the problem is that nothing distinguishes an intentional hero from a content slide accidentally using hero utilities. Additionally, two header idioms coexist: all seven content templates use `<header class="ls-stack ls-stack--sm">` (gap `--ls-space-2`, no width cap) while `.ls-slide__header` in `registry/core/base/slide.css:85` uses gap `--ls-space-3` and `max-inline-size: 1080px` — and the blank init template plus four example decks already use `.ls-slide__header`. Target: one canonical content header (`.ls-slide__header`), explicit slide kinds, and no attempt to equalize hero vs content offsets.

### P6 — Nothing catches layout misuse in the mandatory path

`validate` never inspects slide-level layout patterns; `scripts/visual-qa-report.mjs` reports overflow only, and any future analysis logic currently has no invocation path (the script only prints a browser eval payload — there is no mode that consumes the collected JSON on the Node side).

### P7 — The arg parser silently tolerates unknown flags

`parseArgs` (`src/shared/args.mjs`) treats any undeclared `--flag` as a value option that consumes the next token: `catalog --breif --json` swallows `--json` and silently changes the output format. Every new flag this plan adds raises the cost of that behavior.

### P8 — Guidance lives in many literal strings, not just docs

Stale command recipes exist in `src/cli/agent-instructions.mjs`, but also as raw strings in `deck-commands.mjs` help texts and `initCommand`'s `nextSteps` array, `validation-commands.mjs` (validate help + `unknown_ls_class` hints at lines ~317/325 point to `catalog --json`, which will no longer contain classes), `text-output.mjs` agent blocks, `skill-command.mjs` help, and `agent-skill.mjs` (`runtimeNeutralInstruction`, `POST_INSTALL_INSTRUCTIONS`). A rewrite that only touches docs/skill files will leave contradictory guidance in CLI output. An automated stale-guidance test must cover `src/` too.

---

## Design decisions (pinned — no implementer coin-flips)

1. **No `--full` alias.** One name per mode. `--api` is the only rich-output flag.
2. **Flags are additive.** `inspect X --api --json` = default snippet payload **plus** `authoring`. `--with-dependencies` adds brief dependency summaries; `--with-dependencies --api` makes those summaries rich. `--readme` adds README for requested items only. No flag removes or reshapes default fields.
3. **No `--groups` mode.** Every brief catalog response includes a compact top-level `groups` count block for the filtered set instead.
4. **No per-item command strings.** `commandTemplates` appears once at top level of brief payloads.
5. **`agentLevel` is stored; `agentRecommended` is computed.** Stored `agentRecommended` becomes a repo-validation error after migration.
6. **Class scope metadata is `authoring.classMetadata`,** an object keyed by class token with `{ scopeType, safeAnywhere, description }`; keys validated against `authoringClasses(item)`.
7. **`.ls-slide__header` adopts the current template rhythm,** not vice versa: `--ls-slide-header-gap` defaults to `var(--ls-space-2)`. `--ls-slide-header-max-inline-size` defaults to the current `1080px`; visual QA screenshots decide whether to widen it before the slice merges. This means the blank template and the four example decks that already use `.ls-slide__header` get slightly tighter header spacing — review them in the same visual pass.
8. **Static slide-kind rules are containment-based, not tree-based.** The regex HTML tooling has no DOM tree, so "direct child of `.ls-slide__inner`" is not implementable; rules below are defined on per-slide HTML segments only, and `.ls-center` inside a content slide does **not** warn (centering a diagram cell is legitimate). Only `.ls-slide-fill` marks a full-slide layout.
9. **Metadata lands before CLI modes.** `--starter`/`--level` work the day they ship instead of "once a later track lands."
10. **Analysis gets an invocation path**: `visual-qa-report.mjs --analyze` reads collected JSON from stdin and prints warnings, backed by a pure module.
11. **Version 0.4.0** with a new `CHANGELOG.md` documenting the default-output break and the `--api` escape hatch.

---

## Implementation slices

Each slice ends green: targeted tests plus `pnpm test`, `pnpm validate:registry`, `pnpm validate:skills`, `pnpm validate:examples`; add `pnpm lint && pnpm fmt:check` when touching lint-sensitive code. Slices are ordered by dependency; commit per slice.

---

### Slice 0 — Strict argument parsing

**Files:** `src/shared/args.mjs`, every `parseArgs` call site (`deck-commands.mjs`, `validation-commands.mjs`, `skill-command.mjs`, `preview-command.mjs`), `tests/` (new `tests/args.test.mjs`).

**Changes:**

1. Extend the spec: `parseArgs(argv, { boolean: [...], value: [...], repeatable: [...], aliases: {...} })`. When `value` is present, the parser is strict: an option that is in neither `boolean` nor `value` (after alias resolution) throws `usageError` with a nearest-match suggestion (simple Levenshtein ≤ 2 against the known option names: "Unknown option --breif. Did you mean --brief?").
2. A `value` option must be followed by a non-flag token (or `=value`); another `--flag` as the value is an error.
3. Export a shared constant for the registry options every registry-touching command accepts: `REGISTRY_VALUE_OPTIONS = ["registry-root", "registry-url"]` (plus the legacy `registry` key so `rejectRemovedRegistryOption` still produces its dedicated message rather than a generic unknown-flag error).
4. Declare complete option sets at every call site. Audit each command for options it reads but never declared — known cases: `init` (`--template`, `--theme`, `--title`), `add` (`--dir`, `--base-dir`), `catalog` (`--type`, `--tag`, `--query`, `--limit`), `validate` (`--dir` via `args.dir` fallback), `doctor` (`--dir`), `validate-examples` (`--dir`), `generate-catalog` (`--output`), `skill` (`--reference`).

**Tests:**

- Typo'd flag fails with exit code 2 and a suggestion; `--json` is not swallowed.
- Every currently documented invocation in each command's `--help` text still parses (write this as a sweep: extract `--flag` tokens from each help string and assert they're declared — this test permanently prevents help/parser drift).
- Value flag with a missing value or a flag-as-value fails clearly.
- `--registry` still yields the dedicated "has been removed" message.

---

### Slice 1 — Registry metadata: `agentLevel`, `useCases`, `classMetadata`

**Files:** all `registry/**/registry-item.json`, `src/registry/source.mjs`, `src/validation/registry.mjs`, `schemas/registry-item.schema.json`, `tests/registry-resolution.test.mjs` / new metadata tests.

**Metadata model:**

```json
"agentLevel": "starter" | "recommended" | "advanced" | "experimental"
```

```json
"authoring": {
  "classMetadata": {
    "ls-slide-fill": {
      "scopeType": "direct-child-of-slide-inner",
      "safeAnywhere": false,
      "description": "Full-slide layouts that intentionally span the slide header/body rows. Not for ordinary content slides."
    },
    "ls-center":       { "scopeType": "centers-content-cluster", "safeAnywhere": false, "description": "Intentional centering only (hero/section)." },
    "ls-center-start": { "scopeType": "centers-content-cluster", "safeAnywhere": false, "description": "Intentional start-aligned centering (hero)." },
    "ls-fill":         { "scopeType": "within-constrained-area",  "safeAnywhere": false, "description": "Fills a height-constrained parent area." }
  }
}
```

`scopeType` enum: `anywhere`, `within-slide`, `within-slide-inner`, `direct-child-of-slide-inner`, `within-constrained-area`, `centers-content-cluster`.

**Tasks:**

1. Assign `agentLevel` to all 40 items and **delete stored `agentRecommended`**. Initial assignment:
   - `starter`: `core/base`, `templates/split`, `templates/three-cards`, `templates/title-hero`, `templates/section-divider`, the four themes, `animations/reveal`, `animations/fade`, `animations/slide-up`.
   - `recommended`: remaining previously-recommended stable components/utilities/templates.
   - `advanced`: dense/specialized items (e.g. `code-diff`, `http-exchange`, `file-tree`, `technical-walkthrough`) and anything previously not recommended.
   - `experimental`: none initially.
     Adjust by judgment during implementation; the invariant that matters is starter ≤ ~12 items.
2. Add short `useCases` (one line each) to all templates and themes; they become the primary selection signal in brief output. Examples: split → "Explain one concept with a visual plus supporting points."; three-cards → "Compare or group three related ideas."; metric-dashboard → "Show KPIs, progress, or measurable status."
3. Set `utilities/layout` `safeAnywhere: false` and add the `classMetadata` above.
4. `src/registry/source.mjs`: compute `agentRecommended` in `summarizeItem()` from `agentLevel` (fallback to stored field only while migrating; remove the fallback in this same slice once all items carry `agentLevel`). Include `agentLevel` in summaries.
5. `src/validation/registry.mjs` (`validateItemMetadata` and friends):
   - `agentLevel` required, enum-validated.
   - Stored `agentRecommended` in item JSON → error (`stored_agent_recommended`).
   - `classMetadata`: object; each key must start with `ls-` and be present in `authoringClasses(item)`; `scopeType` enum-validated; `safeAnywhere` boolean.
   - Contradiction rule: item `safeAnywhere: true` while any `classMetadata` entry has `safeAnywhere: false` → error.
   - Port `recommended_item_missing_snippet` to levels: starter/recommended `ls:component|utility|animation|template` items must provide a snippet.
6. Update `schemas/registry-item.schema.json` to match (and add a comment/description noting it is documentation; enforcement is `src/validation/registry.mjs`).

**Tests:** missing/invalid `agentLevel` fails; stored `agentRecommended` fails; `classMetadata` key not in `authoringClasses` fails (test with a `classGroups`-only item); contradiction rule fails; summaries expose computed `agentRecommended` and `agentLevel`; snippet requirement now keyed on level.

---

### Slice 2 — Brief catalog by default

**Files:** `src/registry/source.mjs` (or new `src/registry/summaries.mjs`), `src/cli/deck-commands.mjs`, `src/cli/text-output.mjs`, `src/cli/agent-instructions.mjs`, `tests/cli-output.test.mjs` + new.

**CLI surface:**

```sh
slidesls catalog --json                 # brief (NEW default)
slidesls catalog --starter --json       # only agentLevel=starter
slidesls catalog --level <level> --json
slidesls catalog --recommended --json   # starter + recommended (compat)
slidesls catalog --api --json           # brief fields PLUS authoring/files/deps (additive)
# existing filters unchanged and composable: --type --tag --query --limit
```

**Brief payload shape:**

```json
{
  "count": 40,
  "groups": [
    { "type": "ls:template", "count": 9 },
    { "type": "ls:component", "count": 16 }
  ],
  "items": [
    {
      "name": "templates/split",
      "type": "ls:template",
      "description": "Two-column slide template for a visual plus supporting points.",
      "tags": ["template"],
      "useCases": ["Explain one concept with a visual plus supporting points."],
      "agentLevel": "starter",
      "snippetCount": 1,
      "dependencyCount": 4,
      "themeAttribute": null
    }
  ],
  "commandTemplates": {
    "inspect": "slidesls inspect <item> --json",
    "inspectApi": "slidesls inspect <item> --api --json",
    "addDryRun": "slidesls add <item> --dir <deck> --dry-run --json"
  },
  "agentInstructions": {
    "notes": ["This is the brief catalog. Full authoring metadata: add --api."]
  }
}
```

`themeAttribute`/`styleTone`/`pairsWith` included only when set (themes). No per-item command strings. `--api` adds the current `summarizeItem()` fields (`authoring`, `files`, `registryDependencies`, `docs`, `rootClass`, `safeAnywhere`, …) to each item without removing brief fields.

**Tasks:**

1. `summarizeItemBrief(item, registryData)` (needs `registryData` for `dependencyCount` via `resolveItems` closure size minus one — or just `registryDependencies.length`; pin: **direct dependency count**, cheaper and adequate) and `catalogGroups(items)`.
2. Rework `catalogCommand()`: brief by default; `--api` merges rich fields; `--starter`/`--level` filter on `agentLevel`; `--recommended` filters computed `agentRecommended`.
3. `text-output.mjs` catalog block: keep the concise table; update the agent text block to point at default brief catalog, `--api` for authoring detail, and `inspect <item> --json` for snippets.
4. `agent-instructions.mjs`: replace `catalogRecommendedJson`/`catalogJson` recipes with `catalogJson` (brief), `catalogStarterJson`, `catalogThemesJson`, `catalogApiJson`. Downstream literal strings are finished in Slice 6, but recipes referenced by code must be coherent now.

**Tests:** default omits `authoring`; `--api` includes it _and_ still carries `useCases`/`agentLevel`; `groups` present and reflects active filters; `--starter` returns only starter; filters compose; brief payload for the full catalog stays under a size budget (assert < 12 KB — a regression tripwire for reintroduced bloat); migration note present.

---

### Slice 3 — Snippet-focused inspect by default

**Files:** `src/cli/deck-commands.mjs`, `src/cli/text-output.mjs`, `src/cli/agent-instructions.mjs`, tests.

**CLI surface (all additive):**

```sh
slidesls inspect <items...> --json                       # snippet + aggregate load (NEW default)
slidesls inspect <items...> --api --json                 # + authoring for requested items
slidesls inspect <items...> --with-dependencies --json   # + brief dependency summaries
slidesls inspect <items...> --with-dependencies --api --json  # dependency summaries rich
slidesls inspect <items...> --readme --json              # + readme for requested items
```

**Default payload per requested item:** `name`, `type`, `description`, `useCases`, `agentLevel`, `snippets[]` with `html`, `dependencyOrder` (full closure, e.g. `["core/base","utilities/layout","components/panel","components/card","templates/split"]`), `load: { links, scripts }` **aggregated over the closure** (`resolveItems` → `planCopies` on the whole closure → `tagsForWrites`), `themeAttribute` when set, `docs` path. Top-level `commandTemplates` + `agentInstructions` as in catalog. Dependency items do not appear as entries unless `--with-dependencies`.

**Structural-change note for agents:** the default response no longer contains dependency item entries; include a one-line note in `agentInstructions` ("Dependency details: add --with-dependencies; full authoring: add --api.") since this response changes shape, not just size.

**Tasks:**

1. Rework `inspectCommand()`: resolve each requested item's closure once; build snippet payloads; modes strictly additive.
2. Multi-item requests: per-item closures and per-item `load` (an agent pasting one template needs that template's tags; merging closures across requested items loses that mapping).
3. `inspectAgentInstructions()`: default next steps = `add --dry-run` → paste snippet → `validate` → preview; API mode adds "edit copied files carefully".
4. Text output: default shows snippet labels/paths + aggregate links/scripts; drop the per-dependency dump.

**Tests:** default includes snippet HTML and aggregate closure tags (assert `core/base` CSS links appear for `templates/split` despite `files: []`); default has no dependency `authoring`; `--api` adds requested-item authoring while keeping snippets; `--with-dependencies` adds brief summaries (no dependency snippet HTML); `--with-dependencies --api` makes them rich; `--readme` works; multi-item request keeps per-item load tags distinct.

---

### Slice 4 — Slide kinds, canonical content header, static layout validation

**Files:** `registry/core/base/slide.css`, `registry/core/base/registry-item.json`, `registry/templates/*/snippet.html`, `src/deck/templates.mjs`, `src/shared/html.mjs`, `src/validation/markup-structure.mjs`, `src/cli/validation-commands.mjs` (hints), `examples/*/index.html`, tests.

**Slide kind API:** `data-ls-slide-kind="content" | "hero" | "section"` on `.ls-slide`. Declared in `core/base` `authoring.dataAttributes` with values, plus usage rules ("content slides use a stable top `.ls-slide__header`; hero/section slides may intentionally center and may use `ls-slide-fill`").

**Header CSS (per pinned decision 7):**

```css
.ls-slide__header {
  display: grid;
  gap: var(--ls-slide-header-gap, var(--ls-space-2));
  max-inline-size: var(--ls-slide-header-max-inline-size, 1080px);
}
```

Declare both variables in `core/base` `authoring.cssVariables`.

**Markup changes:**

1. All seven content templates (`split`, `split-diagram`, `three-cards`, `metric-dashboard`, `code-plus-notes`, `api-flow`, `technical-walkthrough`): `data-ls-slide-kind="content"` on the section, `<header class="ls-slide__header">` replacing `ls-stack ls-stack--sm`.
2. `title-hero` → `data-ls-slide-kind="hero"`; `section-divider` → `data-ls-slide-kind="section"`. Centering utilities stay.
3. `src/deck/templates.mjs`: blank slide → `kind="content"` (already uses `.ls-slide__header`); minimal slide 1 stays hero-styled and gets `kind="hero"`; minimal slide 2 → `kind="content"` + `.ls-slide__header`.
4. Examples: add kinds; content slides move to `.ls-slide__header`; hero/section stay centered and marked.

**Static validation** (new rules in `validateDeckStructure`, warning-level; strict mode escalates like existing rules):

Add a `slideSegments(html)` helper to `src/shared/html.mjs`: locate `.ls-slide` start tags with match indices, slice the HTML between consecutive slide starts, return `{ attributes, html }` per slide. Rules per segment:

1. `invalid_slide_kind` — `data-ls-slide-kind` present with a value outside the enum.
2. `content_slide_full_height_layout` — kind is `content` and the segment contains class `ls-slide-fill`. Hint: use `.ls-slide__header` + body layout, or mark the slide `hero`/`section`.
3. `missing_slide_kind` — no kind attribute and the segment contains `ls-slide-fill` **and** (`ls-center` or `ls-center-start`). Hint: add `data-ls-slide-kind`. (Unmarked slides otherwise never warn — rollout-safe for existing decks.)

Deliberately no rule against `.ls-center` alone in content slides — centering a sub-area (diagram cell, panel) is legitimate; only `ls-slide-fill` marks a full-slide layout.

**Hint updates in the same slice:** `validateKnownClasses` hints (`validation-commands.mjs:317,325`) currently say "Run slidesls catalog --json to see valid public ls-\* classes" — brief output no longer lists classes. Change to `slidesls catalog --api --json` (and the class-owner warning already names the item; point its hint at `inspect <item> --api --json`).

**Tests:** every template snippet has a kind; content templates use `.ls-slide__header` and contain no `ls-slide-fill`; generated minimal/blank decks validate with zero new warnings; a fixture content slide with `ls-slide-fill` warns; unmarked fill+center fixture warns `missing_slide_kind`; invalid kind value warns; kind-less plain deck produces no new warnings; example validation passes.

**Visual gate before merge:** screenshot fresh minimal deck, `examples/template-gallery`, and one themed example at 1600×900; confirm header rhythm unchanged for template-derived slides and acceptable for the blank template/examples that inherit the `space-3 → space-2` gap tightening; decide the `max-inline-size` default from these screenshots.

---

### Slice 5 — Visual QA: collection payload + analyzable rhythm report

**Files:** `scripts/visual-qa-report.mjs`, new `src/validation/visual-rhythm.mjs`, new `tests/visual-rhythm.test.mjs`, `skills/.../references/preview-validation.md` (final wording in Slice 6).

**Architecture:** the browser eval payload only **collects** facts; a pure Node module **analyzes**; the script gains an `--analyze` mode so the analysis is actually reachable:

```sh
node scripts/visual-qa-report.mjs --eval | agent-browser --session slidesls-review eval --stdin > collected.json
node scripts/visual-qa-report.mjs --analyze < collected.json
```

`--analyze` reads collected JSON from stdin, runs `analyzeVisualRhythm()` from `src/validation/visual-rhythm.mjs`, prints `{ warnings, slides, summary }` JSON, exits 0 (warnings are advisory; screenshots stay authoritative).

**Collection payload additions (per slide):** explicit `data-ls-slide-kind`; class facts (`hasSlideFill`, `hasCenter`, `hasCenterStart`, and whether the centering class is inside the fill subtree); rects for slide, `.ls-slide__inner`, first `header`, first `.ls-title`, `.ls-slide__body`; derived `innerOffsetTop`, `headerOffsetTop`, `titleOffsetTop`, `bodyOffsetTop`. Keep existing overflow candidates and intentional-scroll detection unchanged.

**Kind inference (explicit attribute wins):**

1. fill subtree contains `.ls-center` → `section`
2. else fill subtree contains `.ls-center-start` → `hero`
3. else → `content`

Report `kindSource: "explicit" | "inferred"`.

**Analysis rules (absolute expectation first, median second):**

1. Expected content header top ≈ `innerOffsetTop` (derived from the collected rects, not hardcoded). Warn when a content slide's `headerOffsetTop` deviates by more than 24px (configurable constant).
2. Warn when a content slide's header/title offset exceeds 30% of slide height (catches decks where _every_ content slide is wrongly centered — a median can't).
3. Median cross-check across content slides only when ≥ 3 exist.
4. Hero/section slides exempt from rhythm warnings.

**Tests (pure, no browser):** consistent content offsets → no warnings; one deviant content slide → warned; all-centered content deck → warned via absolute rule; hero/section large offsets → exempt; explicit kind overrides inference; median skipped below 3 content slides; `--analyze` end-to-end with a fixture JSON on stdin; `--eval` output contains the required collection fields; `--help` works.

---

### Slice 6 — Skill-first guidance rewrite (docs, skill, CLI strings)

**Files:** `src/cli/agent-instructions.mjs`, `src/cli/text-output.mjs`, `src/cli/deck-commands.mjs` (help strings, `initCommand` `nextSteps`), `src/cli/validation-commands.mjs` (validate help), `src/cli/skill-command.mjs` (help), `src/skill/agent-skill.mjs` (`runtimeNeutralInstruction`, `POST_INSTALL_INSTRUCTIONS`), `README.md`, `docs/agent-workflow.md`, `docs/cli.md`, `docs/deck-contract.md`, `docs/registry-contract.md`, `skills/create-slides-with-slidesls/SKILL.md` + `references/*.md`, tests.

**Canonical agent workflow (everywhere it appears):**

```sh
# 1. Skill first
slidesls skill install <your-agent-skill-dir>/create-slides-with-slidesls   # or: skill link
# then read installed SKILL.md; references load on demand
# no-install fallback: slidesls skill show          (SKILL.md only, ~8 KB)
# full export fallback only: slidesls skill show --all

# 2. Incremental discovery
slidesls catalog --starter --json
slidesls catalog --type template --json
slidesls catalog --type preset --tag theme --json
slidesls inspect <item> --json
slidesls add <item> --dir <deck> --dry-run --json
slidesls validate <deck> --json
slidesls preview <deck>

# 3. Advanced only
slidesls inspect <item> --api --json
slidesls catalog --api --json
```

**Required changes:**

1. Demote `skill show --all` everywhere to "full export/fallback": `skillInfo().runtimeNeutralInstruction`, `POST_INSTALL_INSTRUCTIONS[2]`, skill help text, SKILL.md "Install, link, or read" section, `agentHelpBlock()` step 1.
2. SKILL.md rewrite: workflow steps 6–7 use brief catalog/snippet inspect; "Fast discovery map" routes workflow → `skill show`/installed SKILL.md, candidates → `catalog --json` (+filters), markup → `inspect <item> --json`, low-level API → `--api` modes, deep class reference → `skill show --reference catalog`; "Do not" section: replace `catalog --json`-as-API references with `--api`; add layout guidance (content → `.ls-slide__header` + `data-ls-slide-kind="content"`; hero/section marked and intentionally centered; never `ls-slide-fill` on ordinary content slides).
3. `references/deck-authoring.md`: add the slide-kind contract and canonical content-slide skeleton. `references/preview-validation.md`: add the collect→analyze pipeline from Slice 5.
4. Root help `agentHelpBlock()`: skill-first, then starter catalog, then snippet inspect; keep the preview/browser QA steps.
5. **Stale-guidance test** (new): scan `src/**/*.mjs`, `docs/**/*.md`, `skills/**/*.md`, `README.md`:
   - `skill show --all` may appear only with fallback/export wording nearby (same line or ±2 lines).
   - `catalog --recommended --json` and `inspect <item> --readme --json` as _primary first steps_ are gone (allowed only in compat/changelog contexts).
   - Every `slidesls <cmd> --flag` string found in guidance uses flags the parser declares (reuse Slice 0's extraction helper) — guidance can never reference a nonexistent flag again.

**Tests:** update `tests/skill-command.test.mjs` (runtime-neutral instruction mentions `skill show`, not `--all`-first; install/link still emit "Fully read"); `tests/cli-output.test.mjs` (root help skill-first, brief-first); the stale-guidance sweep above.

---

### Slice 7 — Generated catalog reference update

**Files:** `src/registry/catalog-doc.mjs`, regenerate `skills/.../references/catalog.md`, `tests/catalog-doc.test.mjs`.

1. Header note: "Deep reference. For normal authoring use `catalog --json` (brief) and `inspect <item> --json` (snippet) first."
2. Per item: emit `Agent level`, keep computed `Agent recommended`, render `classMetadata` (scope type + safe-anywhere + description per class).
3. Regenerate via `node bin/slidesls.mjs generate-catalog --registry-root .` — `pnpm validate:skills` enforces freshness, so this must land in the same commit as the renderer change.
4. Do not split the catalog file; brief CLI defaults are the primary fix.

**Tests:** doc contains the deep-reference note, agent levels, and class scope lines for `utilities/layout`.

---

### Slice 8 — Release: verification, version, changelog

1. Full sweep: `pnpm check` (runs lint, fmt, tests, registry/skills/examples validation, cli smoke) and `npm pack --dry-run`.
2. Optional visual QA (fresh minimal deck + `examples/template-gallery` + `examples/stress-gallery` + one themed example) using the Slice 5 pipeline; acceptance: content slides within tolerance, hero/section marked/exempt, no unexpected overflow.
3. Bump `package.json` to **0.4.0**.
4. Create `CHANGELOG.md`:
   - Breaking: `catalog --json` and `inspect --json` are now brief/snippet-focused; previous rich output via `--api` (and `--with-dependencies` for inspect's dependency entries).
   - Breaking: unknown CLI flags now fail with exit code 2.
   - Removed: stored `agentRecommended` in registry metadata (computed from new `agentLevel`).
   - Added: `agentLevel`, `authoring.classMetadata`, `data-ls-slide-kind`, `.ls-slide__header` variables, static layout warnings, visual rhythm analysis.
5. Update `PROJECT.md` "Implemented tooling" if command descriptions changed materially.

---

## Risks and mitigations

| Risk                                                               | Mitigation                                                                                                                             |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Default-output break surprises an early adopter                    | Pre-1.0; migration note inside both brief payloads; `--api` restores full data; CHANGELOG entry; 0.4.0 bump.                           |
| Strict parsing rejects a flag some doc still mentions              | Slice 0 help-string sweep test + Slice 6 guidance sweep test make parser/docs drift impossible.                                        |
| Header normalization shifts visuals in blank template + 4 examples | Pinned `--ls-slide-header-gap: var(--ls-space-2)`; explicit before/after screenshot gate in Slice 4.                                   |
| Static kind rules false-positive on legitimate decks               | Only `ls-slide-fill` (never bare `.ls-center`) triggers content warnings; unmarked slides warn only on fill+center; all warning-level. |
| `classMetadata` validated against the wrong class universe         | Keys checked against `authoringClasses(item)` (classes ∪ flattened classGroups), tested with a classGroups-only item.                  |
| Rhythm math untestable / unreachable                               | Pure `visual-rhythm.mjs` + `--analyze` stdin mode + fixture tests; browser payload only collects.                                      |
| Median logic misfires on small decks                               | Absolute expectation (from collected `innerOffsetTop`) is primary; median only at ≥ 3 content slides.                                  |
| Snippet mode ships broken paste guidance                           | Aggregate-closure load-tag test asserts `core/base` links appear for a `files: []` template.                                           |
| Brief output bloats back over time                                 | Size-budget regression test (< 12 KB for full brief catalog).                                                                          |

---

## Acceptance criteria

- Unknown flags fail with exit code 2 and a suggestion; every documented flag parses.
- `catalog --json` is brief (< 12 KB for all 40 items), includes `groups`, `useCases`, `agentLevel`, top-level `commandTemplates`, and a `--api` pointer; `--api` is additive; `--starter`/`--level` filter correctly.
- `inspect <item> --json` returns snippet HTML plus dependency-closure `load` tags; `--api`/`--with-dependencies`/`--readme` are additive; multi-item requests keep per-item load tags.
- All registry items carry validated `agentLevel`; stored `agentRecommended` is gone and computed in output; `utilities/layout` is `safeAnywhere: false` with validated `classMetadata` for `ls-slide-fill`, `ls-center`, `ls-center-start`, `ls-fill`.
- All content templates and generated content slides use `data-ls-slide-kind="content"` + `.ls-slide__header`; hero/section templates are marked; `validate` warns on content-slide `ls-slide-fill` and on unmarked fill+center slides; existing kind-less decks gain no warnings otherwise.
- `visual-qa-report.mjs --eval` collects offsets/kind facts; `--analyze` produces rhythm warnings from stdin JSON; analysis logic is fully unit-tested without a browser.
- All guidance (CLI help, JSON `agentInstructions`, `nextSteps`, validate hints, README, docs, SKILL.md, references, generated catalog) reflects the skill-first, brief-first workflow; the stale-guidance sweep passes.
- `pnpm check` and `npm pack --dry-run` pass; version is 0.4.0 with CHANGELOG.

---

## Review notes incorporated

Revised after two independent review rounds. Key corrections over the previous draft:

- **Reordered metadata before CLI modes** so `--starter`/`--level` work the day they ship (previous draft had a forward dependency on a later track).
- **Pinned all hedged decisions**: no `--full` alias; flags strictly additive (resolving "does `--api` include snippets?" — yes, additive); direct dependency count in brief output.
- **Corrected the schema assumption**: `schemas/registry-item.schema.json` is documentation-only; enforcement changes go in `src/validation/registry.mjs` (`validateItemMetadata`), including porting the existing `recommended_item_missing_snippet` invariant to levels.
- **Made static slide rules implementable**: the regex HTML tooling has no DOM tree, so rules are containment-based on new `slideSegments()`; dropped the un-implementable "direct child of slide inner" check and the false-positive-prone bare-`.ls-center` rule; rules are now disjoint (no double warnings).
- **Gave the rhythm analysis an invocation path** (`--analyze` stdin mode) — previously the pure module was only reachable from tests.
- **Extended the guidance rewrite to literal CLI strings** (`initCommand` nextSteps, validate help and `unknown_ls_class` hints, `agent-skill.mjs` instructions) with a sweep test covering `src/`, not just docs.
- **Fixed the validate-hint contradiction**: `unknown_ls_class` hints must point to `catalog --api --json` once brief is the default.
- **Added a release slice** (0.4.0, CHANGELOG) — the previous draft broke defaults without a versioning story.
- **Added regression tripwires**: brief-catalog size budget, help-string/parser sweep, aggregate-load-tag test pinned to the `files: []` template case.

---

## Implementation Progress

Tracker started: 2026-07-03

### Status legend

- [ ] Not started
- [~] In progress
- [x] Complete
- [!] Blocked / needs decision

### Decomposition

- [~] Slice 0 — Strict argument parsing
- [ ] Slice 1 — Registry metadata: `agentLevel`, `useCases`, `classMetadata`
- [ ] Slice 2 — Brief catalog by default
- [ ] Slice 3 — Snippet-focused inspect by default
- [ ] Slice 4 — Slide kinds, canonical content header, static layout validation
- [ ] Slice 5 — Visual QA collection + analyzable rhythm report
- [ ] Slice 6 — Skill-first guidance rewrite
- [ ] Slice 7 — Generated catalog reference update
- [ ] Slice 8 — Release verification/version/changelog

### Work log

- 2026-07-03: Read full plan before editing. Created this tracker. Launched read-only `scout` subagent (`15fd5913-b9cc-4c7a-9655-18065e6535bb`) for implementation context; no project/source edits by subagent.

### Validations

- Pending.

### Independent reviews

- Pending after major implementation steps.

### Deviations / decisions

- None so far.
- 2026-07-03: Implemented Slice 0 strict args, Slice 1 registry metadata migration/validation, Slice 2 brief catalog, Slice 3 snippet-focused inspect, and initial Slice 4/5 code paths. Changed `src/shared/args.mjs`, CLI command arg declarations, registry metadata JSON, registry summaries/validation, catalog/inspect command output, agent instructions/text output, slide-kind/header markup/CSS/examples, static slide-kind validation, visual rhythm module/script, schema, and tests. Validation run: `pnpm test` passed; `pnpm validate:registry` passed; `pnpm validate:examples` passed.
- 2026-07-03: Addressed independent review findings: JSON error path no longer swallows `--json`, JSON output compacted to meet brief catalog <12KB budget, visual QA fill/center inference fixed for same-element classes, class-owner hint now points to `inspect <item> --api --json`, added parser/help sweep, stale-guidance sweep, registry negative tests, inspect mode tests, visual QA tests. Completed Slice 6 guidance rewrite, Slice 7 generated catalog update, Slice 8 version/changelog/package inclusion. Ran `pnpm test` (103 passing), `pnpm validate:registry`, `pnpm validate:skills`, `pnpm validate:examples`, `pnpm check`, and `npm pack --dry-run`; all passed. `pnpm fmt` was run to satisfy formatting. `.gitignore` now ignores `.pi-subagents/` artifacts.
- 2026-07-03: Final reviewer blockers addressed: leading/root unknown flags now fail with JSON usage errors when `--json` is present (`node bin/slidesls.mjs --breif --json`), and `package.json` now includes `scripts/visual-qa-report.mjs` in the package files. Added a regression test for leading root unknown flags. Re-ran `pnpm check` (passed, 104 tests) and `npm pack --dry-run --json` with assertion that `scripts/visual-qa-report.mjs` is included (passed, 212 files).
- 2026-07-03: Follow-up review `6daab15e` confirmed root unknown-flag blocker resolved with no remaining material blockers. `improve-skills` reflection: no reusable skill update warranted; implement-plan already requires rerunning review after material final fixes.
- 2026-07-03: Follow-up review `e352ca98` confirmed package-files blocker resolved and no remaining blockers. Final independent reviews are aligned.
