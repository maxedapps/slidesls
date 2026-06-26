# Plan: Font Family Presets and Project State Update

Date: 2026-06-26
Status: Implemented
Project: ls_slides

## Context

`ls_slides` is a copyable registry of vanilla HTML/CSS/JS building blocks for web slide decks. The repository now has a real initial registry foundation: `core/base`, reveal animations, title/detail layouts, badge/card/diagram components, root/per-item registry metadata, a two-slide intro example, and a dependency-free examples server.

`PROJECT.md` still reflects the earlier base-scaffold stage in places and should be updated so future agents understand that registry components and metadata now exist. The next capability is support for different font families without turning the repo into a framework, package, generator, or runtime dependency.

Current typography state:

- `registry/core/base/tokens.css` defines only `--ls-font-sans` and `--ls-font-mono`.
- `.ls-page` uses `--ls-font-sans` directly.
- Some technical labels in layouts/components use `--ls-font-mono` directly.
- Titles, labels, badges, cards, and body copy inherit or use size/weight tokens but do not yet have semantic font-family roles.
- `registry/presets/` exists but only has a placeholder README.

## Goals

- Update `PROJECT.md` to accurately describe the current implemented state.
- Add first-class support for different font families through copyable CSS, not runtime JavaScript.
- Preserve the copyable-registry model.
- Keep `core/base` dependency-light and usable with no network access.
- Introduce semantic font roles so layouts/components can switch typography coherently.
- Add optional scoped font preset registry items under `registry/presets/fonts/`.
- Demonstrate font preset usage in examples/docs without forcing it on all decks.
- Keep font stack assignment separate from font loading.

## User constraints

- Use `pnpm` only.
- Keep the project vanilla and copyable-registry oriented.
- Do not add framework dependencies.
- Do not add a runtime package or generator.
- Use `ls-` prefixed classes/attributes where classes are needed.
- Keep registry items readable and easy to copy.
- Support multiple font families as optional choices.
- Use scoped-only presets: loading a preset file should not globally change the deck unless an element opts in with `data-ls-font="..."`.

## Research performed

Local files inspected:

- `PROJECT.md`
- `README.md`
- `package.json`
- `registry.json`
- `registry/README.md`
- `registry/core/base/tokens.css`
- `registry/core/base/slide.css`
- `registry/core/base/reset.css`
- `registry/core/base/README.md`
- `registry/core/base/registry-item.json`
- `registry/presets/README.md`
- `examples/README.md`
- `examples/project-intro/index.html`
- `.plans/2026-06-26-registry-foundation-intro-deck.md`

No external research is required for this plan because the change is internal architecture using stable CSS custom properties, cascade layers, local/system font stacks, and existing registry metadata conventions.

## Decisions

### 1. Use semantic font roles in core

Keep raw family tokens, but add semantic role tokens in `registry/core/base/tokens.css`:

```css
--ls-font-sans:
  Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
--ls-font-serif: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
--ls-font-mono: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;

--ls-font-body: var(--ls-font-sans);
--ls-font-heading: var(--ls-font-sans);
--ls-font-display: var(--ls-font-heading);
--ls-font-label: var(--ls-font-sans);
--ls-font-code: var(--ls-font-mono);
```

Use semantic roles throughout registry CSS:

- `.ls-page` -> `var(--ls-font-body)`
- `.ls-title` -> `var(--ls-font-heading)` by default
- title-hero oversized title -> add `font-family: var(--ls-font-display)`
- `.ls-eyebrow`, `.ls-badge` -> `var(--ls-font-label)`
- technical captions/diagram metadata -> `var(--ls-font-code)`

This lets a preset alter the deck personality without editing every component.

### 2. Keep presets as scoped token remaps, not component forks

Add copyable preset items under:

```txt
registry/presets/fonts/<preset-name>/
  font.css
  README.md
  registry-item.json
```

Each preset should be a tiny CSS file normally loaded after `core/base/tokens.css` for readability and predictable copy order. Scoped activation works because the custom properties are set directly on the opted-in element/subtree, not because presets globally override `:root`. Presets should use the existing `@layer tokens`; do not add a new cascade layer yet.

### 3. Use scoped-only font selection

Core keeps the default typography in `:root`. Presets do **not** set `:root`; they only define scoped attribute selectors:

```css
@layer tokens {
  [data-ls-font="editorial-serif"] {
    --ls-font-heading: var(--ls-font-serif);
    --ls-font-display: var(--ls-font-serif);
  }
}
```

Global deck usage:

```html
<link rel="stylesheet" href="../../registry/presets/fonts/editorial-serif/font.css" />
<body class="ls-page" data-ls-font="editorial-serif"></body>
```

Per-slide usage:

```html
<section class="ls-slide" data-ls-font="editorial-serif"></section>
```

This makes presets composable: multiple preset files can be loaded without global side effects or last-loaded-wins surprises.

### 4. Separate font stack presets from font loading presets

Initial implementation should not add new font CDN dependencies to core. Font preset files should only assign font stacks using system/local family names and CSS variables.

The existing intro example already loads Lucide from a pinned CDN, so CDN use is not forbidden in examples. Still, font loading has distinct network, privacy, licensing, integrity, and offline-preview implications. Add web font loading only as explicit future registry items, for example:

```txt
registry/presets/fonts/cdn-inter/
registry/presets/fonts/cdn-space-grotesk/
registry/presets/fonts/self-hosted-template/
```

### 5. Add a small set of initial stack presets

Create three initial presets that demonstrate meaningful typographic differences without external dependencies:

1. `editorial-serif` — serif headings/display with sans body for narrative or strategic decks.
2. `technical-mono` — monospace labels/code and a more technical voice while keeping body readable.
3. `system-humanist` — humanist/system sans leaning on OS fonts for clean professional decks.

Avoid a no-op `professional-sans` preset because the default roles in `tokens.css` already cover the baseline.

### 6. Keep registry metadata consistent

Add every preset to `registry.json` and give each one a per-item metadata file:

```json
{
  "name": "presets/fonts/editorial-serif",
  "type": "ls:preset",
  "description": "Serif heading font role remap for editorial slide decks.",
  "files": [
    { "path": "registry/presets/fonts/editorial-serif/font.css", "type": "registry:style" }
  ],
  "registryDependencies": ["core/base"],
  "dependencies": [],
  "devDependencies": [],
  "docs": "registry/presets/fonts/editorial-serif/README.md"
}
```

Use the same metadata shape as the existing registry items.

## Alternatives considered

### Alternative A — Only expose `--ls-font-sans` and `--ls-font-mono`

Rejected. This is too limiting: switching from sans to serif headings would require downstream edits across many selectors, and components cannot express typographic intent.

### Alternative B — Add many component-specific font variables

Rejected for now. Variables like `--ls-card-title-font`, `--ls-badge-font`, and `--ls-diagram-label-font` would be powerful but overly granular for the early registry. Semantic roles cover most needs with less complexity.

### Alternative C — Add JavaScript-driven font selection

Rejected. Fonts are presentational CSS tokens. JS would add unnecessary runtime behavior and conflict with the copyable, vanilla, no-framework model.

### Alternative D — Make preset files globally active on load

Rejected by user preference and composability concerns. Loading two global presets would create order-dependent behavior. Scoped-only presets allow several choices to be loaded safely and activated via `data-ls-font`.

### Alternative E — Bundle web fonts or CDN font presets immediately

Rejected for the first step. External font loading adds network and licensing considerations. The project can add explicit CDN/self-hosted presets later, but core support should first work offline with system stacks.

## Implementation phases

### Phase 1 — Update project documentation state

- [x] Edit `PROJECT.md` to reflect that the registry foundation now exists.
- [x] Replace stale “Do not add actual registry components, metadata formats...” wording with guidance that future registry additions need an explicit plan and must preserve the established metadata/item model.
- [x] Add a short “Current registry foundation” section listing:
  - root registry index,
  - `core/base`,
  - reveal animation,
  - title/detail layouts,
  - badge/card/diagram components,
  - example deck,
  - examples server.
- [x] Add font preset direction under technical direction or registry model.

### Phase 2 — Add semantic font role tokens

- [x] Update `registry/core/base/tokens.css` with `--ls-font-serif`, `--ls-font-body`, `--ls-font-heading`, `--ls-font-display`, `--ls-font-label`, and `--ls-font-code`.
- [x] Keep existing `--ls-font-sans` and `--ls-font-mono` for compatibility.
- [x] Do not remove or rename existing raw tokens.

### Phase 3 — Migrate registry CSS to semantic roles

- [x] Update `registry/core/base/slide.css`:
  - `.ls-page` uses `--ls-font-body`.
  - `.ls-eyebrow` uses `--ls-font-label`.
  - `.ls-title` uses `--ls-font-heading`.
- [x] Update `registry/layouts/title-hero/title-hero.css`:
  - add `font-family: var(--ls-font-display)` to the hero title rule.
  - captions or technical text use `--ls-font-code`.
- [x] Update `registry/components/badge/badge.css`:
  - badge text uses `--ls-font-label`.
- [x] Update `registry/components/diagram/diagram.css`:
  - labels/captions currently using `--ls-font-mono` switch to `--ls-font-code`.
- [x] Search all registry CSS for direct `font-family` and `--ls-font-` usage; keep raw-token usage only inside `tokens.css` and preset files unless clearly intentional.

### Phase 4 — Add font preset registry items

- [x] Create `registry/presets/fonts/README.md` explaining:
  - semantic font roles,
  - load order,
  - global body-level and per-slide scoped usage,
  - offline/system-stack nature of initial presets,
  - distinction between font stacks and font loading.
- [x] Create `registry/presets/fonts/editorial-serif/` with:
  - `font.css`,
  - `README.md`,
  - `registry-item.json`.
- [x] Create `registry/presets/fonts/technical-mono/` with the same files.
- [x] Create `registry/presets/fonts/system-humanist/` with the same files.
- [x] Update `registry/presets/README.md` to link/mention font presets.
- [x] Update root `registry.json` to index the three new preset metadata files.

Suggested preset behavior:

```css
/* editorial-serif */
[data-ls-font="editorial-serif"] {
  --ls-font-heading: var(--ls-font-serif);
  --ls-font-display: var(--ls-font-serif);
}
```

```css
/* technical-mono */
[data-ls-font="technical-mono"] {
  --ls-font-label: var(--ls-font-mono);
  --ls-font-heading: var(--ls-font-sans);
}
```

The code role already defaults to `--ls-font-mono`; this preset mainly makes labels/eyebrows feel more technical without making body text hard to read.

```css
/* system-humanist */
[data-ls-font="system-humanist"] {
  --ls-font-body: "Avenir Next", Avenir, "Segoe UI", ui-sans-serif, system-ui, sans-serif;
  --ls-font-heading: "Avenir Next", Avenir, "Segoe UI", ui-sans-serif, system-ui, sans-serif;
  --ls-font-display: var(--ls-font-heading);
  --ls-font-label: "Avenir Next", Avenir, "Segoe UI", ui-sans-serif, system-ui, sans-serif;
}
```

### Phase 5 — Demonstrate usage without forcing a preset

- [x] Keep `examples/project-intro` on default typography unless visual review explicitly supports changing it.
- [x] Update `examples/project-intro/README.md` with a short font preset usage snippet:

```html
<link rel="stylesheet" href="../../registry/presets/fonts/editorial-serif/font.css" />
<body class="ls-page" data-ls-font="editorial-serif"></body>
```

- [x] Optionally add commented snippets in docs, not in the example HTML, to avoid cluttering the proof deck.
- [x] Browser-inspect the example even if HTML is unchanged because `core/base/slide.css` changes affect every deck.

### Phase 6 — Add repeatable registry validation

- [x] Add `scripts/validate-registry.mjs` to validate:
  - every `registry.json.items[]` path exists,
  - every item JSON parses,
  - every listed file path exists,
  - every listed docs path exists,
  - every `registryDependencies[]` entry refers to an existing item `name` field. Build a name set by reading all indexed item JSON files before validating dependencies.
- [x] Add a package script, e.g.:

```json
"validate:registry": "node scripts/validate-registry.mjs"
```

- [x] Consider updating `check` to include it:

```json
"check": "pnpm lint && pnpm fmt:check && pnpm validate:registry"
```

This matters because Oxlint/Oxfmt do not validate CSS, JSON metadata semantics, HTML, or Markdown.

### Phase 7 — Documentation polish

- [x] Update `registry/core/base/README.md` to mention semantic font roles.
- [x] Update `registry/README.md` copy model if needed to mention presets as optional token remaps.
- [x] Update `README.md` only if a concise top-level mention of presets improves discoverability.
- [x] Ensure docs say presets are optional and copyable, not required runtime dependencies.

### Phase 8 — Validation and commit

- [x] Run formatting and baseline checks:

```sh
pnpm fmt
pnpm check
```

- [x] Run registry validation directly if it is not folded into `check`:

```sh
pnpm validate:registry
```

- [x] Start the example server:

```sh
pnpm serve:examples
```

- [x] Smoke-test:

```sh
curl -I http://localhost:4173/examples/
curl -I http://localhost:4173/examples/project-intro/
```

- [x] Browser-inspect `examples/project-intro` in normal and export modes:
  - `/examples/project-intro/`
  - `/examples/project-intro/?export=1`
- [x] If practical, temporarily apply `data-ls-font="editorial-serif"` in dev tools or a scratch copy to confirm scoped preset behavior and title fit.
- [x] Check `git diff` for accidental broad changes.
- [x] Commit with a focused message, ensuring root `registry.json` is staged:

```sh
git add PROJECT.md README.md package.json registry.json registry examples scripts
pnpm check
git commit -m "Add font preset support"
```

## Implementation progress

- [x] Phase 1 — Updated `PROJECT.md` with the implemented registry foundation and font preset direction.
- [x] Phase 2 — Added semantic font role tokens in `registry/core/base/tokens.css`.
- [x] Phase 3 — Migrated registry CSS font-family usage to semantic roles.
- [x] Phase 4 — Added scoped font preset registry items for `editorial-serif`, `technical-mono`, and `system-humanist`.
- [x] Phase 5 — Documented font preset usage in the project intro example without changing the example deck default typography.
- [x] Phase 6 — Added repeatable registry metadata validation and included it in `pnpm check`.
- [x] Phase 7 — Updated registry/core/top-level docs for optional font presets.
- [x] Phase 8 — Ran validation, browser verification, peer review, and committed the implementation.
  - Commit: `6dfd7e0` — `Add font preset support`

Validation run so far:

```sh
node --check scripts/validate-registry.mjs
node --check scripts/serve-examples.mjs
pnpm validate:registry
pnpm fmt
pnpm check
```

Results: all passed. Browser smoke checks also passed for `/examples/project-intro/`, `/examples/project-intro/?export=1`, and dynamic scoped `data-ls-font="editorial-serif"` behavior. Peer review accepted the implementation as-is.

## Validation

Primary validation:

```sh
pnpm check
pnpm validate:registry
```

Additional syntax/smoke checks:

```sh
node --check scripts/serve-examples.mjs
node --check scripts/validate-registry.mjs
pnpm serve:examples
curl -I http://localhost:4173/examples/
curl -I http://localhost:4173/examples/project-intro/
```

Manual/browser validation:

- Confirm default example still renders correctly.
- Confirm `?export=1` still renders all slides statically.
- Confirm a loaded font preset only applies when `data-ls-font` is present.
- Confirm per-slide scoping works by applying `data-ls-font` to one slide.

## Risks / rollback

- Risk: Serif/display presets may affect layout fit because titles are large and current letter-spacing is tuned for sans. Mitigation: keep the intro example default unchanged; document that presets can require downstream size/spacing tweaks.
- Risk: Direct `font-family` usage may remain in components. Mitigation: grep for `font-family` and `--ls-font-` after changes.
- Risk: Adding presets could imply a required theme system. Mitigation: docs must state presets are optional scoped token remaps.
- Risk: Validation commands like Oxlint/Oxfmt give little signal for CSS/HTML/Markdown. Mitigation: add repeatable registry validation and browser smoke tests.
- Rollback: revert the commit. Existing decks using raw `--ls-font-sans` and `--ls-font-mono` should continue working because those tokens are retained.

## Peer review summary

Planning peer review approved the overall semantic font-role/token-remap direction and found it aligned with the project constraints. Feedback incorporated:

- Use scoped-only presets instead of global-on-load presets.
- Do not add a no-op `professional-sans` preset.
- Treat Oxlint/Oxfmt as low-signal for this CSS/JSON/Markdown-heavy change.
- Add repeatable registry metadata validation.
- Browser-inspect examples even if only base CSS changes.
- Explicitly stage root `registry.json` when committing.
- Keep presets focused on semantic role tokens instead of mutating raw tokens, and ensure dependency validation resolves item names rather than paths.

Implementation peer review: fresh review after commit `6dfd7e0` accepted the implementation as-is. Non-blocking observations: the registry validator could later enforce item `type`, and `system-humanist` intentionally repeats literal stacks for copyability.
