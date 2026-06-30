# Validation

## Deck validation

`slidesls validate [dir]` checks config discovery, entry existence, required deck shell markup, local asset references, manifest files, optional strict hash drift, removed layout macros, and common missing registry-item usage for known classes.

## Repo validation

- `slidesls validate-registry` checks registry metadata, files, docs, snippets, dependency references/cycles, and local JS syntax.
- `slidesls validate-examples` checks example asset links and rejects removed `ls-layout-*` usage.
- `slidesls doctor` checks Node/package/config/registry/project write health.

## Preview and snapshots

`slidesls preview` serves files locally for manual or agent-browser review. Snapshot generation is deferred post-MVP and should remain optional/no-heavy-dependency.
