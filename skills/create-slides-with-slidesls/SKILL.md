---
name: create-slides-with-slidesls
description: Use this skill when the user wants to create slides, make an HTML presentation, turn content into a deck, edit/animate/preview/validate slides, or visually review plain HTML/CSS/JS slide decks with the slidesls CLI. Use agent-browser for optional screenshot/browser visual QA after material slide edits. Do not use for PowerPoint, Keynote, Google Slides, non-slidesls framework decks, or mandatory React/reveal.js/Vite presentation systems.
metadata:
  package: "@maxedapps/slidesls"
  skill-version-source: "package"
---

# create-slides-with-slidesls

slidesls is an agent-primary slide authoring CLI and copyable registry. Generated decks remain plain editable HTML/CSS/JS and do not depend on slidesls, agent-browser, or any framework at runtime.

## Command discovery

First confirm the active CLI version and command surface:

```sh
slidesls --help
```

Installed package usage:

```sh
npx -y @maxedapps/slidesls@latest <command>
```

Local checkout/dev usage:

```sh
node /path/to/ls_slides/bin/slidesls.mjs <command>
```

## Install, link, or read this skill

Runtime-neutral no-install path:

```sh
slidesls skill show --all
```

Install or link to the skill directory required by the active agent runtime:

```sh
slidesls skill install <your-agent-skill-dir>/create-slides-with-slidesls
slidesls skill link <your-agent-skill-dir>/create-slides-with-slidesls
```

Example for Claude Code project-local skills only:

```sh
slidesls skill install ./.claude/skills/create-slides-with-slidesls
```

After installing or linking, fully read `SKILL.md` and the relevant files in `references/` before authoring slides.

## Workflow

1. Clarify the deck goal, audience, dimensions, style, whether the deck should be static or animated, and whether an existing deck folder should be reused.
2. Choose exactly one theme early:
   - `executive-blue` for product/professional decks.
   - `boardroom-navy` for formal strategy, board, and reporting decks.
   - `technical-deep` for engineering/code-heavy decks.
   - `playful-ink` for workshops, education, and friendly product demos.
3. Run `slidesls --help` and, if behavior is unclear, `slidesls doctor --json`.
4. For a new deck, use a dedicated deck folder:

   ```sh
   slidesls init ./slides/my-deck --template minimal --theme executive-blue --title "My Deck"
   ```

5. If editing an existing deck, inspect `slidesls.json` and the configured entry file. If adding a theme manually, copy it with `slidesls add presets/themes/<theme> --dir <deck>` and set `data-ls-theme="<theme>"` on the existing `<html>` element. Do not add a second theme attribute and do not stack multiple themes.
6. Discover agent-safe primitives with `slidesls catalog --recommended --json`.
7. Inspect templates/components with `slidesls inspect <item> --readme --json`; use returned snippet HTML as source-of-truth markup.
8. Unless the user asks for a static deck, use progressive disclosure: copy/load `animations/reveal` and one subtle variant (`animations/slide-up` or `animations/fade`), then add `.ls-reveal` plus `data-step` or `data-ls-reveal-sequence`.
9. Add assets with `slidesls add <items...> --dir <deck> --dry-run --json`, review planned files and load tags, then run without `--dry-run`.
10. Paste/edit snippets and plain HTML, CSS, and JS directly.
11. Validate with `slidesls validate <deck> --json` and fix all errors; review warnings.
12. Preview with `slidesls preview <deck>` and visually inspect representative slides unless the user explicitly opts out. For agents, use `agent-browser` screenshots/browser checks so you can actually see the slides. Check title/section slides, densest content, and any table/timeline/progress/code slides.
13. Run `slidesls doctor --dir <deck> --json` if config, registry, or environment behavior looks wrong.

## Animation recipe

```sh
slidesls add animations/reveal animations/slide-up --dir <deck> --dry-run --json
slidesls add animations/reveal animations/slide-up --dir <deck>
```

```html
<div data-ls-reveal-sequence>
  <article class="ls-card ls-reveal ls-reveal-slide-up">...</article>
  <article class="ls-card ls-reveal ls-reveal-slide-up">...</article>
</div>
```

Use animation to reveal ideas, not decorate every element. Prefer `slide-up` for cards/lists, `fade` for captions and secondary notes, and `scale-in` sparingly for metrics/hero callouts. Do not stack transform variants.

## Visual QA with agent-browser

`slidesls preview` is long-running; start it in the background or another terminal and keep it running while browser commands execute.

Layout QA with all reveal content visible:

```sh
slidesls preview <deck> --host 127.0.0.1 --port 4321
agent-browser --session slidesls-review open http://127.0.0.1:4321/?export=1
agent-browser --session slidesls-review set viewport 1600 900
agent-browser --session slidesls-review wait --load networkidle
agent-browser --session slidesls-review screenshot ./slides-export-review.png
```

Interactive reveal-step QA:

```sh
agent-browser --session slidesls-review open http://127.0.0.1:4321
agent-browser --session slidesls-review wait --load networkidle
agent-browser --session slidesls-review screenshot ./slide-1-step-0.png
agent-browser --session slidesls-review press ArrowRight
agent-browser --session slidesls-review screenshot ./slide-1-step-1.png
```

If the binary is unavailable, try `npx -y agent-browser ...`. Inspect the screenshots and iterate until visually acceptable; do not merely capture files.

## Fast discovery map

- Need the workflow? `slidesls skill show`
- Need the full class/style/data-attribute catalog? `slidesls skill show --reference catalog`
- Need machine-readable public APIs? `slidesls catalog --json`
- Need recommended building blocks? `slidesls catalog --recommended --json`
- Need themes? `slidesls catalog --type preset --tag theme --json`
- Need exact markup and docs? `slidesls inspect <item> --readme --json`
- Need copied files/load tags? `slidesls add <items> --dry-run --json`
- Need validation/fix feedback? `slidesls validate <deck> --json`

## References bundled with this skill

- `references/copy-workflow.md` — safe add/copy workflow.
- `references/deck-authoring.md` — deck shell, reveal contract, icons, animation recipes, and composition guidance.
- `references/preview-validation.md` — validation and preview loop, browser QA, and visual-quality checklist.
- `references/registry-contract.md` — registry metadata and file contract.
- `references/catalog.md` — generated registry catalog. Also available via `slidesls skill show --reference catalog`.

For current item-specific details, start with `slidesls catalog --recommended --json`; its `authoring` metadata is the quick source of truth for public classes, modifiers, data attributes, theme/font attributes, CSS variables, and usage rules. Use item READMEs and snippets through:

```sh
slidesls inspect <item> --readme --json
```

## Do not

- Do not install to `.claude/skills/...` unless the active runtime is Claude Code and that is the desired project-local skill path.
- Do not use old `ls-layout-*` or `layouts/*` patterns; use templates, utilities, and standalone components.
- Do not invent `ls-*` classes or nested structural contracts; use `catalog --json` authoring metadata and snippets returned by `inspect --json`.
- Do not add React, Vite, Tailwind, or another framework unless explicitly requested.
- Do not make generated decks depend on `slidesls` at runtime.
- Do not skip `slidesls validate` before finalizing.
- Do not skip preview/visual inspection after creating or materially editing slides unless the user opts out.
- Do not rely on static validation alone for layout fit; agents should use `agent-browser` screenshots/browser checks for visual review.
- Do not assume Lucide icons work unless the deck loads Lucide.
- Do not edit registry source inside an installed package when the intent is deck customization; edit copied deck files instead.
