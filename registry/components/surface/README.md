# Surface

The one bordered container in the slidesls v2 vocabulary. Cards, panels, callouts, and boxed metrics collapse into this single noun; everything else stays deliberately unboxed, so a surface signals "this content is one framed unit" — optionally with a status tone.

## Usage

Key classes:

- `.ls-surface` — the bordered, content-sized container (a CSS grid with a small gap).
- `.ls-surface__kicker` — small uppercase label in the accent color.
- `.ls-surface__title` — heading-font title.
- `.ls-surface__text` — muted body copy.

Modifiers:

- `.ls-surface--muted` — quieter background for secondary blocks.
- `.ls-surface--accent` — accent border/background; the title takes the accent color.
- `.ls-surface--success` / `.ls-surface--warning` / `.ls-surface--danger` — status tones.
- `.ls-surface--row` — horizontal band; kicker/title/text flow inline for compact rows.
- `.ls-surface--center` — centers content; use only in stretched grid areas.

Override-safe variables: `--ls-surface-padding` (default `26px 28px`), `--ls-surface-title-size` (`29px`), `--ls-surface-text-size` (`22px`). Slide density (`data-ls-density="compact"`/`"spacious"`) adjusts them automatically.

## When not to use

- A single idea the whole slide exists for — use `components/statement` and let type do the work.
- A headline number — use `components/stat` unboxed; scale contrast replaces the border.
- Grids of one-liner boxes — use `components/list`; a border around one short line is noise.

## Copy

Copy `surface.css` after `core/base` styles.
