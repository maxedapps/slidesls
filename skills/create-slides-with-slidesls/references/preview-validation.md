# Preview and validation

Recommended loop after creating or materially editing a deck:

```sh
slidesls validate <deck> --json
slidesls preview <deck> --host 127.0.0.1 --port 4321
slidesls doctor --dir <deck> --json
```

Fix all `validate` errors before visual review. Treat warnings as issues to review, especially missing load tags, missing registry items, broken progress/timeline/reveal structures, large code blocks, accessibility gaps, missing Lucide scripts, or reveal-step problems. Default JSON output may include `customizedFiles` for edited copied registry files; that is allowed unless `--strict` is required.

Validation is static and lightweight, not a full HTML parser or browser render. It does not replace preview. Unless the user opts out, inspect representative slides after static validation:

- title/opening and section-divider slides;
- the densest content slide;
- slides with tables, timelines, progress bars, quotes, or code;
- any slide using compact density, serif display titles, or custom CSS variables.

## agent-browser visual QA

For AI agents, prefer `agent-browser` for the visual pass so you can see actual rendered slides instead of inferring layout from HTML/CSS. `slidesls preview` is long-running: start it in the background or another terminal and keep it running while browser commands execute. If `agent-browser` is not on PATH, use `npx -y agent-browser ...` or follow the installed `agent-browser` skill, which recommends `agent-browser skills get core --full` for current CLI-matched instructions.

Use a pinned viewport for stable review. JSON preview output includes both `url` and `exportUrl`. Use `?export=1` / `exportUrl` for layout QA with all reveal content visible:

```sh
slidesls preview <deck> --host 127.0.0.1 --port 4321
agent-browser --session slidesls-review open http://127.0.0.1:4321/?export=1
agent-browser --session slidesls-review set viewport 1600 900
agent-browser --session slidesls-review wait --load networkidle
agent-browser --session slidesls-review screenshot ./slides-export-review.png
```

Use normal mode for interactive reveal-step coherence. `ArrowRight` may advance reveal steps before changing slides. New copied runtimes also support deep links such as `#slide=2&step=1` (`slide` is 1-based, `step` is 0-based):

```sh
agent-browser --session slidesls-review open 'http://127.0.0.1:4321/#slide=1&step=0'
agent-browser --session slidesls-review wait --load networkidle
agent-browser --session slidesls-review screenshot ./slide-1-step-0.png
agent-browser --session slidesls-review press ArrowRight
agent-browser --session slidesls-review screenshot ./slide-1-step-1.png
```

Inspect screenshots and iterate until visually acceptable; do not merely capture files.

## Visual-quality checklist

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

## Optional browser fit check

This catches some fit issues but cannot judge aesthetic balance; screenshots remain authoritative.

```sh
node scripts/visual-qa-report.mjs --eval | agent-browser --session slidesls-review eval --stdin > collected.json
node scripts/visual-qa-report.mjs --analyze < collected.json
```

Review the collected JSON for native deck dimensions, current slide state, kind/offset facts, and overflow candidates. Review the analysis JSON for advisory rhythm warnings. Intentional scroll surfaces such as table frames, code blocks, and terminal bodies are flagged separately.

Navigate through the deck or open representative slide URLs as needed, and capture screenshots for any slide you changed materially. If the browser session already exists or multiple agents may be running, use a named `agent-browser --session <name>`.
