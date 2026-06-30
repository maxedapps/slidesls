# Primitive authoring contract

`slidesls` primitives are copyable blueprints, not hidden framework components. Copied files should remain readable, editable, and robust in plain HTML/CSS.

## Taxonomy

### Utilities

Utilities work anywhere and own generic layout behavior only.

Examples:

- `.ls-stack`
- `.ls-cluster`
- `.ls-grid`
- `.ls-center`
- `.ls-fill`

Do not make utilities depend on `.ls-slide__body`, `.ls-slide__inner`, or a special ancestor class.

### Components

Components own their visual/content styling and internal element classes.

Examples:

- `.ls-card`
- `.ls-panel`
- `.ls-metric`

A component must not require a specific slide layout parent. Avoid selectors that style a component through an unrelated ancestor.

### Templates

Templates are complete HTML snippets composed from utilities and components. They should not introduce template-specific CSS contracts in v1.

## Public API

- Keep class names `ls-` prefixed and readable.
- Prefer semantic tokens from `core/base` before adding item-local variables.
- Add item-local CSS variables only for meaningful customization points.
- Use small, predictable modifier sets.
- Include at least one snippet for every recommended utility/component/template.

## Decoration

Decorative effects should be opt-in or variable-controlled. Baseline CSS should not hard-code visual noise that consumers must fight to remove.

## Progressive enhancement

Modern CSS is encouraged when it improves copyability, but baseline correctness must not depend on fragile features.

- Container queries are fine after stable sizing is established.
- `:has()` is fine for optional child-aware styling.
- `color-mix()` is fine for token-derived surfaces.
- Out-of-flow behavior must be explicit and safe.

## Reveal sequencing

Reveal primitives keep authoring simple with `.ls-reveal` and `data-step`. The core runtime may add internal `data-ls-reveal-state="future|current|past"` attributes so CSS recipes can support arbitrary step counts without hard-coded selectors.

Use `data-ls-reveal-sequence` on a group when direct `.ls-reveal` children should receive missing `data-step` values in DOM order.

## Visual QA

Every new or changed primitive should be validated in an example deck. Example slides should demonstrate credible defaults first, then intentional customization hooks. Avoid one-off inline hacks unless the inline value demonstrates a documented CSS variable.
