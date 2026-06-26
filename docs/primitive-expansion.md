# Primitive expansion strategy

`ls_slides` should grow in batches of coherent primitives, not as a random catalog. Each batch should improve both everyday professional decks and more expressive presentation moments while preserving the copyable-registry model.

## Balance to preserve

The registry should provide structure without trapping users in rigid templates.

- **Structured enough**: clear layout contracts, predictable class names, sensible spacing, accessible defaults, and consistent token usage.
- **Flexible enough**: composable slots, CSS custom properties, optional modifiers, and markup that users can easily edit after copying.
- **Professional enough**: support common consulting/product/teaching slides such as two-column, comparison, metrics, timelines, and code slides.
- **Creative enough**: support bold editorial slides such as asymmetric statements, oversized type, spotlight visuals, layered cards, and unconventional content grids.

## Primitive design rules

- Prefer **slots and regions** over content-specific templates.
- Keep class names `ls-` prefixed and readable.
- Use semantic tokens from `core/base` before introducing item-local variables.
- Add item-local CSS variables only for meaningful customization points.
- Avoid hard-coding copy, icons, media, or data into registry items.
- Make default markup useful, but easy to delete or rearrange.
- Support both dense business slides and sparse high-impact slides.
- Keep registry items dependency-light; use vanilla CSS/JS first.
- Aggressively use modern CSS when it improves clarity or flexibility: container queries, cascade layers, `:has()`, subgrid, anchor positioning, `@property`, and `color-mix()`.
- Use browser APIs as progressive enhancements when they fit presentation workflows: Fullscreen, Screen Wake Lock, View Transitions, Popover, and Web Animations.
- Add GSAP only when an animation primitive clearly needs it.

## Layout families to build toward

### Everyday professional layouts

- `two-column` — balanced text/content split.
- `three-column` — equal feature or comparison columns.
- `comparison-grid` — before/after or option-vs-option analysis.
- `metric-dashboard` — headline plus KPI/stat cards.
- `timeline-strip` — horizontal process or roadmap.
- `code-explainer` — code block plus explanation panel.

### Editorial / creative layouts

- `centered-statement` — one bold idea with optional eyebrow/supporting text.
- `section-divider` — chapter break / topic transition.
- `asymmetric-feature` — bold statement on one side, stacked content regions on the other.
- `image-spotlight` — large visual with overlay or side annotation.
- `quote-feature` — large quotation with attribution and context.
- `layered-canvas` — overlapping cards, labels, or diagram elements.

## Component families to build toward

- Text primitives: `bullet-list`, `quote`, `callout`, `highlight-text`.
- Data primitives: `metric`, `stat-grid`, `table`, `progress`, `timeline`.
- Media primitives: `media-frame`, `image-card`, `logo-strip`.
- Technical primitives: `code-block`, `terminal`, `api-card`.
- Visual primitives: `divider`, `connector`, `numbered-step`, `annotation`.

## Animation families to build toward

- Basic reveals: `fade`, `slide-up`, `scale-in`.
- Sequencing: `stagger`, `step-focus`.
- Emphasis: `highlight`, `pulse`, `spotlight`.
- Diagram motion: `path-draw`, `connector-grow`.

Animations should remain optional registry items and compose with `registry/animations/reveal` where possible. Prefer CSS/Web Animations/View Transitions before adding dependencies. Use scroll-driven animations only for narrative or scrolling deck variants, not as the default slide navigation model.

## Batch strategy

Each expansion batch should include:

1. A small set of related layouts/components/animations.
2. Registry metadata and README files for every item.
3. At least one example deck or example slide validating the new primitives together.
4. `registry.json` updates.
5. `pnpm check` validation.

Recommended first expansion batch:

- Layouts: `centered-statement`, `section-divider`, `two-column`, `comparison-grid`, `asymmetric-feature`, `image-spotlight`.
- Components: `callout`, `metric`, `stat-grid`, `bullet-list`, `code-block`, `media-frame`, `quote`.
- Animations: `fade`, `slide-up`, `stagger`.

Modern-platform opportunities for this batch:

- Use container queries in `two-column`, `comparison-grid`, `metric`, `stat-grid`, `code-block`, and `media-frame` so components adapt to their assigned slide regions.
- Use anchor positioning for `asymmetric-feature`, `image-spotlight`, annotations, callouts, and diagram labels as progressive enhancement.
- Use `:has()` for components that adapt when optional icons, media, attribution, or metadata are present.
- Use `color-mix()` for accent surfaces and borders instead of duplicating one-off colors.
- Use `@property` only for primitives with interpolated custom-property animation, such as progress, highlight, spotlight, or connector effects.

## Quality bar

A new primitive should only be added if it is:

- copyable without build tooling,
- useful in more than one deck,
- visually coherent with the dark professional default theme,
- customizable through markup and CSS variables,
- designed modern-first but progressively enhanced when browser support is uneven,
- documented with concise usage guidance and any notable platform requirements,
- validated in an example before commit.
