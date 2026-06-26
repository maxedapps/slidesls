# Modern platform strategy

`ls_slides` should aggressively use modern CSS and browser APIs when they make copied slide code smaller, clearer, more expressive, or easier to customize. The project should prefer platform primitives over framework abstractions while keeping fallbacks understandable.

## Research summary

Current platform capabilities are strong enough to shape the registry around modern CSS:

- **CSS anchor positioning** is now broadly emerging and useful for anchored labels, callouts, badges, overlays, and diagram annotations. Some subfeatures still have uneven support, so use it as progressive enhancement with simple absolute/grid fallbacks.
- **Container queries** are stable enough to use for components that adapt to their allocated slide region instead of the viewport.
- **Cascade layers** are already core to the project and should remain the backbone for predictable composition.
- **`:has()`**, **subgrid**, **`@property`**, and **`color-mix()`** are good default tools for expressive, dependency-free CSS.
- **Popover**, **Fullscreen**, **Screen Wake Lock**, **View Transitions**, and **scroll-driven animations** can support optional richer presentation behavior, but should be feature-detected and not required for basic deck rendering.

## CSS capabilities to use deliberately

### Cascade layers

Continue using the canonical layer order from `core/base/reset.css`:

```css
@layer reset, tokens, base, layouts, components, animations, utilities;
```

New primitives should place styles in the appropriate layer and avoid specificity fights.

### Container queries

Use container queries for components and layouts that need to adapt to available slide space:

- cards that change density in narrow regions,
- stat grids that switch column count,
- media frames with different caption placement,
- code blocks that adjust controls/line metadata.

Prefer container-aware primitives over viewport-only breakpoints because slides often divide a fixed canvas into regions.

### CSS anchor positioning

Use anchor positioning for progressive enhancement where an element should attach to another element:

- callout pointers,
- diagram labels,
- floating badges,
- image annotations,
- timeline markers,
- popover-like contextual overlays.

Recommended pattern:

1. Provide a simple default layout that works without anchors.
2. Add anchored placement inside `@supports`.
3. Keep class names and CSS variables readable so copied code can be customized.

Example direction:

```css
.ls-annotation-target {
  anchor-name: --ls-annotation-target;
}

@supports (position-anchor: --ls-annotation-target) {
  .ls-annotation {
    position-anchor: --ls-annotation-target;
    position-area: top right;
  }
}
```

Do not make anchor positioning mandatory for core layout correctness until support is fully dependable across expected presentation browsers.

### `:has()`

Use `:has()` for contextual styling that previously required extra utility classes or JavaScript:

- cards with media vs. text-only cards,
- slides with/without eyebrow labels,
- quote blocks with/without attribution,
- components that adapt when icons are present.

Keep selectors understandable and avoid deep, fragile content inspection.

### Subgrid

Use subgrid for nested components that need to align with parent layout columns/rows, especially:

- comparison grids,
- timeline rows,
- card decks,
- dense business slides.

Fallback should remain a normal grid/flex layout when subgrid is not essential.

### Typed custom properties with `@property`

Use `@property` for animatable custom properties where it materially improves animation quality or state transitions:

- progress rings/bars,
- spotlight masks,
- numeric reveal effects,
- gradient position/angle transitions.

Avoid adding typed properties for every token; reserve them for animation and interpolation.

### Modern color functions

Use `color-mix()` and related modern color syntax to derive surfaces, borders, and accent states from semantic tokens. Prefer derived values over duplicated hex colors when it improves themeability.

Example direction:

```css
.ls-callout {
  background: color-mix(in oklab, var(--ls-accent) 14%, transparent);
  border-color: color-mix(in oklab, var(--ls-accent) 35%, transparent);
}
```

### Scroll-driven animations

Use scroll-driven animations only for examples or future narrative/scrolling deck variants. Standard slide decks should continue to use explicit reveal/navigation state.

## Browser APIs to use as progressive enhancements

### Fullscreen API

Useful for a presentation-mode control in the runtime or examples. Must be optional: decks still need to work when fullscreen is unavailable or blocked.

### Screen Wake Lock API

Useful for presentation mode so the device does not sleep mid-talk. It requires a secure context and user-agent support, so it should be opt-in and feature-detected.

### View Transition API

Useful for polished slide-to-slide transitions in capable browsers. It should enhance the existing runtime navigation rather than replace normal slide visibility/state handling.

### Popover API

Useful for optional speaker notes, help overlays, slide menus, or contextual annotations. Combine with anchor positioning where appropriate, but keep static slide output clean.

### Web Animations API

Prefer CSS animations for simple effects. Use Web Animations when JavaScript needs runtime control, interruption, or sequencing without adding a library.

## Compatibility posture

The project should be **modern-first, progressively enhanced**:

- Use modern CSS/browser APIs when they reduce complexity or unlock expressive primitives.
- Keep copied code understandable without a build step.
- Use `@supports`, feature detection, and graceful fallback for features with uneven support.
- Do not add transpilers, polyfill bundles, or framework dependencies by default.
- Examples may demonstrate cutting-edge enhancements as long as baseline rendering still works.
- Registry READMEs should call out any feature that needs progressive enhancement or a specific browser capability.

## How this affects primitive design

New layout/component/animation items should ask:

1. Can modern CSS remove JavaScript from this primitive?
2. Can container queries make it work in multiple slide regions?
3. Can anchor positioning make annotations/callouts more reusable?
4. Can `:has()` remove extra modifier classes?
5. Can `color-mix()` or tokens make theme variants easier?
6. Is the feature safe as a baseline, or should it live behind `@supports`?

## Sources consulted

- MDN: CSS anchor positioning — https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Anchor_positioning
- MDN: CSS container queries — https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_container_queries
- MDN: `@layer` — https://developer.mozilla.org/en-US/docs/Web/CSS/@layer
- MDN: `@property` — https://developer.mozilla.org/en-US/docs/Web/CSS/@property
- MDN: `color-mix()` — https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix
- MDN: `:has()` — https://developer.mozilla.org/en-US/docs/Web/CSS/:has
- MDN: Subgrid — https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout/Subgrid
- MDN: CSS scroll-driven animations — https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll-driven_animations
- MDN: Popover API — https://developer.mozilla.org/en-US/docs/Web/API/Popover_API
- MDN: Fullscreen API — https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API
- MDN: Screen Wake Lock API — https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API
- MDN: View Transition API — https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API
- web.dev: Anchor positioning — https://web.dev/learn/css/anchor-positioning
- web.dev: Container queries baseline — https://web.dev/articles/baseline-in-action-container-queries
- web.dev: Same-document View Transitions baseline — https://web.dev/blog/same-document-view-transitions-are-now-baseline-newly-available
