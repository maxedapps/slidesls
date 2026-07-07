# Archetypes and the rhythm plan

Archetypes are complete slide patterns: a snippet with layout, components, furniture, and motion already wired, plus a **content contract** (slot counts and word limits). Discover with `slidesls catalog --type archetype --json`; get markup with `slidesls inspect archetypes/<name> --json`.

## The nine archetypes

| Archetype      | Use for                         | Contract essence                                                                                             |
| -------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `title-hero`   | the opener                      | title ≤10 words (a claim), subtitle ≤20, badges ≤3, optional figure (no-figure `statement` variant included) |
| `section`      | chapter breaks                  | number + title ≤6 words; deliberately sparse                                                                 |
| `statement`    | one idea, full stop             | claim ≤14 words, support ≤16                                                                                 |
| `big-stat`     | numbers that carry the argument | 1–3 stats, value ≤6 chars, label ≤8 words                                                                    |
| `process-flow` | how something runs              | 3–5 steps, titles ≤4 words, bodies 6–16 words, step reveals                                                  |
| `comparison`   | decisions, before/after         | exactly 2 columns, 2–4 aligned rows (`before-after` variant included)                                        |
| `evidence`     | quotes with proof               | quote ≤30 words + attribution + exactly one proof (stat/chart/figure)                                        |
| `walkthrough`  | code narration                  | one code block + 2–4 annotations ≤14 words, step-synced highlights                                           |
| `dashboard`    | operational status              | 3–5 tiles from surface/stat/chart                                                                            |

## Writing to the contract

Contracts are the fix for ragged, unequal slides: constrain the content, not the CSS. Word limits are in each archetype's catalog entry and enforced by `contract_copy_length` / `contract_slot_count` (advisory, precise hints). When copy doesn't fit, cut the copy or split the slide — never shrink type, never widen boxes.

Keep the `data-ls-archetype` attribute on the slide: it powers contract linting, the `validate --report` scorecard, and monotony detection.

How the lint counts: a "word" is a whitespace-separated token of the slot's measured text element (for a walkthrough annotation or timeline item, that is the body text — titles are not counted against the body limit). `maxChars` counts visible characters with inline markup stripped (`218<em>ms</em>` is 5 chars). When in doubt, run `validate --report --json`; the hint quotes the text it measured.

## The rhythm plan

Before HTML, list every slide as `archetype — intent`:

```
1 title-hero — Atlas paid for itself
2 section — the year in numbers
3 big-stat — 3 headline numbers
4 process-flow — how migrations ran
...
```

Self-check (the `archetype_monotony` lint enforces the same thresholds):

- No archetype > 50% of content slides; no shape 3× in a row.
- Open with `title-hero`, close with `statement`.
- Alternate density: after a dense slide (dashboard, walkthrough), give the audience a sparse one (statement, section, big-stat).

## The image-sourcing ladder

For any figure slot, in order:

1. **Real asset** from the user (ask in the style brief).
2. **Authored diagram** — `flow`, `chart`, or hand-written inline SVG in a `figure`.
3. **`ls-figure--abstract`** — the style's intentional generative art.
4. **Drop the slot** — every figure archetype ships a no-figure variant.

Text in a panel pretending to be a visual is never sanctioned (`placeholder_echo`).

## When no archetype fits

Compose directly: one `ls-layout--*` in the slide body, regions filled with components (`slidesls inspect layouts/core --api --json`). Keep the furniture footer, keep the contract spirit (short titles, bounded copy). Composed slides simply go unmarked (no `data-ls-archetype`) — that is expected and does not weaken the deck's scorecard; only marked slides feed monotony and contract checks.

Footers: content slides carry the furniture footer; `title-hero` and `section` slides may omit it (the snippets show the convention).
