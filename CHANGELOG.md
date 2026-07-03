# Changelog

## 0.4.0

### Breaking

- `catalog --json` is now brief and selection-focused by default. Use `catalog --api --json` for the previous rich authoring metadata.
- `inspect <item> --json` is now snippet/load-tag focused by default. Use `--api` for authoring metadata and `--with-dependencies` for dependency detail entries.
- Unknown CLI flags now fail with exit code 2 instead of being treated as implicit value options.
- Registry metadata no longer stores `agentRecommended`; it is computed from the new `agentLevel` (`starter`/`recommended`).

### Fixed

- `validate` no longer reports a false `copied_asset_not_loaded` warning for module scripts (including `slide-runtime.js`) on every generated deck, and now detects loaded-but-unlisted JS assets via `loaded_asset_missing_manifest_item`.

### Added

- `agentLevel` metadata with `--starter` and `--level <level>` catalog filters.
- `authoring.classMetadata` for class-scoped safety/scope guidance.
- `data-ls-slide-kind` and static validation warnings for full-slide layout misuse.
- Canonical content-slide `.ls-slide__header` rhythm variables.
- Visual rhythm collection/analysis via `scripts/visual-qa-report.mjs --eval` and `--analyze`.
- Skill-first, brief-first agent guidance across CLI output, docs, and bundled skill references.
