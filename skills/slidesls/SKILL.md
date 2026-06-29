---
name: slidesls
description: Use this skill when creating, editing, previewing, or validating plain HTML/CSS/JS slide decks with slidesls; when discovering/adding slidesls registry items; or when an agent needs a lightweight CLI workflow for web presentation decks. Do not use for PowerPoint, Keynote, Google Slides, React/reveal.js-specific decks, or mandatory framework slide systems.
---

# slidesls

slidesls is an agent-primary slide authoring CLI and copyable registry. Generated decks remain plain editable HTML/CSS/JS and do not depend on slidesls at runtime.

## Workflow

1. Clarify the deck goal, audience, dimensions, style, and whether an existing deck folder should be reused.
2. If starting fresh, run `slidesls init <dir> --template minimal --title "..."`.
3. If editing an existing deck, inspect `slidesls.json` and the configured entry file.
4. Discover primitives with `slidesls catalog` or `slidesls catalog --json`.
5. Inspect candidates with `slidesls inspect <item> --readme`.
6. Add assets with `slidesls add <items...> --dir <deck>`; use `--dry-run --json` before large changes.
7. Author/edit the plain HTML, CSS, and JS directly.
8. Validate with `slidesls validate <deck>` and fix all errors.
9. Preview with `slidesls preview <deck>`; use browser tools for visual review when needed.
10. Run `slidesls doctor --dir <deck>` if config, registry, or environment behavior looks wrong.

## Useful commands

```sh
slidesls --help
slidesls init deck --template minimal --title "My Deck"
slidesls catalog --json
slidesls inspect layouts/title-hero --readme
slidesls add components/card animations/reveal --dir deck --dry-run --json
slidesls add components/card animations/reveal --dir deck
slidesls validate deck --json
slidesls preview deck --port 4321
slidesls doctor --dir deck --json
```

## References

Prefer canonical docs under `docs/`:

- `docs/cli.md` — CLI commands and options.
- `docs/deck-contract.md` — generated deck HTML/CSS API.
- `docs/registry-contract.md` — registry item metadata and files.
- `docs/agent-workflow.md` — agent-oriented workflow.
- `docs/validation.md` — validation and preview checks.

Use registry item READMEs for item-specific markup and API details.
