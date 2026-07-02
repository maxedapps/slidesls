# Publishing

Package name: `@maxedapps/slidesls`.
Binary name: `slidesls`.

Publishing is manual and requires explicit approval. The first `npm publish --access public` creates the package on npm; no website-side package creation is required. The publisher must be logged in with rights to the `@maxedapps` scope.

## Gates

```sh
pnpm check
npm pack --dry-run
npm pack
```

Then test the tarball in a temp project:

```sh
npm init -y
npm install /path/to/maxedapps-slidesls-*.tgz
mkdir deck
cd deck
npx slidesls skill install ../agent-skills/create-slides-with-slidesls
npx slidesls init --template minimal --title "Packed Smoke"
npx slidesls add components/card
npx slidesls validate
npx slidesls doctor
```

## Package contents

The package should include `bin/`, `src/`, `registry/`, `schemas/`, docs, skill docs if intentionally shipped, root metadata, and `LICENSE`. It should exclude `.plans/`, generated plan HTML, screenshots, temp artifacts, and local context files.

## Publish

```sh
npm whoami
npm publish --access public
```

If `npm whoami` fails, log in first:

```sh
npm login
```

For future releases, bump the version, re-run the gates, publish, and push the version commit/tag if `npm version` was used.
