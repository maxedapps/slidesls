# Copy workflow

Use the CLI as the single copy surface. Before public npm publishing, commands may be invoked through the local checkout:

```sh
node /path/to/ls_slides/bin/slidesls.mjs add <items...> --dir <deck> --dry-run --json
node /path/to/ls_slides/bin/slidesls.mjs add <items...> --dir <deck>
```

If `slidesls` is installed in the target project, use:

```sh
npx slidesls add <items...> --dir <deck> --dry-run --json
npx slidesls add <items...> --dir <deck>
```

`slidesls add` resolves registry dependencies, copies implementation files into the deck asset directory (`slidesls/` by default), and updates `slidesls/manifest.json`. It prints load tags so agents can add them to the HTML when needed. Template snippet HTML is exposed through `inspect --json`; it is not copied into deck assets by `add`.

Important:

- Always prefer `--dry-run --json` before copying multiple items or changing an existing deck.
- `add` copies assets and updates the manifest; it does not rewrite the deck HTML.
- Insert returned `<link>` and `<script>` tags into the entry HTML when needed.
- For templates, inspect snippet HTML first, then add the template or its dependencies to copy required assets.
- Use `--include-docs` only when downstream item READMEs should be copied into the deck.
- Customize copied deck files, not package registry source files.
