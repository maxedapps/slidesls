---
name: create-slides-with-slidesls
description: Use this skill when the user wants to create slides, make an HTML presentation, turn content into a deck, edit/animate/preview/validate slides, or visually review plain HTML/CSS/JS slide decks with the slidesls CLI. Use agent-browser for optional screenshot/browser visual QA after material slide edits. Do not use for PowerPoint, Keynote, Google Slides, non-slidesls framework decks, or mandatory React/reveal.js/Vite presentation systems.
metadata:
  package: "@maxedapps/slidesls"
  skill-version-source: "package"
---

# create-slides-with-slidesls

slidesls is a skill-guided slide design system for agents: five art directions (styles), a content vocabulary that goes far beyond bordered boxes, complete slide patterns (archetypes) with content contracts, and motion that is on by default. Generated decks remain plain editable HTML/CSS/JS and do not depend on slidesls, agent-browser, or any framework at runtime.

The bar: every slide has one focal point, consecutive slides differ in shape, type does the emphasis work borders used to fake, and the deck moves — calmly, in the style's own signature.

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

### 1. Style brief — the required first artifact

Before any HTML, write a five-line brief (in conversation or a comment):

- **Audience & mood** — who watches, and how it should feel.
- **Style** — exactly one of `editorial`, `terminal`, `gallery`, `boardroom`, `pop` (`slidesls catalog --type style --json`; guidance in `references/style-directions.md`). The user's stated direction always wins over these defaults.
- **Icon stance** — sprite icons (default, sparse) or none; emoji only if the user explicitly wants an emoji-styled deck (`data-ls-icons="emoji"`).
- **Motion level** — the style default (transitions + entrances are automatic), plus steps only where sequence carries meaning; `data-ls-motion="none"` only when the user needs a static deck.
- **Available image assets** — screenshots, photos, logos the user can provide. This feeds the image ladder (rule 4); ask now, not at slide 7.

### 2. Deck rhythm plan

List every slide as `archetype — one-line intent` before writing HTML (`slidesls catalog --type archetype --json`; details in `references/archetypes.md`). Self-check the plan:

- No archetype exceeds half the content slides, and no shape repeats 3× in a row (the `archetype_monotony` lint enforces exactly these thresholds).
- The deck opens with `title-hero`, closes with `statement`, and every 3–4 content slides the shape changes register (a statement, a big-stat, or a section break).

### 3. Build loop

Initialize with the chosen style, then build one slide at a time:

```sh
slidesls init ./slides/my-deck --template minimal --style editorial --title "My Deck"
```

Per slide: `slidesls inspect archetypes/<name> --json` and paste the snippet. The inspect output's `load.links` lists every stylesheet the snippet needs; `slidesls add archetypes/<name> --dir <deck>` copies the archetype's full dependency closure (components included) — insert any load tags your entry HTML is missing.

Then **write the copy to the contract**: every archetype's slot counts and word limits are in its catalog entry, and the `contract_slot_count` / `contract_copy_length` lints check them. Contracts are why columns align and boxes stay balanced — cut copy to fit, never shrink type.

Customize only through documented tokens and variants (`references/customization.md`): override token variables in a deck-level `@layer tokens` block, use component modifiers, or drop to `layouts/core` + components for structures no archetype covers. For cover-style copy beside media, use `ls-hero-media` + `ls-hero-copy`; do not put grouped title/subtitle copy into aligned subgrid regions.

### 4. Motion pass

The defaults are free: slide transitions and staggered entrances ship with the style's signature. Add `data-step` reveals only where the reveal order carries meaning (a flow's steps, an evidence slide's proof, a walkthrough's annotations — the archetype snippets show where). Full model: `references/motion.md`.

Verify motion by stepping the live preview with ArrowRight — **never from export screenshots** (export mode deliberately renders everything static).

### 5. QA loop

```sh
slidesls validate <deck> --report --json
```

Fix all errors first (`unknown_icon`, `style_missing`, `style_fonts_missing` are provable defects). Then work the warnings: contract, monotony, `placeholder_echo`, `surface_only_slide`, `icon_mix` findings each carry a precise hint — fix them or suppress deliberately with `data-ls-lint="off"` on one intentionally unusual slide.

Then the rendered pass (full recipe: `references/qa.md`): keep `slidesls preview <deck> --json` running, collect facts with `slidesls visual-qa --eval` on the export URL, analyze with `slidesls visual-qa --analyze --input <collected.json> --json` (fill ratios, legibility, `low_contrast`), and screenshot every content slide via the preview's `slideLinks` deep links. Judge each screenshot against the positive checklist:

- Is there one focal point?
- Is the hierarchy unambiguous at thumbnail size?
- Does the whitespace read as intentional (anchored by furniture, rhythm, or scale)?
- Do consecutive slides differ in shape?
- Would you present this slide?

### 6. Done criteria

A deck is done when the scorecard (`validate --report`) is clean — or every remaining finding is deliberately suppressed and explained — **and** the rendered review happened. A clean scorecard alone is not done: it gates structure and honesty; the screenshots gate taste.

## Hard rules (each maps to a lint)

- One style per deck, activated on `<html>` — `style_missing`, `style_conflict`, `style_fonts_missing`.
- Sprite icons or nothing; no emoji in icon slots, no CDN icon scripts, no glyph soup — `unknown_icon`, `emoji_icon`, `icon_mix`. After changing icon references: `slidesls icons sync --dir <deck> --json`.
- No fake visuals: text-in-a-panel pretending to be an image is never sanctioned — `placeholder_echo`. Follow the image ladder: real asset → authored diagram (`flow`, `chart`, inline SVG in a `figure`; use `ls-figure--contain` when the full asset must remain visible) → `ls-figure--abstract` → the archetype's no-figure variant.
- No card-grid monotony: the box (`ls-surface`) is for content that needs a frame — `many_surfaces_in_grid`, `surface_only_slide`. Short items are a `list`, numbers are a `stat`, sequences are a `flow`.
- No repeated-shape decks — `archetype_monotony`.
- Write to the contract, don't shrink type — `contract_copy_length`, `body_text_small`.
- Charts are honest by construction (0–100 scale, fixed zero baseline) and accessible (`role="img"` + `aria-label`).
- Motion off is a decision, not a default — `motion_absent` surfaces `data-ls-motion="none"`.

Flexibility clause: these defaults encode taste, not law. When the user gives an explicit style direction, it wins; suppression via `data-ls-lint="off"` is legitimate when intentional — the lints exist to make deviations deliberate, not to forbid them.

## Fast discovery map

- Need the workflow? `slidesls skill show`
- Need a style? `slidesls catalog --type style --json`
- Need slide patterns? `slidesls catalog --type archetype --json`
- Need content components? `slidesls catalog --type component --json`
- Need the layout system? `slidesls inspect layouts/core --api --json`
- Need exact markup and load tags? `slidesls inspect <item> --json`
- Need icons? `slidesls icons list --json`, then `slidesls icons sync --dir <deck> --json`
- Need copied files/load tags? `slidesls add <items> --dry-run --json`
- Need the scorecard? `slidesls validate <deck> --report --json`
- Need rendered per-slide findings? `slidesls visual-qa --eval` then `slidesls visual-qa --analyze --input <collected.json> --json`
- Need to change accent color or fonts? Override token variables in a deck-level `@layer tokens` block — recipe in `references/customization.md`; discover safe variables via `inspect <item> --api --json` `cssVariables` (`overrideSafe`, defaults)
- Need the full class/data-attribute catalog? `slidesls skill show --reference catalog` — per-item lookup only; do not read it end-to-end

## References bundled with this skill

- `references/style-directions.md` — the five art directions and how to choose.
- `references/archetypes.md` — slide patterns, contracts, and the rhythm plan.
- `references/motion.md` — the motion model: transitions, stagger, steps, kill switches.
- `references/customization.md` — tokens, variants, and safe deck-level overrides.
- `references/qa.md` — validation, scorecard, browser QA, and the positive checklist.
- `references/catalog.md` — generated registry catalog. Per-item lookup only (it is large); also available via `slidesls skill show --reference catalog`.

## Do not

- Do not install to `.claude/skills/...` unless the active runtime is Claude Code and that is the desired project-local skill path.
- Do not invent `ls-*` classes or nested structural contracts; use snippets returned by `inspect --json` and `--api` authoring metadata when needed.
- Do not stack styles or mix a style with hand-picked font links from another style.
- Do not use `ls-slide-fill` on ordinary content slides. Content slides use `data-ls-slide-kind="content"` and `.ls-slide__header`; hero/section slides must be marked and may intentionally center full-slide layouts.
- Do not add React, Vite, Tailwind, or another framework unless explicitly requested.
- Do not make generated decks depend on `slidesls` at runtime.
- Do not skip `slidesls validate` before finalizing, and do not rely on static validation alone — run `slidesls visual-qa` and inspect per-slide screenshots.
- Do not judge composition or motion from the full-export overview; inspect slides at full size via deep links and step motion live.
- Do not override `.ls-*` selectors in deck CSS outside `@layer`; unlayered rules beat all component CSS. Override token variables (in `@layer tokens`) instead.
- Do not edit registry source inside an installed package when the intent is deck customization; edit copied deck files instead.
