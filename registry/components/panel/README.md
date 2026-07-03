# components/panel

Standalone visual container for grouped slide content. Panels work anywhere and pair well with layout utilities.

## Basic markup

```html
<div class="ls-panel">
  <h3 class="ls-panel__title">Clear container</h3>
  <p class="ls-panel__text">Use panels for grouped explanations, diagrams, or emphasis blocks.</p>
</div>
```

## Variants

- `.ls-panel--muted`
- `.ls-panel--accent`
- `.ls-panel--center` for centered visual anchors; it centers the content cluster rather than distributing children through the full panel height
- `.ls-panel--fit` for short text-only callouts that should not stretch to full column height
- `.ls-panel--frame` for clipped media/diagram frames, screenshots, code, or diagrams that should have visual mass

## When not to use

- A grid of small text panels where each holds one short sentence — use `components/icon-item` rows/tiles or `components/card` so the copy has structure.
