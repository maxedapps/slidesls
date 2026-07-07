# Publishing

Package name: `@maxedapps/slidesls`. Binary name: `slidesls`.

Publishing is manual and requires explicit approval. The publisher must be logged in with rights to the `@maxedapps` scope.

## Vendored assets first

If the release touches fonts or icons, regenerate the vendored files from their pinned devDependencies — never edit them by hand:

```sh
node scripts/fonts-sync.mjs   # registry/fonts/* from @fontsource-variable/*
node scripts/icons-sync.mjs   # registry/icons/* from lucide-static
```

## Gates

```sh
pnpm pack:check
```

`pack:check` runs, in order:

1. `pnpm check` — lint, format check, tests, `validate-registry`, `validate-skills` (generated catalog up to date), `validate-examples`, CLI smoke tests.
2. `SLIDESLS_RELEASE=1 node scripts/visual-gate.mjs` — the rendered composition + motion gate over `examples/composition` and the full generated gallery (every snippet × style × density). In release mode a missing browser driver **fails** the gate instead of skipping, so it can never silently no-op; it also captures the `.gallery-review/` stills for the human rubric review (motion checklist: [motion-review.md](./motion-review.md)).
3. `node scripts/check-pack-size.mjs` — the unpacked tarball must stay under the 5 MB budget (vendored fonts and icons must never balloon the package).
4. `npm pack --dry-run`.

Then test the tarball in a temp project:

```sh
npm pack
npm init -y
npm install /path/to/maxedapps-slidesls-*.tgz
npx slidesls init ./deck --template minimal --style editorial --title "Packed Smoke"
npx slidesls validate ./deck --report
npx slidesls doctor --dir ./deck
```

## Package contents

`package.json#files` ships `bin/`, `src/`, `registry/` (including vendored fonts with per-family `OFL.txt` and the curated icon symbols), `schemas/`, `scripts/visual-qa-report.mjs`, `skills/` (the bundled agent skill), `docs/`, `README.md`, `PROJECT.md`, `CHANGELOG.md`, `LICENSE`, and `registry.json`. `.plans/`, benchmarks, examples, tests, galleries, and review artifacts stay out.

## Publish

```sh
npm whoami        # npm login first if this fails
npm publish --access public
```

For each release: bump the version, update `CHANGELOG.md`, re-run the gates, publish, and push the version commit/tag.
