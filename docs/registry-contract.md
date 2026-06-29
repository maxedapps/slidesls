# Registry contract

Registry items are copyable primitives indexed by `registry.json`.

## Item metadata

Each item has `registry-item.json` with:

- `name` — stable item id, e.g. `components/card`.
- `type` — `core`, `layout`, `component`, `animation`, `preset`, or `preset/font`.
- `description`, `tags`, and optional `useCases`.
- `registryDependencies` — other registry item names that must be copied first.
- `files` — repo-relative implementation files.
- `docs` — item README path.

## Copy/load order

Use `slidesls add`; it resolves dependencies, copies files, and updates the manifest. Manual copies should load `core/base` first, then presets, layouts, components, and animations.

## Future fields

Optional snippet metadata may be added later as plain HTML fragments. Current loaders should ignore unknown additive fields.
