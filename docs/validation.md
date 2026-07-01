# Validation

## Deck validation

`slidesls validate [dir]` checks config discovery, entry existence, required deck shell markup, local asset references, manifest files, removed layout macros, unknown `ls-*` class attributes, common missing registry-item usage for known classes, and targeted structural issues such as broken custom progress bars, raw timeline shorthand, incompatible reveal variants, reveal-highlight misuse, and very large code blocks.

Copied registry files are intentionally editable. Default validation reports changed copied files as `customizedFiles` in JSON data, not as warnings or errors. Use `--strict` when you need hash drift and deck-level structural warnings to fail validation.

## Repo validation

- `slidesls validate-registry` checks registry metadata, authoring metadata, files, docs, snippets, dependency references/cycles, snippet dependency closure, official snippet structure, local JS syntax, and registry CSS container-query contracts.
- `slidesls validate-examples` recursively checks `examples/**/*.html`, asset links, removed `ls-layout-*` usage, unsupported real `ls-*` class attributes, and targeted structure checks.
- `slidesls doctor` checks Node/package/config/registry/project write health.

## Static validation limits

Validation is a lightweight static check, not a full HTML parser, browser render, or visual regression tool. It catches common contract and asset issues in generated/plain decks, but it does not prove visual fit or typography. Use `slidesls preview` plus manual or `agent-browser` review for visual correctness.

After creating or materially editing slides, preview and inspect representative slides unless intentionally skipped: title/section slides, the densest content slide, and any table/timeline/progress/code slides. Agents should capture browser screenshots with `agent-browser` so layout decisions are based on rendered output, not inferred HTML/CSS.

## Preview and snapshots

`slidesls preview` serves files locally for manual or `agent-browser` review and keeps running until the process is stopped. Snapshot generation is deferred post-MVP and should remain optional/no-heavy-dependency.
