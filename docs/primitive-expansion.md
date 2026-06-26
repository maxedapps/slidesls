# Primitive expansion strategy

`ls_slides` grows through coherent groups of primitives, not as a random catalog. Each addition should improve both everyday professional decks and more expressive presentation moments while preserving the copyable-registry model.

## Balance to preserve

The registry should provide structure without trapping users in rigid templates.

- **Structured enough**: clear layout contracts, predictable class names, sensible spacing, accessible defaults, and consistent token usage.
- **Flexible enough**: composable slots, CSS custom properties, optional modifiers, and markup that users can easily edit after copying.
- **Professional enough**: support common consulting/product/teaching slides such as columns, comparisons, metrics, timelines, tables, and code explainers.
- **Creative enough**: support bold editorial slides such as asymmetric statements, quote features, image spotlights, layered canvases, annotations, and connectors.

## Primitive design rules

See also [Primitive authoring contract](./primitive-authoring.md) for the shared layout API, sizing, decoration, progressive-enhancement, and visual QA contract.

- Prefer **slots and regions** over content-specific templates.
- Keep class names `ls-` prefixed and readable.
- Use semantic tokens from `core/base` before introducing item-local variables.
- Add item-local CSS variables only for meaningful customization points.
- Avoid hard-coding copy, icons, media, or data into registry items.
- Make default markup useful, but easy to delete or rearrange.
- Support both dense business slides and sparse high-impact slides.
- Keep registry items dependency-light; use vanilla CSS/JS first.
- Use modern CSS when it improves clarity or flexibility: container queries, cascade layers, `:has()`, subgrid, anchor positioning, `@property`, and `color-mix()`.
- Use browser APIs as progressive enhancements when they fit presentation workflows: Fullscreen, Screen Wake Lock, View Transitions, Popover, and Web Animations.
- Add GSAP only when an animation primitive clearly needs it.

## Implemented catalog

### Layouts

Everyday professional layouts:

- `two-column` — balanced text/content split.
- `three-column` — equal or weighted feature/comparison columns.
- `comparison-grid` — before/after or option-vs-option analysis.
- `metric-dashboard` — headline insight plus KPI/stat/card regions.
- `timeline-strip` — horizontal process or roadmap.
- `code-explainer` — code block plus explanation panel.

Editorial and visual layouts:

- `title-hero` — opening slide with hero title and visual area.
- `detail-split` — asymmetric explanation slide with visual + stack.
- `centered-statement` — one bold idea with optional eyebrow/supporting text.
- `section-divider` — chapter break / topic transition.
- `asymmetric-feature` — bold statement beside stacked supporting content.
- `image-spotlight` — large visual with caption, overlay, or side annotation.
- `quote-feature` — large quotation with attribution and context.
- `layered-canvas` — visual canvas for layered cards, annotations, and connectors.

### Components

Text/content primitives:

- `badge`
- `bullet-list`
- `callout`
- `quote`
- `highlight-text`
- `annotation`

Data/structure primitives:

- `metric`
- `stat-grid`
- `table`
- `timeline`
- `numbered-step`
- `progress`
- `divider`
- `legend`

Media/technical/visual primitives:

- `card`
- `diagram`
- `media-frame`
- `image-card`
- `logo-strip`
- `code-block`
- `connector`

### Animations

- Base reveals: `reveal`.
- Reveal variants: `fade`, `slide-up`, `scale-in`.
- Sequencing/focus: `stagger`, `step-focus`.
- Emphasis: `highlight`, `pulse`, `spotlight`.
- Diagram/connector motion: `connector-grow`, `path-draw`.

Animations should remain optional registry items and compose with `registry/animations/reveal` where possible. Prefer CSS/Web Animations/View Transitions before adding dependencies. Use scroll-driven animations only for narrative or scrolling deck variants, not as the default slide navigation model.

### Examples

- `examples/project-intro` — initial foundation validation.
- `examples/primitive-gallery` — foundational primitive gallery.
- `examples/structured-content-gallery` — structured content and data gallery.
- `examples/visual-narrative-gallery` — visual narrative and annotation gallery.

## Batch strategy for future additions

Future expansion should still happen in coherent planned groups. Each expansion should include:

1. A small set of related layouts/components/animations.
2. Registry metadata and README files for every item.
3. At least one example deck or example slide validating the new primitives together.
4. `registry.json` updates.
5. `pnpm check` validation.
6. Browser/visual review for galleries or visual primitives.
7. Peer review before finalizing substantial changes.

Potential future directions:

- **Registry quality and usability pass**: normalize READMEs, improve copy/load guidance, add use-case catalog docs, and audit visual examples.
- **Presentation runtime ergonomics**: fullscreen, wake lock, presenter controls, export guidance, and navigation polish.
- **Technical/developer primitives**: terminal, API cards, code diff, file tree, request/response examples.
- **Theme and preset expansion**: color presets, light mode, print/export presets, and style packs.

## Modern-platform patterns in use

- Container queries let primitives adapt to assigned slide regions.
- `:has()` supports optional-icon/media/metadata adaptations where useful.
- `color-mix()` creates accent surfaces and borders without one-off color duplication.
- `@property` is reserved for primitives with meaningful interpolated custom-property animation.
- CSS-only reveal companions such as `step-focus` should mirror runtime state without adding JavaScript.
- Anchor positioning remains useful, but floating behavior must have a safe normal-flow fallback and a clear opt-in API.

## Quality bar

A new primitive should only be added if it is:

- copyable without build tooling,
- useful in more than one deck,
- visually coherent with the dark professional default theme,
- customizable through markup and CSS variables,
- designed modern-first but progressively enhanced when browser support is uneven,
- documented with concise usage guidance and any notable platform requirements,
- validated in an example before commit.

Current quality lessons:

- Defaults should look product-quality in galleries; decoration should be opt-in.
- Modern CSS enhancements must not alter normal flow in ways that can overlap essential content.
- Dense tables, timelines, progress, code explainers, and dashboards need semantic markup, explicit labels/values, and conservative overflow handling before visual flourish.
- Reveal sequencing should support realistic item counts through runtime state instead of hard-coded CSS ceilings.
- Captions should not be clipped by decorative table surfaces.
- Safe-area utilization should be controlled through explicit layout APIs.
- Avoid parent opacity on layered structured components when child surfaces must remain opaque over lines/connectors.
- Annotations default to normal flow; overlay behavior should be explicit.
- Connectors use hand-authored SVG/CSS geometry instead of auto-routing.
- Legends must provide text and shape cues instead of relying on color alone.
- Layered canvases should make overlap/floating explicit and baseline-safe.
