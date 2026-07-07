# Comparison

Two columns, aligned by construction: options, before/after, us/them. The subgrid skeleton keeps headings, rows, and bottom-line notes level across both sides, so the comparison reads as a fair fight — and an optional verdict line makes the call explicit.

## Contract

- columns: exactly 2 (`ls-layout__region`); a third option is a table
- columnHeading: exactly 2, ≤ 4 words
- rows: 2–4 per column, aligned — row N answers the same question on both sides
- verdict: optional, one line; reveal it last if the deck makes a call

## Motion

Columns enter with the core stagger. A verdict line, when present, takes `ls-reveal` with `data-step="1"` so it lands after both sides have been seen.

## When not to use

- Three or more options, or many criteria: use `components/table` so rows stay comparable.
- One side is a strawman: an honest comparison gives both columns their best case, or it persuades no one.
