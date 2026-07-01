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
2. Choose exactly one theme early:
   - `executive-blue` for product/professional decks.
   - `boardroom-navy` for formal strategy, board, and reporting decks.
   - `technical-deep` for engineering/code-heavy decks.
   - `playful-ink` for workshops, education, and friendly product demos.
3. Run `slidesls --help` and, if behavior is unclear, `slidesls doctor --json`.
4. For a new deck, use a dedicated deck folder. Inside that folder run:

   ```sh
   slidesls init --template minimal --theme executive-blue --title "My Deck"
   ```

   Or initialize an explicit path inside a larger project:

   ```sh
   slidesls init ./slides/my-deck --template minimal --theme executive-blue --title "My Deck"
   ```

5. If editing an existing deck, inspect `slidesls.json` and the configured entry file. If adding a theme manually, copy it with `slidesls add presets/themes/<theme> --dir <deck>` and set `data-ls-theme="<theme>"` on the existing `<html>` element. Do not add a second theme attribute and do not stack multiple themes.
6. Discover agent-safe primitives with `slidesls catalog --recommended --json`.
7. Inspect templates/components with `slidesls inspect <item> --readme --json`; use returned snippet HTML as source-of-truth markup.
8. Add assets with `slidesls add <items...> --dir <deck> --dry-run --json`, review planned files and load tags, then run without `--dry-run`.
9. Paste/edit snippets and plain HTML, CSS, and JS directly.
10. Validate with `slidesls validate <deck> --json` and fix all errors; review warnings.
11. Preview with `slidesls preview <deck>` and visually inspect representative slides unless the user explicitly opts out. Check the title/section slides, densest content slide, and any table/timeline/progress/code slides.
12. Run `slidesls doctor --dir <deck> --json` if config, registry, or environment behavior looks wrong.

## Fast discovery map

- Need the workflow? `slidesls skill show`
- Need the full class/style/data-attribute catalog? `slidesls skill show --reference catalog`
- Need machine-readable public APIs? `slidesls catalog --json`
- Need recommended building blocks? `slidesls catalog --recommended --json`
- Need themes? `slidesls catalog --type preset --tag theme --json`
- Need exact markup and docs? `slidesls inspect <item> --readme --json`
- Need copied files/load tags? `slidesls add <items> --dry-run --json`
- Need validation/fix feedback? `slidesls validate <deck> --json`

## Useful commands

```sh
slidesls --help
slidesls skill info --json
slidesls skill link ./.claude/skills/slidesls
slidesls init --template minimal --theme executive-blue --title "My Deck"
slidesls init ./slides/my-deck --template minimal --theme executive-blue --title "My Deck"
slidesls catalog --recommended --json
slidesls catalog --type preset --tag theme --json
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
- `references/catalog.md` — generated registry catalog. Also available via `slidesls skill show --reference catalog`.

For current item-specific details, start with `slidesls catalog --recommended --json`; its `authoring` metadata is the quick source of truth for public classes, modifiers, data attributes, theme/font attributes, CSS variables, and usage rules. Use item READMEs and snippets through:

```sh
slidesls inspect <item> --readme --json
```

## Do not

- Do not use old `ls-layout-*` or `layouts/*` patterns; use templates, utilities, and standalone components.
- Do not invent `ls-*` classes or nested structural contracts; use `catalog --json` authoring metadata and snippets returned by `inspect --json`.
- Do not add React, Vite, Tailwind, or another framework unless explicitly requested.
- Do not make generated decks depend on `slidesls` at runtime.
- Do not skip `slidesls validate` before finalizing.
- Do not skip preview/visual inspection after creating or materially editing slides unless the user opts out.
- Do not assume Lucide icons work unless the deck loads Lucide.
- Do not edit registry source inside an installed package when the intent is deck customization; edit copied deck files instead.
