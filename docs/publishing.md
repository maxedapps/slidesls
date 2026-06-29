# Publishing

Package name: `@maxedapps/slidels`.
Binary name: `slidesls`.

Publishing is manual and requires explicit approval.

## Gates

```sh
pnpm check
npm pack --dry-run
npm pack
```

Then test the tarball in a temp project:

```sh
npm init -y
npm install /path/to/maxedapps-slidels-*.tgz
npx slidesls init deck --template minimal --title "Packed Smoke"
npx slidesls add components/card --dir deck
npx slidesls validate deck
npx slidesls doctor --dir deck
```

## Package contents

The package should include `bin/`, `src/`, `registry/`, `schemas/`, docs, skill docs if intentionally shipped, root metadata, and `LICENSE`. It should exclude `.plans/`, generated plan HTML, screenshots, temp artifacts, and local context files.

Repository/homepage/bugs metadata remain TBD until the canonical public GitHub URL is chosen.
