# Plan: slidesls npm CLI and Agent-Primary Anywhere Deck Authoring

Date: 2026-06-29
Status: In Progress
Project: slidesls

## Context

The current `ls_slides` repo will become `slidesls`: a project-local copyable registry plus agent skill for vanilla HTML/CSS/JS slide decks. It already has core slide assets, layouts, components, animations, font presets, examples, validation scripts, and helper scripts for listing, inspecting, copying, catalog generation, and serving decks.

The new target is to make it as easy to use as HyperFrames is for motion graphics: an agent or human can run one npm CLI in any folder, initialize or prepare a deck project, add registry items, author slides, validate the result, preview it, capture screenshots when browser support is available, and iterate. Generated decks must remain plain editable HTML/CSS/JS with copied assets, not framework projects.

This is an intentional product-positioning pivot from the current `PROJECT.md` wording that says the project is not a CLI product or npm dependency. The refined identity is:

> `slidesls` ships an npm authoring CLI and agent skill. The CLI is not a required runtime dependency for generated decks; it copies registry assets into plain HTML/CSS/JS deck projects.

## Goals

- Publish a package exposing a `slidesls` CLI.
- Support creation and modification of deck projects anywhere on disk.
- Preserve copyable registry output; no mandatory framework, bundler, Tailwind, or runtime package in generated decks.
- Make agent operation first-class through machine-readable CLI outputs, deterministic manifests, strong validation, preview ergonomics, and rewritten skill docs.
- Refactor existing scripts into a clean package-ready CLI architecture.
- Upgrade registry metadata and snippets so agents can choose and apply primitives reliably.
- Convert examples/templates into reusable deck fixtures and use them as integration tests.

## User constraints

- Big refactors are desired.
- Clean implementation is preferred over incremental patching.
- Output decks stay vanilla HTML/CSS/JS.
- Registry remains copyable/editable.
- The tool should be as easy to use as HyperFrames.
- `init` is desirable for easy deck project creation or adding to an existing folder.

## Research performed

- Inspected current repo structure, `PROJECT.md`, registry metadata/assets, examples, skill files, scripts, docs, and validation setup.
- Researched HyperFrames official docs:
  - Introduction: HTML/CSS/JS compositions and deterministic rendering.
  - Quickstart: installable agent skills and `init` workflow.
  - CLI docs: `init`, `add`, `catalog`, `preview`, `lint`, `validate`, `snapshot`, `inspect`, `doctor`, project config.
  - Pipeline docs: named artifacts and validation loop.
  - Catalog docs: registry blocks/components and quality bar.
- Ran local validation successfully except `pnpm check`, which is blocked by local pnpm version mismatch (`11.9.0` vs pinned `11.1.1`).
- Ran fresh peer review of this plan with Claude CLI and incorporated the feedback.

## Decisions

1. Use `slidesls` as the product name and CLI binary name; if the unscoped npm package name is unavailable, use a scoped package while keeping the `slidesls` binary.
2. Add a Phase 0 to resolve identity/naming/schema decisions before implementation.
3. Keep generated deck projects dependency-free by default; the npm package is only an authoring tool.
4. Add `slidesls.json` as project-local authoring config, not a runtime requirement.
5. Add an upgraded manifest under copied item base dir to track copied files, hashes, registry source, CLI version, entry file, and generated link/script state.
6. Replace loose scripts with a real CLI while preserving current script behavior through command equivalents during migration.
7. Introduce item snippets as additive registry files; the CLI reads snippets when present instead of blocking on full migration.
8. Implement static validation before browser validation or snapshotting.
9. Defer risky HTML mutation such as `add --inject` until the safe copy/print-snippet workflow is solid.
10. Treat examples as the source of truth for richer `init --template` decks; MVP templates are only `blank` and `minimal`.
11. Browser-based validation and snapshots should be optional/lazy so base CLI install stays lightweight.
12. Default generated decks should avoid external icon CDNs; Lucide stays opt-in.

## Alternatives considered

### Keep current skill scripts only

Rejected. The scripts prove the model but are too fragmented for npm-level usability and HyperFrames-like ergonomics.

### Add a heavy generator/framework

Rejected. It conflicts with the copyable-registry identity and would make generated decks less editable.

### Rely only on `add` and skip `init`

Rejected for the npm product. `add` is essential, but `init` provides the easy first-run experience and can still remain a tiny plain-HTML bootstrap.

### Full shadcn compatibility

Deferred. The project is shadcn-inspired, but slide-specific metadata, snippets, deck config, and validation matter more now.

### Bundle a full browser automation stack in the MVP

Rejected for MVP. Browser validation and snapshots are valuable, but bundling heavyweight browser dependencies too early risks undermining the lightweight authoring-tool identity. Static validation, preview, and agent/browser-tool integration come first.

## Milestones

### v0.1 — Anywhere authoring MVP

- Identity and naming cleanup.
- Package-ready slidesls CLI foundation.
- `slidesls.json` and manifest v2.
- Commands: `init`, `add`, `catalog`, `inspect`, `preview`, `validate` with static validation.
- Strengthened registry validation.
- Temp-dir smoke tests.
- Updated README, `PROJECT.md`, and skill workflow for MVP.

### v0.2 — Registry usability and templates

- Metadata v2 additive migration.
- Snippets for important layouts/components first, then full coverage.
- README normalization for registry items.
- Examples as source-of-truth templates.
- Richer `init --template` options.
- Runtime polish that supports validation and authoring.

### v0.3 — Visual validation and publish hardening

- Optional browser validation.
- Optional snapshot command.
- Doctor command.
- Publishing metadata and release workflow.
- Package size and dependency audit.
- CI/GitHub Actions if desired.

## Implementation discipline

This plan should be implemented as small, reviewable slices even though the target architecture is a large refactor. Each slice should leave the repo in a valid state. Prefer deleting compatibility code after each replacement is proven instead of keeping parallel systems indefinitely.

Recommended slice size:

1. One command or one shared subsystem per PR/commit.
2. One metadata/schema migration batch per commit.
3. One README normalization batch per registry category, not all docs mixed with CLI logic.
4. One compatibility-wrapper removal per commit after the replacement command is covered by tests.
5. Validation first for every migrated surface: command tests before docs polish, schema checks before metadata expansion, static validation before browser checks.

Definition of done for each slice:

- focused smoke test exists or an existing one is updated;
- `pnpm lint`, `pnpm fmt:check`, and relevant validation commands pass where available;
- docs/README affected by the slice are updated in the same slice;
- obsolete files introduced by the replaced path are either removed or explicitly listed in the cleanup backlog.

## Implementation progress

- [x] Phase 0 — Product identity, naming, and schema baseline
  - Updated `PROJECT.md` to define `slidesls` as an npm authoring CLI plus copyable registry.
  - Canonical MVP names: CLI `slidesls`, config `slidesls.json`, copied asset dir `slidesls/`, local/bundled registry default.
  - Added local schema files instead of hosted schema URLs.
- [x] Phase 1 — Package-ready CLI foundation
  - Added `bin/slidesls.mjs` and `src/{cli,registry,deck,validation,server,shared}/`.
  - Added package `bin` metadata and JSON result/error contracts.
  - Added dependency-free arg parsing with `=` preservation and `--json` support.
- [x] Phase 2 — Project config and manifest v2
  - Added `slidesls.json` config helpers and schema.
  - Added manifest v2 helpers with copied files, hashes, source, entry, links, scripts, and dependency order.
- [x] Phase 3 — MVP CLI commands
  - Implemented `init`, `add`, `catalog`, `inspect`, `preview`.
  - `add` prints tags and does not mutate HTML by default.
- [x] Phase 4 — Static validation MVP
  - Implemented `slidesls validate` for config/entry, shell markup, local href/src assets, manifest hashes, runtime script, Lucide warning, and reveal-step warning.
  - Existing registry/example validators remain in place during migration.
- [x] Phase 5 — MVP smoke tests and docs
  - Added `scripts/test-cli-smoke.mjs` covering init/catalog/inspect/add/validate/preview JSON.
  - Rewrote root `README.md` for the `slidesls` CLI quickstart.
- [ ] Later phases — metadata v2 snippets, full README normalization, examples-as-templates, runtime polish, browser validation/snapshots, doctor, publishing hardening, cleanup/removal.

## Implementation validation log

- `node --check bin/slidesls.mjs` — passed.
- `node --check src/cli/commands.mjs` — passed.
- `node scripts/test-cli-smoke.mjs` — passed.
- `node scripts/validate-registry.mjs` — passed.
- `node scripts/validate-examples.mjs` — passed.
- `node skills/ls-slides/scripts/generate-catalog.mjs --registry-root . --check` — passed.
- `./node_modules/.bin/oxlint --no-error-on-unmatched-pattern` — passed.
- `./node_modules/.bin/oxfmt --check bin src schemas scripts/test-cli-smoke.mjs package.json README.md PROJECT.md .plans/2026-06-29-slidesls-npm-cli-anywhere-deck-authoring.md` — passed.
- Fresh Claude implementation review found one required fix: preview needed MIME types for module scripts. Fixed by adding extension-based `Content-Type` headers and a smoke-test assertion for `slide-runtime.js`. Also copied local schema files into initialized projects to satisfy generated `$schema`.
- Full `pnpm check` not run because this environment's pnpm version is known to mismatch the repo-pinned `pnpm@11.1.1`.

## Implementation phases

### Phase 0 — Product identity, naming, and schema baseline

- [ ] Update `PROJECT.md` at the start to reflect the new identity:
  - npm CLI authoring tool is in scope.
  - generated decks remain runtime-free plain HTML/CSS/JS.
  - registry remains copyable and editable.
  - no framework/build system by default.
- [ ] Decide canonical names:
  - CLI binary: `slidesls`.
  - npm package name/scope: tentatively `slidesls`; verify availability before publishing. If unavailable, use a scoped package such as `@maxedapps/slidesls` while keeping the binary `slidesls`.
  - repo/registry branding: normalize all current `ls_slides` and `ls-slides` product references to `slidesls`, except historical plan notes where preserving history is useful.
- [ ] Decide schema URL strategy:
  - Do not emit `https://slidesls.dev/...` unless that domain is owned and will serve schemas.
  - Ship JSON schemas in the package/repo first.
  - Use stable schema IDs once hosting is real.
- [ ] Decide default registry source strategy:
  - local development uses `--registry-root`.
  - published CLI can use bundled registry, remote raw GitHub registry, or both; decide before package publishing.
- [ ] Decide default icon policy:
  - no external CDN in generated decks by default.
  - inline SVG/text markers by default.
  - Lucide support remains opt-in.

### Phase 1 — Package-ready slidesls CLI foundation

- [ ] Create package-oriented structure:

```txt
bin/
  slidesls.mjs
src/
  cli/
  registry/
  deck/
  validation/
  server/
  shared/
registry/
skills/
docs/
examples/
```

- [ ] Add `bin` field to `package.json` for `slidesls`.
- [ ] Keep package private during development if needed; prepare public metadata later.
- [ ] Move reusable logic from `skills/ls-slides/scripts/lib/registry-source.mjs` (current path; later rename/remove compatibility wrappers) into `src/registry/`.
- [ ] Improve arg parsing:
  - preserve values containing `=`.
  - support booleans, repeatable args, positional args, and `--json` consistently.
- [ ] Add consistent command result and error contracts:

```json
{ "ok": true, "data": {}, "warnings": [], "_meta": { "version": "0.0.0" } }
```

```json
{
  "ok": false,
  "error": { "code": "missing_config", "message": "...", "hint": "..." },
  "_meta": { "version": "0.0.0" }
}
```

- [ ] Define documented exit codes:
  - `0` success.
  - `1` validation or command failure.
  - `2` usage/argument error.
  - `3` environment error.
- [ ] Ensure every command supports `--help`; commands that agents use support `--json`.
- [ ] Preserve existing script entry points temporarily as wrappers or compatibility aliases.
- [ ] Add temp-dir smoke test harness now, not at the end.

- [ ] Add compatibility policy for old paths:
  - current helper scripts may remain as thin wrappers during v0.1;
  - wrappers must print deprecation guidance to use `slidesls <command>`;
  - wrappers are removed after CLI smoke tests and skill docs no longer reference them.
- [ ] Create cleanup checklist for files made obsolete by the CLI refactor.

### Phase 2 — Project config and manifest v2

- [ ] Define `slidesls.json`:

```json
{
  "$schema": "./slidesls/schema/slidesls.schema.json",
  "registry": "bundled",
  "paths": {
    "items": "slidesls",
    "entry": "index.html",
    "assets": "assets",
    "snapshots": "snapshots"
  }
}
```

- [ ] Implement config discovery from current directory upward, with `--dir` override.
- [ ] Implement config creation/update helpers.
- [ ] Add schema file for `slidesls.json`.
- [ ] Define upgraded manifest under `<itemsBase>/manifest.json`:
  - schema/version.
  - CLI version.
  - registry source.
  - entry file.
  - copied item names.
  - dependency order.
  - copied files with source path, target path, file type, sha256.
  - generated link/script suggestions or injected tags.
  - timestamps.
- [ ] Add schema file for manifest.
- [ ] Add manifest read/merge/write helpers.
- [ ] Add safe path and atomic write utilities.
- [ ] Define modified-file behavior:
  - normal validation warns when copied files differ from manifest hash.
  - strict validation can fail on drift.
  - update command later must not overwrite modified files without explicit approval.

### Phase 3 — MVP CLI commands

#### `slidesls init [dir]`

- [ ] Create or prepare target directory.
- [ ] Support `init .` for existing folders with safe overwrite checks.
- [ ] Write `slidesls.json`.
- [ ] Copy required core assets and starter items.
- [ ] Write `index.html` from template.
- [ ] Write manifest.
- [ ] MVP templates:
  - `blank` — shell only.
  - `minimal` — title slide plus one content slide.
- [ ] Support options:
  - `--template blank|minimal` for MVP.
  - `--title <text>`.
  - `--registry <url-or-path>`.
  - `--force`.
  - `--json`.
- [ ] Print next-step commands:

```sh
slidesls catalog
slidesls add layouts/two-column components/card
slidesls validate
slidesls preview
```

#### `slidesls add <items...>`

- [ ] Resolve config and registry source.
- [ ] Resolve dependencies in dependency order.
- [ ] Copy missing files safely.
- [ ] Update manifest.
- [ ] MVP behavior: print exact `<link>` / `<script>` tags and available snippets; do not mutate HTML by default.
- [ ] Support:
  - `--dir <project>`.
  - `--registry <url-or-path>`.
  - `--base-dir <relative>`.
  - `--include-docs`.
  - `--force`.
  - `--dry-run`.
  - `--json`.
- [ ] Defer `--inject` to a later phase; document it as future work.

#### `slidesls catalog`

- [ ] Replace current list script.
- [ ] Support `--type`, `--tag`, `--query`, `--limit`, `--json`.
- [ ] Output agent-parseable table/text by default.
- [ ] Include derived `title` and tags/use cases when available.

#### `slidesls inspect <item>`

- [ ] Replace current inspect script.
- [ ] Show metadata, dependency order, files, load guidance, snippets, README.
- [ ] Support multiple items and `--json`.
- [ ] Read snippets when present; do not fail when absent during migration.

#### `slidesls preview [dir]`

- [ ] Refactor current `serve-deck.mjs` into CLI command.
- [ ] Read entry path from config unless overridden.
- [ ] Support `--host`, `--port`, `--open`, `--json`.
- [ ] Auto-pick free port if requested or default port unavailable.
- [ ] In JSON output, print URL, root, entry, host, port, and process info useful for agents.

### Phase 4 — Static validation and registry validation

#### `slidesls validate [dir]`

- [ ] Implement static deck validation first:
  - config exists/valid or sensible default for explicit dir.
  - manifest valid when present.
  - copied files exist.
  - hashes match or warn on user modifications.
  - local `href`/`src` assets exist and stay inside project.
  - required deck shell exists:
    - `body.ls-page`.
    - `.ls-deck[data-ls-deck]`.
    - at least one `.ls-slide`.
    - `slide-runtime.js` module script.
  - validate runtime readiness expectations as browser-only later; static validator should only check markup.
  - the base layer declaration from `reset.css` is present when copied/linked.
  - CSS/JS references resolve.
  - genuine same-layer animation dependency: animation variants should have `animations/reveal` available before or alongside them in guidance.
  - `data-lucide` warns if Lucide script missing.
  - reveal elements have `data-step` or are direct children of `data-ls-reveal-sequence`.
- [ ] Avoid noisy link-order false positives because cascade layers control most CSS order.
- [ ] Support `--strict`, `--json`.
- [ ] Add validation result codes for agent branching.

#### Registry validation

- [ ] Strengthen existing `validate-registry`:
  - all metadata files under registry are indexed.
  - no duplicate item paths/names.
  - known item and file types.
  - safe repo-relative paths.
  - docs and declared snippets exist.
  - dependencies are strings and acyclic.
  - CSS files use expected cascade layer.
  - JS files syntax-check.
- [ ] Add schema files for registry metadata v1/v2.
- [ ] Update `pnpm check` to use the new command.

#### Example validation

- [ ] Keep `validate-examples` during migration.
- [ ] Ensure examples can pass static deck validation once converted.
- [ ] Add example item coverage reporting later in v0.2.

### Phase 5 — Tests and MVP documentation

- [ ] Add integration smoke tests using temp directories:

```sh
slidesls init /tmp/slidesls-smoke --template minimal --json
slidesls catalog --json
slidesls inspect layouts/title-hero --json
slidesls add components/card --dir /tmp/slidesls-smoke --dry-run --json
slidesls add components/card --dir /tmp/slidesls-smoke --json
slidesls validate /tmp/slidesls-smoke --json
slidesls preview /tmp/slidesls-smoke --json
```

- [ ] Add package scripts for CLI smoke tests.
- [ ] Keep these checks in `pnpm check` once stable:
  - lint.
  - format.
  - registry validate.
  - skill catalog validate.
  - example validate.
  - CLI smoke tests.
- [ ] Rewrite `README.md` around MVP quickstart:

```sh
npx slidesls init my-deck
cd my-deck
npx slidesls catalog --query dashboard
npx slidesls add layouts/two-column components/card
npx slidesls validate
npx slidesls preview
```

- [ ] Update `skills/slidesls/SKILL.md` for MVP lifecycle:
  1. clarify deck goal.
  2. run `init` or inspect existing config.
  3. use `catalog` / `inspect`.
  4. run `add`.
  5. author/edit slides.
  6. run `validate`.
  7. run `preview`.
  8. use available browser/screenshot tools for visual review.
  9. iterate.

### Phase 6 — Registry metadata v2 and snippets

- [ ] Define additive metadata v2 fields:
  - `name`.
  - `type`.
  - `title`.
  - `description`.
  - `tags`.
  - `useCases`.
  - `files`.
  - `registryDependencies`.
  - `snippets`.
  - `loadOrder` or `loadHints`.
  - optional `accessibilityNotes`.
  - optional `browserSupport`.
- [ ] Avoid high-rot fields in the first pass:
  - Do not require `compatibleWith` globally; derive compatibility from tags/types and README guidance.
  - Do not require vague `requiredHooks`; use snippets and validator-specific rules for known shell hooks instead.
- [ ] Keep backward compatibility during migration: derive `title` from `name` where missing.
- [ ] Add `snippet.html` to high-value layouts/components first:
  - title hero.
  - two/three column.
  - metric dashboard.
  - code explainer.
  - table.
  - timeline.
  - card.
  - callout.
  - metric/stat grid.
- [ ] Extend snippets to all layouts/components after validating the format.
- [ ] Add example snippets for animations/presets where useful.
- [ ] Update catalog generation to include tags, use cases, snippets, and load hints.
- [ ] Normalize item READMEs around:
  - Use when.
  - Minimal markup.
  - API / attributes.
  - Variables.
  - Accessibility / semantic notes.
  - Copy/load order.

### Phase 6.5 — Required README normalization

This phase is mandatory, not optional polish. The product is agent-primary, so READMEs are part of the tool API.

- [ ] Rewrite root `README.md` for the new `slidesls` quickstart and npm CLI model.
- [ ] Rewrite `registry/README.md` around the registry contract, item anatomy, snippets, and validation.
- [ ] Rewrite category READMEs:
  - `registry/core/README.md`;
  - `registry/layouts/README.md`;
  - `registry/components/README.md`;
  - `registry/animations/README.md`;
  - `registry/presets/README.md`;
  - `registry/presets/fonts/README.md`.
- [ ] Normalize every item README under `registry/**/README.md` to the same structure:
  - Use when;
  - Minimal markup;
  - API / attributes;
  - Variables;
  - Accessibility / semantic notes;
  - Copy/load order;
  - Related items / tags where useful.
- [ ] Rewrite `examples/README.md` and every example README after examples become template/integration projects.
- [ ] Rewrite skill READMEs/references to use `slidesls` commands only.
- [ ] Remove or rewrite stale `scripts/README.md` after old scripts become wrappers or are deleted.
- [ ] Add README validation checks where practical:
  - every registry item has README;
  - every registry item README contains required headings;
  - README command examples use `slidesls`, not old script paths.

### Phase 7 — Examples as templates and integration projects

- [ ] Decide example representation:
  - repo examples may reference local `registry/` for readability, or
  - converted examples may be true initialized downstream deck projects with copied `slidesls/` assets.
- [ ] Avoid duplicating template content: richer `init --template` decks should be sourced from examples/fixtures.
- [ ] Add examples/templates:
  - minimal deck.
  - pitch deck.
  - teaching/code deck.
  - dashboard/report deck.
  - visual narrative deck.
- [ ] Add `slidesls.json` to example projects where appropriate.
- [ ] Use examples as fixtures for validation and preview smoke tests.
- [ ] Keep generated snapshots out of git unless intentionally used as fixtures.
- [ ] Expand `init --template` after examples exist:
  - `pitch`.
  - `lesson`.
  - `dashboard`.
  - `visual`.

### Phase 8 — Runtime and deck contract polish

- [ ] Improve runtime navigation:
  - optional hash/query route for slide/step.
  - slide counter data attributes/events.
  - custom events for ready, slide change, step change.
- [ ] Improve export/print mode.
- [ ] Add optional fullscreen support.
- [ ] Add optional wake lock support.
- [ ] Keep all enhancements progressive and no-framework.
- [ ] Update deck contract docs and validation accordingly.
- [ ] Ensure `.ls-stage` remains optional unless the CSS/runtime contract changes; validator should match actual required shell only.

### Phase 9 — Optional browser validation and snapshots

- [ ] Add browser validation as optional functionality:
  - enabled by `--browser` or when dependency/environment is available.
  - static validation remains useful without browser support.
- [ ] Decide implementation strategy before coding:
  - connect to system Chrome/CDP if available, or
  - optional dependency/lazy install, or
  - document agent/browser-tool workflow instead of bundling browser automation.
- [ ] Browser validation should:
  - serve deck internally.
  - open entry.
  - assert `[data-ls-deck]` receives `data-ls-ready="true"`.
  - navigate all slides and steps.
  - check `?export=1`.
  - capture console errors and failed network requests.
- [ ] Implement `slidesls snapshot [dir]` after browser strategy is settled.
- [ ] Snapshot support:
  - `--slides all|active|1,3-5`.
  - `--steps all|final`.
  - `--export`.
  - `--out <dir>`.
  - `--json`.
- [ ] Save snapshot manifest with file paths and slide/step metadata.

### Phase 10 — Doctor and publish hardening

- [ ] Implement `slidesls doctor`.
- [ ] Check:
  - Node version.
  - CLI version.
  - registry reachability or bundled registry availability.
  - local config health.
  - write permissions.
  - browser availability for optional snapshot/browser validation.
- [ ] Support `--json`.
- [ ] Keep non-sensitive output; redact home paths in JSON if needed.
- [ ] Prepare package metadata:
  - package name/scope.
  - description.
  - license.
  - repository.
  - files allowlist.
  - engines.
  - bin.
- [ ] Decide whether registry ships inside npm package, remote GitHub, or both.
- [ ] Add release checklist.
- [ ] Add versioning policy.
- [ ] Add npm dry-run validation.
- [ ] Ensure package excludes generated examples/snapshots unless intended.

### Phase 10.5 — Cleanup and removal pass

This project should not keep duplicate old and new systems. After the CLI, config, validation, and skill migration are stable, do a deliberate cleanup pass.

- [ ] Remove or convert old project-level scripts that are superseded by CLI commands:
  - `scripts/serve-examples.mjs` may become `slidesls examples` later or stay only if examples server remains distinct;
  - `scripts/validate-registry.mjs` should become a wrapper for `slidesls validate-registry` or be removed;
  - `scripts/validate-examples.mjs` should become a wrapper for `slidesls validate-examples` or be removed.
- [ ] Remove or convert old skill-local scripts after command parity:
  - `skills/ls-slides/scripts/copy-items.mjs` -> `slidesls add`;
  - `skills/ls-slides/scripts/list-items.mjs` -> `slidesls catalog`;
  - `skills/ls-slides/scripts/inspect-item.mjs` -> `slidesls inspect`;
  - `skills/ls-slides/scripts/serve-deck.mjs` -> `slidesls preview`;
  - `skills/ls-slides/scripts/generate-catalog.mjs` -> `slidesls generate-catalog` or internal build command;
  - `skills/ls-slides/scripts/lib/registry-source.mjs` -> `src/registry/*`.
- [ ] Rename skill folder from `skills/ls-slides/` to `skills/slidesls/` once consumers and docs are updated; keep a short migration note if needed.
- [ ] Remove stale generated artifacts and untracked planning scratch files from repo state.
- [ ] Remove stale references to `ls_slides`, `ls-slides`, and `ls-slides/` copied asset paths, except intentionally historical plan notes.
- [ ] Collapse duplicated docs between `docs/`, `skills/*/references/`, and README files; keep one source of truth and generate derived catalog docs where possible.
- [ ] Delete compatibility wrappers after at least one release/milestone if this is still pre-publication; if already public, keep wrappers for one minor release with deprecation warnings.
- [ ] Re-run full repo grep for old names, old script paths, and obsolete config examples.

### Phase 11 — Docs restructure

- [ ] Refactor docs into:
  - `docs/vision.md`.
  - `docs/cli.md`.
  - `docs/registry-contract.md`.
  - `docs/deck-contract.md`.
  - `docs/agent-workflow.md`.
  - `docs/primitive-authoring.md`.
  - `docs/validation.md`.
  - `docs/publishing.md`.
- [ ] Keep `README.md` focused on quickstart.
- [ ] Fix stale `scripts/README.md` or remove it after CLI migration.
- [ ] Keep agent-readable references primary; any future docs site remains secondary.

### Phase 12 — Future commands

These are intentionally post-MVP:

- [ ] `slidesls update`
  - diff copied registry files.
  - respect user modifications via manifest hashes.
  - dry-run by default or require confirmation for overwrites.
- [ ] `slidesls remove`
  - remove copied items only when safely unused or with explicit force.
- [ ] `slidesls new-slide`
  - append snippets/layouts to `index.html` only after snippet metadata and HTML mutation are reliable.
- [ ] `slidesls add --inject`
  - conservative HTML insertion.
  - dry-run diff output.
  - backup before mutation.

## Validation

During implementation, each major phase should keep these commands passing where applicable:

```sh
node --check bin/slidesls.mjs
pnpm lint
pnpm fmt:check
pnpm validate:registry
pnpm validate:skills
pnpm validate:examples
```

After CLI MVP:

```sh
slidesls init /tmp/slidesls-smoke --template minimal --json
slidesls add components/card --dir /tmp/slidesls-smoke --json
slidesls validate /tmp/slidesls-smoke --json
slidesls catalog --json
slidesls inspect layouts/title-hero --json
```

Browser/snapshot validation when optional browser support is available:

```sh
slidesls snapshot /tmp/slidesls-smoke --slides all --json
```

## Risks / rollback

- Product identity drift: npm CLI could be mistaken for a required runtime package. Mitigate with upfront `PROJECT.md`, README, and generated-deck docs that clarify CLI as authoring tool only.
- Naming/schema drift: old `ls_slides` / `ls-slides` references can confuse registry URLs, copied asset paths, and publishing. Mitigate with Phase 0 naming cleanup and a final grep-based cleanup pass.
- Metadata v2 migration can break catalog generation. Mitigate with backward-compatible loaders and phased enforcement.
- HTML injection can corrupt unusual decks. Defer `--inject` until after MVP; start with printed tags/snippets.
- Hash-based manifests can conflict with intentional user edits. Treat modified copied files as warnings unless strict validation/update mode is requested.
- Browser automation can add install weight. Keep browser support optional/lazy and make static validation useful without it.
- Examples/templates can duplicate content. Make examples/fixtures the source of truth for richer `init --template` decks.
- Publishing package while preserving copyable registry can blur product identity. Docs must clearly say npm package is an authoring tool, not a deck runtime.

## Peer review summary

Claude CLI reviewed the draft plan and agreed with the overall direction, but recommended several changes that were incorporated:

- Move the identity pivot and `PROJECT.md` rewrite to Phase 0 instead of late docs cleanup.
- Resolve naming/schema/registry URL decisions before implementation.
- Keep browser automation optional and out of the MVP to avoid heavyweight installs.
- Add explicit v0.1/v0.2/v0.3 milestone cut lines.
- Add a machine-readable JSON error/result contract and exit codes.
- Avoid overzealous CSS load-order validation because cascade layers handle most ordering; validate only real dependencies and file availability.
- Defer risky `--inject` behavior.
- Make metadata v2 and snippets additive rather than gating the CLI MVP.
- Use examples as template source of truth to avoid duplicated deck content.
- Decide no-CDN icon defaults for generated decks.
- Move CLI smoke tests earlier so each command is covered as it lands.
