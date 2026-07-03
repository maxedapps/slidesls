# Preview and validation

Recommended loop after creating or materially editing a deck:

```sh
slidesls validate <deck> --json
slidesls preview <deck> --host 127.0.0.1 --port 4321
slidesls doctor --dir <deck> --json
```

Fix all `validate` errors before visual review. Treat warnings as issues to review, especially missing load tags, missing registry items, broken progress/timeline/reveal structures, large code blocks, accessibility gaps, missing Lucide scripts, or reveal-step problems. Default JSON output may include `customizedFiles` for edited copied registry files; that is allowed unless `--strict` is required.

Design-lint warnings (`many_cards_in_grid`, `stretched_grid_with_cards`, `card_grid_check_density`) are advisory composition pointers: they flag structural signatures of weak slides (wrapping card rows, stretched sparse grids, unreviewed text-card grids). Fix them via the density decision table in `deck-authoring.md`, or verify the rendered slide in the visual QA loop below and suppress a deliberate exception with `data-ls-lint="off"` on that slide.

Validation is static and lightweight, not a full HTML parser or browser render. It does not replace rendered review.

## Per-slide visual QA loop

Run this loop unless the user explicitly opts out. It is machine-driven: `slidesls visual-qa` measures the rendered deck and tells you which slides to inspect, and `preview --json` gives you a deep link per slide.

For AI agents, use `agent-browser` so you can see actual rendered slides instead of inferring layout from HTML/CSS. `slidesls preview` is long-running: start it in the background or another terminal and keep it running while browser commands execute. If `agent-browser` is not on PATH, use `npx -y agent-browser ...`. If the browser session already exists or multiple agents may be running, use a named `agent-browser --session <name>`.

1. Capture the full export once for overview and cross-slide rhythm (never for composition judgment):

   ```sh
   slidesls preview <deck> --host 127.0.0.1 --port 4321
   agent-browser --session slidesls-review open http://127.0.0.1:4321/?export=1
   agent-browser --session slidesls-review set viewport 1600 900
   agent-browser --session slidesls-review wait --load networkidle
   agent-browser --session slidesls-review screenshot ./slides-export-review.png
   ```

2. Collect rendered facts and analyze them per slide:

   ```sh
   slidesls visual-qa --eval > qa-eval.js
   agent-browser --session slidesls-review eval --stdin < qa-eval.js > collected.json
   slidesls visual-qa --analyze --input collected.json --json
   ```

   The analysis returns advisory warnings (`card_low_fill`, `equal_cards_sparse`, `body_text_small`, header-rhythm codes), a `perSlide` list with a `deepLink` per slide, and `summary.slidesToInspect`.

3. Screenshot content slides individually at full size and inspect each against the checklist below. Deep links come from `visual-qa` output or `preview --json` `slideLinks` (`#slide=N` is 1-based). For decks up to ~15 slides, inspect every content slide; beyond that, inspect every flagged slide plus representative ones (title/section, densest content, tables/timelines/progress/code):

   ```sh
   agent-browser --session slidesls-review open 'http://127.0.0.1:4321/#slide=2'
   agent-browser --session slidesls-review wait --load networkidle
   agent-browser --session slidesls-review screenshot ./slide-2.png
   ```

4. Fix or explicitly justify every advisory finding, re-validate, re-collect, and repeat until the analysis is clean.

Do not judge composition from the full-export overview: at overview scale each slide renders a few hundred pixels wide and per-slide composition problems are invisible. Inspect the screenshots you capture and iterate until visually acceptable; do not merely capture files.

For interactive reveal-step coherence, use normal mode plus `ArrowRight` (`#slide=2&step=1` deep links work too; `step` is 0-based):

```sh
agent-browser --session slidesls-review open 'http://127.0.0.1:4321/#slide=1&step=0'
agent-browser --session slidesls-review wait --load networkidle
agent-browser --session slidesls-review screenshot ./slide-1-step-0.png
agent-browser --session slidesls-review press ArrowRight
agent-browser --session slidesls-review screenshot ./slide-1-step-1.png
```

## Visual-quality checklist

Measurable rules first — these are what `visual-qa` approximates, and what your eyes confirm:

- text occupies well under half of a card's height → restructure (fewer/larger elements, `data-ls-density="spacious"`, or `templates/icon-grid` / `templates/feature-rows`);
- body copy should render at roughly 20px or larger on the 1600×900 canvas; raise type or shorten copy instead of shrinking it;
- three or more same-size boxes with one short sentence each is an anti-pattern — use icon tiles or rows;
- whitespace belongs between groups, not trapped inside boxes.

And the qualitative pass:

- no overflow, clipped text, or hidden essential content;
- no unintended centering;
- no giant empty panels/cards unless intentionally framing an image, code sample, diagram, or metric;
- title, subtitle, badges, and labels form coherent clusters rather than being stranded at extremes;
- columns align and have balanced optical weight;
- visual anchors are proportionate to their content;
- repeated cards have consistent rhythm, but not excessive empty height;
- code and tables are legible at the actual slide scale;
- contrast is readable;
- images have meaningful alt text or are explicitly decorative;
- slides and icon-only controls have accessible names;
- icons/fonts are loaded or gracefully absent;
- reveal steps produce meaningful intermediate states.

## Collected data

The collected JSON carries native deck dimensions, per-slide kind/offset facts, per-container fill ratios and computed body type sizes, grid child metrics, and overflow candidates (intentional scroll surfaces such as table frames, code blocks, and terminal bodies are flagged separately). `node scripts/visual-qa-report.mjs` remains available as a repo-path fallback for the same collect/analyze pair.
