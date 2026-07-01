# Preview and validation

Recommended loop after creating or materially editing a deck:

```sh
slidesls validate <deck> --json
slidesls preview <deck> --host 127.0.0.1 --port 4321
slidesls doctor --dir <deck> --json
```

Fix all `validate` errors before visual review. Treat warnings as issues to review, especially missing registry items, broken progress/timeline/reveal structures, large code blocks, missing Lucide scripts, or reveal-step problems. Default JSON output may include `customizedFiles` for edited copied registry files; that is allowed unless `--strict` is required.

Validation is static and lightweight, not a full HTML parser or browser render. It does not replace preview. Unless the user opts out, inspect representative slides after static validation:

- title/opening and section-divider slides;
- the densest content slide;
- slides with tables, timelines, progress bars, quotes, or code;
- any slide using compact density, serif display titles, or custom CSS variables.

For AI agents, prefer `agent-browser` for the visual pass so you can see actual rendered slides instead of inferring layout from HTML/CSS. A typical loop:

```sh
slidesls preview <deck> --host 127.0.0.1 --port 4321
agent-browser open http://127.0.0.1:4321
agent-browser wait --load networkidle
agent-browser screenshot ./slides-visual-check.png
```

Navigate through the deck or open representative slide URLs as needed, and capture screenshots for any slide you changed materially. Check for overflow, clipped text, unintended centering, broken spacing, hidden content, illegible contrast, missing fonts/icons, and reveal/progress/timeline states. If the browser session already exists or multiple agents may be running, use a named `agent-browser --session <name>`.

`preview` serves the deck until the process is stopped. For agent workflows, spawn it as a long-running process, parse the startup URL (or first JSON object when using `--json`), then terminate the process after visual checks. If `agent-browser` is not on PATH, use `npx -y agent-browser` or follow the installed `agent-browser` skill, which recommends `agent-browser skills get core --full` for current CLI-matched instructions.
