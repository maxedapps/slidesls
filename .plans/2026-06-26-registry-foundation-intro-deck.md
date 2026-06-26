# Plan: Registry Foundation, Metadata, and Intro Example Deck

Date: 2026-06-26
Status: Implemented
Project: ls_slides

## Context

`ls_slides` is a copyable registry of vanilla HTML, CSS, and JavaScript building blocks for creating web-based slide decks. The base repository structure already exists. The next step is to create the first real registry slice: core slide foundation, initial layouts/components/animations, registry metadata, and a small example deck that proves the pieces work together.

The two-slide example deck is a validation consumer, not the main product. Reusable patterns must live in `registry/`; the example should assemble registry items with minimal one-off styling.

## Goals

- Establish the first usable `registry/core` foundation for browser-rendered slide decks.
- Add registry metadata now, inspired by the shadcn registry model.
- Add initial reusable layout patterns needed for a title slide and an explanatory detail slide.
- Add minimal reusable components needed by those layouts.
- Add a vanilla reveal/navigation foundation with reduced-motion and export/static-mode support.
- Support Lucide icons in a copyable, dependency-light way.
- Create an example two-slide deck that demonstrates the foundation.
- Keep the project aligned with the copyable-registry model, not a framework/runtime/generator.

## User constraints

- Use `pnpm` only.
- No other monorepo tools.
- Use Oxlint and Oxfmt.
- Preserve the copyable-registry model.
- Add registry metadata files in this step.
- No framework dependency for registry items.
- Do not turn this repo into a runtime package.
- Use modern vanilla HTML, CSS, and JavaScript.
- Support icons, especially Lucide icons.
- Use a dark professional default theme.
- Use `ls-` prefixed class names.
- Build the actual registry foundation; the example deck is only proof that it works.

## Research performed

Local project files inspected:

- `PROJECT.md`
- `README.md`
- `package.json`
- `.plans/2026-06-26-base-project-setup.md`
- current `registry/`, `examples/`, `docs/`, `skills/`, and `scripts/` structure

External/source research performed:

- Lucide vanilla usage and installation docs: `https://lucide.dev/guide/lucide`, `https://lucide.dev/guide/installation`
- MDN cascade layers: `https://developer.mozilla.org/en-US/docs/Web/CSS/%40layer`
- MDN custom properties: `https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascading_variables/Using_custom_properties`
- MDN prefers-reduced-motion: `https://developer.mozilla.org/en-US/docs/Web/CSS/%40media/prefers-reduced-motion`
- GSAP timeline docs: `https://gsap.com/docs/v3/GSAP/gsap.timeline()/`
- shadcn registry docs: `https://ui.shadcn.com/docs/registry/registry-json`, `https://ui.shadcn.com/docs/registry/registry-item-json`, `https://ui.shadcn.com/docs/registry/github`

Key findings:

- Lucide supports vanilla HTML placeholders such as `<i data-lucide="copy"></i>` followed by `lucide.createIcons()`; examples often use a CDN, and stable consumers should pin versions instead of using `@latest`.
- After Lucide replacement, styling should target the generated SVG wrapper or `.lucide`/`.ls-icon > svg`, not rely on `[data-lucide]` still existing.
- CSS cascade layers are appropriate for a copyable CSS registry because they define predictable ordering across reset, tokens, base, layouts, components, animations, and utilities.
- CSS custom properties are a good fit for tokenized, copyable design systems.
- `prefers-reduced-motion` should disable or simplify non-essential reveal/transition motion.
- GSAP is useful for future advanced animation recipes, but this first slice does not need it and should not add it as a root dependency.
- shadcn’s registry model centers around registry item metadata that lists files, dependencies, devDependencies, and registryDependencies. This solves distribution for split files: an item can depend on other registry items, and a future copy script/CLI/docs flow can resolve the graph.

## Decisions

### 1. Use item directories plus metadata, not only loose files

Structure registry items as directories so each item can own:

- implementation files,
- `registry-item.json`,
- a concise `README.md` with copy/use notes.

This avoids future ambiguity when an item consists of multiple files. It also gives agents a stable unit to copy or reason about.

### 2. Add root registry metadata now

Use the canonical registry/project metadata name `ls-slides` to match `package.json`; keep `ls_slides` only as the human-facing/project-folder spelling when needed.

Add a root-level source metadata file:

```txt
registry.json
```

Use it as the registry index for this repository. Keep the first schema small and shadcn-inspired rather than trying to exactly implement shadcn’s CLI behavior. It should identify available items and their metadata locations.

Initial root metadata should include fields such as:

```json
{
  "name": "ls-slides",
  "homepage": "https://github.com/<owner>/<repo>",
  "items": [
    "registry/core/base/registry-item.json",
    "registry/animations/reveal/registry-item.json"
  ]
}
```

Use a placeholder or omit `homepage` if the canonical remote URL is not known during implementation.

### 3. Use per-item `registry-item.json` files

Each registry item should describe:

- `name`
- `type`
- `description`
- `files`
- `registryDependencies`
- `dependencies`
- optional `devDependencies`
- optional `docs`

Initial item types can be project-local strings, e.g.:

- `ls:core`
- `ls:layout`
- `ls:component`
- `ls:animation`

This keeps the repository honest about not yet being a shadcn CLI registry while preserving the same mental model.

### 4. Split files are not a future problem if dependencies are explicit

Splitting the foundation into core/layout/component/animation items is compatible with copyable distribution because metadata declares the copy graph.

Example:

- `layouts/title-hero` depends on `core/base` and any structural components it directly uses. Reveal animation is optional and should be selected by the example/consumer rather than forced by layout items.
- `examples/project-intro` can document the exact item set it consumes.
- A future copy helper can resolve `registryDependencies` and copy all needed files.

This mirrors the shadcn role model: users request an item, and its dependency graph determines the files copied into the downstream project.

### 5. Use a fixed 16:9 logical slide canvas

Set default tokens for a `1600px × 900px` slide canvas. Use a small JS-enhanced scaling mechanism that sets a `--ls-scale` custom property from `min(viewportWidth / 1600, viewportHeight / 900)`, then applies `transform: scale(var(--ls-scale))` to the fixed canvas. This keeps authoring predictable and implementation simple.

No-JS fallback must be readable even if not presentation-perfect: before the runtime marks the deck ready, CSS should render slides as normal stacked `1600px × 900px` sections in document flow with overflow available. JavaScript is required for polished viewport scaling, keyboard navigation, reveal state, and export/static mode, but not for seeing the content.

### 6. Establish CSS cascade layer contracts now

Use this layer order:

```css
@layer reset, tokens, base, layouts, components, animations, utilities;
```

The canonical layer-order declaration must live at the top of the always-first core CSS file, `registry/core/base/reset.css`, before any layered rules. Each registry CSS file should then declare styles in the correct layer. Documentation must say: copy/load the core base item first, because it establishes layer precedence for all other items. This is foundational because independently copied registry items must compose predictably.

### 7. Keep navigation runtime in `registry/core`

Navigation, active slide state, scaling hooks, export/static mode, and optional icon initialization are core deck infrastructure. Put runtime JavaScript in the core item, not under animations.

### 8. Keep animation vanilla for now

Use CSS transitions plus a small vanilla JavaScript runtime. Do not add GSAP yet. Reserve GSAP for later `registry/animations` recipes that genuinely need timelines or advanced choreography.

### 9. Support Lucide through generic icon contracts plus example CDN usage

Registry components should style generic icon containers, e.g. `.ls-icon`, `.ls-icon-mark`, `.ls-icon-badge`, `.ls-icon > svg`, and `.ls-icon .lucide`. They should not require Lucide specifically.

The example deck can load a pinned Lucide CDN script and call `lucide.createIcons()` if present. Use SRI if feasible for the chosen CDN/version. This proves Lucide support without making Lucide a root dependency.

### 10. Use `ls-` prefixed class names

Use readable semantic classes with an `ls-` prefix. BEM-style element naming is acceptable where it improves clarity:

- `.ls-deck`
- `.ls-stage`
- `.ls-slide`
- `.ls-slide__inner`
- `.ls-slide__header`
- `.ls-slide__body`
- `.ls-layout-title-hero`
- `.ls-layout-detail-split`
- `.ls-card`
- `.ls-badge`

### 11. Use a dark professional default theme

Start with a restrained dark theme: neutral surfaces, modest borders, subtle shadows, one blue/cyan accent family, and generous whitespace. Token architecture should allow future `registry/presets/` items to remap theme values without rewriting components.

### 12. Example deck demonstrates composition, not unique design

The example deck should mostly use registry assets. Any example-only CSS should be tiny and limited to deck-specific content tuning if absolutely needed.

## Alternatives considered

### Alternative A — Put all foundation CSS in one file

Rejected. A single file is simpler for an example, but weaker for a copyable registry because consumers may want only core styles plus selected layouts/components. Separate items with metadata and dependencies are closer to the shadcn model.

A later convenience bundle can be added once the registry stabilizes.

### Alternative B — Keep loose files directly under `registry/core`, `registry/layouts`, etc.

Rejected for this phase because the user wants registry metadata now. Item directories provide a cleaner place for `registry-item.json`, implementation files, and item-specific README notes.

### Alternative C — Add GSAP immediately

Rejected. The first animation need is subtle reveal/navigation behavior, which CSS and vanilla JS handle well. Adding GSAP now would conflict with the current project direction of not adding root dependencies until a concrete recipe needs them.

### Alternative D — Install Lucide as a root dependency

Rejected for now. This repo is not the runtime consumer. The example can use a pinned CDN script, while registry components keep icon styling generic. If future validation tooling needs local icon assets, revisit this.

### Alternative E — Build the example as a self-contained HTML file with embedded styles/scripts

Rejected. Self-contained HTML is good for standalone slide generation, but here the purpose is to build reusable registry files. The example should exercise the registry files directly.

### Alternative F — Initialize docs site now

Rejected. The current task is foundation and registry items. Astro docs should wait until the registry has enough stable concepts to document.

## Implementation phases

### Phase 1 — Create registry metadata skeleton

Create:

```txt
registry.json
```

Define the root registry index with initial item references.

Create initial item directories:

```txt
registry/core/base/
registry/animations/reveal/
registry/layouts/title-hero/
registry/layouts/detail-split/
registry/components/badge/
registry/components/card/
registry/components/diagram/
```

Each item gets:

```txt
README.md
registry-item.json
```

Document dependency relationships through `registryDependencies`. Keep layout dependencies structural only; do not force `animations/reveal` from layout metadata unless the layout cannot function without it.

### Phase 2 — Define core foundation item

Create:

```txt
registry/core/base/reset.css
registry/core/base/tokens.css
registry/core/base/slide.css
registry/core/base/icons.css
registry/core/base/slide-runtime.js
```

Expected responsibilities:

- `reset.css`
  - lightweight modern reset scoped for slides where possible
  - box sizing
  - media defaults
  - button/input font inheritance if needed
- `tokens.css`
  - `@layer tokens`
  - slide dimensions
  - dark professional color tokens
  - semantic tokens and primitive-ish values that future presets can remap
  - typography tokens
  - spacing scale
  - radius/shadow tokens
  - motion duration/easing tokens
- `slide.css`
  - `@layer base`
  - page/stage/viewport styles
  - `.ls-deck`, `.ls-stage`, `.ls-slide`, `.ls-slide__inner`, `.ls-slide__header`, `.ls-slide__body`
  - fixed logical canvas and JS-enhanced `--ls-scale` viewport scaling
  - no-JS fallback where `.ls-deck:not([data-ls-ready]) .ls-slide` renders as readable stacked slides
  - active/inactive slide visibility states
  - accessibility states supported by JS (`inert`, `aria-hidden`)
  - static/export-mode behavior where practical
- `icons.css`
  - generic icon sizing and wrappers
  - styles for `.ls-icon > svg`, `.ls-icon .lucide`, `.ls-icon-mark`, `.ls-icon-badge`
  - no dependency on Lucide existing
- `slide-runtime.js`
  - initialize slides
  - calculate and update `--ls-scale` on load/resize
  - mark the deck with `data-ls-ready` after initialization
  - keyboard navigation
  - reveal-step state
  - active slide attributes/classes
  - set `inert` and `aria-hidden` for inactive slides
  - static/export mode via `?export=pdf` or `?export=1`
  - optional Lucide initialization if `window.lucide?.createIcons` exists
  - dispatch a small lifecycle event such as `ls-slides:ready`

Update `.oxlintrc.json` to include the browser environment so `window`, `document`, `location`, and keyboard/browser globals are accepted when linting the new runtime.

### Phase 3 — Add reveal animation item

Create:

```txt
registry/animations/reveal/reveal.css
```

Expected responsibilities:

- `.ls-reveal` and `[data-step]` visibility states
- active reveal state based on attributes/classes set by runtime
- stagger support through `--ls-delay`
- subtle fade/translate motion
- `prefers-reduced-motion` support
- static/export mode disables animation and reveals all content

The item metadata should depend on `core/base`.

### Phase 4 — Add initial layouts

Create:

```txt
registry/layouts/title-hero/title-hero.css
registry/layouts/detail-split/detail-split.css
```

Expected responsibilities:

- `title-hero.css`
  - hero/title layout for opening slides
  - supports eyebrow, large title, subtitle, optional badge row, and a visual/icon area
  - visually engaging but restrained
- `detail-split.css`
  - asymmetric detail slide layout
  - left visual/diagram area + right explanation stack
  - supports file-tree/flow/concept visual patterns without becoming a full component catalog

Use class names such as `.ls-layout-title-hero` and `.ls-layout-detail-split`.

### Phase 5 — Add minimal components

Create only the components needed by the two-slide example:

```txt
registry/components/badge/badge.css
registry/components/card/card.css
registry/components/diagram/diagram.css
```

Expected responsibilities:

- `badge.css`
  - small labels/pills for short metadata
  - restrained rectangular/pill variants
- `card.css`
  - feature cards and stack cards
  - icon + heading + short body
- `diagram.css`
  - simple flow nodes/connectors and/or registry file-tree visual blocks
  - no charting system yet

Do not add a large component catalog. This phase should prove the pattern, not exhaustively design every component.

### Phase 6 — Build the example deck

Create:

```txt
examples/project-intro/README.md
examples/project-intro/index.html
```

The deck should reference registry item files with relative paths, e.g.:

```html
<link rel="stylesheet" href="../../registry/core/base/reset.css" />
<link rel="stylesheet" href="../../registry/core/base/tokens.css" />
<link rel="stylesheet" href="../../registry/core/base/slide.css" />
<link rel="stylesheet" href="../../registry/core/base/icons.css" />
<link rel="stylesheet" href="../../registry/animations/reveal/reveal.css" />
<link rel="stylesheet" href="../../registry/layouts/title-hero/title-hero.css" />
<link rel="stylesheet" href="../../registry/layouts/detail-split/detail-split.css" />
<link rel="stylesheet" href="../../registry/components/badge/badge.css" />
<link rel="stylesheet" href="../../registry/components/card/card.css" />
<link rel="stylesheet" href="../../registry/components/diagram/diagram.css" />
<script src="https://cdn.example/lucide@<pinned-version>/..."></script>
<script type="module" src="../../registry/core/base/slide-runtime.js"></script>
```

Choose a current stable Lucide version at implementation time and pin it. Prefer a CDN URL that supports SRI or document why SRI was not added.

Slide 1: title slide

- Main title: `ls_slides`
- Subtitle: concise description of copyable vanilla slide building blocks
- Visual: Lucide-backed icon mark or small composition
- Supporting labels: `vanilla`, `copyable`, `agent-friendly` or similar

Slide 2: detail slide

- Title: explain the core idea
- Left visual: `Registry → Copy → Customize` flow or concise registry file-tree diagram
- Right stack: three cards
  - `Copyable`: move files into your deck
  - `Vanilla`: HTML, CSS, JS; no framework lock-in
  - `Composable`: layouts, components, styles, animations combine

The example should start each slide at reveal step 0 and reveal content with a coordinated step 1 stagger.

### Phase 7 — Add concise documentation updates

Update relevant README files:

- `registry/README.md`
  - explain item-directory model and metadata
  - explain that this is shadcn-inspired but not necessarily shadcn CLI-compatible yet
- `registry/core/README.md`
  - list core item and copy order
- `registry/layouts/README.md`
  - list initial layouts and dependencies
- `registry/components/README.md`
  - list initial components and dependencies
- `registry/animations/README.md`
  - describe reveal behavior
- `examples/README.md`
  - link to `project-intro`
- `examples/project-intro/README.md`
  - how to open locally
  - mention Lucide CDN and pinned version
  - note this is an example consumer of registry assets

Do not create full docs-site pages yet.

### Phase 8 — Validate and polish

Run:

```sh
pnpm fmt
pnpm lint
pnpm fmt:check
pnpm check
```

Also run local browser/static checks:

```sh
python3 -m http.server 4173
# open http://localhost:4173/examples/project-intro/
```

Manual/visual validation checklist:

- Example deck renders at 16:9 and scales to viewport.
- Title slide looks polished and not generic/boring.
- Detail slide explains the registry idea quickly.
- Lucide icons render if CDN loads.
- Deck still fails gracefully if Lucide is unavailable.
- Deck content remains readable in a no-JS fallback, even though keyboard navigation/reveals/scaling are not active.
- ArrowRight/Space advances reveal/slide.
- ArrowLeft goes back.
- Home/End works.
- `?export=pdf` or `?export=1` shows all reveal content and disables animation when JavaScript is available.
- Reduced-motion mode does not depend on animated movement.
- Inactive slides are not keyboard-focusable and are hidden from assistive tech.
- Metadata files accurately describe file paths and registry dependencies.
- No unexpected root dependencies were added.
- No framework/build tooling was introduced.

Optional agent/browser validation if time permits:

- Open the example deck in a browser.
- Capture screenshots at slide 1 step 0, slide 1 revealed, slide 2 revealed, and export/static mode.
- Verify basic keyboard navigation by automation.

## Acceptance criteria

- `registry/` contains the first actual copyable CSS/JS foundation items.
- `registry.json` and per-item `registry-item.json` files exist and describe the initial item graph.
- The example deck uses registry files rather than embedding most styles/scripts.
- The deck contains exactly the requested two conceptual slides for this phase.
- Lucide icon support is demonstrated without adding Lucide as a root dependency.
- Styling is engaging, professional, and restrained.
- Animation/navigation works with vanilla JS and CSS.
- Reduced-motion and static/export mode are accounted for.
- Browser lint environment is configured if needed for `slide-runtime.js`.
- `pnpm check` passes.
- The work is committed after implementation.

## Risks / rollback

- Risk: overbuilding a framework/runtime. Mitigation: keep plain copyable files, no bundler, no package exports, no generated API.
- Risk: metadata schema becomes too custom. Mitigation: keep it small and shadcn-inspired; document that compatibility with shadcn CLI is not guaranteed yet. Since the root index uses paths to per-item metadata instead of shadcn’s exact inline `items[]` shape, a future shadcn-CLI compatibility effort may need an index migration.
- Risk: example-specific CSS leaks into registry prematurely. Mitigation: only promote genuinely reusable patterns; keep deck-specific tuning minimal.
- Risk: fragmented CSS files become inconvenient to consume. Mitigation: metadata declares dependencies; README documents copy order; future copy tooling can resolve the graph.
- Risk: CDN Lucide failure affects local demo. Mitigation: keep markup meaningful and icon containers optional; document that Lucide can be installed/copied by consumers.
- Risk: fixed canvas scaling has edge cases on small screens or print. Mitigation: prefer CSS-first scaling, test common viewport sizes, and keep static/export mode simple.
- Risk: Oxfmt/Oxlint may not format or lint CSS/HTML deeply. Mitigation: still run project checks and manually review rendered slides.

Rollback is simple because this step only adds static files, metadata, and README updates. Revert the implementation commit if the foundation direction is rejected.

## Implementation progress

- [x] Phase 1 — Created registry metadata skeleton and item directories.
- [x] Phase 2 — Defined core foundation item.
- [x] Phase 3 — Added reveal animation item.
- [x] Phase 4 — Added initial layouts.
- [x] Phase 5 — Added minimal components.
- [x] Phase 6 — Built project intro example deck.
- [x] Phase 7 — Updated concise registry/example documentation.
- [x] Phase 8 — Validated and polished.

## Implementation notes

- Implementation commit: `01c1a87` (`Add registry foundation and intro deck`).
- Follow-up polish commit: `Polish registry foundation metadata`.
- Used `lucide@0.468.0` from jsDelivr in the example deck with a computed SHA-384 SRI hash.
- Kept reveal animation as an optional consumer choice; layouts do not require it in metadata.
- Updated Oxlint config with `browser: true` for the core runtime.
- Browser screenshots were captured with `npx agent-browser` for the revealed title slide and export/static mode.
- Follow-up polish from peer review removes a placeholder schema URL, removes an unused CSS custom property, documents the initial reveal step limit, and keeps optional title-hero badge usage out of required metadata dependencies.

## Implementation validation

```sh
pnpm fmt                         # passed
pnpm check                       # passed
node --check registry/core/base/slide-runtime.js  # passed
node <registry metadata validation script>        # passed; validated 7 items
python3 -m http.server 4173 + npx agent-browser   # passed; screenshots captured
```

## Peer review summary

The first draft was reviewed with Claude. The reviewer agreed with the overall copyable-registry direction, no-framework approach, no premature GSAP dependency, and generic icon contracts. The review identified several improvements that are incorporated in this final plan:

- Add registry metadata now because the user explicitly wants actual registry setup in this step.
- Use item directories with `registry-item.json` files instead of only loose files.
- Move navigation/runtime infrastructure to `registry/core` rather than `registry/animations`.
- Fix Lucide styling assumptions: target generated SVGs/wrappers, not only `[data-lucide]` placeholders.
- Account for browser globals in Oxlint once `slide-runtime.js` exists.
- Treat PDF export as static/export mode unless print-specific behavior is explicitly implemented.
- Consider CSS-first scaling rather than making JS a hard rendering dependency.
- Include accessibility handling for inactive slides through `inert`/`aria-hidden`.
- Use browser/visual validation where practical.

A second review of this revised plan accepted the architecture and recommended these final clarifications, which are reflected above: put the canonical cascade layer declaration in the first core CSS file, choose an explicit JS-enhanced scaling mechanism with a no-JS readable fallback, make the Oxlint browser environment update concrete, keep reveal animation optional rather than forcing it through layout dependencies, use the canonical `ls-slides` metadata name, and document divergence from exact shadcn registry shapes.

Implementation peer review accepted the implementation as matching the plan and mergeable. Optional polish items were addressed: documented the initial three-step reveal selector range, removed an unused CSS custom property, kept `components/badge` optional for `layouts/title-hero`, and removed the placeholder schema URL from `registry.json`.
