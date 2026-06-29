# Plan: slidesls Cleanup, Documentation, Command Completion, and Publish Readiness

Date: 2026-06-29
Status: Implemented
Project: slidesls

## Context

The repo now has a working v0.1 CLI MVP for `slidesls` with `init`, `add`, `catalog`, `inspect`, `validate`, and `preview`. The project is not yet clean or publish-ready: old `ls_slides` / `ls-slides` docs and skill scripts remain, root docs are only partially rewritten, command coverage is incomplete, package metadata is still private/dev-oriented, and full validation is blocked by a local pnpm version mismatch.

The desired next outcome is a lean, simple, publishable authoring tool: one canonical CLI, one canonical skill, one registry contract, one docs model, minimal duplicate scripts, and no stale product identity.

## Goals

- Finish the transition from `ls_slides` / `ls-slides` to `slidesls` everywhere non-historical.
- Make the repo structure clean and easy to understand.
- Replace old helper scripts with CLI commands or thin temporary wrappers, then remove wrappers before publishing if no external users depend on them.
- Normalize README/docs so agents and humans see one workflow.
- Complete the wanted CLI command set for a publishable MVP:
  - `init`
  - `add`
  - `catalog`
  - `inspect`
  - `validate`
  - `preview`
  - `doctor`
  - internal/public validation helpers for registry/examples/skills as needed.
- Defer `snapshot` until after the cleanup/publish MVP unless a dependency-free strategy is separately approved.
- Keep generated decks plain HTML/CSS/JS and dependency-free.
- Keep package dependencies minimal; avoid mandatory Playwright/Puppeteer/browser bundles.
- Prepare npm packaging and release checks without publishing until the user explicitly approves.

## User constraints

- The project should be super clean, lean, and simple.
- No mandatory framework, bundler, Tailwind, or runtime npm dependency in generated decks.
- The CLI is an authoring tool, not a runtime requirement.
- Cleanup is required, not optional.
- Avoid parallel old/new systems lingering indefinitely.

## Research performed

- Inspected current git state after the v0.1 CLI MVP commits.
- Inspected current README/docs/skill/script structure.
- Searched for stale `ls_slides`, `ls-slides`, old helper script, and old skill path references.
- Confirmed current CLI coverage and missing commands.
- Confirmed existing untracked files are unrelated: `context.md` and `.plans/2026-06-29-slidesls-npm-cli-anywhere-deck-authoring.html`.

No external web research is required for the cleanup plan itself; npm publish mechanics should be verified during implementation with local `npm pack --dry-run`, `npm view`, and npm documentation only if behavior is unclear.

## Decisions

1. **One canonical user-facing tool: `slidesls`.** All non-historical docs and command examples should use `slidesls`.
2. **Keep old skill scripts only as short-lived wrappers.** For a clean pre-publication repo, remove them before publish once command parity and skill docs are migrated.
3. **Make `src/` the only implementation home.** Project scripts can call CLI internals, but core logic should not live under `skills/`.
4. **Keep browser functionality optional.** `snapshot` should use an available system/browser mechanism or documented agent-browser workflow; it must not add heavyweight mandatory dependencies to the base package.
5. **Prefer fewer docs with clearer ownership.** Root README is quickstart; `docs/cli.md`, `docs/registry-contract.md`, `docs/deck-contract.md`, `docs/agent-workflow.md`, and `docs/publishing.md` carry details. Registry item READMEs remain local item API docs.
6. **Publish only after package tarball testing.** `npm pack --dry-run` and temp global/local install tests are publish gates.
7. **Do not rewrite historical `.plans/` content except current implementation plans.** Historical old names can remain in old plans.
8. **Publish package name:** use `@maxedapps/slidels` as the npm package name, while keeping the CLI binary `slidesls`.
9. **Repository URL:** leave GitHub/repository metadata TBD until the canonical public URL is chosen.
10. **Keep the deck API prefix:** `.ls-*` and `data-ls-*` remain the stable CSS/HTML API.
11. **Defer snippets/metadata v2 expansion** until after the cleanup/publish MVP.
12. **Cleanup artifacts:** keep `.plans/` Markdown history, ignore rendered `.plans/*.html`, and delete `context.md`.

## Alternatives considered

### A. Keep all old scripts permanently as compatibility aliases

Rejected for the desired clean/lean project. Permanent aliases create two operational surfaces, duplicate docs, and more validation burden. Temporary wrappers are acceptable only while docs and tests migrate.

### B. Move everything into one large `bin/slidesls.mjs` file

Rejected. It is superficially lean but harder to test and maintain. The current `src/` split is appropriate if kept small and dependency-free.

### C. Add Playwright/Puppeteer now for snapshots

Rejected for publish MVP. It conflicts with the lightweight authoring-tool identity. Snapshot can be deferred or implemented through optional system Chrome/CDP/agent-browser guidance later.

### D. Leave docs cleanup until after publishing

Rejected. Docs are part of the agent API. Publishing with mixed names and old workflows would make the package feel unfinished.

## Implementation phases

### Phase 0 — Validation environment and artifact hygiene

- [ ] Fix the pnpm validation environment before further cleanup:
  - prefer Corepack using the pinned `pnpm@11.1.1`, or
  - deliberately update `packageManager` and lockfile if the project should move to a newer pnpm.
- [ ] Delete untracked `context.md`.
- [ ] Add rendered plan HTML artifacts to `.gitignore`:
  - `.plans/*.html`.
- [ ] Keep `.plans/*.md` tracked for historical implementation context.
- [ ] Run current targeted validation to establish a clean baseline.

### Phase 1 — Command inventory and CLI surface freeze

- [ ] Decide the exact publish-MVP command list:
  - required: `init`, `add`, `catalog`, `inspect`, `validate`, `preview`, `doctor`;
  - post-MVP: `snapshot`;
  - internal/public repo checks: `validate-registry`, `validate-examples`, `generate-catalog` if still needed.
- [ ] Add `slidesls --help` and per-command `--help` snapshots to smoke tests.
- [ ] Document command stability in `docs/cli.md`.
- [ ] Ensure all commands support `--json` where useful for agents.
- [ ] Normalize command names and options:
  - prefer `--dir` for project directory;
  - prefer `--registry-root` for local repo source;
  - avoid adding aliases unless necessary.

### Phase 2 — Complete missing lean commands

#### `slidesls doctor`

- [ ] Implement dependency-free `doctor`.
- [ ] Check:
  - Node version satisfies `package.json#engines`.
  - CLI version and package metadata are readable.
  - Current working directory/config discovery health.
  - `slidesls.json` parseability when present.
  - entry file existence when config exists.
  - registry availability for bundled/local source.
  - write permission for project dir when applicable.
  - optional browser/snapshot capability as informational only.
- [ ] Support `--dir` and `--json`.
- [ ] Exit non-zero only for real environment/config failures; warnings for optional capabilities.
- [ ] Add doctor to CLI smoke tests.

#### `slidesls validate-registry`

- [ ] Move `scripts/validate-registry.mjs` logic into `src/validation/registry.mjs`.
- [ ] Add CLI command `slidesls validate-registry`.
- [ ] Keep `scripts/validate-registry.mjs` as a temporary wrapper or delete it after package scripts are migrated.
- [ ] Preserve current validation behavior and add checks from the plan where simple:
  - all metadata indexed;
  - no duplicate names/paths;
  - safe repo-relative paths;
  - known item/file types;
  - dependency cycles;
  - docs exist;
  - JS syntax check.

#### `slidesls validate-examples`

- [ ] Move `scripts/validate-examples.mjs` logic into `src/validation/examples.mjs`.
- [ ] Add CLI command `slidesls validate-examples`.
- [ ] Keep or remove project script wrapper based on final cleanup policy.
- [ ] Ensure it validates example asset links and minimal template hooks during migration.

#### `slidesls generate-catalog` or `slidesls catalog-doc`

- [ ] Decide whether generated skill catalog remains necessary after docs cleanup.
- [ ] If yes, move `skills/ls-slides/scripts/generate-catalog.mjs` logic into `src/registry/catalog-doc.mjs` and expose `slidesls generate-catalog --check` as an internal command.
- [ ] If no, remove generated catalog and rely on `slidesls catalog --json` plus item READMEs.
- [ ] Prefer removal if it simplifies the agent workflow without losing important context.

#### `slidesls snapshot`

- [ ] Defer `snapshot` from the publish MVP.
- [ ] Document it as a future optional browser workflow in `docs/cli.md` / `docs/validation.md`.
- [ ] Do not add Playwright/Puppeteer or any other mandatory browser dependency for the cleanup/publish MVP.

### Phase 3 — Simplify package scripts around the CLI

- [ ] Replace direct old script calls in `package.json`:
  - `validate:registry` -> `node bin/slidesls.mjs validate-registry`.
  - `validate:examples` -> `node bin/slidesls.mjs validate-examples`.
  - `validate:skills` -> `node bin/slidesls.mjs generate-catalog --check` or remove if catalog is removed.
  - `serve:deck` -> `node bin/slidesls.mjs preview` or remove if redundant.
- [ ] Keep `serve:examples` only if examples server remains distinct and valuable; otherwise replace with `slidesls preview examples/...` guidance.
- [ ] Keep scripts minimal:
  - `lint`
  - `fmt`
  - `fmt:check`
  - `check`
  - `cli:smoke`
  - publish dry-run/check scripts.
- [ ] Resolve the pnpm version mismatch so `pnpm check` is actually runnable:
  - use Corepack with `pnpm@11.1.1`, or
  - update `packageManager` and lockfile deliberately if the repo should use `11.9.0`.

### Phase 4 — Skill migration and old script cleanup

- [ ] Rename `skills/ls-slides/` to `skills/slidesls/`.
- [ ] Rewrite `skills/slidesls/SKILL.md` around the CLI workflow:
  1. clarify deck goal;
  2. run `slidesls init` or inspect existing `slidesls.json`;
  3. use `slidesls catalog` / `slidesls inspect`;
  4. run `slidesls add`;
  5. author/edit plain HTML;
  6. run `slidesls validate`;
  7. run `slidesls preview`;
  8. optionally use browser tools for visual review;
  9. iterate.
- [ ] Rewrite skill references to use `slidesls` commands only.
- [ ] Update `skills/README.md` to reference `skills/slidesls/`.
- [ ] Remove `skills/ls-slides/scripts/` after CLI command parity is covered.
- [ ] Remove `skills/ls-slides/assets/minimal-deck.html` if `slidesls init --template minimal` fully replaces it; otherwise move it under `src/deck/templates/` or `examples/templates/` as the single source.
- [ ] Update validation paths accordingly.
- [ ] Grep for `skills/ls-slides` and old script names; only historical `.plans/` may remain.

### Phase 5 — README and docs normalization

#### Docs ownership

- [ ] Collapse duplicate docs: canonical contract/workflow docs live under `docs/`.
- [ ] `skills/slidesls/SKILL.md` should link to or summarize `docs/` content instead of maintaining parallel long-form references.
- [ ] Remove or drastically reduce `skills/*/references/` after equivalent canonical docs exist.

#### Root-level docs

- [ ] Rewrite root `README.md` as the concise product quickstart:
  - what `slidesls` is;
  - install/run locally before publish;
  - npm usage after publish;
  - core commands;
  - generated deck philosophy;
  - validation/publish status.
- [ ] Rewrite `PROJECT.md` as architecture/vision only, not command docs.
- [ ] Replace `docs/README.md` with a lean docs index.
- [ ] Create or normalize:
  - `docs/cli.md`;
  - `docs/registry-contract.md`;
  - `docs/deck-contract.md`;
  - `docs/agent-workflow.md`;
  - `docs/validation.md`;
  - `docs/publishing.md`.
- [ ] Remove or merge stale docs:
  - `docs/modern-platform-strategy.md` may become `docs/vision.md` or be linked as design rationale;
  - `docs/primitive-authoring.md` and `docs/primitive-expansion.md` should be retained only if updated to `slidesls` naming and current workflows.

#### Registry docs

- [ ] Rewrite `registry/README.md` around:
  - item anatomy;
  - metadata contract;
  - copied asset paths;
  - snippets if present/future;
  - validation.
- [ ] Normalize category READMEs:
  - `registry/core/README.md`;
  - `registry/layouts/README.md`;
  - `registry/components/README.md`;
  - `registry/animations/README.md`;
  - `registry/presets/README.md`;
  - `registry/presets/fonts/README.md`.
- [ ] Normalize item READMEs to a simple required heading set:
  - `# <Item title>`;
  - `## Use when`;
  - `## Minimal markup`;
  - `## API`;
  - `## Variables`;
  - `## Accessibility`;
  - `## Copy/load order`.
- [ ] Defer README validator automation until after publish MVP; use manual review plus grep checks for now.
- [ ] Avoid over-writing item READMEs with generic boilerplate; preserve useful item-specific guidance.

#### Examples docs

- [ ] Rewrite `examples/README.md` around examples as validation/demo decks.
- [ ] Update each example README to explain:
  - purpose;
  - items demonstrated;
  - how to preview;
  - how it differs from generated downstream decks.
- [ ] Decide if examples should remain repo-relative or become true initialized `slidesls` projects. For lean MVP, keep repo-relative examples unless template conversion is needed.

### Phase 6 — Naming cleanup and path consistency

- [ ] Update `registry.json` name from `ls-slides` to `slidesls` if no downstream compatibility issue exists.
- [ ] Update metadata descriptions that say `ls_slides` to `slidesls`.
- [ ] Update copied asset examples from `ls-slides/` to `slidesls/`.
- [ ] Update lifecycle/event docs only if event names are product-facing; keep CSS class prefix `ls-` as the stable visual API unless there is a separate plan to migrate CSS class names.
- [ ] Run grep gates:
  - `grep -R "ls_slides\|ls-slides\|skills/ls-slides\|copy-items.mjs\|list-items.mjs\|inspect-item.mjs\|serve-deck.mjs"`.
- [ ] Allow old names only in historical `.plans/` files and possibly compatibility notes.

### Phase 7 — Deferred metadata/snippet expansion

- [ ] Do not include registry metadata v2 or snippet expansion in the cleanup/publish MVP.
- [ ] Preserve backward-compatible loader behavior for future additive fields.
- [ ] Add a short post-MVP note in `docs/registry-contract.md` that snippets may arrive later as optional plain HTML fragments.
- [ ] Revisit snippets only after the repo has one clean CLI, one clean skill, normalized docs, and package smoke tests.

### Phase 8 — Example/template consolidation

- [ ] Choose one source for built-in templates:
  - `src/deck/templates.mjs` for tiny `blank`/`minimal` templates;
  - `examples/templates/` only for richer future templates.
- [ ] Remove duplicate minimal-deck assets after skill migration.
- [ ] Keep MVP templates limited to `blank` and `minimal` unless richer examples are ready.
- [ ] Add temp-dir tests for both templates.
- [ ] Ensure generated templates validate with `slidesls validate`.

### Phase 9 — Publish hardening

- [ ] Use npm package name `@maxedapps/slidels` and keep binary name `slidesls`.
- [ ] Before final publish, verify whether `slidels` spelling is intentional despite the product/CLI name `slidesls`; if not, correct before `private: false`.
- [ ] Update `package.json`:
  - `private: false` only when ready;
  - `description`;
  - `version: 0.1.0` for first publish candidate;
  - `license`;
  - add a root `LICENSE` file;
  - `repository` only after canonical public GitHub URL is chosen;
  - `homepage` if available;
  - `bugs` if available;
  - `keywords`;
  - `engines`;
  - `bin`;
  - tight `files` allowlist.
- [ ] Add `prepack` or `pack:check` script that runs:
  - CLI smoke;
  - validators;
  - lint/format checks;
  - `npm pack --dry-run`.
- [ ] Inspect package contents:
  - includes `bin/`, `src/`, `registry/`, `schemas/`, required docs, and `skills/` only if the agent skill is intentionally shipped in the package;
  - excludes `.plans/`, `examples/` unless intentionally shipped, `context.md`, generated HTML plan previews, screenshots, temp artifacts.
- [ ] Test packed package in a temp folder:
  - `npm pack`;
  - install tarball locally or globally;
  - run `slidesls init`, `add`, `validate`, `preview`, `doctor`.
- [ ] Verify no runtime dependency is needed in generated decks.
- [ ] Keep publish as manual final step; do not run `npm publish` without explicit user approval.

### Phase 10 — Final cleanup gates

- [ ] Remove untracked/stale artifacts that should not remain:
  - delete `context.md`;
  - keep rendered plan HTML files untracked/ignored via `.gitignore`.
- [ ] Remove obsolete wrappers/scripts after replacement commands are validated.
- [ ] Run final grep for old names and old commands.
- [ ] Run full validation in exact package-manager environment.
- [ ] Request a fresh implementation review.
- [ ] Commit in small slices:
  1. commands/validation;
  2. package scripts;
  3. skill migration and script removal;
  4. docs normalization;
  5. snippets/templates if included;
  6. publish hardening.

## Validation

Use these commands throughout implementation:

```sh
node --check bin/slidesls.mjs
node scripts/test-cli-smoke.mjs
node bin/slidesls.mjs doctor --json
node bin/slidesls.mjs validate-registry --json
node bin/slidesls.mjs validate-examples --json
node bin/slidesls.mjs init /tmp/slidesls-clean-test --template blank --json
node bin/slidesls.mjs init /tmp/slidesls-clean-test-min --template minimal --json
node bin/slidesls.mjs add components/card --dir /tmp/slidesls-clean-test-min --json
node bin/slidesls.mjs validate /tmp/slidesls-clean-test-min --json
./node_modules/.bin/oxlint --no-error-on-unmatched-pattern
./node_modules/.bin/oxfmt --check .
pnpm check
npm pack --dry-run
```

Before publishing, additionally test the tarball:

```sh
npm pack
TMP_DIR="$(mktemp -d)"
cd "$TMP_DIR"
npm init -y
npm install /path/to/slidesls-*.tgz
npx slidesls init deck --template minimal --title "Packed Smoke"
npx slidesls add components/card --dir deck
npx slidesls validate deck
npx slidesls doctor --dir deck
```

## Risks / rollback

- **Over-cleaning breaks useful agent context.** Mitigate by preserving concise canonical docs before deleting old references.
- **Removing old scripts before CLI parity breaks checks.** Mitigate by migrating package scripts and smoke tests first, then deleting old scripts.
- **Snapshot command can bloat the package.** Mitigate by deferring or making it optional with no mandatory browser dependency.
- **README normalization can become a huge content rewrite.** Mitigate by using a required heading template and doing category/item batches.
- **Package tarball can miss registry files.** Mitigate with `npm pack --dry-run` and packed-tarball smoke tests.
- **Old names may remain in historical plans.** This is acceptable if grep gates explicitly allow `.plans/` historical content.

## Definition of done

- `slidesls` is the only non-historical product name in docs, scripts, config, and examples.
- Users can run all publish-MVP commands through `slidesls`.
- Old skill-local scripts are removed or reduced to explicitly temporary wrappers; no docs depend on them.
- Skill docs use the CLI workflow only.
- Root/docs/registry/example READMEs are consistent and concise.
- `pnpm check` passes in the pinned package-manager environment.
- `npm pack --dry-run` contents are clean.
- Packed tarball smoke test passes.
- Fresh peer review accepts the cleanup/publish-readiness implementation.
- `npm publish` is still manual and requires explicit user approval.

## Peer review summary

Fresh Claude review accepted the overall direction but requested revisions before finalization. Incorporated changes:

- Moved pnpm/environment cleanup to the front.
- Deferred `snapshot`, snippets, metadata v2 expansion, and README validator automation to keep the publish MVP lean.
- Added explicit docs ownership: canonical long-form docs under `docs/`, not duplicated in skill references.
- Added publish-readiness gaps: `LICENSE`, version bump, tarball contents decision, and repository URL TBD handling.
- Incorporated user decisions: package `@maxedapps/slidels`, binary `slidesls`, keep `ls-` API prefix, ship `doctor`, defer snippets, delete `context.md`, and ignore rendered `.plans/*.html`.

## Implementation progress

- [x] Phase 0 — Validation environment and artifact hygiene
  - Updated `packageManager` to local `pnpm@11.9.0`, deleted `context.md`, ignored `.plans/*.html`, and established a clean validation baseline.
- [x] Phase 1 — Command inventory and CLI surface freeze
  - Froze publish-MVP commands, added help coverage to smoke tests, and documented commands in `docs/cli.md`.
- [x] Phase 2 — Complete missing lean commands
  - Added `doctor`, `validate-registry`, `validate-examples`, and `generate-catalog` CLI commands backed by `src/` modules. `snapshot` remains deferred.
- [x] Phase 3 — Simplify package scripts around the CLI
  - Migrated validation/package scripts to `bin/slidesls.mjs` commands and added `pack:check`.
- [x] Phase 4 — Skill migration and old script cleanup
  - Renamed `skills/ls-slides` to `skills/slidesls`, rewrote skill docs around the CLI, removed skill-local scripts, and removed the duplicate minimal deck asset.
- [x] Phase 5 — README and docs normalization
  - Added canonical docs under `docs/`, rewrote root/registry/examples/skill docs, and reduced duplicated workflow references.
- [x] Phase 6 — Naming cleanup and path consistency
  - Updated non-historical `ls_slides` / `ls-slides` references to `slidesls` while preserving `.ls-*` / `data-ls-*` deck APIs.
- [x] Phase 7 — Deferred metadata/snippet expansion
  - Left snippets/metadata v2 post-MVP and documented future optional snippets.
- [x] Phase 8 — Example/template consolidation
  - Kept `src/deck/templates.mjs` as the built-in template source and added blank/minimal CLI smoke coverage.
- [x] Phase 9 — Publish hardening
  - Set package identity to `@maxedapps/slidels`, added `LICENSE`, metadata/files allowlist, dry-run pack check, and tarball smoke test.
- [x] Phase 10 — Final cleanup gates
  - Grep gate passes outside historical `.plans`; full validation and tarball smoke pass.

## Implementation validation

- `node --check bin/slidesls.mjs` — passed.
- `node --check src/cli/commands.mjs` — passed.
- `node --check src/validation/registry.mjs` — passed.
- `node --check src/validation/examples.mjs` — passed.
- `node bin/slidesls.mjs validate-registry --json` — passed.
- `node bin/slidesls.mjs validate-examples --json` — passed.
- `node bin/slidesls.mjs doctor --json` — passed.
- `node scripts/test-cli-smoke.mjs` — passed.
- `pnpm check` — passed with `pnpm@11.9.0`.
- `npm pack --dry-run` — passed.
- Packed tarball smoke (`npm install <tgz>`, `npx slidesls init/add/validate/doctor`) — passed.
- Grep gate for stale non-historical old names/old commands — passed.

## Implementation review

- Fresh Claude review accepted commit `9951c56` as-is.
- Optional nits addressed in follow-up commit `5c910c4`: removed dead template candidate, simplified CLI command parsing, and added `.mjs` to known registry file types.
- Reviewer noted `slidesls:ready` is an intentional pre-publish event rename from the old product name; no in-repo listeners depended on the old event.

## Implementation notes

- `private` remains `true`; publishing is still manual and requires explicit approval.
- Repository/homepage/bugs metadata remain unset until a canonical public URL is chosen.
- The package name intentionally remains `@maxedapps/slidels` per user decision, while the binary remains `slidesls`.
