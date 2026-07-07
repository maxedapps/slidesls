# Code

One component for code blocks, diffs, and terminal transcripts, switched by `data-ls-variant`. Line-level hooks (`data-ls-line`) support highlight, add/del, and prompt/output emphasis, and give step-driven walkthroughs something to point at.

## Usage

Author as a `<figure>`:

- `.ls-code` — the framed monospace block; add `data-ls-variant="block"`, `"diff"`, or `"terminal"`.
- `.ls-code__header` — a `<figcaption>` header row (filename, language, or command context).
- `.ls-code__body` — the scrollable body containing a `<pre>`.
- `.ls-code__line` — one `<span>` per line inside the `<pre>`.

Line attributes (`data-ls-line` on `.ls-code__line`):

- `highlight` — accent background plus inset accent bar; use for the 1–3 lines the narration is about.
- `add` / `del` — diff lines; the `+`/`-` markers are drawn by CSS, so do not type them into the source.
- `prompt` / `output` — terminal variant only; prompts get a drawn `$` and output dims.

Override-safe variable: `--ls-code-font-size` (default `21px`; compact slide density uses `18px`).

## When not to use

- Excerpts beyond ~15 lines — trim to the lines that matter; a wall of code is unreadable at slide distance.
- Concept-first audiences — draw the shape of the system with `components/flow` instead of syntax.
- Tabular data — `components/table` typesets values; code framing implies "read this literally".

## Copy

Copy `code.css` after `core/base` styles.
