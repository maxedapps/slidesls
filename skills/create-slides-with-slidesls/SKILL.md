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
slidesls skill show
```

Full export fallback only:

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
2. Choose exactly one theme early (discover all with `slidesls catalog --type preset --tag theme --json`):
   - `executive-blue` for product/professional decks.
   - `clean-light` for bright product, teaching, and print-friendly decks.
   - `boardroom-navy` for formal strategy, board, and reporting decks.
   - `technical-deep` for engineering/code-heavy decks.
   - `playful-ink` for workshops, education, and friendly product demos.
3. Run `slidesls --help` and, if behavior is unclear, `slidesls doctor --json`.
4. For a new deck, use a dedicated deck folder:

   ```sh
   slidesls init ./slides/my-deck --template minimal --theme executive-blue --title "My Deck"
   ```

5. If editing an existing deck, inspect `slidesls.json` and the configured entry file. If adding a theme manually, copy it with `slidesls add presets/themes/<theme> --dir <deck>` and set `data-ls-theme="<theme>"` on the existing `<html>` element. Do not add a second theme attribute and do not stack multiple themes.
6. Discover candidates incrementally with `slidesls catalog --starter --json`, `slidesls catalog --json`, or filtered catalog commands such as `slidesls catalog --type template --json`. Pick layouts with the density decision table below; check each item's `avoidWhen` before using it.
7. Inspect templates/components with `slidesls inspect <item> --json`; use returned snippet HTML and load tags as source-of-truth markup, and respect the returned `composition` guidance (`avoidWhen`, `alternatives`). Use `--api` only when low-level authoring metadata is needed.
8. Unless the user asks for a static deck, use progressive disclosure: copy/load `animations/reveal` and one subtle variant (`animations/slide-up` or `animations/fade`), then add `.ls-reveal` plus `data-step` or `data-ls-reveal-sequence`.
9. Add assets with `slidesls add <items...> --dir <deck> --dry-run --json`, review planned files and load tags, then run without `--dry-run`.
10. Paste/edit snippets and plain HTML, CSS, and JS directly.
11. Validate with `slidesls validate <deck> --json` and fix all errors; review warnings. Design-lint warnings (`many_cards_in_grid`, `stretched_grid_with_cards`, `card_grid_check_density`) are advisory composition pointers — fix or explicitly justify them.
12. Run the per-slide visual QA loop unless the user explicitly opts out (full recipe: `references/preview-validation.md`):
    - keep `slidesls preview <deck> --json` running; its `slideLinks` are per-slide deep links;
    - collect rendered facts with `slidesls visual-qa --eval` via agent-browser on the export URL, then `slidesls visual-qa --analyze --input <collected.json> --json`;
    - screenshot every content slide via its deep link (all slides for decks up to ~15; flagged plus representative beyond) and inspect at full size;
    - fix or explicitly justify every advisory finding, then re-run until clean;
    - do not judge composition from the full-export overview screenshot.
13. Run `slidesls doctor --dir <deck> --json` if config, registry, or environment behavior looks wrong.

## Density decision table

Match layout to item count and copy length (details: `references/deck-authoring.md`):

- 3-5 one-liner points → `templates/feature-rows`; not full-height cards.
- 4-6 short items → `templates/icon-grid`; never 5+ stretched cards.
- 3 items with 2-4 sentences or a visual each → `templates/three-cards`.
- 1 big idea + sparse support → hero/section kind, or `templates/split` with `data-ls-density="spacious"`.
- Dense tables/code → `data-ls-density="compact"` plus visual review.

Grids size rows to content and center vertically by default. Add `.ls-grid--fill` only for frames, diagrams, and dashboards that intentionally fill the body — never for sparse card grids.

## Animation

Unless the user asks for a static deck, add `animations/reveal` plus one subtle variant and use `.ls-reveal` with `data-step` or `data-ls-reveal-sequence`. Reveal ideas, don't decorate every element. Full recipe and reveal contract: `references/deck-authoring.md`.

## Visual QA

The complete agent-browser recipe (screenshots, deep links, `slidesls visual-qa` collection/analysis) lives in `references/preview-validation.md` — read it before the QA pass. Essentials: keep `slidesls preview` running in the background; use the export URL for collection; screenshot slides individually via `slideLinks` deep links; inspect the screenshots and iterate until visually acceptable, do not merely capture files.

## Fast discovery map

- Need the workflow? `slidesls skill show`
- Need the full class/style/data-attribute catalog? `slidesls skill show --reference catalog` — per-item lookup only; do not read it end-to-end, use `catalog --json` / `inspect <item> --json` first
- Need candidate items? `slidesls catalog --json` (brief) or `slidesls catalog --starter --json`
- Need themes? `slidesls catalog --type preset --tag theme --json`
- Need exact markup and load tags? `slidesls inspect <item> --json`
- Need low-level public APIs? `slidesls inspect <item> --api --json` or `slidesls catalog --api --json`
- Need copied files/load tags? `slidesls add <items> --dry-run --json`
- Need validation/fix feedback? `slidesls validate <deck> --json`
- Need rendered per-slide findings? `slidesls visual-qa --eval` then `slidesls visual-qa --analyze --input <collected.json> --json`
- Need to change accent color or fonts? Override token variables in a deck-level `@layer tokens` block or switch `data-ls-theme`/`data-ls-font` — recipe in `references/deck-authoring.md`; discover safe variables via `inspect <item> --api --json` `cssVariables` (`overrideSafe`, defaults)

## References bundled with this skill

- `references/copy-workflow.md` — safe add/copy workflow.
- `references/deck-authoring.md` — deck shell, reveal contract, icons, animation recipes, and composition guidance.
- `references/preview-validation.md` — validation and preview loop, browser QA, and visual-quality checklist.
- `references/registry-contract.md` — registry metadata and file contract.
- `references/catalog.md` — generated registry catalog. Per-item lookup only (it is large); also available via `slidesls skill show --reference catalog`.

For current item-specific details, start with `slidesls catalog --json` or `slidesls catalog --starter --json`; these are brief selection payloads. Use item snippets through:

```sh
slidesls inspect <item> --json
```

Use full authoring APIs only when needed:

```sh
slidesls inspect <item> --api --json
slidesls catalog --api --json
```

## Do not

- Do not install to `.claude/skills/...` unless the active runtime is Claude Code and that is the desired project-local skill path.
- Do not use old `ls-layout-*` or `layouts/*` patterns; use templates, utilities, and standalone components.
- Do not invent `ls-*` classes or nested structural contracts; use snippets returned by `inspect --json` and `--api` authoring metadata when needed.
- Do not use `ls-slide-fill` on ordinary content slides. Content slides use `data-ls-slide-kind="content"` and `.ls-slide__header`; hero/section slides must be marked and may intentionally center full-slide layouts.
- Do not add `.ls-grid--fill` to grids of sparse text cards; stretched sparse cards trap dead space. Reserve it for frames, diagrams, and dashboards.
- Do not build grids of 5+ cards or cards holding only a title plus one short sentence; use `templates/icon-grid` or `templates/feature-rows` per the density decision table.
- Do not add React, Vite, Tailwind, or another framework unless explicitly requested.
- Do not make generated decks depend on `slidesls` at runtime.
- Do not skip `slidesls validate` before finalizing.
- Do not skip preview/visual inspection after creating or materially editing slides unless the user opts out.
- Do not rely on static validation alone for layout fit; run `slidesls visual-qa` and inspect per-slide screenshots.
- Do not judge composition from the full-export overview screenshot; inspect flagged slides at full size via their deep links.
- Do not override `.ls-*` selectors in deck CSS outside `@layer`; unlayered rules beat all component CSS. Override token variables (in `@layer tokens`) instead.
- Do not assume Lucide icons work unless the deck loads Lucide.
- Do not edit registry source inside an installed package when the intent is deck customization; edit copied deck files instead.
