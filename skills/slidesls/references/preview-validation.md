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

`preview` serves the deck until the process is stopped. For agent workflows, spawn it as a long-running process, parse the startup URL (or first JSON object when using `--json`), then terminate the process after visual checks.
