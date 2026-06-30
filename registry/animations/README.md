# Animations

Copyable animation and transition recipes.

Current items:

- `reveal/` — subtle CSS reveal transitions driven by the core runtime.
- `fade/` — opacity-only reveal variant for `.ls-reveal` elements.
- `slide-up/` — configurable larger vertical reveal variant for `.ls-reveal` elements.
- `scale-in/` — reveal-compatible scale/opacity entrance variant.
- `highlight/` — subtle text/data emphasis animation.

Reveal variants compose with `animations/reveal`; they do not replace the core reveal/runtime contract. Load `reveal.css` first, then variant CSS.

Keep animation recipes vanilla by default. Add heavier animation dependencies only for future recipes that genuinely need timeline orchestration.
