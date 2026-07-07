# Motion review checklist

Run per style at every phase gate. The automated motion checks in
`scripts/visual-gate.mjs` (entrance opacity ramp, stagger paint-in
distinctness, key-spam interrupt run) catch mechanical breakage; this
checklist catches motion that works but reads wrong. Review in a live
browser (`slidesls preview`), stepping with ArrowRight — never from export
screenshots.

## Per style

- [ ] **Signature matches the brief.** The transition/stagger feel matches the
      style's stated motion signature (e.g. editorial: slow fades, paragraphs
      settling — not snappy; pop: springy — not sluggish).
- [ ] **No double-motion sludge.** When the deck uses a `rise`/`slide`
      transition, children enter opacity-only (choreography rule); nothing
      translates twice in the same navigation.
- [ ] **Stagger reads as rhythm, not lag.** Units settle in a readable cadence;
      the last unit lands before you lose patience (≤ ~1.2s total).
- [ ] **Steps read as narrative.** `data-step` reveals land where the spoken
      emphasis would be; no step reveals something already visible.
- [ ] **Interrupts feel intentional.** Holding ArrowRight lands cleanly on the
      final slide; no flicker, no half-faded slides, no content jumps.
- [ ] **Slide 1 loads static.** Reloading the deck shows the first slide with
      no entrance flash.
- [ ] **Reduced motion is actually static.** With the OS/browser
      `prefers-reduced-motion` enabled, navigation is instant (1ms opacity), no
      translation anywhere.
- [ ] **Export/print show everything.** `?export=1` and print preview render
      all slides complete with all steps revealed and zero motion.

## Recording

Record verdicts per style in `.gallery-review/REVIEW.md` alongside the
gallery rubric session, noting the style, date, and any deviations approved.
