# Copy workflow

Use the CLI as the single copy surface.

```sh
slidesls add <items...> --dir <deck> --dry-run --json
slidesls add <items...> --dir <deck>
```

`slidesls add` resolves registry dependencies, copies files into the deck asset directory (`slidesls/` by default), and updates `slidesls/manifest.json`. It prints load tags so agents can add them to the HTML when needed.

Prefer `--dry-run --json` before large changes. Use `--include-docs` only when downstream item READMEs should be copied into the deck.
