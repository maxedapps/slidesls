# Plan: Agent-Safe Registry Redesign for slidesls

## Summary

Redesign `slidesls` around a clean, lean, agent-safe registry built as if this architecture existed from day one. Delete the fragile structural layout system and other noisy primitives instead of preserving compatibility. Replace it with:

1. top-level reusable **utilities**;
2. standalone **components**;
3. explicit paste-ready **templates/snippets**.

This is intentionally a breaking cleanup. There are no users yet, so the project should not carry legacy `layouts/*`, `ls-layout-*`, or gallery/demo cruft.

## Confirmed requirements

- Big breaking changes are wanted.
- Delete everything that is no longer part of the clean architecture.
- Do not mark old items as legacy; remove them.
- Design the registry and codebase as if this was the original model.
- Keep generated decks plain HTML/CSS/JS with no runtime package dependency.
- Add `catalog --recommended`.
- Expose snippets/templates through the registry/inspect flow first.
- Avoid automatic HTML insertion initially; agents should receive paste-ready snippets and edit HTML directly.

## Current problem

The current `registry/layouts/*` category contains structural CSS contracts disguised as composable primitives. Example: `layouts/detail-split` visually works only when layout children are inside `.ls-slide__body` because the grid is applied by:

```css
.ls-layout-detail-split .ls-slide__body { ... }
```

Agents can produce plausible markup that validates structurally but breaks visually because the contract is hidden in CSS ancestry selectors.

A grep of current layouts shows this is systemic: many layouts depend on `.ls-slide__body`, `.ls-slide__inner`, or `.ls-layout-*` ancestors.

## Target architecture

Final registry shape:

```txt
registry/
  core/
    base/
  utilities/
    layout/
  components/
    badge/
    callout/
    card/
    code-block/
    divider/
    image-card/
    metric/
    panel/
    progress/
    quote/
    table/
    timeline/
  animations/
    reveal/
    fade/
    slide-up/
    scale-in/
    highlight/
  presets/
    fonts/
      editorial-serif/
      system-humanist/
      technical-mono/
  templates/
    title-hero/
    section-divider/
    split/
    split-diagram/
    three-cards/
    code-plus-notes/
    metric-dashboard/
```

Delete entirely:

```txt
registry/layouts/
```

Also delete noisy components/animations that are not part of the clean v1 set.

## Design principles

### Utility

A utility works anywhere and owns only generic layout/alignment behavior.

```html
<div class="ls-stack">
  <div class="ls-grid ls-grid--2">
    <div class="ls-grid ls-grid--wide-left"></div>
  </div>
</div>
```

Rules:

- no dependency on `.ls-slide__body`, `.ls-slide__inner`, or a layout ancestor;
- no semantic content assumptions;
- small modifier set;
- tune with CSS variables where useful.

### Component

A component owns its own visual/content styling.

```html
<article class="ls-card">
  <h3 class="ls-card__title">Durable execution</h3>
  <p class="ls-card__text">Every session is checkpointed.</p>
</article>
```

Rules:

- no required layout parent;
- no selectors like `.ls-layout-x .ls-card`;
- component internals are scoped by component root;
- include at least one snippet.

### Template

A template is a complete HTML skeleton composed from utilities and components.

```html
<section class="ls-slide">
  <div class="ls-slide__inner">
    <header class="ls-stack">...</header>
    <div class="ls-grid ls-grid--wide-left">...</div>
  </div>
</section>
```

Rules:

- template snippets are full `<section class="ls-slide">...</section>` blocks;
- templates should not introduce template-specific CSS classes in v1;
- templates have `files: []`; snippet HTML is referenced only through `snippets`, not copied by `add`;
- templates depend on the utilities/components needed by the snippet.

## Registry metadata model

Use **one semantic taxonomy field**: `type`. Do not add a parallel `kind` field.

Allowed types:

```txt
ls:core
ls:utility
ls:component
ls:animation
ls:preset
ls:template
```

Extend registry item metadata with optional fields:

```json
{
  "name": "components/card",
  "type": "ls:component",
  "description": "Standalone card component.",
  "rootClass": "ls-card",
  "safeAnywhere": true,
  "agentRecommended": true,
  "snippets": [
    {
      "label": "Basic card",
      "path": "registry/components/card/snippets/basic.html"
    }
  ]
}
```

Template example:

```json
{
  "name": "templates/three-cards",
  "type": "ls:template",
  "description": "Three-card slide template using layout utilities and card components.",
  "files": [],
  "registryDependencies": ["core/base", "utilities/layout", "components/card"],
  "dependencies": [],
  "devDependencies": [],
  "docs": "registry/templates/three-cards/README.md",
  "rootClass": null,
  "safeAnywhere": false,
  "agentRecommended": true,
  "snippets": [
    {
      "label": "Three cards slide",
      "path": "registry/templates/three-cards/snippet.html"
    }
  ]
}
```

Important:

- Absence of `agentRecommended` means not included in `catalog --recommended`.
- Template snippets must not appear in `files`; otherwise `add templates/x` copies snippet HTML into deck assets.
- `produces: "html"` is not needed unless code actually consumes it; omit it for now.

## Implementation phases

## Phase 1: Registry inventory and aggressive deletion

Delete:

```txt
registry/layouts/
```

Delete or defer noisy/over-specific components unless they are rebuilt with snippets and a clear v1 use case:

```txt
registry/components/annotation/
registry/components/connector/
registry/components/diagram/
registry/components/highlight-text/
registry/components/legend/
registry/components/logo-strip/
registry/components/media-frame/
registry/components/numbered-step/
registry/components/stat-grid/
registry/components/bullet-list/
```

Delete or defer advanced animations:

```txt
registry/animations/connector-grow/
registry/animations/path-draw/
registry/animations/pulse/
registry/animations/spotlight/
registry/animations/stagger/
registry/animations/step-focus/
```

Keep/rebuild small v1 set:

```txt
core/base
utilities/layout
components/badge
components/callout
components/card
components/code-block
components/divider
components/image-card
components/metric
components/panel
components/progress
components/quote
components/table
components/timeline
animations/reveal
animations/fade
animations/slide-up
animations/scale-in
animations/highlight
presets/fonts/*
templates/*
```

Update `registry.json` after deletion.

Do not expect `pnpm check` to pass mid-migration. This is a coherent sweep; checks should pass once registry, examples, docs, generated catalog, and smoke tests are all updated.

## Phase 2: Clean CSS layer model

Update `registry/core/base/reset.css` layer declaration.

Current order includes dead `layouts`:

```css
@layer reset, tokens, base, layouts, components, animations, utilities;
```

New order:

```css
@layer reset, tokens, base, components, animations, utilities;
```

Use:

- `@layer utilities` for layout utilities;
- `@layer components` for components;
- `@layer animations` for animations;
- no new `@layer core` unless added explicitly to the layer order.

## Phase 3: Add `utilities/layout`

Create:

```txt
registry/utilities/layout/
  layout.css
  README.md
  registry-item.json
  snippets/basic.html
```

Registry item:

```json
{
  "name": "utilities/layout",
  "type": "ls:utility",
  "description": "Reusable layout utilities for stacks, clusters, grids, centering, and fill behavior.",
  "files": [{ "path": "registry/utilities/layout/layout.css", "type": "registry:style" }],
  "registryDependencies": ["core/base"],
  "dependencies": [],
  "devDependencies": [],
  "docs": "registry/utilities/layout/README.md",
  "rootClass": "ls-stack",
  "safeAnywhere": true,
  "agentRecommended": true,
  "snippets": [
    { "label": "Basic utility layouts", "path": "registry/utilities/layout/snippets/basic.html" }
  ]
}
```

Initial classes:

```css
.ls-stack
.ls-stack--sm
.ls-stack--lg
.ls-cluster
.ls-grid
.ls-grid--2
.ls-grid--3
.ls-grid--wide-left
.ls-grid--wide-right
.ls-center
.ls-fill
.ls-frame
```

Keep this intentionally small. Do not add many responsive or alignment variants yet.

## Phase 4: Add/clean standalone components

Add new component:

```txt
registry/components/panel/
  panel.css
  README.md
  registry-item.json
  snippets/basic.html
```

Root class:

```css
.ls-panel
.ls-panel--muted
.ls-panel--accent
```

For every kept component:

- add `rootClass`;
- add `safeAnywhere: true`;
- add `agentRecommended: true` when it should appear in the recommended catalog;
- add at least one snippet under `snippets/`;
- ensure CSS depends only on component root/internal classes;
- remove hidden parent/ancestor layout selectors if any remain.

Likely component snippets:

```txt
components/card/snippets/basic.html
components/callout/snippets/basic.html
components/code-block/snippets/basic.html
components/metric/snippets/basic.html
components/panel/snippets/basic.html
components/quote/snippets/basic.html
components/table/snippets/basic.html
components/timeline/snippets/basic.html
```

## Phase 5: Add templates

Create:

```txt
registry/templates/title-hero/
registry/templates/section-divider/
registry/templates/split/
registry/templates/split-diagram/
registry/templates/three-cards/
registry/templates/code-plus-notes/
registry/templates/metric-dashboard/
```

Each template directory contains:

```txt
registry-item.json
README.md
snippet.html
```

Each template registry item:

- `type: "ls:template"`;
- `files: []`;
- `agentRecommended: true`;
- `safeAnywhere: false`;
- `registryDependencies` lists every required utility/component;
- `snippets` references `snippet.html`;
- no template CSS in v1 unless absolutely unavoidable.

Template replacements:

- old `layouts/title-hero` -> `templates/title-hero`;
- old `layouts/section-divider` / centered statements -> `templates/section-divider`;
- old `detail-split`, `two-column`, `asymmetric-feature` -> `templates/split`;
- old `image-spotlight`, `layered-canvas` -> `templates/split-diagram`;
- old `three-column`, comparison use cases -> `templates/three-cards`;
- old `code-explainer` -> `templates/code-plus-notes`;
- old `metric-dashboard` -> `templates/metric-dashboard`.

## Phase 6: Extend registry validation

Update `src/validation/registry.mjs`.

Required changes:

- Add allowed types:
  - `ls:utility`
  - `ls:template`
  - optionally bare `utility` / `template` only if historical compatibility is still desired internally.
- Validate `snippets`:
  - `snippets` must be an array if present;
  - each snippet needs non-empty `label` and safe relative `path`;
  - path must exist and be readable;
  - path should end in `.html`;
  - path must not be listed in `files` for templates unless a future explicit copy behavior exists.
- Validate `agentRecommended` is boolean if present.
- Validate `safeAnywhere` is boolean if present.
- Validate `rootClass` is string or absent/null.
- For templates, require at least one snippet.
- For templates, recommend/require `files: []`.

Strong recommendation: add `schemas/registry-item.schema.json` in this phase and have registry validation use it or at least mirror it. This prevents typo drift in new metadata such as `agentRecommended`.

## Phase 7: Extend registry source, catalog, and inspect

Update `src/registry/source.mjs`:

- `summarizeItem()` should include:
  - `rootClass`
  - `safeAnywhere`
  - `agentRecommended`
  - `snippets` metadata without HTML content for catalog summary.

Update `inspectCommand` in `src/cli/commands.mjs`:

- Fetch snippet HTML for requested items.
- Avoid noisy dependency snippet expansion if possible.

Important detail: `inspectCommand` currently uses `resolveItems`, so inspecting `templates/split` may return dependencies too. For snippets, attach HTML only to explicitly requested item names, not every resolved dependency. Dependencies can still appear as summaries/load info.

Expected JSON:

```json
{
  "items": [
    {
      "name": "templates/split",
      "type": "ls:template",
      "agentRecommended": true,
      "snippets": [
        {
          "label": "Split slide",
          "path": "registry/templates/split/snippet.html",
          "html": "<section class=\"ls-slide\">..."
        }
      ]
    }
  ]
}
```

Text output should include compact snippet labels/paths.

## Phase 8: Add `catalog --recommended`

Update `catalogCommand`:

- parse boolean `recommended`;
- filter items to `agentRecommended === true`;
- compose with `--type`, `--tag`, `--query`, and `--limit`.

Recommended command:

```sh
slidesls catalog --recommended --json
```

Also update root help / skill docs to make this the default agent discovery command.

## Phase 9: Update catalog generation

Update `src/registry/catalog-doc.mjs`:

- add groups:
  - Core
  - Utilities
  - Components
  - Animations
  - Presets
  - Templates
- remove old Layouts grouping.
- include new metadata where useful:
  - root class;
  - safe anywhere;
  - agent recommended;
  - snippets.

Regenerate:

```sh
node bin/slidesls.mjs generate-catalog
```

Ensure `pnpm validate:skills` passes.

## Phase 10: Update init/default deck

Update:

- `src/cli/commands.mjs`
- `src/deck/templates.mjs`

Changes:

- `minimalItems` should no longer include `layouts/title-hero`.
- Minimal init should copy:
  - `core/base`
  - `utilities/layout`
  - any components used by the generated opening slide, e.g. `components/badge`, `components/panel` if needed.
- Generated `index.html` should use the same primitive composition style as `templates/title-hero/snippet.html`.
- No `ls-layout-*` or old layout-specific classes in generated HTML.
- Update `nextSteps`; remove old `layouts/two-column` suggestion.

Example next step:

```txt
slidesls catalog --recommended
slidesls inspect templates/split --json
slidesls add utilities/layout components/card components/panel
```

## Phase 11: Update examples aggressively

Current example galleries are heavily based on items being deleted. Do not carry them as legacy demos.

Delete or replace:

```txt
examples/primitive-gallery/
examples/structured-content-gallery/
examples/visual-narrative-gallery/
```

Recommended clean examples:

```txt
examples/project-intro/
examples/template-gallery/
```

`project-intro` should demonstrate a normal small deck built with utilities/components/templates.

`template-gallery` should demonstrate the new template snippets and recommended primitives.

Update `src/validation/examples.mjs`:

- remove hardcoded old `title-hero.css` / `ls-layout-title-hero` checks;
- optionally replace with checks that default/generated examples do not use `ls-layout-*` and do use `utilities/layout` when `ls-grid` or `ls-stack` appears.

## Phase 12: Update positive validation for missing dependencies

Add high-signal validation in `src/validation`.

Goal: catch common agent mistakes such as using `.ls-grid` without loading/copying `utilities/layout`.

Recommended approach:

- derive class-to-item mapping from registry metadata where possible:
  - `rootClass` maps to item name;
  - optionally add `classNames` metadata later for utilities with many classes.
- v1 can include a small maintained map for utilities/components if it is generated or kept close to registry metadata.
- use manifest copied items and/or local references to determine loaded items.

Checks:

- HTML uses `ls-grid`, `ls-stack`, `ls-cluster`, etc. but `utilities/layout` is missing => warning/error.
- HTML uses `ls-panel` but `components/panel` is missing.
- HTML uses `ls-card` but `components/card` is missing.

Avoid a large old-layout denylist. Since old layouts are deleted and there are no users, denylist migration checks are less valuable. A simple warning for any `ls-layout-` class is enough:

```txt
ls-layout-* classes are not part of the new registry. Use templates and utilities instead.
```

## Phase 13: Update docs and skills

Update:

- `README.md`
- `docs/cli.md`
- `docs/agent-workflow.md`
- `docs/deck-contract.md`
- `docs/registry-contract.md`
- `docs/primitive-authoring.md`
- `docs/primitive-expansion.md` — delete or rewrite if old-layout focused.
- `skills/slidesls/SKILL.md`
- `skills/slidesls/references/*.md`

New canonical agent workflow:

```sh
slidesls catalog --recommended --json
slidesls inspect templates/split --json
slidesls inspect components/card --json
slidesls add utilities/layout components/panel components/card --dry-run --json
slidesls add utilities/layout components/panel components/card
slidesls validate --json
```

Docs should state:

- prefer templates for full slide skeletons;
- prefer utilities/components for custom composition;
- snippets from `inspect --json` are source-of-truth markup;
- old `layouts/*` and `ls-layout-*` are gone;
- do not create new structural ancestor-dependent CSS APIs.

## Phase 14: Update tests and smoke checks

Update existing tests that reference old layouts:

- `tests/cli-output.test.mjs`
- `tests/registry-resolution.test.mjs`
- `scripts/test-cli-smoke.mjs`
- any examples/validation tests.

Add tests:

- `catalog --recommended --json` returns only `agentRecommended: true` items.
- recommended catalog includes `utilities/layout`, `components/panel`, `templates/split`.
- catalog no longer includes any `layouts/*` items.
- `inspect templates/split --json` returns snippet HTML.
- `inspect components/card --json` returns snippet HTML.
- `add templates/split --dry-run --json` copies dependencies but not snippet HTML files.
- `init` creates markup using utilities/components and validates.
- `validate` warns/errors when `.ls-grid` is used without `utilities/layout` loaded.
- `validate-registry` fails on missing snippet files.
- `generate-catalog --check` passes after regenerated skill catalog.
- `cli:smoke` uses `catalog --recommended` and template inspect.

Final verification:

```sh
pnpm fmt
pnpm check
npm pack --dry-run
```

## Files likely to change

Registry:

- delete `registry/layouts/`
- delete selected `registry/components/*`
- delete selected `registry/animations/*`
- add `registry/utilities/layout/`
- add `registry/components/panel/`
- add `registry/templates/*/`
- update `registry.json`

Code:

- `src/cli/commands.mjs`
- `src/registry/source.mjs`
- `src/registry/catalog-doc.mjs`
- `src/validation/registry.mjs`
- `src/validation/examples.mjs`
- `src/deck/templates.mjs`
- maybe `src/deck/copy.mjs` only if template/snippet copy behavior needs explicit handling
- possibly new `schemas/registry-item.schema.json`

Docs/skills:

- `README.md`
- `docs/*.md`
- `skills/slidesls/SKILL.md`
- `skills/slidesls/references/*.md`

Examples/tests:

- `examples/*`
- `tests/*.test.mjs`
- `scripts/test-cli-smoke.mjs`

## Acceptance criteria

- `registry/layouts/` no longer exists.
- No default deck, example, docs, or skill workflow recommends `layouts/*` or `ls-layout-*`.
- `registry/utilities/layout` exists and is recommended.
- `components/panel` exists and is recommended.
- `templates/*` exist with snippet HTML and no copied CSS contract.
- `slidesls catalog --recommended --json` works.
- `slidesls inspect templates/split --json` returns full HTML snippet content.
- `slidesls inspect components/card --json` returns snippet content.
- `slidesls add templates/split --dry-run --json` does not copy snippet HTML by default.
- `slidesls init` creates a valid primitive-based deck.
- examples validate and demonstrate the new model.
- `pnpm check` passes.
- `npm pack --dry-run` includes new templates/snippets and excludes deleted obsolete registry items.

## Deferred work

- Automatic HTML insertion.
- Separate `template list/show` command.
- Browser visual QA / screenshot validation.
- Full DOM parser-based validation.
- Public npm publishing.
- Reintroducing advanced diagrams/annotations/animations once they have clear snippets and non-fragile APIs.

## Review notes incorporated

This plan was reviewed critically before finalization. Key revisions made from the initial draft:

- Template snippets are stored only in `snippets`, not `files`, to avoid accidental copying by `add`.
- Chose one taxonomy field, `type`, instead of adding parallel `kind` metadata.
- Changed `core/layout-utilities` to top-level `utilities/layout` for a cleaner greenfield structure.
- Added required changes for registry validation allowed types and snippet validation.
- Added required changes for catalog generation grouping and metadata output.
- Explicitly decided to delete or replace old example galleries instead of trying to preserve them.
- Added cleanup of old `title-hero` checks and old help/smoke references.
- Removed the idea of a large legacy-layout denylist; use positive dependency validation and a simple `ls-layout-*` warning instead.
