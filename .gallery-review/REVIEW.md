# Gallery review

Sampled rubric review verdicts. One section per session; keep history.

Rubric (per image or side-by-side pair):

1. Is there a focal point?
2. Is the hierarchy unambiguous at thumbnail size?
3. Does the whitespace read as intentional?
4. Is it on-brief for the style?
5. Would you present this slide?

## <date> — <scope>

| Combo | Verdict | Notes |
| ----- | ------- | ----- |

## 2026-07-07 — Phase 0 gate (0.6.0)

Scope: gallery matrix (default + editorial × 3 densities, v1 snippets), motion
pages (default, editorial). Automated gate green (geometry on default-density
pages, motion assertions on both styles). Reviewed by implementing agent;
maintainer sign-off pending for the editorial brief (plan OQ2).

| Combo                                | Verdict          | Notes                                                                                                                                                                    |
| ------------------------------------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| editorial--default (stills)          | pass (draft bar) | Fraunces/Newsreader/mono render correctly; paper+oxblood palette coherent; callout accent surface reads slightly pink — revisit tone surfaces in Phase 1 style deepening |
| default--default (stills)            | pass             | v1 parity preserved                                                                                                                                                      |
| motion/default (live + assertions)   | pass             | crossfade, stagger cadence, key-spam clean                                                                                                                               |
| motion/editorial (live + assertions) | pass             | slower signature (560/760ms) reads as intended; slide-1 load static                                                                                                      |
| density variants                     | advisory only    | v1 components at compact densities have sub-20px text; superseded by Phase 1 v2 components + threshold recalibration (task 1.7)                                          |

## 2026-07-07 — Phase 1+2 gate (0.7.0/0.8.0)

Scope: full v2 registry (38 items) — components/layouts/archetypes × 6 style
combos × 3 densities; four-decks benchmark side-by-side (editorial, terminal,
gallery, boardroom; identical Atlas content).

| Combo                            | Verdict          | Notes                                                                                                                                   |
| -------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Components × editorial (stills)  | pass             | list checks, unboxed stats, ink code block, honest bar chart all render with taste                                                      |
| 4-style contact sheet (shells)   | pass             | thumbnails unmistakably different studios                                                                                               |
| Benchmark slide 3 (big-stat ×4)  | pass             | same numbers, four identities; boardroom brass + terminal phosphor accents land                                                         |
| Benchmark slide 8 (dashboard ×4) | pass             | surface/stat tile mix; watch-item tint reads correctly in all four; minor: bottom-right whitespace could tighten (deferred, acceptable) |
| Motion assertions ×6 styles      | pass             | entrance ramp, stagger distinctness, key-spam invariants green in gate                                                                  |
| low_contrast sweep               | pass after fixes | lint caught 6 real token defects (editorial/gallery/terminal/boardroom/pop subtle+accent smalls) — all corrected to AA                  |
| Four-decks criteria              | pass             | 9 distinct archetypes each, longest run 1, scorecards clean, contracts exact                                                            |

### Motion checklist (mechanical spot-verification, 2026-07-07)

- Editorial fade purity: entering slide never translates (fade signature respected; children carry movement per choreography rule).
- Pop bounce: entering slide rises from +72px, overshoots to −6.8px, settles — the spring is real, not just an easing name.
- Reduced-motion emulation (pop, worst case): navigation instant, zero animations, no translate — kill switch verified.
- Key-spam, entrance ramp, stagger distinctness: automated in the release gate for all six style pages.
- Outstanding for maintainer: subjective "reads as rhythm not lag" pass per style in a live browser.

## 2026-07-07 — Phase 3 gate items

| Check                                | Verdict | Notes                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------------ | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fresh-agent dogfood (skill+CLI only) | pass    | 9-slide terminal-style deck, scorecard clean after ONE lint iteration, 7 distinct archetypes, correct style/motion/icon decisions routed by catalog useWhen/avoidWhen. Friction log (9 items) triaged: timeline snippet added, comparison verdict variant added, contract word-count semantics + composed-slide + hero-footer conventions documented, chart value semantics documented, SKILL.md dependency-add step added |
| pop flagship rendered pass           | pass    | zero measured warnings; poster energy on-brief (blob texture, alternating coral/blue, sticker tiles); flow markers slightly small — acceptable, revisit post-1.0                                                                                                                                                                                                                                                           |
