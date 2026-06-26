# Animations

Copyable animation and transition recipes.

Current items:

- `reveal/` — subtle CSS reveal transitions driven by the core runtime.
- `fade/` — opacity-only reveal variant for `.ls-reveal` elements.
- `slide-up/` — configurable larger vertical reveal variant for `.ls-reveal` elements.
- `stagger/` — within-step delay sequencing for grouped reveal children.
- `scale-in/` — reveal-compatible scale/opacity entrance variant.
- `step-focus/` — CSS-only companion that dims non-current grouped reveal items.
- `highlight/` — subtle text/data emphasis animation.
- `pulse/` — subtle attention pulse for markers and annotations.
- `spotlight/` — local focus treatment for visual regions.
- `connector-grow/` — reveal-compatible line growth for connector paths.
- `path-draw/` — SVG path drawing recipe using `pathLength="1"`.

`fade`, `slide-up`, `stagger`, `scale-in`, `step-focus`, `highlight`, `pulse`, `spotlight`, `connector-grow`, and `path-draw` compose with `animations/reveal`; they do not replace the core reveal/runtime contract. Load `reveal.css` first, then variant CSS.

Keep animation recipes vanilla by default. Add GSAP only for future recipes that genuinely need timeline orchestration.
