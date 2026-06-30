# Plan: Harden slidesls CLI, validation, and preview edge cases

## Summary

Address all review findings while preserving the intended copyable-registry model. `slidesls add` must continue to work without `init`; that mode should be explicit and documented as **copy mode**, not treated as an error.

Priorities:

1. Fix the confirmed preview crash on malformed URL paths.
2. Centralize safe config path validation without making `init` mandatory.
3. Unify local HTML reference extraction and percent-decoding.
4. Improve copy/write atomicity for both `init` and `add`.
5. Reclassify manifest hash drift so edited copied assets are not treated as a default problem.
6. Add bounded remote registry fetches.
7. Clean up lower-priority UX/docs/runtime issues.

## Confirmed requirements and assumptions

- `init` remains optional for `add`.
- `slidesls add` must support copying registry assets into arbitrary existing projects.
- Generated decks remain dependency-free plain HTML/CSS/JS.
- No mandatory browser, bundler, framework, Playwright, Puppeteer, or full HTML parser dependency.
- Preserve existing CLI commands/options.
- Prefer additive JSON fields when possible.
- Existing `pnpm check` must keep passing.
- Add focused regression tests for each bug/behavior change.

## Relevant current-state findings

### 1. Preview crash on malformed paths

- `src/cli/commands.mjs:641-643` parses/decodes request paths before the handler `try` block.
- `decodeURIComponent("%E0%A4%A")` throws `URIError`.
- In the async request handler this can become an unhandled rejection and kill the preview process.
- Existing symlink/path escape defense is good and should be preserved:
  - `assertInside(root, target)`
  - `realpath(target)`
  - `assertInside(realRoot, realTarget)`

### 2. Config path validation is inconsistent

- `src/deck/config.mjs` currently merges config path fields directly.
- `validateCommand` reads `path.join(root, config.paths.entry)` without first validating that the configured entry path is safe/project-relative.
- `manifestPath()` similarly uses `config.paths.items`.
- Copy flows later guard writes with `assertInside`, but validation/manifest/doctor should report clear config errors and avoid outside-project reads.

Important nuance from review:

- Do **not** blindly make `mergeConfig()` throw in surprising places without auditing callers.
- `mergeConfig()` is used by `readConfig`, `writeDefaultConfig`, `init`, `add`, `validate`, `preview`, and `doctor`.

### 3. Local HTML reference extraction is duplicated/inconsistent

- `src/shared/html.mjs:localReferences()` strips query/hash but does not URL-decode local paths.
- `src/validation/examples.mjs` has a separate extractor that does decode.
- Deck validation can falsely report `assets/My%20Image.png` missing when the real file is `assets/My Image.png`.

### 4. `add` copy mode is intentional

- `addCommand` falls back to defaults when no `slidesls.json` is found.
- This is desired: registry assets should be copyable into any project without scaffolding a deck.
- The improvement is clarity, not restriction.

### 5. Manifest hash drift warning conflicts with editable copied assets

- `validateCommand` currently adds `manifest_hash_drift` to warnings by default and errors in strict mode.
- Text output currently prints only errors, so this is mostly a JSON/agent UX issue.
- Still, JSON warnings should not imply ordinary customization is a problem.

### 6. Remote registry fetch has no timeout

- `RegistrySource.readText()` uses bare `fetch()`.
- Remote `catalog`, `inspect`, `add`, and validation can wait indefinitely on a slow/hanging host.
- A per-request timeout bounds individual fetches; total sequential registry loading may still be `timeout × item count` unless an overall deadline or parallelization is added.

### 7. Copy/write flow is not fully atomic

- `performCopies()` writes files as it loops and only throws collision errors after the loop.
- This affects both `init` and `add`.
- A collision or later read/write failure can leave partial copied assets.
- Any fix must preserve current hash-skip semantics: existing identical files should not be treated as collisions.

### 8. `catalog --type` matching is too loose

- Current filter uses `item.type.endsWith(args.type)`.
- Accidental suffixes like `--type e` can match unintended types.
- Should normalize `ls:` prefix and compare exact normalized type.

### 9. `preview --json` is intentionally long-running

- The command prints startup data, then keeps the server process alive.
- This is fine, but agents need to spawn/kill it explicitly.
- Help/docs should make this explicit.

### 10. Runtime keyboard helper assumes `event.target.closest`

- `registry/core/base/slide-runtime.js` uses `event.target.closest(...)` directly.
- Usually fine in browser `keydown`, but easy to guard defensively.

### 11. Regex/static HTML validation limitations are undocumented

- Validation uses lightweight regex extraction.
- This is acceptable for the MVP, but docs should state it is static/heuristic, not a full parser or visual validation.

### 12. `listen()` EADDRINUSE retry

- Reviewed and deprioritized.
- Current bounded retry with the same server object appears acceptable.
- No implementation change planned unless tests reveal a problem.

## Chosen implementation strategy

Use small, targeted hardening changes that fit the current codebase:

- Keep the dependency-free/minimal philosophy.
- Avoid full HTML parser/schema validator dependencies for now.
- Add shared helpers where duplication already caused bugs.
- Prefer validation/precheck phases before writes.
- Keep `add` copy mode, but expose it clearly in output/docs.
- Make default validation reflect the copyable/editable registry model.

## Alternatives considered

### Require `init` before `add`

Rejected. It conflicts with the intended “bring components into any project” workflow.

### Add a full HTML parser dependency

Rejected for this hardening pass. Current validation is intended to be static/lightweight; shared extraction + documented limitations is enough for MVP.

### Remove manifest hashes entirely

Rejected. Hashes are still valuable for strict drift checks, diagnostics, and future update tooling.

### Parallelize all remote registry fetches immediately

Deferred. Add timeout first. Parallel loading or an overall deadline can be a follow-up if remote mode becomes performance-sensitive.

## Implementation plan

## Phase 1 — Config path validation without surprising `mergeConfig()` behavior

Likely files:

- `src/deck/config.mjs`
- `src/shared/fs.mjs` or new `src/deck/paths.mjs`
- `src/cli/commands.mjs`
- tests, likely new config-focused tests or additions to existing tests

Tasks:

1. Add a helper such as `normalizeConfigPaths(config)` or `validateConfigPaths(config)`.
2. Validate only project path fields:
   - `paths.items`
   - `paths.entry`
   - `paths.assets`
   - `paths.snapshots`
3. Rules:
   - must be strings after defaults are applied
   - must be non-empty
   - must not be absolute
   - must not traverse outside project via `..`
   - normalize Windows separators to POSIX-style where appropriate
4. Decide exact integration point after auditing all `mergeConfig()` callers:
   - Option A: keep `mergeConfig()` pure and call validation at IO boundaries (`readConfig`) and in `writeDefaultConfig`.
   - Option B: add a separate `readValidatedConfig()` and migrate commands to it.
5. Recommended: keep `mergeConfig()` simple/pure and validate at config read/write command boundaries, with structured/friendly errors.
6. Ensure `doctor` distinguishes malformed JSON from invalid config paths instead of reporting all failures as parse errors.
7. Add tests for:
   - safe relative paths pass
   - backslash paths normalize safely
   - `../outside`, absolute paths, empty paths fail
   - `validate` cannot read outside project via malicious `paths.entry`
   - `preview`/`add` happy paths still work with valid config

## Phase 2 — Preview malformed URL hardening

Likely files:

- `src/cli/commands.mjs`
- `tests/preview.test.mjs`

Tasks:

1. Move request URL parsing and `decodeURIComponent()` into the request handler `try` block.
2. Catch malformed percent-encoding and respond with `400 Bad request`.
3. Preserve existing behavior:
   - `/` serves configured entry
   - valid files are served with correct MIME
   - symlink escapes remain blocked
4. Add tests:
   - malformed path like `/%E0%A4%A` returns 400 and does not kill server
   - server still responds to `/` after malformed request
   - valid percent-encoded filename, e.g. `assets/My%20File.txt`, can be served if inside root

## Phase 3 — Shared local HTML reference extraction

Likely files:

- `src/shared/html.mjs`
- `src/validation/examples.mjs`
- `src/cli/commands.mjs`
- `tests/html-validation.test.mjs`

Tasks:

1. Replace duplicate href/src reference logic with one shared function, e.g. `localFileReferences(html)`.
2. Return structured entries:
   - `rawValue`
   - `localPath`
3. Preserve useful behavior from both current implementations:
   - quoted `href`/`src` matching
   - ignore empty, hash-only, protocol, and protocol-relative URLs
   - strip query/hash
   - decode percent-encoding
   - malformed percent encodings do not crash; fall back to raw stripped path or report a controlled validation error
   - preserve current tolerance flags from example validator (`gims`) where useful
4. Update `validateCommand` to resolve `localPath` but show `rawValue` in messages.
5. Update `validateExamples` to use the shared helper and remove local duplicate functions.
6. Add tests for:
   - `%20` references validate correctly
   - malformed percent encoding does not crash
   - query/hash stripping still works
   - outside-project asset references remain rejected

## Phase 4 — Preserve and clarify `add` copy mode

Likely files:

- `src/cli/commands.mjs`
- `README.md`
- `docs/cli.md`
- maybe `docs/registry-contract.md`
- `tests/cli-output.test.mjs`

Tasks:

1. Keep behavior: `add` without config copies assets using defaults.
2. Add explicit JSON fields in both normal and `--dry-run` branches:
   - `configFound: boolean`
   - `mode: "deck" | "copy"`
   - `baseDir: config.paths.items`
3. Text output:
   - If no config is found, prepend/append concise info:
     - `No slidesls.json found; using copy mode and writing assets under ./<actual-base-dir>.`
   - Use actual `config.paths.items`, including `--base-dir` overrides.
4. Update docs to define two workflows:
   - **Deck mode**: `init`, validate, preview full slidesls deck.
   - **Copy mode**: `add --dir <project>` to bring registry CSS/JS/snippets into any project without `init`.
5. Add tests:
   - uninitialized `add` works
   - uninitialized `add --dry-run --json` includes copy-mode fields
   - uninitialized real `add --json` includes copy-mode fields
   - `--base-dir custom-dir` is reflected in JSON/text output

## Phase 5 — Reclassify manifest hash drift

Likely files:

- `src/cli/commands.mjs`
- `docs/validation.md`
- tests around validation

Tasks:

1. Change default `validate` behavior for hash drift:
   - deck remains valid
   - no warning that implies a problem
   - report customized files separately if useful
2. Recommended JSON shape:
   - Add `customizedFiles: [{ targetPath, expectedSha256, actualSha256 }]`
   - Keep `warnings` for actionable problems
3. In `--strict`, keep drift as an error.
4. Be explicit that this is a small JSON envelope behavior change:
   - existing `warnings[].code === "manifest_hash_drift"` consumers should move to `customizedFiles` or `--strict`
5. Update docs:
   - copied registry files are intentionally editable
   - default validation accepts customization
   - strict validation detects drift from copied baseline
6. Add tests:
   - edit copied CSS, default `validate --json` remains valid and has no `manifest_hash_drift` warning
   - default result includes `customizedFiles` if that field is chosen
   - strict validation reports drift as an error

## Phase 6 — Remote registry fetch timeout

Likely files:

- `src/registry/source.mjs`
- `tests/registry-source.test.mjs`
- docs if mentioning remote registry behavior

Tasks:

1. Add timeout support to `RegistrySource`:
   - option such as `fetchTimeoutMs`
   - default around 10–15 seconds per request
2. Use Node 22-supported `AbortSignal.timeout(fetchTimeoutMs)`.
3. Wrap abort/timeout errors with clear messages:
   - include URL
   - include timeout duration
4. Note limitation: this bounds each request, not necessarily total registry load time.
5. Optional improvement if easy:
   - add an overall `loadRegistry` deadline, or
   - parallelize item metadata fetches with bounded concurrency
6. Add tests using a local delayed HTTP server:
   - timeout produces clear error
   - normal fast remote JSON still works

## Phase 7 — Refactor copy flow to validate before writing for both `init` and `add`

Likely files:

- `src/deck/copy.mjs`
- `src/cli/commands.mjs`
- tests in `tests/cli-output.test.mjs` or a new copy/init test file

Tasks:

1. Refactor `performCopies()` or add a helper so copy flow has two stages:
   - validate/read/prepare stage
   - commit/write stage
2. During prepare stage:
   - read source content
   - calculate sha256
   - check existing destinations
   - classify existing identical files as skipped/non-colliding
   - classify existing different files as collisions
   - collect all collisions before writing anything
3. If collisions exist and `force` is false, throw before any writes.
4. Preserve current output semantics as much as possible:
   - copied files include hashes
   - skipped identical files are marked as skipped
5. Apply the same safer copy behavior to both:
   - `initCommand`
   - `addCommand`
6. For `initCommand`, additionally precheck non-registry files before writing:
   - `slidesls.json`
   - entry file
   - schema files
   - manifest path if needed
7. Preserve `--force` behavior.
8. Add tests:
   - `add` with later colliding file does not partially write earlier files
   - `init` with colliding copied registry asset does not create config/entry/schema first
   - existing identical copied files are not treated as collisions
   - `--force` still overwrites modified files

## Phase 8 — Tighten `catalog --type`

Likely files:

- `src/cli/commands.mjs`
- maybe a small helper in `src/registry/source.mjs` or `src/registry/catalog-doc.mjs`
- tests in `tests/cli-output.test.mjs` or catalog tests

Tasks:

1. Add normalized type helper:
   - `ls:component` -> `component`
   - `component` -> `component`
2. Filter by exact normalized equality.
3. Support both user inputs:
   - `--type component`
   - `--type ls:component`
4. Add tests:
   - `--type component` returns only components
   - `--type ls:component` returns only components
   - `--type e` does not accidentally match suffixes

## Phase 9 — Preview server-mode docs/output

Likely files:

- `src/cli/commands.mjs`
- `README.md`
- `docs/cli.md`
- `skills/slidesls/references/preview-validation.md`

Tasks:

1. Update `preview --help` to say:
   - starts a local server
   - prints URL/startup info
   - keeps running until stopped
2. Ensure JSON `note` is clear enough for agents.
3. Update docs/skill guidance:
   - spawn as long-running process
   - parse first JSON object for URL when using `--json`
   - terminate process after preview/screenshot work
4. No functional change required.

## Phase 10 — Runtime defensive keyboard handling

Likely files:

- `registry/core/base/slide-runtime.js`

Tasks:

1. Change `shouldIgnoreKey()` to guard the target:

```js
function shouldIgnoreKey(event) {
  return event.target instanceof Element && Boolean(event.target.closest(interactiveSelector));
}
```

2. Preserve current keyboard behavior.
3. Existing JS syntax validation and smoke tests cover basic sanity.

## Phase 11 — Document static validation limitations

Likely files:

- `docs/validation.md`
- `README.md` if useful
- `skills/slidesls/references/preview-validation.md`

Tasks:

1. Document that validation is static and lightweight.
2. State it checks:
   - config
   - entry markup hooks
   - local asset references
   - manifest files
   - likely missing registry item classes
3. State it is not:
   - a full HTML parser
   - a browser render
   - a screenshot/visual regression tool
4. Recommend `preview` and optional browser workflows for visual validation.

## Phase 12 — Leave `listen()` retry unchanged unless tests prove otherwise

Likely files:

- none by default

Tasks:

1. No code change planned.
2. Optional non-flaky test only if easy:
   - occupy a port
   - run preview with that port
   - assert fallback port works
3. If this test is flaky on CI/local systems, skip it.

## Testing and verification plan

Run the full suite after implementation:

```sh
pnpm lint
pnpm fmt:check
pnpm test
pnpm validate:registry
pnpm validate:skills
pnpm validate:examples
pnpm cli:smoke
pnpm check
```

Focused tests to add/update:

- Preview malformed URL returns controlled response and server survives.
- Preview serves valid percent-encoded filenames.
- Config path traversal is rejected before outside-project reads.
- Percent-encoded asset references validate correctly.
- Malformed percent references do not crash validation.
- Uninitialized `add` remains supported and reports copy mode in normal and dry-run JSON.
- `add --base-dir` in copy mode reports the actual base dir.
- Edited copied files do not produce default drift warnings; strict mode reports drift.
- Remote registry fetch timeout gives clear error.
- `init` and `add` avoid partial writes on collisions.
- Existing identical copied files remain accepted/skipped.
- Exact `catalog --type` filtering.

## Backward compatibility notes

- `add` remains usable without `init`.
- Existing commands/options remain.
- JSON output changes should be additive where possible.
- `manifest_hash_drift` moving out of default `warnings` may affect agents that depended on that warning; document `customizedFiles` and `--strict` as replacements.
- Default validation becomes friendlier to legitimate copied-asset customization.

## Risks and mitigations

### Risk: Config validation rejects existing unusual configs

Mitigation:

- Only reject clearly unsafe paths: empty, absolute, traversal.
- Keep normal relative nested paths supported.

### Risk: Copy refactor changes subtle skip/force behavior

Mitigation:

- Preserve hash-identical skip semantics.
- Add tests for identical existing files and `--force` overwrites.

### Risk: Timeout tests are flaky

Mitigation:

- Use a local HTTP server with deterministic delayed response.
- Avoid external network dependencies.

### Risk: JSON envelope changes surprise agents

Mitigation:

- Prefer additive fields.
- Document the one intentional semantic shift: drift customization moves from default warning to `customizedFiles`/strict.

## Claude review notes incorporated

Claude reviewed the draft plan and identified important refinements:

- Copy atomicity must be handled in `performCopies()` for both `init` and `add`, not just `init` prechecks.
- Collision prechecks must preserve hash-identical skip behavior.
- Path validation should not blindly make `mergeConfig()` throw without auditing all callers.
- Copy-mode fields must be present in both normal and `--dry-run` branches.
- Copy-mode text must use the actual `--base-dir` value.
- Manifest drift JSON behavior should be called out as a small compatibility shift.
- Remote timeout is per request unless an overall deadline/parallel loading is added.

These points are integrated above.

## Open questions

No blocking open questions.

Recommended small implementation decision:

- Represent default manifest drift as `customizedFiles` in `validate` JSON data and reserve warnings/errors for actual problems.
