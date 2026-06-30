# Plan: Fix Review Findings and Add Focus-Focused CLI Tests

Date: 2026-06-30
Status: Implemented
Project: slidesls

## Summary

Fix all issues found in the deep codebase review before publish readiness: catalog grouping, validation brittleness, unreachable Lucide warning, misleading dry-run output, ambiguous registry option handling, package-name typo, publish/docs metadata consistency, preview symlink hardening, minor cleanup, and output-focused tests.

No deprecation is needed because the package has not been published.

## Confirmed user decisions

- Correct npm package name from `@maxedapps/slidels` to `@maxedapps/slidesls`.
- Remove the ambiguous `--registry <url-or-path>` API entirely; do **not** deprecate it.
- Keep explicit registry source options only:
  - `--registry-root <path>` for local registry checkouts.
  - `--registry-url <url>` for remote raw registry roots.
- Include focused tests/output assertions in the same implementation.
- Do not publish; keep publishing manual and separately approved.

## Current-state findings

### Broken / misleading behavior

- `src/registry/catalog-doc.mjs:6` groups only bare types (`core`, `layout`, etc.), but registry metadata uses `ls:*` types. Generated `skills/slidesls/references/catalog.md` currently groups all items under `Other`.
- `src/cli/commands.mjs:315` validates the runtime module script with an attribute-order-sensitive regex, so valid `<script src="...slide-runtime.js" type="module">` can fail.
- `src/cli/commands.mjs:334` checks `data-lucide` and then `!/lucide/i`, which can never warn because `data-lucide` contains `lucide`.
- `src/cli/commands.mjs:84` treats non-`bundled` `args.registry` as `registryRoot`, so URL values become bogus local paths.
- `src/cli/commands.mjs:589` prints `Copied undefined file(s)` for non-JSON `add --dry-run`.
- `package.json:2` uses `@maxedapps/slidels`, which must be corrected to `@maxedapps/slidesls`.
- `package.json:4` has `private: true`, intentionally blocking publish. Keep this guard unless the user explicitly approves publishing.
- `docs/registry-contract.md:10` documents bare item types even though real metadata uses `ls:*`.

### Hardening / cleanup opportunities

- `previewCommand` guards path traversal but does not resolve symlinks with `realpath`; a symlink inside a deck could expose files outside the root if preview is bound broadly.
- `bin/slidesls.mjs` re-parses args after command execution and again in the catch path; only needed for `--json` output selection.
- `src/shared/result.mjs` exports unused `printResult`.
- `src/deck/copy.mjs` dynamically imports `readFile` inside a loop.
- `addCommand` returns `snippets: []`, currently a placeholder. Keep only if intentionally part of the response contract; otherwise remove from command output.

### Test gaps

- `scripts/test-cli-smoke.mjs` mostly checks successful exits and one MIME header, not output shape/content.
- No focused tests cover:
  - catalog grouping for `ls:*` types,
  - runtime script attribute order,
  - Lucide warning,
  - dry-run text output,
  - `--registry` rejection,
  - registry URL/root routing,
  - path-safety helpers,
  - dependency resolution.

## Chosen implementation strategy

Use a focused publish-readiness cleanup slice:

1. Fix observable behavior and docs first.
2. Add `node:test` tests for the previously missed edge cases.
3. Keep the architecture intact; no broad refactor.
4. Remove unsupported `--registry` completely from code and generated docs. Because generic parsing accepts unknown options today, commands must explicitly reject `--registry` wherever registry selection might be relevant.
5. Keep only explicit `--registry-root` / `--registry-url`.
6. Keep `private: true`; only correct package name and metadata references.

This is preferable to a large CLI rewrite because the current architecture is good and validation already passes. The goal is to close concrete gaps, not re-architect.

## Alternatives considered

### Keep `--registry` and auto-detect URL vs path

Rejected by user. Since the package is unpublished, remove the ambiguous API instead of supporting multiple registry-source spellings.

### Deprecate `--registry`

Rejected by user. No public compatibility requirement exists.

### Silently ignore `--registry`

Rejected. This would not truly remove the API; it would create confusing no-op behavior. A user passing `--registry` should get a usage error.

### Leave package name as `@maxedapps/slidels`

Rejected by user. Correct to `@maxedapps/slidesls` before publish to avoid permanent npm naming confusion.

### Add a heavyweight test framework

Rejected. Node's built-in `node:test` and `assert` are enough and keep dev dependencies minimal.

## Implementation phases

### Phase 1 — Package name and docs consistency

- Update `package.json`:
  - `name`: `@maxedapps/slidesls`.
  - Keep `private: true`.
- Update package-name references:
  - `README.md` quickstart and package line.
  - `docs/publishing.md`.
  - any non-historical docs/skills mentioning `@maxedapps/slidels`.
- Do not rewrite historical `.plans/` files except this new plan.
- Verify no non-historical `slidels` remains:

  ```sh
  grep -R "slidels" --exclude-dir=node_modules --exclude-dir=.git .
  ```

  Only historical `.plans/` references are acceptable if any remain.

### Phase 2 — Remove and reject ambiguous `--registry`

- Update `src/cli/commands.mjs`:
  - Change `registrySource(args)` to use only `args["registry-root"]` and `args["registry-url"]`.
  - Remove `(args.registry && args.registry !== "bundled" ? args.registry : undefined)`.
  - In `initCommand`, stop setting config from `args.registry`; default config remains `bundled` unless a future explicit config option is designed.
- Add a small helper such as `rejectRemovedRegistryOption(args)`:
  - If `args.registry !== undefined`, throw `usageError("--registry has been removed", "Use --registry-root <path> or --registry-url <url>.")`.
  - Call it in registry-consuming commands:
    - `init`
    - `add`
    - `catalog`
    - `inspect`
    - `doctor`
    - `validate-registry`
    - `generate-catalog`
  - `validate`, `preview`, and `validate-examples` do not consume registry source and do not need the registry-source options.
- Update help text comprehensively:
  - `init --help`: include `--registry-root` / `--registry-url` if supported by implementation.
  - `add --help`: include `--registry-root` / `--registry-url`.
  - `catalog --help`: include `--registry-root` / `--registry-url`.
  - `inspect --help`: include `--registry-root` / `--registry-url`.
  - `doctor --help`: include `--registry-root` / `--registry-url` if doctor checks registry availability with overrides.
  - `validate-registry --help`: already includes both; verify.
  - `generate-catalog --help`: include both `--registry-root` and `--registry-url`.
  - `docs/cli.md`: consistently document `--registry-root` and `--registry-url`; remove any `--registry` examples.
- Add tests to assert:
  - `--registry-url <url>` creates remote `RegistrySource` mode.
  - `--registry-root <path>` creates local mode.
  - `slidesls catalog --registry foo --json` exits non-zero with usage error.
  - `--registry` is absent from command help and canonical docs.

### Phase 3 — Fix catalog generation

- Update `src/registry/catalog-doc.mjs`:
  - Normalize item types before grouping, e.g. strip `ls:` prefix.
  - Map:
    - `ls:core` / `core` -> `Core`
    - `ls:layout` / `layout` -> `Layouts`
    - `ls:component` / `component` -> `Components`
    - `ls:animation` / `animation` -> `Animations`
    - `ls:preset` / `preset` / `preset/font` -> `Presets`
- Regenerate catalog:

  ```sh
  node bin/slidesls.mjs generate-catalog --registry-root .
  ```

- Verify `skills/slidesls/references/catalog.md` now has `Core`, `Layouts`, `Components`, `Animations`, and `Presets` headings.
- Add unit tests for `groupName` with both bare and `ls:*` values.

### Phase 4 — Fix static HTML validation logic

- Replace brittle regex checks with small helper functions in `src/shared/html.mjs` or local helpers in `commands.mjs`.
- Add helper behavior:
  - Parse relevant start tags and attributes simply enough for current static validation.
  - Determine whether an element has a class token independent of attribute order.
  - Determine whether a `script` has `type="module"` and `src` containing `slide-runtime.js`, independent of attribute order.
  - Determine whether markup uses `data-lucide`.
  - Determine whether a Lucide script is present by checking `<script ... src="...lucide...">` or inline script content containing `lucide.createIcons` if needed.
- Update `validateCommand` checks for:
  - `body.ls-page`.
  - `.ls-deck[data-ls-deck]` independent of attribute order.
  - at least one `.ls-slide`.
  - module runtime script independent of attribute order.
  - Lucide warning should trigger when `data-lucide` exists and no Lucide script is present.
- Keep parser intentionally lightweight; do not add an HTML parser dependency.
- Add tests for:
  - valid runtime module script with `type` before `src`.
  - valid runtime module script with `src` before `type`.
  - non-module runtime script fails.
  - `data-lucide` without Lucide script warns.
  - `data-lucide` with Lucide script does not warn.

### Phase 5 — Fix dry-run text output

- Update `textFor("add", result)` in `src/cli/commands.mjs`:
  - If `result.data.dryRun`, output `Would copy N file(s). Add these tags if needed:` using `result.data.files.length`.
  - Otherwise keep `Copied N file(s)...`.
  - Guard links/scripts with defaults to avoid crashes if a future result shape changes.
- Add CLI output test for non-JSON `add --dry-run`:
  - It must not include `undefined`.
  - It must say `Would copy`.

### Phase 6 — Preview symlink hardening

- Update `previewCommand` static-file resolution:
  - Resolve requested target path under project root as today.
  - When target exists, use `realpath` on both project root and target before reading.
  - Assert real target remains inside real root.
  - Keep 404 behavior for missing/unsafe paths.
- Keep host default `127.0.0.1`.
- Add test:
  - Create temp deck with symlink inside deck pointing outside.
  - Start preview in a subprocess with `--port 0 --json`.
  - Request the symlink path.
  - Expect 404.
  - Always kill the preview subprocess in `finally` so `node:test` cannot hang.
  - Skip gracefully if symlink creation fails due to platform permissions.

### Phase 7 — Minor cleanup without broad refactor

- `src/deck/copy.mjs`:
  - Statically import `readFile` with existing fs imports.
  - Remove dynamic import inside loop.
- `src/shared/result.mjs`:
  - Remove unused `printResult` if no imports exist.
- `bin/slidesls.mjs`:
  - Factor the repeated boolean list into a shared constant or tiny `parseGlobalFlags` helper.
  - Do not change command behavior beyond cleanup.
- Decide `snippets: []`:
  - If future response shape intentionally reserves snippets, leave it and document as empty until snippet metadata exists.
  - If not needed, remove it from `addCommand` response and tests.
- Re-run lint/format after cleanup.

### Phase 8 — Add focused tests

Create a dependency-free test suite using Node's built-in test runner.

Suggested structure:

```txt
tests/
  cli-output.test.mjs
  catalog-doc.test.mjs
  html-validation.test.mjs
  registry-source.test.mjs
  shared-fs.test.mjs
  registry-resolution.test.mjs
```

Test areas:

- `catalog-doc.test.mjs`
  - `groupName("ls:core") === "Core"`.
  - `groupName("ls:layout") === "Layouts"`.
  - `groupName("ls:component") === "Components"`.
  - `groupName("ls:animation") === "Animations"`.
  - `groupName("ls:preset") === "Presets"`.
  - `renderCatalog` creates expected section headings for a small fake registry data set.
- `html-validation.test.mjs`
  - Use temp initialized decks or exported helper functions to validate runtime script order and Lucide warnings.
- `cli-output.test.mjs`
  - Spawn `node bin/slidesls.mjs add ... --dry-run` and assert text output.
  - Spawn `catalog --json` and assert JSON envelope/data shape includes item count and known item.
  - Spawn a registry-consuming command with `--registry` and assert non-zero usage error.
- `registry-source.test.mjs`
  - `new RegistrySource({ registryUrl }).describe().mode === "remote"`.
  - `new RegistrySource({ registryRoot }).describe().mode === "local"`.
- `registry-resolution.test.mjs`
  - `resolveItems` returns dependencies before requested items.
  - `resolveItems` rejects unknown items.
  - `resolveItems` rejects cycles.
- `shared-fs.test.mjs`
  - `assertSafeRelativePath` rejects absolute paths, `..`, and empty values.
  - `assertInside` rejects outside paths and accepts inside paths.
- Optional `preview.test.mjs`
  - Symlink escape returns 404 and subprocess cleanup is guaranteed.

Add package script:

```json
"test": "node --test tests/**/*.test.mjs"
```

Update `check` to include tests, preferably before validators catch generated/catalog drift:

```json
"check": "pnpm lint && pnpm fmt:check && pnpm test && pnpm validate:registry && pnpm validate:skills && pnpm validate:examples && pnpm cli:smoke"
```

Keep `scripts/test-cli-smoke.mjs` as integration smoke; new tests cover output/content edge cases.

### Phase 9 — Publish metadata and docs polish

- Update docs to mention package `@maxedapps/slidesls` consistently.
- Consider adding package metadata while still keeping `private: true`:
  - `author` if desired.
  - `repository`, `homepage`, `bugs` only once canonical public URL is known. If unknown, leave unset as currently documented.
- Do not add `prepublishOnly` unless the team wants publish hooks now. If added, use existing `pnpm pack:check` or a lighter check, but avoid making local development unexpectedly slow.
- Ensure `npm pack --dry-run` includes corrected package name and intended files.

## Files likely to change

- `package.json`
- `README.md`
- `docs/cli.md`
- `docs/publishing.md`
- `docs/registry-contract.md`
- `src/cli/commands.mjs`
- `src/registry/catalog-doc.mjs`
- `src/shared/html.mjs`
- `src/shared/result.mjs`
- `src/deck/copy.mjs`
- `skills/slidesls/references/catalog.md`
- new test files under `tests/`
- this plan file and rendered HTML

## Validation plan

Run after implementation:

```sh
node --check bin/slidesls.mjs
node --check src/cli/commands.mjs
node --check src/registry/catalog-doc.mjs
node --check src/shared/html.mjs
node --check src/deck/copy.mjs
node --check src/validation/registry.mjs
node --check src/validation/examples.mjs
pnpm test
pnpm check
npm pack --dry-run
```

Targeted behavioral checks:

```sh
node bin/slidesls.mjs generate-catalog --registry-root . --check
node bin/slidesls.mjs add components/card --dir /tmp/some-deck --dry-run
node bin/slidesls.mjs validate /tmp/deck-with-src-first-runtime --json
node bin/slidesls.mjs validate /tmp/deck-with-data-lucide-no-script --json
node bin/slidesls.mjs catalog --registry foo --json # should fail usage
node bin/slidesls.mjs catalog --json
```

Expected outcomes:

- `pnpm check` passes.
- Catalog headings are correct.
- Dry-run text says `Would copy` and never `undefined`.
- Runtime script order does not cause false failures.
- Lucide missing-script warning triggers correctly.
- `--registry` fails with a usage error.
- `--registry-root` and `--registry-url` work explicitly.
- No non-historical `@maxedapps/slidels` remains.
- `npm pack --dry-run` shows `@maxedapps/slidesls@0.1.0` while `private: true` still prevents accidental publish.

## Rollout / compatibility

- No deprecation/migration needed for `--registry` because the package is not public.
- Generated deck API remains unchanged (`.ls-*`, `data-ls-*`, `slidesls.json`, copied `slidesls/` directory).
- Existing local decks using copied assets are unaffected.
- The package cannot publish until `private: true` is deliberately removed in a later approved release step.

## Risks and mitigations

- **Risk: Lightweight HTML parsing becomes too complex.**
  - Mitigation: only parse the specific tags/attributes needed by validation; add tests for supported cases.
- **Risk: Generic arg parser still accepts unknown flags.**
  - Mitigation: explicitly reject `--registry` in registry-consuming commands; avoid a broader unknown-flag behavior change in this fix unless separately planned.
- **Risk: Removing `--registry` leaves stale plan references.**
  - Mitigation: do not rewrite historical `.plans`; grep only non-historical docs/source.
- **Risk: New tests make `pnpm check` slower.**
  - Mitigation: use small temp files and built-in `node:test`; keep browser tests out of this phase.
- **Risk: Symlink test portability.**
  - Mitigation: skip symlink test if `symlink` fails due to permissions/platform.
- **Risk: Preview test subprocess leaks.**
  - Mitigation: always kill child process in `finally`; add timeout on preview startup.
- **Risk: Package-name correction affects lockfile metadata.**
  - Mitigation: update package name and run `pnpm install --lockfile-only` only if lockfile importer metadata changes are required; otherwise verify `pnpm check` and `npm pack --dry-run`.

## Plan review outcome

A reviewer subagent reviewed the draft plan. Incorporated feedback:

- `--registry` must be explicitly rejected, not merely ignored.
- Help/docs updates must cover all registry-consuming commands, including `catalog`, `inspect`, and `generate-catalog`.
- Add dependency-resolution tests for `resolveItems`.
- Preview symlink test must guarantee subprocess cleanup to avoid hanging `node:test`.

## Definition of done

- All confirmed review findings are fixed or intentionally documented as future-only.
- `@maxedapps/slidesls` is the package name everywhere non-historical.
- `--registry` has no command semantics, no non-historical docs, and fails with a usage error if passed.
- Catalog groups are correct.
- Validation is less brittle and warns correctly for Lucide.
- Dry-run text output is correct.
- Preview symlink escape is blocked.
- Focused tests cover the previously missed issues.
- `pnpm check` and `npm pack --dry-run` pass.
- No files are published; `private: true` remains unless separately approved.
