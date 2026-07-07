# Evidence

A pull-quote with a named, credible source — corroborated by exactly one piece of proof: a stat, chart, or figure inside the quote's evidence slot. Words make the claim human; the proof makes it true. The choreography is the argument: voice first, number second.

## Contract

- quote: exactly one, ≤ 30 words — trim to the sentence with the verdict in it
- attribution: exactly one, a real name and role
- proof: exactly one (stat, chart, or figure) inside `ls-quote__evidence`, measuring what the quote claims

## Motion

The quote and attribution enter with the slide. The `ls-quote__evidence` block carries `ls-reveal` with `data-step="1"` so the proof lands on the first advance.

## When not to use

- No proof exists: use `components/quote` alone rather than decorating the words with an unrelated stat.
- The numbers are the story and the voice is garnish: use `archetypes/big-stat`.
