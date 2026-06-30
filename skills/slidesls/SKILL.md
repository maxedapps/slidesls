---
name: slidesls
description: Use this skill when creating, editing, previewing, or validating plain HTML/CSS/JS slide decks with slidesls; when discovering/adding slidesls registry items; or when an agent needs a lightweight CLI workflow for web presentation decks. Do not use for PowerPoint, Keynote, Google Slides, React/reveal.js-specific decks, or mandatory framework slide systems.
---

# slidesls

slidesls is an agent-primary slide authoring CLI and copyable registry. Generated decks remain plain editable HTML/CSS/JS and do not depend on slidesls at runtime.

## Command discovery

First confirm the active CLI version and command surface:

```sh
slidesls --help
```

Before public npm publishing, local cross-project usage often uses the checkout directly:

```sh
node /path/to/ls_slides/bin/slidesls.mjs <command>
```

If the package is installed from a local tarball inside the target project, use:

```sh
npx slidesls <command>
```

Future published-package usage:

```sh
npx -y @maxedapps/slidesls@latest <command>
```

## Install or link this skill

For local-only development, prefer linking the skill so it always reflects the current checkout:

```sh
slidesls skill link ./.claude/skills/slidesls
```

When a copy is preferred:

```sh
slidesls skill install ./.claude/skills/slidesls
```

Use a custom target if the active agent runtime expects skills elsewhere.

## Workflow

1. Clarify the deck goal, audience, dimensions, style, and whether an existing deck folder should be reused.
2. Run `slidesls --help` and, if behavior is unclear, `slidesls doctor --json`.
3. For a new deck, use a dedicated deck folder. Inside that folder run:

   ```sh
   slidesls init --template minimal --title "My Deck"
   ```

   Or initialize an explicit path inside a larger project:

   ```sh
   slidesls init ./slides/my-deck --template minimal --title "My Deck"
   ```

4. If editing an existing deck, inspect `slidesls.json` and the configured entry file.
5. Discover agent-safe primitives with `slidesls catalog --recommended --json`.
6. Inspect templates/components with `slidesls inspect <item> --readme --json`; use returned snippet HTML as source-of-truth markup.
7. Add assets with `slidesls add <items...> --dir <deck> --dry-run --json`, review planned files and load tags, then run without `--dry-run`.
8. Paste/edit snippets and plain HTML, CSS, and JS directly.
9. Validate with `slidesls validate <deck> --json` and fix all errors.
10. Preview with `slidesls preview <deck>`; use browser tools for visual review when needed.
11. Run `slidesls doctor --dir <deck> --json` if config, registry, or environment behavior looks wrong.

## Useful commands

```sh
slidesls --help
slidesls skill info --json
slidesls skill link ./.claude/skills/slidesls
slidesls init --template minimal --title "My Deck"
slidesls init ./slides/my-deck --template minimal --title "My Deck"
slidesls catalog --recommended --json
slidesls inspect templates/split --readme --json
slidesls inspect components/card --json
slidesls add utilities/layout components/panel components/card --dir ./slides/my-deck --dry-run --json
slidesls add utilities/layout components/panel components/card --dir ./slides/my-deck
slidesls validate ./slides/my-deck --json
slidesls preview ./slides/my-deck --port 4321
slidesls doctor --dir ./slides/my-deck --json
```

## References bundled with this skill

- `references/copy-workflow.md` — safe add/copy workflow.
- `references/deck-authoring.md` — deck shell, reveal contract, icons, and recipes.
- `references/preview-validation.md` — validation and preview loop.
- `references/registry-contract.md` — registry metadata and file contract.
- `references/catalog.md` — generated registry catalog.

For current item-specific details, prefer CLI metadata and item READMEs through:

```sh
slidesls inspect <item> --readme --json
```

## Do not

- Do not use old `ls-layout-*` or `layouts/*` patterns; use templates, utilities, and standalone components.
- Do not invent nested structural contracts; prefer snippets returned by `inspect --json`.
- Do not add React, Vite, Tailwind, or another framework unless explicitly requested.
- Do not make generated decks depend on `slidesls` at runtime.
- Do not skip `slidesls validate` before finalizing.
- Do not assume Lucide icons work unless the deck loads Lucide.
- Do not edit registry source inside an installed package when the intent is deck customization; edit copied deck files instead.
