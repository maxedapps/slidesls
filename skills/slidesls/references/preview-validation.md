# Preview and validation

Recommended loop:

```sh
slidesls validate <deck> --json
slidesls preview <deck> --host 127.0.0.1 --port 4321
slidesls doctor --dir <deck> --json
```

Fix all `validate` errors before visual review. Treat warnings as issues to review, especially missing Lucide scripts or reveal-step problems. Default JSON output may include `customizedFiles` for edited copied registry files; that is allowed unless `--strict` is required.

Validation is static and lightweight, not a full HTML parser or browser render. Use browser automation/screenshots only after static checks pass.

`preview` serves the deck until the process is stopped. For agent workflows, spawn it as a long-running process, parse the startup URL (or first JSON object when using `--json`), then terminate the process after visual checks.
