# Benchmark deck brief ("four decks" test)

A fixed, realistic brief used as the recurring acceptance test for the style
system: the SAME content authored in four styles must read as four different
studios' work (a stranger should not identify them as siblings), while every
deck's scorecard stays clean and the motion checklist passes per style.

## Procedure

1. Author this brief in four styles (`editorial`, `terminal`, `gallery`,
   `boardroom` — swap one for `pop` when the audience section changes) as
   `examples/benchmark-<style>/index.html`, following the agent skill.
2. Content must be substantively identical across the four; only style,
   emphasis idiom, and figure treatment may vary.
3. Screenshot all four side by side; review under the rubric in
   `.gallery-review/REVIEW.md`.
4. Pass = unrecognizable as siblings at thumbnail size; every archetype used
   at least once across the four; `validate --report` clean; motion checklist
   (docs/motion-review.md) passes per style.

## The brief

**Presenter:** Nadia Reyes, engineering lead of the "Atlas" internal platform
team at a ~400-person company.
**Audience:** engineering org + product leadership, quarterly review.
**Goal:** get continued funding for Atlas by proving the platform's first
year paid off, being honest about the one big failure, and landing next
quarter's single priority.
**Length:** 9–10 slides.

Content beats (each maps naturally to an archetype):

1. **Opener** — claim: "Atlas made every team faster except ours — on purpose."
2. **Chapter: The year in numbers** (section divider).
3. **Big stats** — 3 numbers: 214 services migrated; deploy lead time 41min → 6min; platform team NPS from internal survey 71.
4. **How migrations actually ran** (process flow, 4 steps: assess → scaffold → shadow → cut over).
5. **The failure, honestly** (statement or evidence): the shared staging environment collapsed under load in March; two weeks of org-wide slowdown; what changed as a result.
6. **Before/after comparison** — one team's deploy pipeline before Atlas vs after (comparison archetype).
7. **What teams say** (evidence): quote from a staff engineer on the search team — "We deleted 14,000 lines of Terraform and I have not thought about ingress since." — plus one proof stat (fleet config drift incidents: 0 since June).
8. **Operations dashboard** — availability 99.95%, 61% error budget left, 44 releases/quarter, one watch item (queue saturation on batch nights).
9. **Next quarter** (walkthrough or statement): the single priority — self-serve production databases; if walkthrough, show the planned `atlas db create` CLI experience.
10. **Close** (statement): "Platforms earn their keep when nobody talks about them."
