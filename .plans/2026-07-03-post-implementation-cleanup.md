# Plan: Post-implementation cleanup — validate false positive, sweep coverage, visual gate

## Summary

The 0.4.0 implementation (commit `dfb3f0e`) landed cleanly. Evaluation surfaced four remaining items, in descending priority:

1. **Bug (pre-existing, now load-bearing):** every freshly generated deck warns `copied_asset_not_loaded` for `slide-runtime.js` — a false positive that trains agents to ignore `validate` warnings, undermining the new layout warnings.
2. **Test gap:** the stale-guidance sweep checks known-bad patterns but does not verify that command invocations in docs/skill markdown use flags the parser actually declares.
3. **Dead code:** `inferKind()` in `src/validation/visual-rhythm.mjs` checks a field (`slideKind`) the collection payload never emits.
4. **Unfinished gate:** the `.ls-slide__header` gap change (`--ls-space-3` → `--ls-space-2` for the blank template and four example decks) shipped without the planned before/after screenshot review, and the `--ls-slide-header-max-inline-size: 1080px` default was to be confirmed from rendered output.

All of this folds into 0.4.0 before publish — no version bump; add `### Fixed` entries to the existing CHANGELOG section. Items 1–3 are pure code/test work; item 4 needs a browser (agent-browser) and a human-or-agent judgment on screenshots.

---

## Task 1 — Fix the `copied_asset_not_loaded` false positive

### Root cause

`validateLoadTags` (`src/validation/load-tags.mjs:17-19`) computes loaded assets from `stripNonRenderedCode(html)`. That helper removes entire `<code>`, `<pre>`, `<script>`, and `<style>` elements — including the deck's real `<script type="module" src=".../slide-runtime.js">` tag. So `loadedScripts` is always empty, and the manifest's script tag warns on every deck since this validation was introduced.

Two consequences:

- **False positive:** every `init`-generated deck warns about its own runtime script.
- **False negative:** the second half of the function (`loaded_asset_missing_manifest_item`) also uses `loadedScripts`, so a loaded-but-unlisted JS asset is never detected either.

### Fix

Compute script srcs from the **raw** HTML; keep link extraction on the stripped HTML (links are not stripped today, so this is a no-behavior-change conservatism — a literal `<link>` shown inside a code sample would be entity-escaped and invisible to `startTags` either way):

```js
const loadedLinks = new Set(stylesheetHrefs(renderedHtml).map(normalizeRef));
const loadedScripts = new Set(moduleScriptSrcs(html).map(normalizeRef));
```

Rationale for raw HTML being safe here: an unescaped `<script src=...>` inside `<pre>`/`<code>` would actually execute in the browser (it is not display text), so counting it as "loaded" is technically correct; realistic docs samples escape it as `&lt;script&gt;`, which the tag parser never matches.

### Tests (in `tests/html-validation.test.mjs` or wherever validate coverage lives)

1. **Zero-warning invariant (the important one):** `init` a fresh minimal deck and a fresh blank deck into a temp dir, run `validateCommand`, assert `errors.length === 0` **and** `warnings.length === 0`. This is a standing tripwire: any future rule that fires on generated output breaks the build instead of shipping noise.
2. False positive gone, detection intact: remove the `slide-runtime.js` script tag from the fresh deck's entry HTML → `copied_asset_not_loaded` **does** appear (the warning still works when it should).
3. False negative fixed: hand-add a module script for an item not in the manifest (e.g. copy nothing, just reference `animations/reveal`'s JS if it has one — or construct a minimal fixture) → `loaded_asset_missing_manifest_item` fires for a script-only case.

### CHANGELOG

Under `## 0.4.0`, add `### Fixed` → "validate no longer reports a false `copied_asset_not_loaded` warning for module scripts (including slide-runtime.js) on every generated deck; loaded-but-unlisted JS assets are now detected."

---

## Task 2 — Extend the guidance sweep to command flags in docs/skill markdown

### Gap

`tests/args.test.mjs` ("documented help flags stay in the declared command option set") covers CLI `--help` strings. `tests/cli-output.test.mjs` ("agent guidance avoids stale primary commands") covers two known-bad patterns plus `skill show --all` context. Nothing verifies that a `slidesls` invocation written in `README.md`, `docs/*.md`, or `skills/**/*.md` uses flags the strict parser will accept — a doc typo like `--with-deps` would ship and fail for every agent that follows it.

### Implementation

1. Extract the per-command declared option table used by `tests/args.test.mjs` into a shared test helper (e.g. `tests/helpers/command-options.mjs`) so both tests consume one source of truth. If the table currently lives implicitly in the CLI modules, export the parse specs from each command module instead — preferred, since then the table can never drift from the real `parseArgs` calls.
2. In the stale-guidance test (or a sibling test in the same file), scan the already-collected markdown file set for `slidesls <command> …` invocations — both fenced code blocks and inline code spans. For each, take the first token as the command (resolve `skill <sub>` to the `skill` spec) and every `--flag` token; assert membership in that command's declared boolean/value option set.
3. Skip placeholders (`<item>`, `<deck>`, `[filters]`) and lines marked as historical (CHANGELOG is not in the scanned set; keep it that way).
4. Expect a few legitimate failures on first run if any doc drifted — fix the docs, not the test.

### Tests

The sweep is the test. Add one negative self-check: a fixture string with a bogus flag run through the extraction helper must be flagged (guards against the regex silently matching nothing and the sweep passing vacuously).

---

## Task 3 — Remove the dead `slideKind` branch in visual-rhythm

`src/validation/visual-rhythm.mjs:67`: `inferKind()` first checks `slide.slideKind`, a field neither the `--eval` collection payload (which emits `kind`, already resolved in-browser with `kindSource`) nor the test fixtures produce. Delete the branch. Confirm `tests/visual-rhythm.test.mjs` fixtures exercise both paths that remain: explicit `kind` short-circuits (line 11), and fact-based inference (`hasSlideFill` + `centerInFill`/`centerStartInFill`) when `kind` is absent. No behavior change; run the suite.

---

## Task 4 — Execute the deferred visual gate for the header rhythm change

### What changed visually in `dfb3f0e`

- Seven content templates moved from `ls-stack ls-stack--sm` (gap `--ls-space-2`) to `.ls-slide__header`, whose gap default was set to `var(--ls-space-2)` — **intended: no change** for these.
- The blank init template and the four `pi-coding-agent-*` example decks already used `.ls-slide__header` and therefore **got tighter** header spacing (`space-3` → `space-2`) — intended, but never eyeballed.
- `--ls-slide-header-max-inline-size` kept the `1080px` default pending screenshot review (long titles on a ~1408px content area wrap earlier than an uncapped header would).

### Procedure (agent-browser; preview stays running per deck)

```sh
tmp=$(mktemp -d)
node bin/slidesls.mjs init "$tmp" --template minimal --theme executive-blue --title "Layout QA"
node bin/slidesls.mjs preview "$tmp" --host 127.0.0.1 --port 4321 &
```

For each of: the fresh deck, `examples/template-gallery`, `examples/stress-gallery`, `examples/pi-coding-agent-executive-blue`:

```sh
agent-browser --session slidesls-qa open "http://127.0.0.1:<port>/?export=1"
agent-browser --session slidesls-qa set viewport 1600 900
agent-browser --session slidesls-qa wait --load networkidle
node scripts/visual-qa-report.mjs --eval | agent-browser --session slidesls-qa eval --stdin > collected.json
node scripts/visual-qa-report.mjs --analyze < collected.json
agent-browser --session slidesls-qa screenshot ./qa-<deck>.png
```

Actually inspect the screenshots (do not merely capture them).

### Acceptance / decision points

1. `--analyze` reports zero content-slide rhythm warnings on all four decks; hero/section slides are exempt and correctly classified (`kindSource: "explicit"` throughout the repo decks).
2. No unexpected overflow candidates beyond the known intentional scroll surfaces.
3. **Judgment 1 — gap:** the tightened `space-2` header spacing on the pi example decks and blank template reads well (eyebrow/title/subtitle grouping still breathes). If it looks cramped on any theme, raise only that context via the variable (`--ls-slide-header-gap`) rather than reverting the default.
4. **Judgment 2 — width cap:** check the longest titles in `stress-gallery` and the pi decks. If 1080px wrapping looks premature at 1600×900, widen the `--ls-slide-header-max-inline-size` default (candidate: `1200px`) in `registry/core/base/slide.css`, re-run this procedure, and regenerate nothing (the variable is already in authoring metadata).
5. Record the outcome (one paragraph + screenshot filenames) at the bottom of this plan file so the gate is auditably closed.

---

## Order and verification

Tasks 1–3 in one slice (they are independent but tiny): implement, then `pnpm check`. Task 4 after, since Task 1's zero-warning invariant makes the fresh-deck baseline meaningful for the visual pass. Final: `pnpm check && npm pack --dry-run`, commit as part of the 0.4.0 release line.

## Acceptance criteria

- Fresh `init` decks (minimal and blank) validate with zero errors **and zero warnings**, enforced by a standing test.
- Removing the runtime script tag from a deck still produces `copied_asset_not_loaded`; a loaded-but-unlisted module script produces `loaded_asset_missing_manifest_item`.
- Every `slidesls` invocation in README/docs/skill markdown uses only flags the strict parser declares, enforced by the extended sweep (with a vacuity self-check).
- `visual-rhythm.mjs` has no dead fields; suite green.
- Visual gate executed on the four decks with recorded outcome; gap and width-cap decisions made from rendered output; `--analyze` clean.
- `pnpm check` and `npm pack --dry-run` pass; CHANGELOG 0.4.0 gains a `### Fixed` section.

---

## Visual gate outcome (executed 2026-07-03)

Procedure ran via agent-browser at 1600×900 (`?export=1`) over: fresh minimal deck (`executive-blue` theme), `examples/pi-coding-agent-executive-blue`, `examples/template-gallery`, `examples/stress-gallery`. Example decks were served with `scripts/serve-examples.mjs` (they reference `../../registry/...`, which `slidesls preview <example-dir>` cannot serve — first collection attempt rendered unstyled and was redone).

**Analysis results:** zero content-slide rhythm warnings and zero unintentional overflow on all four decks. Content headers land at exactly 92px (default padding) / 72px (compact density on stress-gallery — validating the derive-expectation-from-DOM approach over any hardcoded offset). Hero (fresh, pi) and section (template-gallery, 348px) slides are classified explicit and exempt.

**Judgment 1 — gap:** keep `--ls-slide-header-gap: var(--ls-space-2)`. Eyebrow/title/subtitle read as one coherent group with clear separation from the body on every theme reviewed, including the pi deck that inherited the `space-3 → space-2` tightening.

**Judgment 2 — width cap:** keep `--ls-slide-header-max-inline-size: 1080px`. Long titles ("A disciplined path from prompt to verified change", the three-line editorial-serif stress title) wrap into balanced, readable lines rather than stretching past a comfortable scan length; no wrap looked premature. No change needed.

**Pipeline bugs found and fixed by the gate itself:**

1. `--analyze` single-parsed stdin, but `agent-browser eval` returns the payload as a JSON string literal — real collections silently analyzed zero slides. Fixed with a tolerant double-parse plus a non-object error; regression test feeds a string-wrapped payload.
2. The analyzer expected `headerOffsetTop ≈ innerOffsetTop`, but `.ls-slide__inner` spans the slide (offset always 0) and positions the header via padding — every real content slide warned at 92px deviation. The collection payload now emits `expectedHeaderOffsetTop` (inner top + computed padding-top) and the analyzer prefers it, falling back to `innerOffsetTop` for hand-fed payloads; fixtures updated, fallback tested.

Screenshots reviewed: `qa-fresh.png`, `qa-pi-coding-agent-executive-blue.png`, `qa-template-gallery.png`, `qa-stress-gallery.png` (session scratchpad).
