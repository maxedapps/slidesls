# Validation

## Deck validation

`slidesls validate [dir]` checks config discovery, entry existence, required deck shell markup, local asset references, manifest files, removed layout macros, unknown `ls-*` class attributes, and common missing registry-item usage for known classes.

Copied registry files are intentionally editable. Default validation reports changed copied files as `customizedFiles` in JSON data, not as warnings or errors. Use `--strict` when you need hash drift from the copied baseline to fail validation.

## Repo validation

- `slidesls validate-registry` checks registry metadata, authoring metadata, files, docs, snippets, dependency references/cycles, and local JS syntax.
- `slidesls validate-examples` checks example asset links and rejects removed `ls-layout-*` usage and unsupported real `ls-*` class attributes.
- `slidesls doctor` checks Node/package/config/registry/project write health.

## Static validation limits

Validation is a lightweight static check, not a full HTML parser, browser render, or visual regression tool. It catches common contract and asset issues in generated/plain decks; use `slidesls preview` plus manual or browser-agent review for visual correctness.

## Preview and snapshots

`slidesls preview` serves files locally for manual or agent-browser review and keeps running until the process is stopped. Snapshot generation is deferred post-MVP and should remain optional/no-heavy-dependency.
