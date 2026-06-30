# Preview and validation

Recommended loop:

```sh
slidesls validate <deck> --json
slidesls preview <deck> --host 127.0.0.1 --port 4321
slidesls doctor --dir <deck> --json
```

Fix all `validate` errors before visual review. Treat warnings as issues to review, especially missing Lucide scripts or reveal-step problems.

Use browser automation/screenshots only after static checks pass. `preview` serves the deck until the process is stopped.
