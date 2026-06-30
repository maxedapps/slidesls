# Agent workflow

## Prepare the active CLI and skill

Before public npm publishing, use the local checkout from other projects:

```sh
node /absolute/path/to/ls_slides/bin/slidesls.mjs --help
```

For local-only work, link the bundled skill into the target project so it stays current with this checkout:

```sh
node /absolute/path/to/ls_slides/bin/slidesls.mjs skill link ./.claude/skills/slidesls
```

Use `skill install` instead if a copied skill is preferred. If installed from a local tarball, use `npx slidesls ...`.

## Deck workflow

1. Clarify deck purpose, audience, tone, slide count, visual constraints, and target folder.
2. Use a dedicated deck folder. From inside that folder run `slidesls init --template minimal`, or initialize an explicit path such as `slidesls init ./slides/my-deck --template minimal`.
3. Inspect `slidesls.json` and the configured entry file for existing decks.
4. Use `slidesls catalog --recommended --json` to choose from the agent-safe set.
5. Use `slidesls inspect templates/<name> --json` for full slide skeletons and `slidesls inspect components/<name> --json` for component snippets.
6. Run `slidesls add ... --dry-run --json`, review planned files and load tags, then run without `--dry-run`.
7. Paste/edit snippet HTML directly; add returned `<link>` and `<script>` tags to the entry HTML when needed.
8. Run `slidesls validate <dir> --json` and fix errors.
9. Run `slidesls preview <dir>` and use browser automation/screenshots for visual review when needed.
10. Run `slidesls doctor --dir <dir> --json` for environment/config issues.

Prefer templates, utilities, and standalone components. Do not introduce structural layout macros, a framework, bundler, Tailwind, or runtime package dependency unless the user explicitly asks for one. Generated decks should remain standalone plain HTML/CSS/JS.
