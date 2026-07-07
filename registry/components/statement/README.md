# Statement

A full-width display-type claim. No border, no box — the words are the design. Use it when one idea deserves the whole slide: a thesis, a section-opening claim, or a closing takeaway. An optional support line carries the qualification so the claim itself stays sharp.

## Usage

Key classes:

- `.ls-statement` — the claim container, vertically centered in its area, capped at 1280px inline size.
- `.ls-statement__text` — the claim in display type with balanced wrapping. Emphasize one span with `<em>` or `.ls-accent-text`; it renders in the accent color, upright.
- `.ls-statement__support` — muted body-size support line, capped at 900px.

Modifiers:

- `.ls-statement--hero` — larger display size for opening/closing slides.
- `.ls-statement--center` — centers the claim and its support line.

Override-safe variable: `--ls-statement-size` (default `var(--ls-text-xl)`; `--hero` defaults to `var(--ls-text-2xl)`). Compact slide density scales the claim down automatically.

## When not to use

- The point needs structure — steps, evidence, or data belong in `components/flow`, `components/chart`, or `components/list`.
- Multiple claims on one slide — split them; a statement earns its size by being alone.
- The claim is a number — use `components/stat`, which typesets values properly.

## Copy

Copy `statement.css` after `core/base` styles.
