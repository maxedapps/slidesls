# Plan: Prebuilt Theme Presets for slidesls

## Summary

Add first-class prebuilt visual themes to slidesls as clean, composable `ls:preset` registry items. Themes should feel intentionally designed, not AI-generated: restrained palettes, limited/no decorative gradients, clean surfaces, strong hierarchy, and consistent professional defaults.

This plan intentionally allows larger refactors. The core refactor is a theme-token architecture: base and components should consume canonical design tokens; themes should override tokens, not structural CSS.

## Clarification status

No clarification is needed before planning. The key user constraints are clear:

- add prebuilt themes;
- include three professional dark/blue-ish styles and one playful style;
- design from a clean ground-up architecture;
- big refactors are welcome;
- strongly tone down gradients and avoid AI-generated-looking visuals;
- do not implement anything yet.

## Requirements and assumptions

- Themes are visual presets, not slide templates.
- Templates remain structural slide snippets.
- Themes should not force a font preset, but may recommend pairings.
- Generated decks stay plain HTML/CSS/JS and dependency-free.
- `slidesls add` remains copy-based; copied theme CSS is editable.
- The first implementation should prioritize architecture and consistency over speed.
- New visual work should prefer solid colors, subtle borders, restrained shadows, and simple texture.
- Gradients should be rare, subtle, and purposeful; avoid large radial blobs, neon fog, glow stacks, and “AI deck” styling.

## Current-state findings

### Existing registry structure

Current item types already support themes without adding a new type:

- `ls:core`
- `ls:utility`
- `ls:component`
- `ls:animation`
- `ls:preset`
- `ls:template`

Existing presets are only font presets:

- `presets/fonts/editorial-serif`
- `presets/fonts/system-humanist`
- `presets/fonts/technical-mono`

Existing templates are structural snippets:

- `templates/title-hero`
- `templates/section-divider`
- `templates/split`
- `templates/split-diagram`
- `templates/three-cards`
- `templates/code-plus-notes`
- `templates/metric-dashboard`

Existing useful primitives:

- `components/badge`
- `components/callout`
- `components/card`
- `components/code-block`
- `components/divider`
- `components/image-card`
- `components/metric`
- `components/panel`
- `components/progress`
- `components/quote`
- `components/table`
- `components/timeline`
- `utilities/layout`
- reveal/emphasis animations

### Themeability gaps

Core and components already use many tokens, but several important visual choices are still hardcoded:

- `registry/core/base/slide.css`
  - page grid line color and grid size are hardcoded
  - print background is hardcoded
- `registry/components/code-block/code-block.css`
  - code background and text color are hardcoded
- `registry/components/card/card.css`
  - inset highlight uses hardcoded white transparency
- `registry/components/panel/panel.css`
  - inset highlight and muted panel background assume dark surfaces
- `registry/components/callout/callout.css`
  - warning/success accents are hardcoded
- `registry/components/progress/progress.css`
  - success/warning accents are hardcoded
  - progress fill currently uses a gradient; should become theme-controllable and flattenable
- `registry/components/table/table.css`
  - striped row background assumes dark surfaces

These must be tokenized before themes can reliably reskin the system.

## Chosen architecture

### Theme axis

Add themes under:

```txt
registry/presets/themes/<theme-name>/
```

Each theme is a normal registry preset:

```json
{
  "name": "presets/themes/executive-blue",
  "type": "ls:preset",
  "description": "Clean professional blue theme for product and business decks.",
  "files": [
    {
      "path": "registry/presets/themes/executive-blue/theme.css",
      "type": "registry:style"
    }
  ],
  "registryDependencies": ["core/base"],
  "dependencies": [],
  "devDependencies": [],
  "docs": "registry/presets/themes/executive-blue/README.md",
  "safeAnywhere": true,
  "agentRecommended": true,
  "styleTone": "professional dark blue",
  "useCases": ["product decks", "business updates", "general professional slides"],
  "pairsWith": ["presets/fonts/system-humanist"],
  "themeAttribute": "executive-blue"
}
```

Important: `description`, `dependencies`, and `devDependencies` are required by the current registry item schema.

Theme CSS uses scoped root attributes:

```css
@layer tokens {
  :root[data-ls-theme="executive-blue"] {
    --ls-page-bg: ...;
    --ls-slide-bg: ...;
    --ls-accent: ...;
  }
}
```

Apply in decks via:

```html
<html lang="en" data-ls-theme="executive-blue"></html>
```

Use `:root[data-ls-theme="..."]`, not just `[data-ls-theme="..."]`, because it has higher specificity than base `:root` and is less fragile if link order is edited.

### Important scoping decision

Themes are deck-wide and should be applied on `<html>`.

This differs slightly from existing font presets, which can be scoped with `[data-ls-font="..."]` on `<body>` or a section. That difference should be documented clearly:

- `data-ls-theme` belongs on `<html>` and should be used once per deck.
- `data-ls-font` may remain more flexible, but docs should show a consistent recommended placement.

### Keep axes separate

- Theme preset = color, surfaces, background treatment, radii, shadows, code colors, status colors.
- Font preset = font family role remaps.
- Template = slide/content structure.
- Component = reusable content primitive.
- Animation = motion/reveal behavior.

Themes should not set font-family tokens in v1. Instead, use metadata/README guidance like:

```json
"pairsWith": ["presets/fonts/system-humanist"]
```

### No heavy gradients

Design rule:

- Prefer solid colors, subtle borders, flat surfaces, restrained shadows.
- Gradients are allowed only when very subtle and clearly useful.
- Avoid large colorful blobs, glow-heavy hero panels, radial gradient stacks, neon fog, and background effects that look generated.
- Professional themes should look like clean product/strategy/engineering decks, not synthetic marketing art.
- If a theme feels decorative before content is added, simplify it.

## Canonical theme token model

Refactor base/components around a canonical token surface.

### Existing tokens to keep

- `--ls-page-bg`
- `--ls-slide-bg`
- `--ls-panel-bg`
- `--ls-surface`
- `--ls-surface-strong`
- `--ls-border`
- `--ls-border-strong`
- `--ls-text`
- `--ls-muted`
- `--ls-subtle`
- `--ls-accent`
- `--ls-accent-2`
- `--ls-accent-text`
- `--ls-accent-bg`
- `--ls-accent-border`
- `--ls-radius-*`
- `--ls-shadow-*`

### New tokens to add

Suggested minimum:

```css
--ls-page-bg-image
--ls-page-grid-color
--ls-page-grid-size
--ls-slide-bg-image
--ls-surface-highlight
--ls-surface-muted
--ls-code-bg
--ls-code-text
--ls-code-header-bg
--ls-code-border
--ls-table-stripe-bg
--ls-status-success
--ls-status-warning
--ls-status-danger
--ls-progress-accent
--ls-progress-accent-2
--ls-print-bg
```

Notes:

- `--ls-page-bg-image` allows themes to remove the grid entirely or use a simple pattern.
- `--ls-slide-bg-image` allows minimal slide texture without per-theme structural overrides.
- `--ls-surface-highlight` replaces hardcoded white inset lines.
- `--ls-surface-muted` replaces `rgb(255 255 255 / 4%)` dark-mode assumptions.
- Do **not** use a single `--ls-progress-fill` token in v1. It would conflict with existing `data-ls-tone` logic. Instead:
  - keep `--ls-progress-accent`;
  - add `--ls-progress-accent-2`;
  - let themes flatten the fill by setting both to the same value;
  - route success/warning through `--ls-status-success` / `--ls-status-warning`.

## Baseline value mapping

During the tokenization refactor, defaults should reproduce the current look. Create a mapping before implementation and preserve these values unless intentionally changed:

| Current hardcoded value | New token                | Default value                                       |
| ----------------------- | ------------------------ | --------------------------------------------------- |
| page grid line          | `--ls-page-grid-color`   | `rgb(255 255 255 / 3%)`                             |
| page grid size          | `--ls-page-grid-size`    | `64px 64px`                                         |
| code block background   | `--ls-code-bg`           | `#0b0f17`                                           |
| code text               | `--ls-code-text`         | `#dbeafe`                                           |
| inset/surface highlight | `--ls-surface-highlight` | `0 1px 0 rgb(255 255 255 / 4%) inset` or equivalent |
| dark muted surface      | `--ls-surface-muted`     | `rgb(255 255 255 / 4%)`                             |
| table stripe            | `--ls-table-stripe-bg`   | `rgb(255 255 255 / 4%)`                             |
| success accent          | `--ls-status-success`    | `#22c55e`                                           |
| warning accent          | `--ls-status-warning`    | `#f59e0b`                                           |
| print page background   | `--ls-print-bg`          | `#fff`                                              |

This mapping should become part of the implementation checklist.

## Background composition requirement

Refactor `slide.css` backgrounds using longhand properties, not a fragile `background` shorthand.

Use a structure like:

```css
body.ls-page,
.ls-page {
  background-color: var(--ls-page-bg);
  background-image: var(--ls-page-bg-image);
  background-size: var(--ls-page-grid-size);
}

.ls-slide {
  background-color: var(--ls-slide-bg);
  background-image: var(--ls-slide-bg-image, none);
}
```

Reason:

- `background` shorthand resets related background properties.
- Multi-layer defaults and fallback values get brittle.
- Print can more cleanly set `background-image: none` and `background-color: var(--ls-print-bg)`.

Print note:

- `--ls-print-bg` should control the page background.
- Slides may still use their theme slide background in print unless a separate print-slide policy is explicitly added later.

## Initial theme set

### 1. `presets/themes/executive-blue`

Purpose: default professional product/business theme.

Visual style:

- deep slate blue background
- clean navy slide surface
- blue accent with restrained cyan secondary
- subtle grid or no grid depending on final visual review
- moderate radii
- crisp panels with subtle border, not glow-heavy
- flat or near-flat progress fills

Recommended font pairings:

- `presets/fonts/system-humanist`

Recommended templates/primitives:

- `templates/title-hero`
- `templates/split`
- `templates/metric-dashboard`
- `templates/three-cards`
- `components/badge`
- `components/panel`
- `components/card`
- `components/metric`
- `components/progress`

Good for:

- product decks
- SaaS updates
- professional intros
- general business/technical presentations

Differentiation axis:

- balanced, safe, default professional.

### 2. `presets/themes/boardroom-navy`

Purpose: formal executive/strategy/board style.

Visual style:

- very dark navy page and slide surfaces
- minimal background texture; likely no visible grid
- low-chroma steel blue plus muted gold/cream accent
- smaller radii than default
- subdued shadows
- dense, controlled contrast
- no decorative gradients

Recommended font pairings:

- `presets/fonts/system-humanist`
- optionally `presets/fonts/editorial-serif` for report-like titles

Recommended templates/primitives:

- `templates/section-divider`
- `templates/metric-dashboard`
- `templates/three-cards`
- `templates/split`
- `components/table`
- `components/metric`
- `components/quote`
- `components/divider`

Good for:

- board updates
- strategy reviews
- financial/business reporting
- stakeholder presentations

Differentiation axis:

- lowest decoration, most formal, most restrained.

### 3. `presets/themes/technical-deep`

Purpose: engineering/dev/tooling talks.

Visual style:

- near-black background
- blue/cyan accent with restrained green success color
- slightly sharper panel edges
- code blocks are first-class and high-contrast
- subtle fine grid is acceptable but should not glow
- no big gradient blobs

Recommended font pairings:

- `presets/fonts/technical-mono`
- optionally `presets/fonts/system-humanist`

Recommended templates/primitives:

- `templates/code-plus-notes`
- `templates/split-diagram`
- `templates/split`
- `components/code-block`
- `components/callout`
- `components/timeline`
- `components/panel`
- `components/progress`

Good for:

- technical talks
- architecture walkthroughs
- CLI/tool demos
- agent/software engineering decks

Differentiation axis:

- highest code/technical emphasis, crispest contrast.

### 4. `presets/themes/playful-ink`

Use this instead of a neon-heavy theme. It satisfies “playful” without looking AI-generated.

Purpose: friendlier workshop/product/community style while staying clean.

Visual style:

- dark ink or deep indigo base, not pure black
- warm coral or berry accent plus soft blue/teal secondary
- larger radii
- softer surfaces
- optional small dot pattern or simple line pattern, not gradients
- controlled contrast, avoiding neon glow

Recommended font pairings:

- `presets/fonts/system-humanist`
- maybe `presets/fonts/editorial-serif` for playful title contrast

Recommended templates/primitives:

- `templates/title-hero`
- `templates/three-cards`
- `templates/split`
- `components/badge`
- `components/card`
- `components/image-card`
- `components/callout`
- `components/progress`

Good for:

- workshops
- creative product demos
- educational/community decks
- feature launches with a friendlier tone

Differentiation axis:

- friendliest and roundest theme, but still disciplined and presentation-safe.

## Optional later themes

Do not add these in the first pass unless the first four are excellent:

- `presets/themes/editorial-light` — true light editorial/report style.
- `presets/themes/minimal-paper` — print-friendly paper style.
- `presets/themes/product-white` — clean light SaaS style.

Light themes should wait until every component has been audited against light surfaces.

## Implementation phases

The work should be sequenced to reduce risk. The most important risk is the token refactor, not authoring four CSS files.

## Phase 1 — Token architecture refactor + one reference theme

Likely files:

- `registry/core/base/tokens.css`
- `registry/core/base/slide.css`
- `registry/components/code-block/code-block.css`
- `registry/components/card/card.css`
- `registry/components/panel/panel.css`
- `registry/components/callout/callout.css`
- `registry/components/progress/progress.css`
- `registry/components/table/table.css`
- `docs/registry-contract.md`
- tests/validation if targeted token tests are added

Tasks:

1. Add canonical theme tokens to `tokens.css` with defaults matching current look.
2. Refactor `slide.css` to use longhand background composition:
   - `--ls-page-bg-image`
   - `--ls-page-grid-color`
   - `--ls-page-grid-size`
   - `--ls-slide-bg-image`
   - `--ls-print-bg`
3. Refactor component CSS:
   - `code-block`: code bg/text/header/border tokens
   - `card`/`panel`: surface highlight token
   - `table`: stripe bg token
   - `callout`/`progress`: status tokens
   - `progress`: `--ls-progress-accent` + `--ls-progress-accent-2`, not one fill token
4. Preserve current no-theme output as closely as possible using the baseline mapping table.
5. Add only one initial theme first: `presets/themes/executive-blue`.
6. Validate that the token vocabulary is sufficient before creating the other three themes.
7. Add a targeted regression test or fixture check for key properties now using `var(--ls-...)` instead of previous hardcoded values.
8. Avoid a broad hardcoded-color linter in v1; it is likely too noisy.

Acceptance criteria:

- Existing decks without `data-ls-theme` still look effectively the same.
- `executive-blue` can reskin page, slide, panel, code, table, callout, and progress surfaces through tokens.
- Registry validation passes.

## Phase 2 — Theme preset contract and metadata

Likely files:

- `docs/registry-contract.md`
- `registry/README.md`
- maybe `src/registry/catalog-doc.mjs`
- maybe `src/cli/commands.mjs`

Tasks:

1. Define `presets/themes/*` convention:
   - CSS-only preset
   - `theme.css`
   - `:root[data-ls-theme="..."]`
   - `@layer tokens`
   - deck-wide application on `<html>`
2. Define `safeAnywhere` for root-scoped token presets:
   - copying is safe because the CSS is inert until `data-ls-theme` is applied;
   - effect is deck-wide once applied.
3. Add recommended metadata fields:
   - `styleTone`
   - `useCases`
   - `pairsWith`
   - `themeAttribute`
4. Decide whether to surface these in `catalog`/`inspect` text output now.
5. Recommended MVP:
   - include metadata in JSON and docs;
   - add richer text surfacing only if simple.

## Phase 3 — Add remaining three themes

Likely added:

```txt
registry/presets/themes/boardroom-navy/README.md
registry/presets/themes/boardroom-navy/theme.css
registry/presets/themes/boardroom-navy/registry-item.json

registry/presets/themes/technical-deep/README.md
registry/presets/themes/technical-deep/theme.css
registry/presets/themes/technical-deep/registry-item.json

registry/presets/themes/playful-ink/README.md
registry/presets/themes/playful-ink/theme.css
registry/presets/themes/playful-ink/registry-item.json
```

Also update:

- `registry.json`
- `registry/presets/README.md` if present, or add/update category docs

Tasks:

1. Use `executive-blue` as the reference theme.
2. Ensure each theme sets the canonical theme token set.
3. Keep all themes visually restrained:
   - no large radial gradient fields
   - no multicolor glow backgrounds
   - no excessive transparency stacks
   - use simple solids, subtle lines, minimal texture
4. Add READMEs with:
   - visual intent
   - best use cases
   - recommended templates
   - recommended font pairings
   - exact application snippet
5. Make professional themes clearly distinct:
   - executive-blue = balanced/product
   - boardroom-navy = formal/quiet
   - technical-deep = code/engineering/high-contrast

Application snippet example:

```html
<html lang="en" data-ls-theme="technical-deep" data-ls-font="technical-mono"></html>
```

But docs should clarify that `data-ls-theme` is deck-wide and belongs on `<html>`.

## Phase 4 — Theme gallery / visual QA example

Likely files:

- `examples/theme-gallery/` or similar
- docs references
- validation scripts may already validate examples

Tasks:

1. Create a small gallery deck showing representative slides under each theme.
2. Include slides that stress important primitives:
   - title hero
   - metric dashboard
   - code-plus-notes
   - table/card/callout mix
3. Also create or capture a no-theme baseline reference after Phase 1.
4. Keep examples clean and realistic.
5. Run existing example validation.
6. Use browser preview manually or with screenshots if available to compare themes.

Visual QA rules:

- If the slide looks impressive because of decoration rather than content hierarchy, simplify.
- If background treatment competes with text, remove it.
- If multiple gradients are visible on one slide, likely reduce them.

## Phase 5 — CLI support: `init --theme`

This is optional but recommended because `add` can copy theme CSS but cannot safely mutate existing HTML to set `data-ls-theme`.

Likely files:

- `src/cli/commands.mjs`
- `src/deck/templates.mjs`
- `docs/cli.md`
- tests

Tasks:

1. Before implementation, verify current init/copy resolver behavior for preset dependency graphs.
2. Add `init --theme <theme-name>`.
3. Accept either:
   - `executive-blue`
   - `presets/themes/executive-blue`
4. Validate theme exists and is `ls:preset` under `presets/themes/`.
5. Add theme item to init dependency/copy list.
6. Set `data-ls-theme="executive-blue"` in generated `index.html`.
7. Optionally support `--font <font-name>` later; do not combine in first pass unless trivial.
8. Add tests:
   - `init --theme executive-blue` copies theme CSS
   - generated HTML has theme attribute
   - invalid theme errors clearly

Do not add `add --theme` yet unless there is a safe HTML mutation strategy. For existing projects, docs/skill should instruct the manual attribute step.

### Theme-specific `add` output

Consider a small UX improvement:

- when `slidesls add presets/themes/executive-blue` succeeds, text output should print:

```txt
Apply this theme by setting data-ls-theme="executive-blue" on the <html> element.
```

This is cheaper and safer than mutating HTML and helps agents avoid forgetting the manual step.

## Phase 6 — Docs updates

Likely files:

- `README.md`
- `docs/cli.md`
- `docs/registry-contract.md`
- `registry/README.md`
- theme READMEs
- maybe `PROJECT.md` after implementation if this changes project state materially

Tasks:

1. Add “Theming” section to README.
2. Explain:
   - themes are visual presets
   - templates are structure
   - fonts are separate presets
   - themes are applied via `data-ls-theme`
3. Document CLI flows:

```sh
slidesls add presets/themes/executive-blue
```

then:

```html
<html data-ls-theme="executive-blue"></html>
```

or, if Phase 5 is implemented:

```sh
slidesls init my-deck --theme executive-blue
```

4. Add theme selection guidance:
   - executive-blue: general professional/product
   - boardroom-navy: formal strategy/business
   - technical-deep: engineering/code
   - playful-ink: workshop/community/friendly product
5. Explicitly state that themes avoid heavy decorative gradients by design.

## Phase 7 — Agent skill updates

Likely files:

- `skills/slidesls/SKILL.md`
- `skills/slidesls/references/deck-authoring.md`
- `skills/slidesls/references/catalog.md`
- maybe `skills/slidesls/references/copy-workflow.md`

Tasks:

1. Add a theme-selection step early in deck authoring.
2. Teach agents:
   - choose exactly one theme
   - copy the theme preset
   - set `data-ls-theme` on `<html>`
   - optionally set `data-ls-font`
3. Add exact idempotent instruction:

```txt
Set data-ls-theme="<theme>" on the existing <html> element. Do not add a second theme attribute and do not stack multiple themes.
```

4. Add recipes:
   - Product/professional: executive-blue + title-hero + split + metric-dashboard
   - Board/business: boardroom-navy + section-divider + metric-dashboard + table/quote
   - Technical: technical-deep + technical-mono + code-plus-notes + split-diagram
   - Workshop/playful: playful-ink + three-cards + callout + image-card
5. Reinforce clean visual style: prefer spacing, hierarchy, and solid surfaces over decorative gradients.

## Phase 8 — Validation and tests

Likely files:

- `src/validation/registry.mjs`
- existing tests or new tests
- example validation if gallery is added

Tasks:

1. Ensure new theme registry items pass schema and registry validation.
2. Validate theme files exist and are copied.
3. Add optional validation checks for theme metadata:
   - `presets/themes/*` should have `themeAttribute`
   - theme CSS should contain matching `data-ls-theme="..."`
4. Add targeted tokenization tests instead of broad color linting:
   - code block background uses `--ls-code-bg`
   - code text uses `--ls-code-text`
   - table stripe uses `--ls-table-stripe-bg`
   - progress tone values use status tokens
   - slide/page background uses longhand + theme tokens
5. Add contrast/accessibility acceptance checks if practical:
   - body text on slide/surface: target 7:1 where possible
   - large title/accent text: at least 4.5:1
   - code text on code background: at least 4.5:1
   - muted text should remain readable, not just decorative
6. Tests:
   - `catalog --type preset` includes theme presets
   - `inspect presets/themes/technical-deep --json` exposes metadata/docs
   - `add presets/themes/executive-blue` copies theme file and manifest entry
   - if `init --theme`: generated deck includes theme CSS and attribute

## How themes should use existing primitives/templates

Themes do not directly depend on structural templates. Instead, docs and skill recommend combinations.

### Professional product deck recipe

Theme:

- `presets/themes/executive-blue`

Font:

- `presets/fonts/system-humanist`

Templates:

- `templates/title-hero`
- `templates/split`
- `templates/three-cards`
- `templates/metric-dashboard`

Primitives:

- badge
- panel
- card
- metric
- progress

Visual feel:

- clean title hierarchy
- understated blue accents
- crisp surfaces
- minimal texture

### Board/strategy deck recipe

Theme:

- `presets/themes/boardroom-navy`

Font:

- `presets/fonts/system-humanist` or `editorial-serif`

Templates:

- `templates/section-divider`
- `templates/metric-dashboard`
- `templates/three-cards`
- `templates/split`

Primitives:

- table
- quote
- metric
- divider
- panel

Visual feel:

- formal, quiet, dense
- high readability
- low decoration
- no gradients

### Technical talk recipe

Theme:

- `presets/themes/technical-deep`

Font:

- `presets/fonts/technical-mono` for labels/code emphasis

Templates:

- `templates/code-plus-notes`
- `templates/split-diagram`
- `templates/split`

Primitives:

- code-block
- callout
- timeline
- panel
- progress

Visual feel:

- precise
- high contrast
- fine grid acceptable
- code blocks visually integrated

### Playful workshop/product recipe

Theme:

- `presets/themes/playful-ink`

Font:

- `presets/fonts/system-humanist`

Templates:

- `templates/title-hero`
- `templates/three-cards`
- `templates/split`

Primitives:

- badge
- card
- image-card
- callout
- progress

Visual feel:

- friendly
- rounded
- warm accent
- simple pattern, not glow/gradient heavy

## Build-from-ground-up ideal structure

If this had existed from day one, the registry would be organized around orthogonal design axes:

```txt
core/base/                 # shell, reset, canonical tokens
presets/themes/            # color/surface/background/radius/shadow systems
presets/fonts/             # typeface role remaps
presets/motion/            # optional future motion timing presets
utilities/                 # layout/media/print helpers
components/                # reusable blocks consuming tokens
animations/                # reveal/emphasis classes
templates/                 # structure-only snippets composed from components
examples/                  # gallery and real deck examples
```

Key principle:

- components and templates never encode a theme;
- themes never encode content structure;
- font presets remain independent;
- CLI copies all of them as regular registry items.

## Testing and verification plan

After implementation:

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

Manual/visual verification:

1. Preview a no-theme baseline deck after Phase 1 and compare to current visual output.
2. Create or preview a deck for each theme.
3. Check:
   - readable title/subtitle/body contrast
   - muted text remains readable
   - code block readability
   - table striping
   - callout warning/success tones
   - progress bars and tone variants
   - print/export basics
   - no excessive gradients or glow effects
4. Prefer reducing decoration if a theme feels too “AI generated.”

## Risks and mitigations

### Risk: themes look incomplete because components keep hardcoded colors

Mitigation:

- tokenization pass first;
- targeted tests for key tokenized properties;
- visual QA gallery.

### Risk: baseline design regresses during tokenization

Mitigation:

- baseline mapping table;
- no-theme visual check before adding all themes.

### Risk: progress tone behavior breaks

Mitigation:

- avoid single `--ls-progress-fill` token;
- keep progress accent tokens and route tone variants through status tokens.

### Risk: users/agents forget `data-ls-theme`

Mitigation:

- exact snippets in theme READMEs and skill docs;
- optional `init --theme`;
- theme-specific `add` output with required attribute line.

### Risk: theme/font/template concepts blur

Mitigation:

- document separate axes;
- do not make themes depend on font presets or templates.

### Risk: registry bloat/confusing choices

Mitigation:

- start with four distinct themes only;
- give each a clear “pick this when” description;
- add more only after usage feedback.

### Risk: gradients creep back in

Mitigation:

- explicit design rule: clean surfaces, subtle texture, restrained accents;
- reject decorative gradient-heavy implementations during review.

## Claude review notes incorporated

Claude reviewed the draft and agreed with the main architecture: tokenize first, use `ls:preset`, keep axes orthogonal, avoid template-as-theme, and use clean restrained design.

Key feedback incorporated:

- The registry item JSON example must include schema-required `description`, `dependencies`, and `devDependencies`.
- Do not use a single `--ls-progress-fill`; it would break tone variants. Use progress accent tokens and status tokens.
- Use longhand background properties rather than fragile `background` shorthand composition.
- Clarify that themes are deck-wide on `<html>`, unlike potentially scoped font presets.
- Add baseline no-theme regression verification before judging themes.
- Add contrast/accessibility acceptance criteria.
- Prefer targeted tokenization tests over a broad hardcoded-color linter.
- Sequence work as token refactor + one reference theme first, then the remaining themes.

## Open questions

No blocking open questions.

Recommended decisions:

1. Use `playful-ink` instead of `playful-neon` for a cleaner playful first theme.
2. Implement `init --theme` in the same feature pass if time allows; otherwise ship docs/skill manual application first.
3. Defer true light themes until after the dark theme system is proven.
