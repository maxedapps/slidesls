# Preview and validation

```sh
slidesls validate <deck> --json
slidesls preview <deck> --host 127.0.0.1 --port 4321
slidesls doctor --dir <deck> --json
```

Fix all `validate` errors before visual review. Use browser automation only after the static checks pass.
