# Agent workflow

The canonical authoring workflow lives in the bundled skill: [`skills/create-slides-with-slidesls/SKILL.md`](../skills/create-slides-with-slidesls/SKILL.md) and its `references/`. This page is the map; the skill is the territory — when they differ, the skill wins.

## 0. Get the skill

Confirm the active CLI first (`slidesls --help`), then install or link the skill into the directory the agent runtime requires:

```sh
slidesls skill install <your-agent-skill-dir>/create-slides-with-slidesls
slidesls skill link <your-agent-skill-dir>/create-slides-with-slidesls
```

Runtime-neutral no-install path: `slidesls skill show` (per-reference: `--reference style-directions|archetypes|motion|customization|qa|catalog`). Full export fallback only: `slidesls skill show --all`. Claude Code project-local example:

```sh
slidesls skill install ./.claude/skills/create-slides-with-slidesls
```

Fully read `SKILL.md` and the relevant references before authoring.

## 1. Style brief

Before any HTML, settle five things: audience & mood; exactly one style (`editorial`, `terminal`, `gallery`, `boardroom`, `pop` — `slidesls catalog --type style --json`); icon stance (sprite icons, sparse, or none); motion level (the style default plus steps only where sequence carries meaning); and what real image assets the user can provide. The user's stated direction always wins.

## 2. Deck rhythm plan

List every slide as `archetype — one-line intent` before writing HTML (`slidesls catalog --type archetype --json`). Self-check: no archetype exceeds half the content slides, no shape repeats three times in a row (`archetype_monotony` enforces exactly these thresholds), open with `title-hero`, close with `statement`, and change register every 3–4 content slides.

## 3. Build loop

```sh
slidesls init ./slides/my-deck --template minimal --style editorial --title "My Deck"
```

Per slide: `slidesls inspect archetypes/<name> --json`, paste the snippet, then write the copy to the contract — slot counts and word limits are in the catalog entry and checked by `contract_slot_count` / `contract_copy_length`. Cut copy to fit; never shrink type.

Discovery commands, incremental and JSON-first:

```sh
slidesls catalog --json                    # complete lightweight inventory
slidesls catalog --type component --json   # content vocabulary
slidesls catalog --intent prove --json     # find items by what a slide must DO
slidesls inspect layouts/core --api --json # layout system API
slidesls add <items...> --dir <deck> --dry-run --json
```

Icons come only from the inline sprite (`slidesls icons list --json`); after changing icon references run `slidesls icons sync --dir <deck> --json`. Customize only through token overrides in a deck-level `@layer tokens` block and documented variants; do not invent `ls-*` classes.

## 4. Motion pass

Transitions and staggered entrances are automatic and free. Add `data-step` reveals only where the reveal order carries meaning (a flow's steps, an evidence slide's proof, a walkthrough's annotations). Verify motion by stepping the live preview with ArrowRight — never from export screenshots (export mode deliberately renders everything static).

## 5. QA loop

```sh
slidesls validate <deck> --report --json
```

Fix all errors first; then work the warnings' hints or suppress deliberately with `data-ls-lint="off"` on one intentionally unusual slide. Then the rendered pass:

```sh
slidesls preview <deck> --host 127.0.0.1 --port 4321   # long-running
slidesls visual-qa --eval                              # collector; run on the ?export=1 URL
slidesls visual-qa --analyze --input collected.json --json
```

Screenshot every content slide via the preview's `slideLinks` deep links and judge each against the positive checklist: one focal point; unambiguous hierarchy at thumbnail size; intentional whitespace; consecutive slides differ in shape; would you present it?

## 6. Done criteria

A deck is done when the scorecard is clean — or every remaining finding is deliberately suppressed and explained — **and** the rendered review happened. A clean scorecard alone is not done: it gates structure and honesty; the screenshots gate taste.

## Hard boundaries

- One style per deck; never mix a style with another style's fonts.
- Sprite icons or nothing; no emoji in icon slots, no icon CDNs.
- No fake visuals: text-in-a-panel pretending to be an image is never sanctioned; follow the image ladder.
- Generated decks stay plain HTML/CSS/JS — no framework, bundler, or runtime package dependency unless the user explicitly asks.
