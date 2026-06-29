# Plan: Fix example asset drift and add example validation

Date: 2026-06-29
Status: Implemented
Project: ls_slides

## Context

A repo audit plus `agent-browser` validation found that the examples mostly render correctly, but two gallery examples request non-existent font preset stylesheet paths. The visual impact is subtle because core/layout/component styles load successfully; only optional font role remaps are missing.

Confirmed broken requests while serving examples locally:

- `examples/structured-content-gallery/index.html` requests `../../registry/presets/fonts/system-humanist/system-humanist.css` and receives HTTP 404.
- `examples/visual-narrative-gallery/index.html` requests `../../registry/presets/fonts/editorial-serif/editorial-serif.css` and receives HTTP 404.

The actual preset implementation files declared by registry metadata are:

- `registry/presets/fonts/system-humanist/font.css`
- `registry/presets/fonts/editorial-serif/font.css`

A second issue was confirmed in `skills/ls-slides/assets/minimal-deck.html`: it includes `title-hero.css`, but applies `ls-title-hero` to `.ls-slide__inner`. The actual layout CSS is scoped by `.ls-layout-title-hero .ls-slide__inner`, so the minimal asset does not activate the title-hero layout contract.

Current validation catches registry metadata and generated catalog drift, but not broken local assets linked from example HTML files or basic consistency of shipped HTML assets. That is why the broken links passed existing checks.

## Goals

- Fix the two incorrect example preset stylesheet paths.
- Fix the minimal deck asset so it demonstrates the `layouts/title-hero` layout correctly.
- Add lightweight automated validation for local example HTML asset references.
- Add a targeted automated guard for the minimal deck title-hero activation hook.
- Wire the new validation into `pnpm check` so future broken local example `href` / `src` references fail quickly.
- Preserve the copyable-registry model; do not add framework tooling, bundlers, or external dependencies.

## User constraints

- Keep the project vanilla HTML/CSS/JS.
- Do not turn helper scripts into a public CLI product or generator.
- Keep validation dependency-free where practical.
- Use existing pnpm/Oxlint/Oxfmt project tooling.
- Keep changes targeted to confirmed findings.

## Research performed

Local files and behavior checked:

- `registry/presets/fonts/system-humanist/registry-item.json` declares `registry/presets/fonts/system-humanist/font.css`.
- `registry/presets/fonts/editorial-serif/registry-item.json` declares `registry/presets/fonts/editorial-serif/font.css`.
- `examples/structured-content-gallery/index.html` currently links `system-humanist.css`, which does not exist.
- `examples/visual-narrative-gallery/index.html` currently links `editorial-serif.css`, which does not exist.
- A full local `href` / `src` existence scan across current example HTML files found these two missing local assets and no others.
- `registry/layouts/title-hero/title-hero.css` scopes layout rules under `.ls-layout-title-hero .ls-slide__inner`.
- `examples/project-intro/index.html` uses the correct title-hero pattern: `<section class="ls-slide ls-layout-title-hero">` with a normal `.ls-slide__inner` descendant.
- `skills/ls-slides/assets/minimal-deck.html` does not include `ls-layout-title-hero` on the slide root.
- `scripts/validate-registry.mjs` validates registry metadata, listed files, dependencies, and docs paths only.
- `scripts/serve-examples.mjs` defines examples as directories under `examples/` that contain `index.html`.
- `package.json` currently runs `lint`, `fmt:check`, `validate:registry`, and `validate:skills` in `check`.

Browser/runtime checks performed:

- `agent-browser network requests` confirmed HTTP 404 stylesheet requests for both incorrect preset paths.
- Browser computed styles confirmed that the font preset variables remain at core defaults until the correct `font.css` files are loaded.
- Serving a copied minimal deck confirmed `document.querySelector('.ls-layout-title-hero .ls-slide__inner') === null`, so the title-hero layout hook is not active.

No external web research is needed because this is a local project consistency and validation issue.

## Decisions

1. **Fix links to match registry metadata rather than creating alias files.**

   The source of truth already says font preset implementation files are named `font.css`. Updating examples preserves the established item model and avoids duplicating CSS aliases that could drift.

2. **Fix the minimal deck markup to use the documented layout root hook.**

   The title-hero layout is intentionally activated by a slide-root class. The minimal asset should mirror `examples/project-intro/index.html` and put `ls-layout-title-hero` on the `.ls-slide` element. The now-meaningless `ls-title-hero` class should be removed from `.ls-slide__inner` because no registry CSS selector uses that class.

3. **Add a separate `scripts/validate-examples.mjs`.**

   Keep `validate-registry.mjs` focused on registry metadata. Example and shipped-HTML validation is related but distinct: it checks consumers/templates of the registry, not registry items themselves.

4. **Keep validation simple and dependency-free.**

   A small Node ESM script can scan `examples/*/index.html`, extract quoted `href` and `src` attributes, ignore external URLs / fragments / data URLs / mailto / tel, resolve local paths relative to the HTML file, and assert files exist.

5. **Mirror existing example discovery.**

   The validator should use the same definition as `scripts/serve-examples.mjs`: sorted directories directly under `examples/` that contain an `index.html` file. Avoid a premature shared helper unless duplication grows.

6. **Add a narrow minimal-deck hook assertion.**

   Static link validation cannot catch the minimal-deck bug because copied deck paths only exist after `copy-items`, and the bug is a wrong CSS activation class rather than a missing file. Add a targeted check that `skills/ls-slides/assets/minimal-deck.html` contains the `ls-layout-title-hero` hook when it links the title-hero layout. This is intentionally narrow, not a general HTML semantic validator.

7. **Wire example validation into `pnpm check`.**

   The broken links are exactly the kind of cheap deterministic issue that should fail standard checks. Keep the existing strict pnpm version policy unchanged.

## Alternatives considered

### Alternative A — Add `system-humanist.css` and `editorial-serif.css` alias files

Rejected. Aliases would hide the drift and create two filenames for the same registry item. The metadata and catalog already use `font.css`; examples should follow that source of truth.

### Alternative B — Extend `scripts/validate-registry.mjs` to also validate examples

Rejected for now. Registry validation and example-consumer validation have different scopes. A sibling script keeps each responsibility clear while still allowing `pnpm check` to run both.

### Alternative C — Use an HTML parser dependency

Rejected. The current examples are simple static HTML files. A conservative attribute scanner is enough for local asset existence checks and avoids adding dependencies.

### Alternative D — Add browser-based validation immediately

Deferred. Browser validation is valuable, but the confirmed example-link issue can be caught by a much cheaper static validation script. This plan still includes manual/browser verification after implementation. A later QA pass can add browser console/resource checks if desired.

### Alternative E — Make the asset validator cover every shipped HTML file

Rejected for this pass. Some shipped HTML assets, especially `skills/ls-slides/assets/minimal-deck.html`, intentionally reference files that exist only after copying registry items into a target folder. A broad existence validator would either fail legitimate templates or need many special cases. This plan validates examples broadly and adds one targeted minimal-deck semantic guard for the confirmed bug.

## Implementation phases

### Phase 1 — Fix confirmed broken paths

- [x] Update `examples/structured-content-gallery/index.html`:

  ```html
  href="../../registry/presets/fonts/system-humanist/font.css"
  ```

- [x] Update `examples/visual-narrative-gallery/index.html`:

  ```html
  href="../../registry/presets/fonts/editorial-serif/font.css"
  ```

- [x] Update `skills/ls-slides/assets/minimal-deck.html` so the first slide uses the title-hero layout root and the inner element no longer carries the unused `ls-title-hero` class:

  ```html
  <section class="ls-slide ls-layout-title-hero" aria-label="Opening">
    <div class="ls-slide__inner"></div>
  </section>
  ```

- [x] Confirm the minimal deck still links only the dependencies it actually needs.

### Phase 2 — Add example and shipped-asset validation script

Create `scripts/validate-examples.mjs`.

Recommended behavior:

- Discover example HTML files under `examples/` using the same logic as `scripts/serve-examples.mjs`:
  - read direct children of `examples/`,
  - keep directories that contain `index.html`,
  - sort deterministically.
- For each example `index.html`, scan for quoted `href="..."`, `href='...'`, `src="..."`, and `src='...'` values.
- Ignore non-local references:
  - `http://...`
  - `https://...`
  - protocol-relative URLs like `//cdn...`
  - `#fragment`
  - empty values
  - `data:`, `mailto:`, `tel:`, `javascript:`
- For local URLs:
  - Strip query string and hash before resolving.
  - Decode URI components safely where possible.
  - Resolve relative to the containing HTML file.
  - Assert the resolved path remains inside the repository root.
  - Assert the target exists and is a file.
- Add a targeted minimal deck consistency check:
  - read `skills/ls-slides/assets/minimal-deck.html`,
  - if it links `registry/layouts/title-hero/title-hero.css`, assert it contains `ls-layout-title-hero`,
  - optionally assert it does not contain the obsolete `ls-slide__inner ls-title-hero` pattern.
- Print a concise success message, e.g.:

  ```txt
  Validated local asset links for 4 example HTML file(s).
  Validated minimal deck layout hooks.
  ```

- On failure, print each missing/unsafe/inconsistent asset with:
  - HTML file path
  - original attribute value or checked pattern
  - resolved path or reason
- Exit non-zero on any failure.

Implementation notes:

- Use only Node built-ins: `node:fs/promises`, `node:fs`, and `node:path`.
- Keep the script ESM to match project style.
- Mirror the small `assert(condition, message)` style used by `scripts/validate-registry.mjs`.
- Keep scope explicit: this validates HTML `href` / `src` local file existence for examples and a targeted minimal deck hook. It does not validate CSS `@import`, CSS `url()`, every possible HTML reference attribute, or visual correctness.

### Phase 3 — Wire validation into package scripts

Update `package.json`:

```json
"validate:examples": "node scripts/validate-examples.mjs",
"check": "pnpm lint && pnpm fmt:check && pnpm validate:registry && pnpm validate:skills && pnpm validate:examples"
```

Keep existing scripts unchanged otherwise.

### Phase 4 — Validate locally

Run direct commands first, because local pnpm version strictness may block `pnpm check` if the shell does not have exactly `pnpm@11.1.1`:

```sh
node --check scripts/validate-examples.mjs
node scripts/validate-examples.mjs
node scripts/validate-registry.mjs
node skills/ls-slides/scripts/generate-catalog.mjs --registry-root . --check
./node_modules/.bin/oxlint --no-error-on-unmatched-pattern
./node_modules/.bin/oxfmt --check
```

Then run the project command with the pinned pnpm version when available:

```sh
pnpm check
```

If the local environment has a different pnpm version and `pmOnFail: error` blocks `pnpm check`, report that direct component validation passed and that full `pnpm check` requires `pnpm@11.1.1`. Do not weaken `pmOnFail` as part of this fix.

### Phase 5 — Browser verification

Serve examples:

```sh
node scripts/serve-examples.mjs --host 127.0.0.1 --port 4173
```

Use `agent-browser` to verify both corrected examples:

```sh
npx agent-browser network requests --clear
npx agent-browser open http://127.0.0.1:4173/examples/structured-content-gallery/
npx agent-browser wait 1000
npx agent-browser network requests --filter "system-humanist" --json
```

Expected: no 404 for `system-humanist.css`; request should be for `font.css` with status 200.

```sh
npx agent-browser network requests --clear
npx agent-browser open http://127.0.0.1:4173/examples/visual-narrative-gallery/
npx agent-browser wait 1000
npx agent-browser network requests --filter "editorial-serif" --json
```

Expected: no 404 for `editorial-serif.css`; request should be for `font.css` with status 200.

Optional computed-style checks:

- Structured gallery body/font variables should use `Avenir Next` / humanist stack after load.
- Visual narrative heading/display variables should use `ui-serif` / Georgia stack after load.

Validate minimal deck asset by copying dependencies into a temp folder and serving it:

```sh
rm -rf /tmp/ls-minimal-check
mkdir -p /tmp/ls-minimal-check
cp skills/ls-slides/assets/minimal-deck.html /tmp/ls-minimal-check/index.html
node skills/ls-slides/scripts/copy-items.mjs \
  --registry-root . \
  --target /tmp/ls-minimal-check \
  --items layouts/title-hero,animations/reveal \
  --force
node skills/ls-slides/scripts/serve-deck.mjs \
  --root /tmp/ls-minimal-check \
  --entry index.html \
  --host 127.0.0.1 \
  --port 4174
```

Then verify in browser that the layout hook matches:

```js
document.querySelector(".ls-layout-title-hero .ls-slide__inner") !== null;
```

Expected: `true`.

## Validation

Required validation after implementation:

```sh
node --check scripts/validate-examples.mjs
node scripts/validate-examples.mjs
node scripts/validate-registry.mjs
node skills/ls-slides/scripts/generate-catalog.mjs --registry-root . --check
./node_modules/.bin/oxlint --no-error-on-unmatched-pattern
./node_modules/.bin/oxfmt --check
pnpm check
```

Browser validation:

```sh
node scripts/serve-examples.mjs --host 127.0.0.1 --port 4173
npx agent-browser open http://127.0.0.1:4173/examples/structured-content-gallery/
npx agent-browser network requests --filter "system-humanist" --json
npx agent-browser open http://127.0.0.1:4173/examples/visual-narrative-gallery/
npx agent-browser network requests --filter "editorial-serif" --json
```

Minimal deck validation:

```sh
node skills/ls-slides/scripts/copy-items.mjs --registry-root . --target /tmp/ls-minimal-check --items layouts/title-hero,animations/reveal --force
node skills/ls-slides/scripts/serve-deck.mjs --root /tmp/ls-minimal-check --entry index.html --host 127.0.0.1 --port 4174
```

Expected browser expression:

```js
document.querySelector(".ls-layout-title-hero .ls-slide__inner") !== null;
// true
```

## Risks / rollback

- **Risk: Static scanner misses unusual HTML syntax.**
  - Mitigation: handle both single-quoted and double-quoted `href` / `src` values. Current examples are Oxfmt-normalized and simple.

- **Risk: Static scanner flags intentional future local URLs with query strings or hashes.**
  - Mitigation: strip query/hash before resolving local paths. External URLs remain ignored.

- **Risk: Validation is mistaken for full asset graph checking.**
  - Mitigation: document scope clearly in script comments/output: example HTML `href` / `src` local files plus targeted minimal deck hook only; no CSS `url()` or visual validation.

- **Risk: `pnpm check` cannot run in environments without exact `pnpm@11.1.1`.**
  - Mitigation: run direct component commands and document the version requirement. Do not weaken `pmOnFail` in this fix.

- **Risk: Minimal deck visual changes slightly.**
  - Mitigation: this is intended; it should activate the layout it already links. Validate via browser.

Rollback is simple:

- Revert the three HTML changes.
- Remove `scripts/validate-examples.mjs`.
- Remove `validate:examples` from `package.json` and restore the previous `check` script.

## Implementation progress

- [x] Phase 1 — Fixed confirmed example and minimal deck paths/hooks.
- [x] Phase 2 — Added `scripts/validate-examples.mjs` for example local asset links and minimal deck layout-hook validation.
- [x] Phase 3 — Added `validate:examples` and included it in `pnpm check`.
- [x] Phase 4 — Ran direct local validation successfully. Full `pnpm check` remains blocked in this environment by the intentional pinned pnpm version requirement (`pnpm@11.1.1`; local `pnpm` is `11.9.0`). Full `oxfmt --check` also reports unrelated untracked `context.md`; targeted formatting checks for changed files pass.
- [x] Phase 5 — Browser-validated corrected font preset requests and minimal deck title-hero hook.
- [x] Implementation committed in `edb27a6` (`Validate example asset links`).
- [x] Fresh implementation peer review completed and accepted the implementation as-is.

## Implementation validation results

Passed:

```sh
node --check scripts/validate-examples.mjs
node scripts/validate-examples.mjs
node scripts/validate-registry.mjs
node skills/ls-slides/scripts/generate-catalog.mjs --registry-root . --check
./node_modules/.bin/oxlint --no-error-on-unmatched-pattern
./node_modules/.bin/oxfmt --check examples/structured-content-gallery/index.html examples/visual-narrative-gallery/index.html .plans/2026-06-29-example-asset-validation-hardening.md scripts/validate-examples.mjs skills/ls-slides/assets/minimal-deck.html package.json
```

Browser validation passed:

- `structured-content-gallery` loads `registry/presets/fonts/system-humanist/font.css` with HTTP 200; computed body font uses the humanist stack.
- `visual-narrative-gallery` loads `registry/presets/fonts/editorial-serif/font.css` with HTTP 200; computed heading font uses the serif stack.
- Copied minimal deck reports `document.querySelector('.ls-layout-title-hero .ls-slide__inner') !== null` as `true` and uses the expected two-column title-hero grid.

Known validation limitations in this environment:

```sh
pnpm check
```

fails before running checks because the repository intentionally enforces `packageManager: pnpm@11.1.1` and the local pnpm is `11.9.0`.

```sh
./node_modules/.bin/oxfmt --check
```

fails only because of unrelated untracked `context.md`; changed files pass targeted formatting checks.

## Peer review summary

A fresh Claude plan review verified the technical diagnosis against the codebase: both example font links are 404s, real files are `font.css`, `title-hero.css` requires `.ls-layout-title-hero .ls-slide__inner`, and the minimal deck currently lacks that hook. The reviewer agreed with the main fix decisions: update links to match metadata, avoid alias files, keep validation dependency-free, and wire it into `pnpm check`.

The review identified one important refinement: a plain example-link validator would not guard the minimal-deck finding, because that asset intentionally references copied target paths and the bug is a wrong CSS hook rather than a missing file. The final plan incorporates this by adding a narrow minimal-deck layout-hook assertion to `scripts/validate-examples.mjs` and by clearly limiting the validator's scope.

The review also suggested mirroring `serve-examples.mjs` example discovery, handling single-quoted attributes defensively, matching the existing `validate-registry.mjs` script style, and explicitly documenting that this does not validate CSS `url()` references or visual correctness. These refinements are included in the final plan.

A fresh Claude implementation review accepted commit `edb27a6` as matching the plan with no required fixes. The reviewer independently verified the corrected font links, minimal deck layout hook, validator behavior, package script integration, and validation limitations. The only note was unrelated: untracked `context.md` remains in the working tree and is why full `oxfmt --check` fails in this environment.
