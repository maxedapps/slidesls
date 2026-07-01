# FINDINGS: slidesls primitive/layout/style audit

Scope: in-depth review of the shipped registry primitives, layouts, templates, themes, fonts, animations, copied example output, and relevant authoring docs after the Eve deck exposed visual breakage.

Process note: findings are added as they are discovered while reading files end-to-end. This file intentionally focuses on defects, pitfalls, and validation gaps; it is not a changelog.

## Findings from core/base and utilities/layout

### 1. `templates/title-hero` pattern cannot reliably vertically center because `.ls-fill` does not span `.ls-slide__inner` rows

- Files: `registry/core/base/slide.css`, `registry/utilities/layout/layout.css`, `registry/templates/title-hero/snippet.html`
- Evidence: `.ls-slide__inner` is a two-row grid (`grid-template-rows: auto 1fr`). `.ls-fill` only sets `block-size: 100%`; when a single `.ls-fill` child is placed directly under `.ls-slide__inner`, it sits in the first auto row instead of spanning the full slide. The shipped `title-hero` snippet uses exactly that structure.
- Impact: title slides based on the official snippet appear top-biased instead of vertically centered, matching the Eve screenshot. Agents are not doing something exotic here; they are following the registry-provided pattern.
- Likely direction: either make `.ls-slide__inner > .ls-fill` span `grid-row: 1 / -1`, or stop using the two-row implicit shell for single-child full-slide templates and add an explicit full-slide/hero layout primitive.

### 2. `.ls-fill` is underspecified and misleading outside a known parent sizing context

- Files: `registry/utilities/layout/layout.css`, `registry/utilities/layout/README.md`, `registry/utilities/layout/registry-item.json`
- Evidence: docs say `.ls-fill` “fill available block size”, but CSS only sets `block-size: 100%`. That is only meaningful when every ancestor has a definite block size and the element is placed in the intended grid track.
- Impact: agents will reasonably add `.ls-fill` expecting it to solve vertical distribution, but it can do nothing or amplify layout bugs depending on parent context.
- Likely direction: document exact valid contexts or replace with clearer primitives such as `.ls-slide-fill` / `.ls-body-fill` that encode the slide-shell relationship.

### 3. Responsive `@container` rules in layout utilities do not activate because no container is declared

- File: `registry/utilities/layout/layout.css`
- Evidence: the file uses `@container (width < 900px)` and `@container (width < 640px)`, but no ancestor sets `container-type`. Without a query container, these rules will not apply in normal use.
- Impact: grid fallbacks for `.ls-grid--4`, `.ls-grid--3`, and wide grids likely never run. On narrow/embedded/custom-size decks, layouts can overflow even though CSS appears to contain responsive behavior.
- Likely direction: either add an intentional container (`.ls-slide__inner { container-type: inline-size; }` or similar) or convert these to regular media queries / remove them if fixed-size slides are the only target.

### 4. Base typography is large and fixed; there are no built-in density/fit variants for common slide pressure

- Files: `registry/core/base/tokens.css`, `registry/core/base/slide.css`
- Evidence: key sizes are fixed px values (`--ls-text-2xl: 82px`, `--ls-text-xl: 58px`, etc.) and slide padding is fixed at `92px 108px`.
- Impact: generated slides with realistic business/technical content can easily exceed the 1600×900 canvas. Agents compensate with ad hoc inline styles, or content silently clips because `.ls-slide` has `overflow: hidden`.
- Likely direction: provide official density modifiers/tokens for dense slides (`data-ls-density="compact"`, `.ls-slide--dense`, or template-level variables) and validation/authoring guidance about content budgets.

### 5. Slide shell has two competing composition models but docs/templates do not make the distinction clear

- Files: `registry/core/base/slide.css`, `registry/core/base/registry-item.json`, templates using direct children under `.ls-slide__inner`
- Evidence: `.ls-slide__inner` has a header/body grid model (`auto 1fr` with `.ls-slide__header` / `.ls-slide__body`) but shipped templates often put arbitrary `.ls-grid`/`.ls-stack` children directly under it.
- Impact: direct-child templates inherit row behavior that was designed for header/body layouts, causing inconsistent vertical placement and height behavior.
- Likely direction: choose one primary model or provide explicit, documented wrappers: header/body templates should use `.ls-slide__header` + `.ls-slide__body`; full-bleed/full-slide templates should use a dedicated spanning class.

## Findings from badge/card/panel/callout

### 6. Component snippets often omit the element wrappers that CSS/authoring metadata imply

- Files: `registry/components/card/snippets/basic.html`, `registry/components/callout/snippets/basic.html`, `registry/components/timeline/snippets/basic.html`, corresponding `registry-item.json` files
- Evidence: cards define `.ls-card__body`; callouts define `.ls-callout__body`; timeline defines marker/title/text elements. Basic snippets frequently use simplified raw children (`h3`, `p`, `strong`, `span`) instead of the full element contract.
- Impact: agents learn a loose child structure from snippets. Some simplified structures work by accident; others, such as timeline, break visibly. This also makes future CSS changes risky because snippets are not exercising the canonical element classes.
- Likely direction: decide whether components intentionally support semantic/raw-child shorthand. If yes, CSS must support it explicitly. If no, snippets must use canonical child classes and validation should eventually detect broken component structures.

### 7. Callout CSS uses `:has()`, which is powerful but makes support assumptions not documented in the registry contract

- File: `registry/components/callout/callout.css`
- Evidence: `.ls-callout:not(:has(.ls-callout__icon))` changes the grid when no icon is present.
- Impact: modern browsers support `:has()`, but it is still a more advanced selector than the rest of the dependency-free CSS. If users export/view in older embedded browsers or HTML-to-PDF tools, callout layout can degrade.
- Likely direction: either document modern browser requirement explicitly or avoid `:has()` by making the iconless snippet/class explicit.

### 8. Text sizing in common content components is fixed and optimistic for dense real slides

- Files: `registry/components/card/card.css`, `registry/components/panel/panel.css`, `registry/components/callout/callout.css`
- Evidence: card title/text are fixed 28px/21px, panel title/text use large global tokens (`58px`, `30px`), callout title/text are 27px/22px.
- Impact: combinations such as 3-card grids plus headings often fit only with short marketing copy. Agents researching technical topics tend to produce longer labels/sentences and hit overflow/clipping.
- Likely direction: provide component density variants or local CSS variables for text size/padding in all components, and expose those variables in authoring metadata.

### 9. Panel is both a content panel and a visual frame, but defaults always align content from the top

- File: `registry/components/panel/panel.css`; seen in title-hero visual panel usage
- Evidence: `.ls-panel` is a grid but has no default `align-content`/`place-items`. The title-hero snippet compensates by also adding `.ls-center`.
- Impact: agents must stack utilities correctly to get common visual-frame behavior. Missing `.ls-center` produces top-aligned content inside large visual panels.
- Likely direction: either add explicit variants (`.ls-panel--center`, `.ls-panel--frame`) or make templates avoid relying on utility composition for core visual intent.

## Findings from code-block/divider/image-card/metric

### 10. Code blocks encourage scrollable regions, which are poor for presentation/export and not validated

- Files: `registry/components/code-block/code-block.css`, `registry/components/code-block/README.md`, `registry/components/code-block/registry-item.json`
- Evidence: `pre.ls-code-block, .ls-code-block pre` uses `overflow: auto` and `max-block-size: 520px`. The authoring usage says code should fit without scrolling, but CSS silently creates scroll areas.
- Impact: a deck can validate while important code is hidden below the scroll fold. In slide presentation and PDF/export screenshots, scrollable code regions are usually unreadable or incomplete.
- Likely direction: either prefer clipping/fit variants with explicit warning, add validation heuristics for long code blocks, or provide smaller/dense snippets for code-heavy templates.

### 11. Image-card basic snippet depends on `components/panel` but metadata does not declare that dependency

- Files: `registry/components/image-card/snippets/basic.html`, `registry/components/image-card/registry-item.json`
- Evidence: the snippet uses `class="ls-image-card__media ls-panel ls-panel--muted"`, but `components/image-card` only declares `registryDependencies: ["core/base"]` and no dependency on `components/panel`.
- Impact: `inspect components/image-card` exposes snippet markup that uses `.ls-panel` classes, but `add components/image-card` will not copy panel CSS. Validation may warn if the HTML uses the snippet without panel in the manifest, but the snippet itself is not self-contained.
- Likely direction: remove `ls-panel` from the snippet/media placeholder or add `components/panel` as a registry dependency if panel styling is intentional.

### 12. Container-query support is inconsistent: metrics declare a container but grids do not

- Files: `registry/components/metric/metric.css`, `registry/utilities/layout/layout.css`
- Evidence: `.ls-metric` correctly declares `container: ls-metric / inline-size` and uses `cqi`. Layout utilities use `@container` but no container.
- Impact: component-local responsiveness works for metrics but not for the layout grid rules agents are likely to rely on. This inconsistency is hard to discover through catalog metadata.
- Likely direction: standardize whether components/utilities use container queries and ensure required `container-type` declarations exist.

### 13. Divider README mentions animation load order even though divider has no animation dependency

- File: `registry/components/divider/README.md`
- Evidence: copy section says “Animation variants should load after `registry/animations/reveal`.” This appears copied/generic and unrelated to divider.
- Impact: small docs noise, but it contributes to agent confusion about required dependencies/load order.
- Likely direction: remove irrelevant animation sentence from divider docs.

## Findings from progress/quote/table/timeline

### 14. Progress basic snippet is visually incomplete: it sets a value but includes no track/bar

- Files: `registry/components/progress/snippets/basic.html`, `registry/components/progress/progress.css`, `registry/components/progress/README.md`
- Evidence: the basic snippet is `<div class="ls-progress" style="--ls-progress-value: 72%"><span class="ls-progress__label">...</span></div>`. CSS only renders a bar for native `<progress>` or for `.ls-progress__track > .ls-progress__bar`; the snippet provides neither.
- Impact: agents copying the basic snippet get text but no visible progress bar, despite the item being a progress component.
- Likely direction: make the basic snippet use native `<progress>` or include `.ls-progress__track` and `.ls-progress__bar`.

### 15. Progress docs advertise `data-ls-density="comfortable"`, but metadata/CSS do not support it

- Files: `registry/components/progress/README.md`, `registry/components/progress/progress.css`, `registry/components/progress/registry-item.json`
- Evidence: README says `data-ls-density="compact|comfortable|spacious"`; CSS and metadata only support `compact` and `spacious`.
- Impact: agents may use `comfortable`, validation will likely flag it as an unknown authoring API value if value validation is enforced, and it has no effect.
- Likely direction: either add `comfortable` as the default/no-op value consistently or remove it from docs.

### 16. Progress README advertises `data-ls-tone="accent"`, but metadata/CSS do not support it as an explicit value

- Files: `registry/components/progress/README.md`, `registry/components/progress/registry-item.json`
- Evidence: README says `data-ls-tone="accent|success|warning"`; metadata lists `success`, `warning`, `danger`, while CSS treats default as accent and has no explicit accent selector.
- Impact: `accent` may be invented by agents and do nothing / fail validation. Docs and catalog disagree.
- Likely direction: align README, metadata, and CSS around either implicit default accent or explicit `accent` value.

### 17. Quote basic snippet does not use the classes that quote CSS styles

- Files: `registry/components/quote/snippets/basic.html`, `registry/components/quote/quote.css`, `registry/components/quote/registry-item.json`
- Evidence: CSS styles `.ls-quote__text` and `.ls-quote__source`, but snippet uses raw `<blockquote>` and `<figcaption>` without these classes.
- Impact: the quote text will not receive the intended large display typography. Agents following the snippet get a much weaker visual result than the component advertises.
- Likely direction: update snippet to use `<blockquote class="ls-quote__text">` and `<figcaption class="ls-quote__source">` or add fallback selectors for raw blockquote/figcaption inside `.ls-quote`.

### 18. Quote CSS uses `:has(cite)` but basic snippet has no cite and support assumptions are undocumented

- Files: `registry/components/quote/quote.css`, `registry/components/quote/snippets/basic.html`
- Evidence: `.ls-quote:has(cite) cite` exists, but the snippet does not include `<cite>`.
- Impact: minor, but docs imply semantic citation while the snippet does not model it. Also adds the same `:has()` support assumption as callout.
- Likely direction: include cite in snippet or remove/replace the selector.

### 19. Timeline snippet and CSS contract are actively broken; this caused the Eve slide overlap

- Files: `registry/components/timeline/snippets/basic.html`, `registry/components/timeline/timeline.css`, `registry/components/timeline/registry-item.json`
- Evidence: snippet uses `<li class="ls-timeline__item"><strong>Plan</strong><span>Choose a template.</span></li>`. CSS makes every item `grid-template-columns: var(--ls-timeline-marker-size) minmax(0, 1fr)`, reserving only 34px for the first child. Long labels like “Connect” overflow into the second column.
- Impact: official snippet produces fragile layouts. Real agent output using “Connect/Deliver/Observe/Verify” visibly overlapped.
- Likely direction: either make markerless items use `max-content 1fr`, or update snippets/docs to require `.ls-timeline__marker` plus a body wrapper with `.ls-timeline__title`/`.ls-timeline__text`.

### 20. Timeline progress mode compounds the markerless layout problem

- File: `registry/components/timeline/timeline.css`
- Evidence: `[data-ls-progress="true"] .ls-timeline__item` adds an inline-start border and padding but does not change the column model. Markerless labels still sit in the tiny marker column.
- Impact: progress timelines are a natural use case for “step title + text”; this mode is especially likely to break with real labels.
- Likely direction: progress markerless layout needs explicit CSS support or a canonical marker/body structure.

### 21. Table frame can create misleading empty vertical space when used as a direct `.ls-slide__inner` child

- Files: `registry/components/table/table.css`, `registry/core/base/slide.css`; previously observed in theme example analysis
- Evidence: `.ls-slide__inner` has `grid-template-rows: auto 1fr`; direct children can be stretched/placed in ways that do not match table intrinsic height. `.ls-table-frame` itself has no sizing policy beyond `overflow: hidden` and border/background.
- Impact: table slides can show large empty framed regions if the frame is stretched while the table remains intrinsic height.
- Likely direction: templates should place tables inside `.ls-slide__body` or a dedicated fit-content wrapper; table frame should not be used as a fill container unless explicitly requested.

## Findings from animations

### 22. Animation variants can override each other via transform; composition rules are not explicit enough

- Files: `registry/animations/reveal/reveal.css`, `registry/animations/fade/fade.css`, `registry/animations/scale-in/scale-in.css`, `registry/animations/slide-up/slide-up.css`
- Evidence: base reveal, scale-in, and slide-up all write `transform` for future state. Fade forces `transform: none`. Combining multiple variants is possible in markup but last-loaded CSS wins.
- Impact: agents may combine classes like `ls-reveal-slide-up ls-reveal-scale-in` and get unpredictable/partial behavior depending on load order. This is not validated.
- Likely direction: document “use at most one reveal variant” in metadata/docs and eventually validate incompatible animation classes.

### 23. Highlight reveal does not hide future content; it only pauses animation

- Files: `registry/animations/highlight/highlight.css`, `registry/animations/highlight/README.md`
- Evidence: `.ls-reveal-highlight[data-ls-reveal-state="future"]` only sets `animation-play-state: paused`; unlike `.ls-reveal`, it does not set opacity/transform. README says use `.ls-reveal-highlight` with reveal steps, but if used without `.ls-reveal`, the highlighted content is visible before its step.
- Impact: agents may use `.ls-reveal-highlight` expecting reveal semantics and accidentally show content too early.
- Likely direction: require combining `.ls-reveal ls-reveal-highlight` in docs/metadata, rename to `.ls-highlight`, or make `.ls-reveal-highlight` include hidden/future behavior.

### 24. Some animation READMEs contain generic copy text that does not match the specific item

- Files: `registry/animations/highlight/README.md`, `registry/animations/scale-in/README.md`
- Evidence: both say “Copy this item CSS after `registry/core/base` styles. Animation variants should load after `registry/animations/reveal`.” But these items already depend on reveal and require load-after-reveal for behavior; the wording is generic and less precise than fade/slide-up docs.
- Impact: minor docs clarity issue; agents benefit from exact load ordering language.
- Likely direction: standardize animation docs: base reveal first, exactly one variant after reveal unless documented otherwise.

## Findings from font and theme presets

### 25. Font preset metadata/docs disagree about valid `data-ls-font` scope

- Files: `registry/presets/fonts/*/registry-item.json`, `registry/presets/themes/technical-deep/README.md`, font CSS files
- Evidence: font metadata says `data-ls-font` scope is “body or section”. The technical-deep README demonstrates `<html lang="en" data-ls-theme="technical-deep" data-ls-font="technical-mono">`. The CSS selector `[data-ls-font="..."]` would technically work on `html`, but metadata/docs disagree.
- Impact: agents may apply font presets to `html` from one doc and to `body` from another. If future validation enforces attribute scope, currently valid-looking docs could fail.
- Likely direction: pick one recommended scope. Since themes belong on `html`, fonts probably should be explicitly allowed on `html`, `body`, or `section` if all are intended.

### 26. Serif font preset can make already-large titles overflow; this is documented only as a caveat, not encoded as safer tokens

- Files: `registry/presets/fonts/editorial-serif/font.css`, `registry/presets/fonts/editorial-serif/README.md`, `registry/core/base/tokens.css`
- Evidence: editorial-serif remaps heading/display to the serif stack but leaves fixed heading sizes unchanged. README notes that large serif display titles can need deck-specific line-height/letter-spacing adjustments.
- Impact: the Eve title slide used a serif title and looked top-heavy/large. Agents choose the requested serif font and then must hand-tune sizes without official density/title variants.
- Likely direction: provide a serif-safe title sizing/line-height token adjustment in the preset or expose official title-size utilities/variables in templates.

### 27. Theme presets only remap colors/radii/shadows, not layout density; visual themes cannot help content fit

- Files: `registry/presets/themes/*/theme.css`, `registry/core/base/tokens.css`
- Evidence: themes consistently override visual tokens but not spacing/type scale/padding. For formal/technical decks, content density often differs from playful/product decks, yet all share 92×108 padding and the same large type scale.
- Impact: a theme can look appropriate but still fail practical slide composition. Agents then add inline CSS, which weakens the registry as source of truth.
- Likely direction: decide whether themes should optionally set density tokens or introduce separate density presets/modifiers.

### 28. Theme docs emphasize minimal gradients, but generated decks can easily override this with inline gradient backgrounds

- Files: `registry/presets/themes/README.md`, Eve deck `index.html`
- Evidence: theme docs say avoid heavy gradients/glow. The agent added custom radial/linear gradient backgrounds in inline CSS while using `boardroom-navy`.
- Impact: this is partly agent misuse, but our CLI/skill/catalog does not strongly tell agents that theme presets should be visually authoritative and custom background overrides should be restrained.
- Likely direction: strengthen authoring guidance: after selecting a theme, avoid overriding `--ls-slide-bg-image` / `.ls-slide` backgrounds unless there is a clear visual reason.

## Findings from templates

### 29. `title-hero` and `section-divider` both use the broken direct `.ls-fill` pattern

- Files: `registry/templates/title-hero/snippet.html`, `registry/templates/section-divider/snippet.html`, `registry/core/base/slide.css`, `registry/utilities/layout/layout.css`
- Evidence: both templates place `.ls-fill` directly under `.ls-slide__inner`, which has two grid rows. `.ls-fill` does not span rows.
- Impact: both opening/section slides can be top-biased instead of truly centered. This is not agent misuse; these are official templates.
- Likely direction: fix `.ls-fill` semantics or update these templates to use explicit full-slide spanning markup.

### 30. Dashboard template uses the visually incomplete progress snippet

- Files: `registry/templates/metric-dashboard/snippet.html`, `registry/components/progress/snippets/basic.html`, `registry/components/progress/progress.css`
- Evidence: dashboard uses `<div class="ls-progress" style="--ls-progress-value: 72%"><span class="ls-progress__label">Registry cleanup</span></div>` with no track/bar.
- Impact: the third dashboard panel lacks an actual progress visualization. Agents copying the template get a broken dashboard primitive.
- Likely direction: update progress component first, then update dashboard template to use the canonical progress markup.

### 31. Template snippets are mostly content-short happy paths and do not stress real generated content

- Files: all `registry/templates/*/snippet.html`
- Evidence: snippets use very short labels/sentences. Real research decks contain longer titles, labels, and citations.
- Impact: templates validate and look fine in gallery fixtures but fail under realistic agent-generated content. The Eve slide shows this: a normal title plus four feature rows exposed layout fragility.
- Likely direction: add example/regression decks with realistic longer copy and visual checks; encode content budget guidance in template docs/metadata.

### 32. Template metadata lists classes but not structural constraints or content budgets

- Files: `registry/templates/*/registry-item.json`
- Evidence: authoring metadata exposes a flat `classes` list and usage string, but does not say “one hero grid direct child must span slide”, “timeline item requires marker/body”, “title should be <= N lines”, etc.
- Impact: agents know which classes exist but not how to compose them safely. This is exactly the gap between static validation passing and visual layout failing.
- Likely direction: extend metadata with structural recipes/content guidance or keep templates as richer snippets with less need for improvisation.

### 33. Templates rely heavily on inline styles for key alignment behavior

- File: `registry/templates/title-hero/snippet.html`
- Evidence: title-hero uses `style="text-align: left; place-items: center start"` on the header.
- Impact: important layout behavior is outside the registry class API and not discoverable as a reusable primitive. Agents may copy, omit, or mutate inline styles inconsistently.
- Likely direction: add a utility such as `.ls-start` / `.ls-center-start` / `.ls-text-start` or a hero-specific class so alignment intent is explicit and reusable.

### 34. Several template/component pairings duplicate containers and consume too much vertical space

- Files: `registry/templates/metric-dashboard/snippet.html`, `registry/components/metric/metric.css`, `registry/components/panel/panel.css`
- Evidence: metrics are already padded/bordered cards, then dashboard wraps each metric in a padded `.ls-panel`. That doubles padding and surfaces.
- Impact: dashboards have less room for labels/progress and can look overly boxed/dense. Agents following the template may compound spacing problems.
- Likely direction: either make metrics standalone in grids or provide a panel-less metric variant when used inside panels.

## Findings from examples

### 35. Repo examples repeat the same broken `.ls-fill` full-slide pattern, so visual QA normalized the bug

- Files: `examples/project-intro/index.html`, `examples/template-gallery/index.html`, `examples/pi-coding-agent-*/index.html`
- Evidence: multiple examples use `.ls-slide__inner > .ls-center/.ls-grid.ls-fill`, matching title/section templates.
- Impact: because examples themselves use the flawed pattern, existing validation/example checks cannot catch the top-biased hero problem. The issue became part of the “known good” visual baseline.
- Likely direction: fix examples after fixing the primitive/template model, then add visual regression for hero/section centering.

### 36. Example galleries use short copy and therefore under-test overflow behavior

- Files: `examples/theme-gallery/*.html`, `examples/template-gallery/index.html`, `examples/project-intro/index.html`
- Evidence: gallery slides use compact headings and short card/table/progress text. They do not include realistic technical labels, citations, multi-line timeline labels, or long researched content.
- Impact: visual QA can pass while real generated decks fail. The Eve deck had normal real-world text length and exposed failures.
- Likely direction: add stress examples with longer titles, 3–4 cards, timelines, tables, citations, and serif fonts.

### 37. Template gallery includes the broken progress markup, so it visually tests the wrong thing

- File: `examples/template-gallery/index.html`
- Evidence: dashboard example uses `.ls-progress` with label only and no track/bar, same as the broken progress snippet.
- Impact: if someone visually reviews the gallery, they may not notice that the progress component is not rendering a bar in template contexts.
- Likely direction: update progress snippet/template/gallery together.

### 38. Pi examples previously exposed `.ls-grid--4` need, but still rely on grid behavior without content-fit safeguards

- Files: `examples/pi-coding-agent-*/index.html`, `registry/utilities/layout/layout.css`
- Evidence: examples use `.ls-grid--4` with moderate-length card text. The grid now exists, but container fallbacks are inactive and cards have fixed text sizes.
- Impact: four-column card layouts remain fragile for agent-generated copy unless content is very short.
- Likely direction: provide a compact card/grid recipe for `.ls-grid--4`, or document stricter content budgets.

## Findings from authoring docs, metadata, and validation

### 39. Authoring metadata is class-focused but cannot express required child structure

- Files: `schemas/registry-item.schema.json`, `registry/components/*/registry-item.json`, `skills/slidesls/references/catalog.md`
- Evidence: schema supports `classGroups`, `classes`, `dataAttributes`, `cssVariables`, `attributes`, and `usage`, but not child requirements, allowed direct-child patterns, required wrappers, incompatible class combinations, or content budgets.
- Impact: catalog is a good list of public APIs but not enough to prevent structural misuse. It cannot tell an agent that timeline item children are wrong or that progress needs a track/bar.
- Likely direction: add a minimal structural metadata concept only where valuable, or make snippets fully canonical and validate snippets visually/structurally.

### 40. Registry validation verifies authoring classes exist in CSS, but not that snippets use the authored/canonical classes

- Files: `src/validation/registry.mjs` (reviewed earlier), `tests/authoring-api.test.mjs`, component snippets
- Evidence: tests catch authoring classes missing from CSS and examples with unknown classes. They do not catch quote snippet missing `.ls-quote__text`, progress snippet missing `.ls-progress__track`, or timeline snippet using raw `strong/span` against a marker-column layout.
- Impact: broken snippets can be published as source-of-truth for agents while all checks pass.
- Likely direction: add snippet-contract validation or screenshot/DOM-computed tests for registry snippets/templates.

### 41. Example validation does not inspect nested theme-gallery pages

- File: `src/validation/examples.mjs`
- Evidence: `exampleHtmlFiles()` only collects `examples/<dir>/index.html`. It does not collect `examples/theme-gallery/boardroom-navy.html`, `executive-blue.html`, etc.
- Impact: per-theme gallery pages can contain unknown classes, missing local assets, or broken markup without `validate-examples` catching them.
- Likely direction: either recursively validate all example HTML files or explicitly include gallery child pages.

### 42. Validation explicitly acknowledges it is not visual, but the workflow does not enforce preview/screenshot review

- Files: `docs/validation.md`, `skills/slidesls/references/preview-validation.md`, `skills/slidesls/SKILL.md`
- Evidence: docs say use preview/manual/browser review after static validation, but the agent work validated and stopped; no browser screenshot was taken.
- Impact: visually broken decks are likely because static validation returns clean. The CLI/skill says preview, but not strongly enough as a required final step for generated decks.
- Likely direction: strengthen skill workflow: after creating or materially editing slides, always preview/screenshot at least representative slides unless user opts out.

### 43. Generated catalog repeats the snippet/source-of-truth claim while some snippets are not actually source-of-truth safe

- Files: `skills/slidesls/references/catalog.md`, `docs/registry-contract.md`, snippets above
- Evidence: docs tell agents to use snippets as source-of-truth markup. Several snippets are incomplete or inconsistent with CSS.
- Impact: this creates a trust problem: agents who follow our instructions still produce broken slides.
- Likely direction: fix snippets first, then add tests that every snippet renders plausibly and uses declared dependencies.

### 44. Some non-template snippets use classes from undeclared registry dependencies

- Files: `registry/utilities/layout/snippets/basic.html`, `registry/utilities/layout/registry-item.json`, `registry/components/image-card/snippets/basic.html`, `registry/components/image-card/registry-item.json`
- Evidence: a static cross-check found:
  - `utilities/layout` snippet uses `ls-panel` / `ls-panel--muted` from `components/panel`, but `utilities/layout` depends only on `core/base`.
  - `components/image-card` snippet uses `ls-panel` / `ls-panel--muted` from `components/panel`, but `components/image-card` depends only on `core/base`.
- Impact: snippets for supposedly standalone items are not actually self-contained. Agents can inspect/copy a snippet, add only that item, and miss required CSS.
- Likely direction: either keep snippets self-contained to each item’s declared dependencies or make snippet dependencies explicit and have validation enforce them.

## Overall synthesis / priority ordering

### Confirmed answer to the Eve question

The Eve failures are mostly caused by registry primitive/layout/template issues, not just by agent misuse.

- The overlapping left timeline column is a direct conflict between the official timeline snippet and timeline CSS.
- The top-biased title slide comes from the official title-hero/section-divider `.ls-fill` pattern not spanning the `.ls-slide__inner` grid.
- The agent did add custom inline styling and gradients, but the two concrete breakages map back to registry-provided patterns.

### Highest-priority fixes

1. Fix `.ls-slide__inner` / `.ls-fill` / full-slide centering semantics and update `title-hero`, `section-divider`, examples, and docs.
2. Fix timeline’s snippet/CSS contract.
3. Fix progress snippets/templates so progress bars actually render.
4. Make snippets self-contained or declare snippet dependencies; start with `utilities/layout` and `image-card` using `ls-panel` without dependency.
5. Add visual or DOM/computed regression checks for registry snippets/templates, not just static class validation.
6. Add content-budget/density support for realistic agent-generated copy.

### Validation gaps to address after primitive fixes

- Validate all example HTML recursively, not only `examples/*/index.html`.
- Validate snippets against declared dependencies.
- Consider structural validation for high-risk components (`timeline`, `progress`, `quote`, `callout`).
- Require or strongly guide preview/screenshot review for generated decks.
