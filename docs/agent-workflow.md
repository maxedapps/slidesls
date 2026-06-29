# Agent workflow

1. Clarify deck purpose, audience, tone, slide count, and visual constraints.
2. Run `slidesls init <dir> --template minimal` for new decks, or inspect `slidesls.json` for existing decks.
3. Use `slidesls catalog --json` and `slidesls inspect <item> --readme` to choose primitives.
4. Run `slidesls add ... --dry-run --json`, review planned files, then run without `--dry-run`.
5. Edit the generated plain HTML/CSS/JS directly.
6. Run `slidesls validate <dir> --json` and fix errors.
7. Run `slidesls preview <dir>` and use browser automation/screenshots for visual review when needed.
8. Run `slidesls doctor --dir <dir>` for environment/config issues.

Do not introduce a framework, bundler, Tailwind, or runtime package dependency unless the user explicitly asks for one.
