# templates/title-hero

Opening slide template with a clear title, subtitle, and badges.

Use this template as a complete slide skeleton. It is composed from utilities and standalone components; it does not require a template-specific CSS class.

Keep hero copy concise so badges, title, and subtitle form one tight visual cluster. The right panel uses `.ls-panel--fit` for short text-only anchors; switch to `.ls-panel--frame` when the panel holds a screenshot, diagram, code sample, or other visual that should keep substantial height.

The hero grid uses `.ls-grid--fill` plus `.ls-slide-fill` on purpose: it is a full-slide layout whose columns intentionally span the slide.

## When not to use

- Ordinary content slides — use `data-ls-slide-kind="content"` with `.ls-slide__header` and a body layout instead of a full-slide hero.
