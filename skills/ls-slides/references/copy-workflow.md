# Copy workflow

## Sources

Default remote source:

```sh
--registry-url https://raw.githubusercontent.com/maxedapps/slidesls/main
```

Use local mode during repo development or while the remote is private:

```sh
--registry-root /path/to/ls_slides
```

All discovery, inspect, catalog, and copy scripts support both modes.

## Safe copy algorithm

`copy-items.mjs`:

1. Loads `registry.json`.
2. Loads all per-item metadata.
3. Resolves selected items and recursive `registryDependencies`.
4. Orders dependencies before dependents.
5. Copies implementation files under the target base directory.
6. Optionally copies READMEs and metadata with `--include-docs`.
7. Writes `manifest.json` with source, requested items, dependency order, and copied files.
8. Refuses overwrites unless `--force` is provided.
9. Refuses unsafe paths that would write outside the target root.

Always run a dry run first:

```sh
node skills/ls-slides/scripts/copy-items.mjs \
  --target /tmp/my-deck \
  --items core/base,layouts/title-hero,animations/reveal \
  --dry-run --json
```

Then copy:

```sh
node skills/ls-slides/scripts/copy-items.mjs \
  --target /tmp/my-deck \
  --items layouts/title-hero,components/badge,animations/reveal \
  --include-docs
```

## Recommended target structure

```txt
target-deck/
  index.html
  ls-slides/
    manifest.json
    registry/core/base/...
    registry/layouts/...
    registry/components/...
    registry/animations/...
    registry/presets/...
```

## Linking copied files

With the default `--base-dir ls-slides`, link copied files like:

```html
<link rel="stylesheet" href="./ls-slides/registry/core/base/reset.css" />
<link rel="stylesheet" href="./ls-slides/registry/core/base/tokens.css" />
<link rel="stylesheet" href="./ls-slides/registry/core/base/slide.css" />
<link rel="stylesheet" href="./ls-slides/registry/layouts/title-hero/title-hero.css" />
<link rel="stylesheet" href="./ls-slides/registry/animations/reveal/reveal.css" />
<script type="module" src="./ls-slides/registry/core/base/slide-runtime.js"></script>
```

Keep copied registry paths intact so item READMEs and future diffs remain easy to reason about.
