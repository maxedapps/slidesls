# Process flow

A pipeline told as a horizontal band of numbered steps: terse titles, one sentence each, revealed in the order the work actually happens. The reveal sequence is the explanation — each advance answers "and then?".

## Contract

- steps: 3–5 (`ls-flow__step`); two stages is a comparison, six is two slides
- stepTitle: ≤ 4 words, verb-first
- stepBody: 6–16 words, one sentence, parallel across steps

## Motion

Each step carries `ls-reveal` with `data-step="1"`..`N` so the pipeline builds stage by stage on advance.

## When not to use

- A stage needs evidence, code, or sub-bullets: give each stage its own slide instead of cramming the band.
- The steps are dated milestones, not a pipeline: use `components/list` with `ls-list--timeline`.
