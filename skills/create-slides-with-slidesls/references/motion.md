# Motion

Motion is core behavior, not an add-on. Three layers, two of them automatic:

## 1. Slide transitions (automatic)

Slides crossfade/rise/slide between navigations, driven by the runtime (Web Animations API — fully interruptible; key-spam can never strand a slide mid-flight). The style's `--ls-transition-kind` token sets the default; the author can override per deck:

```html
<main class="ls-deck" data-ls-deck data-ls-transition="rise"></main>
```

Kinds: `fade` (default), `rise`, `slide` (direction-aware), `none`.

**Choreography rule (built-in):** the slide transition and the child stagger never both translate. With `fade`, children provide the movement; with `rise`/`slide`, the runtime degrades child entrances to opacity-only automatically. Never fight this by adding transform animations of your own.

## 2. Staggered entrances (automatic)

Children of the slide body settle in with the style's cadence. The runtime finds entrance units by walking the body's direct children, descending one level into layout containers (`ls-layout`, `ls-grid`, `ls-stack`, `ls-cluster`) or anything marked `data-ls-stagger`; stepped elements are excluded. First load renders slide 1 static — entrances only play on navigation.

Tune per style via tokens (`--ls-enter-duration`, `--ls-enter-distance`, `--ls-stagger-step`); per deck only in a deck-level `@layer tokens` block.

## 3. Steps (opt-in, where sequence carries meaning)

`data-step="N"` + `.ls-reveal` reveals elements on ArrowRight. Use for narrative order — a flow's stages, an evidence slide's proof, a walkthrough's annotations — not decoration. `data-ls-reveal-sequence` on a container auto-numbers its `.ls-reveal` children.

Walkthrough pattern: pair each annotation's `data-step` with a `data-ls-line="highlight"` line in the code block so the highlight lands with the words.

## Kill switches (all built-in, all tested)

- `?export=1` and print render everything static and fully revealed.
- `prefers-reduced-motion` collapses all motion to instant opacity.
- `data-ls-motion="none"` on the deck or one slide disables transitions and entrances there (`motion_absent` surfaces the deck-wide switch so it stays a decision).

## Reviewing motion

Step the live preview with ArrowRight; hold it down to verify interrupts feel clean. Export screenshots cannot see motion — never sign off motion from them. Checklist (same one the release gate uses): signature matches the style; nothing translates twice; stagger reads as rhythm, not lag; steps land where spoken emphasis would; slide 1 loads without a flash.
