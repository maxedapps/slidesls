# Walkthrough

One code excerpt beside a short numbered list of annotations. Each annotation names one idea and points at one highlighted line, and the annotations reveal in order — so the audience reads the code the way you would explain it at a whiteboard, not all at once.

## Contract

- code: exactly one excerpt, trimmed to the lines the annotations discuss
- annotations: 2–4, ≤ 14 words each, in the same top-to-bottom order as their lines

## Motion

Each annotation carries `ls-reveal` with `data-step="1"`..`N`. Pair every annotation with a `data-ls-line="highlight"` on the line it explains; the static highlights plus the stepped narration keep the eye and the voiceover in sync.

## When not to use

- The code needs no narration: use `components/code` and let the excerpt speak for itself.
- The excerpt runs past roughly fifteen lines: trim it to the load-bearing lines or split the walkthrough across slides.
