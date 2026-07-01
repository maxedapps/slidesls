# Copy workflow

Use the CLI as the single copy surface. Before public npm publishing, commands may be invoked through the local checkout:

```sh
node /path/to/ls_slides/bin/slidesls.mjs add <items...> --dir <deck-or-project> --dry-run --json
node /path/to/ls_slides/bin/slidesls.mjs add <items...> --dir <deck-or-project>
```

If `slidesls` is installed in the target project, use:

```sh
npx slidesls add <items...> --dir <deck-or-project> --dry-run --json
npx slidesls add <items...> --dir <deck-or-project>
```

`slidesls add` resolves registry dependencies, copies implementation files into the configured asset directory (`slidesls/` by default), and updates that directory's `manifest.json`. It works with initialized decks and with arbitrary existing projects. If `--dir` has no `slidesls.json`, `add` uses copy mode and reports `mode: "copy"` in JSON output. It prints load tags so agents can add them to HTML when needed. Template snippet HTML is exposed through `inspect --json`; it is not copied into deck assets by `add`.

Important:

- Use `slidesls skill show --reference catalog` for the full generated class/style/API catalog when you need human-readable discovery.
- Always prefer `--dry-run --json` before copying multiple items or changing an existing deck.
- `add` copies assets and updates the manifest; it does not rewrite the deck HTML.
- Insert returned `<link>` and `<script>` tags into the entry HTML when needed.
- When copying `presets/themes/<theme>`, also set `data-ls-theme="<theme>"` on the existing `<html>` element. Do not add a second theme attribute and do not stack multiple themes.
- For templates, inspect snippet HTML first, then add the template or its dependencies to copy required assets.
- Use `--include-docs` only when downstream item READMEs should be copied into the deck.
- Customize copied deck files, not package registry source files.
