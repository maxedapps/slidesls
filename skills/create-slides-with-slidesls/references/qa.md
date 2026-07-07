# QA: scorecard, browser facts, and the taste pass

Three gates, in order. The first two are machine-checked; the third is judgment — and it is the one that decides.

## 1. Static validation + scorecard

```sh
slidesls validate <deck> --report --json
```

Errors are provable defects — fix all of them:

- `unknown_icon` (sprite missing a referenced symbol → `slidesls icons sync --dir <deck> --json`)
- `style_missing` / `style_conflict` / `style_fonts_missing` (activation or font links broken)
- `missing_asset`, `missing_runtime`, structural errors

Warnings are taste signatures with hints — fix or deliberately suppress (`data-ls-lint="off"`):

- `contract_slot_count` / `contract_copy_length` — write to the archetype contract
- `archetype_monotony`, `surface_only_slide`, `many_surfaces_in_grid` — vary the shapes
- `placeholder_echo` — follow the image ladder
- `emoji_icon` / `icon_mix` — one icon system
- `motion_absent` — motion off must be a decision

The `--report` scorecard shows the archetype map, variety distribution, motion coverage, and icon consistency at a glance. **It is necessary, never sufficient.**

## 2. Rendered facts (browser)

Keep the preview running and collect real geometry:

```sh
slidesls preview <deck> --json   # long-running; slideLinks = per-slide deep links
```

With agent-browser on the export URL (`?export=1`):

```sh
slidesls visual-qa --eval   # prints the collector script; pipe it into agent-browser's stdin eval
slidesls visual-qa --analyze --input <collected.json> --json
```

Measured findings: `card_low_fill`, `equal_cards_sparse`, `body_text_small` (20px floor; 18px on deliberate compact slides), `low_contrast` (4.5:1 body / 3:1 display, computed from composited colors), `collection_incomplete`. Fix at the token/content level — contrast failures usually live in the style pair, not the slide.

## 3. The taste pass

Screenshot every content slide via its deep link (all slides for decks ≤ ~15; flagged plus representative beyond) and inspect at full size — capturing files is not inspecting. Judge each against:

1. **Focal point** — one thing your eye lands on first.
2. **Hierarchy** — unambiguous at thumbnail size.
3. **Whitespace** — reads as intentional (anchored by footer furniture, scale, rhythm), not leftover.
4. **Variety** — consecutive slides differ in shape.
5. **Present test** — would you stand in front of this slide?

Then step the live deck with ArrowRight for the motion checklist (see `motion.md`): signature on-brief, no double movement, steps land with meaning, interrupts clean, slide 1 static on load.

Do not judge composition or motion from the full-export overview screenshot. Iterate until both the scorecard and the screenshots pass; only then is the deck done.
