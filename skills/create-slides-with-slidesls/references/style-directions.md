# Style directions

A style is an art direction: tokens + vendored typefaces + texture + shape + furniture treatment + motion signature, activated by a single `data-ls-style="<name>"` on `<html>`. Exactly one per deck. `slidesls init --style <name>` wires the fonts, links, and attribute; adding later: `slidesls add styles/<name> --dir <deck> --dry-run --json` and insert the returned load tags, then set the attribute.

## Choosing

| Style       | Feels like                                                                     | Reach for it when                                               | Avoid when                                   |
| ----------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------- | -------------------------------------------- |
| `editorial` | a magazine field guide — warm paper, ink, one oxblood accent, serif display    | teaching, essays, retrospectives, culture/strategy narratives   | dense technical dashboards; product pitches  |
| `terminal`  | production infrastructure — near-black, phosphor green, mono display           | engineering deep-dives, incident reviews, CLI/devtools products | warm human storytelling; executive audiences |
| `gallery`   | a white-cube exhibition — black on white, huge grotesk type, one orange accent | design/brand/portfolio decks, manifestos, single-idea talks     | dense data; long prose slides                |
| `boardroom` | calm authority — charcoal-navy, brass rules, serif body                        | board updates, investor decks, annual reviews                   | playful launches; workshop energy            |
| `pop`       | a poster — cream, coral + electric blue, thick ink borders, springy motion     | launches, community talks, consumer/creator audiences           | formal reporting; somber topics              |

The user's stated direction always wins. If they name colors, moods, or a brand, pick the nearest style and adjust tokens (see `customization.md`) rather than fighting the choice.

## What a style controls

- **Type roles** — `--ls-font-display/heading/body/label/code`, sizes, tracking. Never hand-link fonts from another style.
- **Color system** — surfaces, borders, accents, status colors, code block treatment. All contrast-checked (`low_contrast` gates regressions).
- **Texture** — a background layer (`--ls-slide-texture`): editorial's masthead rule, terminal's scanline grid, boardroom's vignette, pop's blobs; gallery deliberately has none.
- **Shape** — radius scale and `--ls-border-width` (pop's 2.5px ink borders vs terminal's hard 1px).
- **Furniture** — the `.ls-slide__footer` treatment (rule, casing, tracking).
- **Motion signature** — transition kind/duration/easing and stagger cadence (`motion.md`). Editorial settles like paragraphs; terminal blinks; gallery slides precisely; boardroom fades patiently; pop bounces.
- **Abstract figure art** — what `ls-figure--abstract` paints (`--ls-abstract-art`).

## Voice rules per style

Each style's README (`slidesls inspect styles/<name> --readme --json`) carries a Voice section — accent rationing, density expectations, motion do/don't. Follow it: the style is a system, not a color scheme.
