# Registry contract

Registry items are copyable primitives indexed by `registry.json`.

## Item metadata

Each item has `registry-item.json` with:

- `name` — stable item id, e.g. `components/card`.
- `type` — one of `ls:core`, `ls:utility`, `ls:component`, `ls:animation`, `ls:preset`, or `ls:template`.
- `description`, `tags`, and optional `useCases`.
- `registryDependencies` — other registry item names that must be copied first.
- `files` — repo-relative implementation files copied by `slidesls add`.
- `docs` — item README path.
- `rootClass` — primary class for utilities/components when applicable.
- `safeAnywhere` — whether the item can be used without a specific parent structure.
- `agentRecommended` — whether `catalog --recommended` should include the item.
- `snippets` — paste-ready HTML examples loaded by `inspect --json`.

Templates must use `files: []` and expose HTML only through `snippets` so `add templates/x` does not copy snippet files into deck assets.

## Copy/load order

Use `slidesls add`; it resolves dependencies, copies files, and updates the manifest. Manual copies should load `core/base` first, then presets/components/animations/utilities as needed. Utilities intentionally load late so layout helpers can be applied anywhere.

## Snippets

Snippets are source-of-truth markup examples. Agents should prefer:

```sh
slidesls inspect templates/split --json
slidesls inspect components/card --json
```

and paste/edit returned snippet HTML instead of guessing structure.
